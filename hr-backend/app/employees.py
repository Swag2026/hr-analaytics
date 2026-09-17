from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from .db import get_conn, native
from .auth import get_current_user
from .audit import log_action

router = APIRouter(prefix="/api/employees", tags=["employees"])

EMP_FIELDS = [
    "national_id", "job_no", "name", "company", "company_label", "branch", "job_title", "status",
    "as_of_month", "as_of_month_name", "is_active", "basic", "net", "housing", "transport",
    "other_allowance", "overtime", "total_allowances", "gross", "absence_days", "absence_amount",
    "deductions", "total_deductions", "gosi", "advances", "other_total", "total_deducted",
]


class EmployeeIn(BaseModel):
    national_id: Optional[str] = None
    job_no: Optional[str] = None
    name: str
    company: str
    company_label: Optional[str] = None
    branch: str
    job_title: Optional[str] = None
    status: Optional[str] = "أساسي"
    as_of_month: Optional[int] = None
    as_of_month_name: Optional[str] = None
    is_active: bool = True
    basic: float = 0
    housing: float = 0
    transport: float = 0
    other_allowance: float = 0
    overtime: float = 0
    absence_days: float = 0
    absence_amount: float = 0
    deductions: float = 0
    gosi: float = 0
    advances: float = 0
    other_total: float = 0
    # These are normally derived — pass them explicitly only if you want to override the calculation.
    total_allowances: Optional[float] = None
    gross: Optional[float] = None
    total_deductions: Optional[float] = None
    total_deducted: Optional[float] = None
    net: Optional[float] = None


def compute_derived(e: dict) -> dict:
    """Fills in total_allowances / gross / total_deducted / net from the components
    when the caller didn't supply them explicitly. This is the same arithmetic the
    original payroll exports used: gross = basic + allowances; net = gross - deductions."""
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


@router.post("")
def create_employee(payload: EmployeeIn, current_user: dict = Depends(get_current_user)):
    data = compute_derived(payload.model_dump())
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cols = [c for c in EMP_FIELDS]
            placeholders = ", ".join(["%s"] * len(cols))
            cur.execute(
                f"INSERT INTO employees ({', '.join(cols)}) VALUES ({placeholders}) RETURNING id, {', '.join(cols)}",
                [data.get(c) for c in cols],
            )
            row = row_to_dict(cur, cur.fetchone())
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "employee.create", "employees", row["id"], row)
    return row


@router.put("/{emp_id}")
def update_employee(emp_id: int, payload: EmployeeIn, current_user: dict = Depends(get_current_user)):
    data = compute_derived(payload.model_dump())
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM employees WHERE id = %s", (emp_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="الموظف غير موجود")
            cols = [c for c in EMP_FIELDS]
            set_clause = ", ".join([f"{c} = %s" for c in cols])
            cur.execute(
                f"UPDATE employees SET {set_clause} WHERE id = %s RETURNING id, {', '.join(cols)}",
                [data.get(c) for c in cols] + [emp_id],
            )
            row = row_to_dict(cur, cur.fetchone())
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "employee.update", "employees", emp_id, row)
    return row


@router.delete("/{emp_id}")
def delete_employee(emp_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM employees WHERE id = %s", (emp_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="الموظف غير موجود")
            cur.execute("DELETE FROM employees WHERE id = %s", (emp_id,))
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "employee.delete", "employees", emp_id, {"name": row[1]})
    return {"ok": True}
