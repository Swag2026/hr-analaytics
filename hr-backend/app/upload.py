import io
import re
from datetime import datetime

import openpyxl
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from .db import get_conn, native
from .auth import get_current_user
from .audit import log_action

router = APIRouter(prefix="/api/upload", tags=["upload"])

MONTH_NAMES = {1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل", 5: "مايو", 6: "يونيو",
               7: "يوليو", 8: "أغسطس", 9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"}

# Candidate header synonyms seen across these payroll exports, mapped to our field names.
# Matching is done on normalized (trimmed, spaces-collapsed) text, so this list doesn't
# need every spacing/punctuation variant — normalize_header() handles that part.
HEADER_SYNONYMS = {
    "national_id": ["رقم الهوية", "الهوية", "رقم الهويه", "هوية", "iqama", "id number"],
    "job_no": ["رقم الموظف", "الرقم الوظيفي", "رقم وظيفي", "كود الموظف", "employee no", "job no"],
    "name": ["اسم الموظف", "الاسم", "اسم", "name"],
    "branch": ["الفرع", "فرع", "branch"],
    "job_title": ["الوظيفة", "المسمى الوظيفي", "job title", "title"],
    "status": ["الحالة", "حالة الموظف", "status"],
    "basic": ["الراتب الأساسي", "الأساسي", "راتب أساسي", "basic salary", "basic"],
    "housing": ["بدل السكن", "بدل سكن", "السكن", "housing"],
    "transport": ["بدل النقل", "بدل المواصلات", "المواصلات", "النقل", "transport"],
    "other_allowance": ["بدلات أخرى", "بدل آخر", "بدلات اخرى", "other allowance", "other allowances"],
    "overtime": ["العمل الإضافي", "الساعات الإضافية", "إضافي", "overtime"],
    "absence_days": ["أيام الغياب", "ايام الغياب", "غياب (أيام)", "absence days"],
    "absence_amount": ["خصم الغياب", "قيمة الغياب", "absence amount", "absence deduction"],
    "deductions": ["الاستقطاعات", "استقطاعات", "الخصومات", "خصومات", "deductions"],
    "advances": ["السلف", "سلف", "advances"],
    "gosi": ["التأمينات", "التأمينات الاجتماعية", "gosi", "social insurance"],
    "net": ["صافي الراتب", "الصافي", "صافي", "net salary", "net"],
}


def strip_diacritics(s: str) -> str:
    return re.sub(r"[\u064B-\u0652]", "", s)


def normalize_header(h) -> str:
    if h is None:
        return ""
    s = str(h).strip().lower()
    s = strip_diacritics(s)
    s = re.sub(r"\s+", " ", s)
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه")
    return s


SYNONYM_LOOKUP = {}
for field, variants in HEADER_SYNONYMS.items():
    for v in variants:
        SYNONYM_LOOKUP[normalize_header(v)] = field


ARABIC_INDIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def to_number(v):
    """Best-effort numeric coercion, logging a correction if the raw value needed cleanup."""
    if v is None or v == "":
        return 0, None
    if isinstance(v, (int, float)):
        return float(v), None
    raw = str(v)
    cleaned = raw.translate(ARABIC_INDIC_DIGITS).replace(",", "").strip()
    try:
        num = float(cleaned)
        if cleaned != raw:
            return num, raw
        return num, None
    except ValueError:
        return 0, raw


def find_header_row(sheet, max_scan=15):
    """Scans the first `max_scan` rows for the one that best matches known header synonyms."""
    best_row_idx, best_score, best_map = None, 0, {}
    for i, row in enumerate(sheet.iter_rows(min_row=1, max_row=max_scan, values_only=True), start=1):
        col_map = {}
        for col_idx, cell in enumerate(row):
            key = SYNONYM_LOOKUP.get(normalize_header(cell))
            if key and key not in col_map:
                col_map[key] = col_idx
        score = len(col_map)
        if score > best_score:
            best_score, best_row_idx, best_map = score, i, col_map
    return best_row_idx, best_map


def pick_sheet(wb):
    """Prefers a sheet whose header row matches the most known payroll columns."""
    best = (None, None, {}, -1)
    for ws in wb.worksheets:
        header_row, col_map = find_header_row(ws)
        if header_row and len(col_map) > best[3]:
            best = (ws, header_row, col_map, len(col_map))
    return best[0], best[1], best[2]


@router.post("")
async def upload_payroll(
    company: str = Form(...),
    company_label: str = Form(...),
    month: int = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="الملف يجب أن يكون بصيغة xlsx")

    raw = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(raw), data_only=True)
    except Exception:
        raise HTTPException(status_code=400, detail="تعذر قراءة الملف — تأكد أنه ملف Excel صالح")

    ws, header_row, col_map = pick_sheet(wb)
    if ws is None or "name" not in col_map or "basic" not in col_map:
        raise HTTPException(
            status_code=422,
            detail="لم يتم العثور على أعمدة الاسم/الراتب الأساسي في أي شيت — تأكد من أسماء الأعمدة أو أرسل نسخة من الملف لتحديث قواعد المطابقة",
        )

    month_name = MONTH_NAMES.get(month, str(month))
    issues = []
    corrections = []
    parsed_rows = []
    seen_national_ids = {}

    for row_idx, row in enumerate(ws.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
        def cell(field):
            idx = col_map.get(field)
            return row[idx] if idx is not None and idx < len(row) else None

        name = cell("name")
        if not name or not str(name).strip():
            continue  # blank row, skip silently (not a data quality issue — just spacer rows)

        national_id_raw = cell("national_id")
        national_id = str(national_id_raw).strip().translate(ARABIC_INDIC_DIGITS) if national_id_raw not in (None, "") else None

        basic, basic_fix = to_number(cell("basic"))
        housing, _ = to_number(cell("housing"))
        transport, _ = to_number(cell("transport"))
        other_allowance, _ = to_number(cell("other_allowance"))
        overtime, _ = to_number(cell("overtime"))
        absence_days, _ = to_number(cell("absence_days"))
        absence_amount, _ = to_number(cell("absence_amount"))
        deductions, _ = to_number(cell("deductions"))
        advances, _ = to_number(cell("advances"))
        gosi, _ = to_number(cell("gosi"))
        net_raw, net_fix = to_number(cell("net"))

        if basic_fix:
            corrections.append({"row": row_idx, "field": "basic", "original": basic_fix, "corrected": basic, "reason": "تحويل أرقام عربية/فواصل إلى رقم صالح"})
        if net_fix:
            corrections.append({"row": row_idx, "field": "net", "original": net_fix, "corrected": net_raw, "reason": "تحويل أرقام عربية/فواصل إلى رقم صالح"})

        total_allowances = housing + transport + other_allowance + overtime
        gross = basic + total_allowances
        total_deducted = absence_amount + deductions + gosi + advances
        net = net_raw if net_raw else (gross - total_deducted)

        # --- quality checks (same rules the original analysis used) ---
        if not national_id:
            issues.append({"row": row_idx, "rule": "MISSING_NATIONAL_ID", "severity": "MEDIUM",
                            "employee_name": str(name), "detail": "رقم الهوية غير موجود لهذا الموظف"})
        elif national_id in seen_national_ids:
            issues.append({"row": row_idx, "rule": "DUPLICATE_NATIONAL_ID_SAME_MONTH", "severity": "HIGH",
                            "employee_name": str(name), "detail": f"مكرر مع الصف {seen_national_ids[national_id]}"})
        else:
            seen_national_ids[national_id] = row_idx

        if basic <= 0:
            issues.append({"row": row_idx, "rule": "NON_POSITIVE_BASIC_SALARY", "severity": "MEDIUM",
                            "employee_name": str(name), "detail": "الراتب الأساسي صفر أو سالب"})

        parsed_rows.append({
            "month": month, "month_name": month_name, "company": company, "company_label": company_label,
            "job_no": str(cell("job_no")) if cell("job_no") is not None else None,
            "national_id": national_id, "name": str(name).strip(),
            "branch": str(cell("branch")).strip() if cell("branch") else None,
            "job_title": str(cell("job_title")).strip() if cell("job_title") else None,
            "status": str(cell("status")).strip() if cell("status") else "أساسي",
            "basic": basic, "housing": housing, "transport": transport, "other_allowance": other_allowance,
            "overtime": overtime, "total_allowances": total_allowances, "gross": gross,
            "absence_days": absence_days, "absence_amount": absence_amount, "deductions": deductions,
            "total_deductions": deductions, "advances": advances, "gosi": gosi, "other_total": 0,
            "total_deducted": total_deducted, "net": net,
        })

    if not parsed_rows:
        raise HTTPException(status_code=422, detail="لم يتم العثور على أي صفوف بيانات صالحة في الملف")

    # cross-check against already-stored data for the same month, other companies
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            nids = [r["national_id"] for r in parsed_rows if r["national_id"]]
            if nids:
                cur.execute(
                    "SELECT DISTINCT national_id, company FROM payroll_records WHERE month = %s AND national_id = ANY(%s) AND company != %s",
                    (month, nids, company),
                )
                cross = cur.fetchall()
                for nid, other_company in cross:
                    issues.append({"row": None, "rule": "EMPLOYEE_IN_MULTIPLE_COMPANIES_SAME_MONTH", "severity": "CRITICAL",
                                   "employee_name": next((r["name"] for r in parsed_rows if r["national_id"] == nid), nid),
                                   "detail": f"نفس رقم الهوية نشط أيضًا في {other_company} لنفس الشهر"})

            # remove any previous import for this exact company+month (re-upload = replace)
            cur.execute("DELETE FROM payroll_records WHERE company = %s AND month = %s", (company, month))

            cols = ["month", "month_name", "company", "company_label", "job_no", "national_id", "name", "branch",
                    "job_title", "status", "basic", "housing", "transport", "other_allowance", "overtime",
                    "total_allowances", "gross", "absence_days", "absence_amount", "deductions", "total_deductions",
                    "advances", "gosi", "other_total", "total_deducted", "net"]
            placeholders = ", ".join(["%s"] * len(cols))
            for r in parsed_rows:
                cur.execute(f"INSERT INTO payroll_records ({', '.join(cols)}) VALUES ({placeholders})", [r.get(c) for c in cols])

                # upsert into employees: keep the latest month's row per (national_id or job_no) per company
                cur.execute(
                    "SELECT id FROM employees WHERE company = %s AND (national_id = %s OR (national_id IS NULL AND job_no = %s))",
                    (company, r["national_id"], r["job_no"]),
                )
                existing = cur.fetchone()
                emp_cols = ["national_id", "job_no", "name", "company", "company_label", "branch", "job_title",
                            "status", "as_of_month", "as_of_month_name", "is_active", "basic", "net", "housing",
                            "transport", "other_allowance", "overtime", "total_allowances", "gross",
                            "absence_days", "absence_amount", "deductions", "total_deductions", "gosi",
                            "advances", "other_total", "total_deducted"]
                emp_vals = {**r, "as_of_month": month, "as_of_month_name": month_name, "is_active": True}
                if existing:
                    set_clause = ", ".join([f"{c} = %s" for c in emp_cols])
                    cur.execute(f"UPDATE employees SET {set_clause} WHERE id = %s", [emp_vals.get(c) for c in emp_cols] + [existing[0]])
                else:
                    cur.execute(
                        f"INSERT INTO employees ({', '.join(emp_cols)}) VALUES ({', '.join(['%s'] * len(emp_cols))})",
                        [emp_vals.get(c) for c in emp_cols],
                    )

            for i in issues:
                cur.execute(
                    """INSERT INTO quality_issues (rule, severity, company, month, file, sheet, source_row, employee_name, detail)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (i["rule"], i["severity"], company, month, file.filename, ws.title,
                     str(i["row"]) if i["row"] else None, i["employee_name"], i["detail"]),
                )
            for c in corrections:
                cur.execute(
                    """INSERT INTO correction_log (file, sheet, source_row, field, original, corrected, type, reason, confidence, status)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (file.filename, ws.title, str(c["row"]), c["field"], str(c["original"]), str(c["corrected"]),
                     "AUTO_CLEAN", c["reason"], 95, "معتمد"),
                )

            quality_score = max(0, round(100 - (len(issues) / len(parsed_rows) * 100))) if parsed_rows else 100
            cur.execute(
                """INSERT INTO payroll_uploads (filename, company, month, month_name, uploaded_by, uploaded_by_name,
                    row_count, issues_count, corrections_count, quality_score, status, summary)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'completed',%s)""",
                (file.filename, company, month, month_name, current_user["id"],
                 current_user["full_name"] or current_user["username"], len(parsed_rows), len(issues),
                 len(corrections), quality_score, None),
            )

            cur.execute(
                "SELECT company, month, month_name, file, company_label FROM files_summary WHERE company=%s AND month=%s",
                (company, month),
            )
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO files_summary (file, company, company_label, month, month_name) VALUES (%s,%s,%s,%s,%s)",
                    (file.filename, company, company_label, month, month_name),
                )
        conn.commit()
    finally:
        conn.close()

    log_action(current_user, "payroll.upload", "payroll_records", f"{company}-{month}",
               {"filename": file.filename, "rows": len(parsed_rows), "issues": len(issues)})

    return {
        "filename": file.filename, "sheet": ws.title, "company": company, "month": month, "month_name": month_name,
        "row_count": len(parsed_rows), "issues": issues, "corrections": corrections,
        "quality_score": max(0, round(100 - (len(issues) / len(parsed_rows) * 100))) if parsed_rows else 100,
        "detected_columns": {k: True for k in col_map},
    }


@router.get("/history")
def upload_history(current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id, filename, company, month, month_name, uploaded_by_name, row_count, issues_count,
                          corrections_count, quality_score, status, created_at
                   FROM payroll_uploads ORDER BY created_at DESC LIMIT 50"""
            )
            cols = [c.name for c in cur.description]
            return [{col: native(v) for col, v in zip(cols, row)} for row in cur.fetchall()]
    finally:
        conn.close()
