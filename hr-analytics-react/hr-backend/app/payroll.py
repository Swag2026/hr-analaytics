from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from .db import get_conn, native
from .auth import get_current_user
from .audit import log_action

router = APIRouter(prefix="/api/payroll-records", tags=["payroll"])

PR_FIELDS = [
    "month", "month_name", "company", "company_label", "job_no", "national_id", "name", "branch",
    "job_title", "status", "basic", "housing", "transport", "other_allowance", "overtime",
    "total_allowances", "gross", "absence_days", "absence_amount", "deductions", "total_deductions",
    "advances", "gosi", "other_total", "total_deducted", "net",
]


class PayrollRecordIn(BaseModel):
    month: int
    month_name: Optional[str] = None
    company: str
    company_label: Optional[str] = None
    job_no: Optional[str] = None
    national_id: Optional[str] = None
    name: str
    branch: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[str] = "أساسي"
    basic: float = 0
    housing: float = 0
    transport: float = 0
    other_allowance: float = 0
    overtime: float = 0
    absence_days: float = 0
    absence_amount: float = 0
    deductions: float = 0
    advances: float = 0
    gosi: float = 0
    other_total: float = 0
    total_allowances: Optional[float] = None
    gross: Optional[float] = None
    total_deductions: Optional[float] = None
    total_deducted: Optional[float] = None
    net: Optional[float] = None


def compute_derived(e: dict) -> dict:
    total_allowances = e["total_allowances"] if e.get("total_allowances") is not None else (
        e["housing"] + e["transport"] + e["other_allowance"] + e["overtime"]
    )
    gross = e["gross"] if e.get("gross") is not None else (e["basic"] + total_allowances)
    total_deductions = e["total_deductions"] if e.get("total_deductions") is not None else e["deductions"]
    total_deducted = e["total_deducted"] if e.get("total_deducted") is not None else (
        e["absence_amount"] + total_deductions + e["gosi"] + e["advances"] + e["other_total"]
    )
    net = e["net"] if e.get("net") is not None else (gross - total_deducted)
    return {**e, "total_allowances": total_allowances, "gross": gross,
            "total_deductions": total_deductions, "total_deducted": total_deducted, "net": net}


def row_to_dict(cur, row):
    cols = [c.name for c in cur.description]
    return {col: native(val) for col, val in zip(cols, row)}


class PayrollRunIn(BaseModel):
    company: str
    company_label: str
    month: int
    month_name: Optional[str] = None
    rows: List[PayrollRecordIn]


EMP_COLS = [
    "national_id", "job_no", "name", "company", "company_label", "branch", "job_title",
    "status", "as_of_month", "as_of_month_name", "is_active", "basic", "net", "housing",
    "transport", "other_allowance", "overtime", "total_allowances", "gross",
    "absence_days", "absence_amount", "deductions", "total_deductions", "gosi",
    "advances", "other_total", "total_deducted",
]


@router.post("/run")
def run_payroll(payload: PayrollRunIn, current_user: dict = Depends(get_current_user)):
    """Post a full payroll run for one company + month: replaces that month's
    payroll_records for the company and mirrors the latest figures into
    `employees`, exactly like an Excel upload does — but built from rows
    entered/edited directly in the app instead of a file."""
    if not payload.rows:
        raise HTTPException(status_code=400, detail="لا يوجد أي صفوف لترحيلها")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM payroll_records WHERE company = %s AND month = %s",
                (payload.company, payload.month),
            )
            cols = list(PR_FIELDS)
            placeholders = ", ".join(["%s"] * len(cols))
            for r in payload.rows:
                data = compute_derived(r.model_dump())
                data["company"] = payload.company
                data["company_label"] = payload.company_label
                data["month"] = payload.month
                data["month_name"] = payload.month_name

                cur.execute(
                    f"INSERT INTO payroll_records ({', '.join(cols)}) VALUES ({placeholders})",
                    [data.get(c) for c in cols],
                )

                cur.execute(
                    "SELECT id FROM employees WHERE company = %s AND (national_id = %s OR (national_id IS NULL AND job_no = %s))",
                    (payload.company, data.get("national_id"), data.get("job_no")),
                )
                existing = cur.fetchone()
                emp_vals = {**data, "as_of_month": payload.month, "as_of_month_name": payload.month_name, "is_active": True}
                if existing:
                    set_clause = ", ".join([f"{c} = %s" for c in EMP_COLS])
                    cur.execute(
                        f"UPDATE employees SET {set_clause} WHERE id = %s",
                        [emp_vals.get(c) for c in EMP_COLS] + [existing[0]],
                    )
                else:
                    cur.execute(
                        f"INSERT INTO employees ({', '.join(EMP_COLS)}) VALUES ({', '.join(['%s'] * len(EMP_COLS))})",
                        [emp_vals.get(c) for c in EMP_COLS],
                    )
        conn.commit()
    finally:
        conn.close()

    log_action(
        current_user, "payroll.run", "payroll_records", f"{payload.company}-{payload.month}",
        {"rows": len(payload.rows), "month": payload.month, "company": payload.company},
    )
    return {"ok": True, "count": len(payload.rows)}


@router.post("")
def create_record(payload: PayrollRecordIn, current_user: dict = Depends(get_current_user)):
    data = compute_derived(payload.model_dump())
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cols = list(PR_FIELDS)
            placeholders = ", ".join(["%s"] * len(cols))
            cur.execute(
                f"INSERT INTO payroll_records ({', '.join(cols)}) VALUES ({placeholders}) RETURNING id, {', '.join(cols)}",
                [data.get(c) for c in cols],
            )
            row = row_to_dict(cur, cur.fetchone())
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "payroll_record.create", "payroll_records", row["id"], row)
    return row


@router.put("/{record_id}")
def update_record(record_id: int, payload: PayrollRecordIn, current_user: dict = Depends(get_current_user)):
    data = compute_derived(payload.model_dump())
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM payroll_records WHERE id = %s", (record_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="السجل غير موجود")
            cols = list(PR_FIELDS)
            set_clause = ", ".join([f"{c} = %s" for c in cols])
            cur.execute(
                f"UPDATE payroll_records SET {set_clause} WHERE id = %s RETURNING id, {', '.join(cols)}",
                [data.get(c) for c in cols] + [record_id],
            )
            row = row_to_dict(cur, cur.fetchone())
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "payroll_record.update", "payroll_records", record_id, row)
    return row


@router.delete("/{record_id}")
def delete_record(record_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM payroll_records WHERE id = %s", (record_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="السجل غير موجود")
            cur.execute("DELETE FROM payroll_records WHERE id = %s", (record_id,))
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "payroll_record.delete", "payroll_records", record_id, {"name": row[1]})
    return {"ok": True}
