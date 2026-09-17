import io
import os

import arabic_reshaper
from bidi.algorithm import get_display
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .db import get_conn, native
from .auth import get_current_user

router = APIRouter(prefix="/api/payslip", tags=["payslip"])

FONT_DIR = os.path.join(os.path.dirname(__file__), "assets")
pdfmetrics.registerFont(TTFont("Arabic", os.path.join(FONT_DIR, "ArabicFont.ttf")))
pdfmetrics.registerFont(TTFont("Arabic-Bold", os.path.join(FONT_DIR, "ArabicFont-Bold.ttf")))

INK = colors.HexColor("#0E1B2E")
BRASS = colors.HexColor("#A9803E")
LINE = colors.HexColor("#E4E1D8")
MUTED = colors.HexColor("#666B78")


import re


def rtl(text):
    """Reshape + reorder Arabic text so reportlab draws it correctly (reportlab has no
    native RTL/shaping support — this is the standard workaround). Diacritics are
    stripped since the bundled Arabic font doesn't include those glyphs."""
    if text is None:
        return ""
    s = re.sub(r"[\u064B-\u0652]", "", str(text))
    return get_display(arabic_reshaper.reshape(s))


def fmt_sar(v):
    v = v or 0
    return f"{v:,.0f}"


def get_payroll_row(employee_id: int, month: int | None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT national_id, job_no, name, company, company_label, branch FROM employees WHERE id = %s", (employee_id,))
            emp = cur.fetchone()
            if not emp:
                raise HTTPException(status_code=404, detail="الموظف غير موجود")
            national_id, job_no, name, company, company_label, branch = emp

            if month:
                cur.execute(
                    """SELECT month, month_name, company_label, branch, job_title, status, basic, housing,
                              transport, other_allowance, overtime, total_allowances, gross, absence_days,
                              absence_amount, deductions, advances, gosi, total_deducted, net
                       FROM payroll_records WHERE company = %s AND (national_id = %s OR job_no = %s) AND month = %s
                       ORDER BY id DESC LIMIT 1""",
                    (company, national_id, job_no, month),
                )
            else:
                cur.execute(
                    """SELECT month, month_name, company_label, branch, job_title, status, basic, housing,
                              transport, other_allowance, overtime, total_allowances, gross, absence_days,
                              absence_amount, deductions, advances, gosi, total_deducted, net
                       FROM payroll_records WHERE company = %s AND (national_id = %s OR job_no = %s)
                       ORDER BY month DESC LIMIT 1""",
                    (company, national_id, job_no),
                )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="لا يوجد سجل راتب لهذا الموظف في الشهر المطلوب")
            cols = [c.name for c in cur.description]
            record = {col: native(v) for col, v in zip(cols, row)}
            return {"national_id": national_id, "job_no": job_no, "name": name, **record}
    finally:
        conn.close()


def draw_payslip(c: canvas.Canvas, data: dict):
    W, H = A4
    right = W - 20 * mm
    left = 20 * mm

    c.setFillColor(INK)
    c.rect(0, H - 28 * mm, W, 28 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Arabic-Bold", 16)
    c.drawRightString(right, H - 13 * mm, rtl("قسيمة الراتب"))
    c.setFont("Arabic", 10)
    c.drawRightString(right, H - 20 * mm, rtl(f"{data['company_label']} - {data['month_name']} 2026"))
    c.setFont("Arabic", 8)
    c.drawRightString(right, H - 25 * mm, rtl("جميع القيم بالريال السعودي"))

    y = H - 40 * mm
    c.setFillColor(INK)
    c.setFont("Arabic-Bold", 11)
    c.drawRightString(right, y, rtl("بيانات الموظف"))
    y -= 7 * mm
    c.setFont("Arabic", 10)
    c.setFillColor(colors.black)
    info_rows = [
        ("الاسم", data["name"]), ("رقم الموظف", data.get("job_no") or "-"),
        ("رقم الهوية", data.get("national_id") or "-"), ("الفرع", data.get("branch") or "-"),
        ("الوظيفة", data.get("job_title") or "-"), ("الحالة", data.get("status") or "-"),
    ]
    for label, value in info_rows:
        c.drawRightString(right, y, rtl(f"{label}:"))
        c.drawRightString(right - 35 * mm, y, rtl(str(value)))
        y -= 6 * mm

    y -= 4 * mm
    c.setStrokeColor(LINE)
    c.line(left, y, right, y)
    y -= 8 * mm

    def section(title, rows, total_label, total_value, accent):
        nonlocal y
        c.setFont("Arabic-Bold", 11)
        c.setFillColor(accent)
        c.drawRightString(right, y, rtl(title))
        y -= 9 * mm
        c.setFont("Arabic", 10)
        c.setFillColor(colors.black)
        for label, value in rows:
            c.drawRightString(right, y, rtl(label))
            c.drawString(left, y, fmt_sar(value))
            y -= 7 * mm
        y -= 3 * mm
        c.setStrokeColor(LINE)
        c.line(left, y, right, y)
        y -= 9 * mm
        c.setFont("Arabic-Bold", 10.5)
        c.drawRightString(right, y, rtl(total_label))
        c.drawString(left, y, fmt_sar(total_value))
        y -= 14 * mm

    section("المستحقات", [
        ("الراتب الأساسي", data["basic"]), ("بدل السكن", data["housing"]), ("بدل المواصلات", data["transport"]),
        ("بدلات أخرى", data["other_allowance"]), ("العمل الإضافي", data["overtime"]),
    ], "إجمالي المستحقات", data["gross"], colors.HexColor("#1F7A5C"))

    section("الاستقطاعات", [
        (f"خصم الغياب ({data['absence_days']} يوم)", data["absence_amount"]),
        ("الاستقطاعات الأخرى", data["deductions"]), ("السلف", data["advances"]),
        ("التأمينات الاجتماعية", data["gosi"]),
    ], "إجمالي الاستقطاعات", data["total_deducted"], colors.HexColor("#AF2E2E"))

    c.setFillColor(BRASS)
    c.rect(left, y - 4 * mm, right - left, 14 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Arabic-Bold", 13)
    c.drawRightString(right - 4 * mm, y + 2 * mm, rtl("صافي الراتب"))
    c.drawString(left + 4 * mm, y + 2 * mm, fmt_sar(data["net"]))

    c.setFont("Arabic", 8)
    c.setFillColor(MUTED)
    c.drawCentredString(W / 2, 12 * mm, rtl("مستند تم إنشاؤه آليا من نظام التحليلات التنفيذية للموارد البشرية - مجموعة سواج"))


@router.get("/{employee_id}")
def get_payslip(employee_id: int, month: int | None = Query(default=None), current_user: dict = Depends(get_current_user)):
    data = get_payroll_row(employee_id, month)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    draw_payslip(c, data)
    c.showPage()
    c.save()
    buf.seek(0)
    filename = f"payslip_{employee_id}_{data['month']}.pdf"
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
