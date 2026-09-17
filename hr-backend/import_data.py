"""
Loads an HR_DATA.json file (same shape the old frontend used to fetch statically)
into the Postgres schema defined in schema.sql.

Usage:
    python3 import_data.py /path/to/HR_DATA.json

Safe to re-run: truncates and reloads all data tables (not the users table).
"""
import json
import sys
import os
import psycopg2

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hr_analytics")


def to_bool(v):
    return bool(v) if v is not None else None


def main(path):
    with open(path, encoding="utf-8") as f:
        d = json.load(f)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Wipe existing data (not users) so this script is idempotent / re-runnable on refresh.
    tables = [
        "monthly_stats", "company_summary", "branches", "branches_monthly", "branch_transfers",
        "employees", "payroll_records", "movement_ledger", "overlap_cases", "resolved_cases",
        "quality_summary", "quality_scores", "quality_issues", "correction_log", "files_summary",
        "companies", "months", "meta",
    ]
    cur.execute("TRUNCATE " + ", ".join(tables) + " RESTART IDENTITY CASCADE")

    meta = d["meta"]
    cur.execute(
        "INSERT INTO meta (id, last_updated, current_period) VALUES (1, %s, %s)",
        (meta.get("last_updated"), meta.get("current_period")),
    )

    for i, c in enumerate(meta["companies"]):
        cur.execute(
            "INSERT INTO companies (company, label, sort_order) VALUES (%s, %s, %s)",
            (c, meta["company_labels"].get(c, c), i),
        )

    for m in meta["months"]:
        cur.execute(
            "INSERT INTO months (month, month_name) VALUES (%s, %s) ON CONFLICT (month) DO NOTHING",
            (m, meta["month_names"].get(str(m), meta["month_names"].get(m))),
        )

    for company, rows in d["monthly"].items():
        for r in rows:
            cur.execute(
                """INSERT INTO monthly_stats
                   (company, month, month_name, headcount, total_basic, total_net, total_gross,
                    total_allowances, total_deductions, total_gosi, total_advances,
                    total_absence_amount, total_absence_days, total_overtime, avg_basic, avg_net)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (company, r["month"], r.get("month_name"), r.get("headcount"), r.get("total_basic"),
                 r.get("total_net"), r.get("total_gross"), r.get("total_allowances"), r.get("total_deductions"),
                 r.get("total_gosi"), r.get("total_advances"), r.get("total_absence_amount"),
                 r.get("total_absence_days"), r.get("total_overtime"), r.get("avg_basic"), r.get("avg_net")),
            )

    for c in d["company_summary"]:
        cur.execute(
            """INSERT INTO company_summary
               (company, label, headcount, total_net_payroll, avg_basic, exits_ytd, new_hires_ytd,
                branches_count, headcount_growth, headcount_growth_pct, payroll_growth_pct,
                exits_confidence, total_absence_amount, total_deductions)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (c["company"], c.get("label"), c.get("headcount"), c.get("total_net_payroll"), c.get("avg_basic"),
             c.get("exits_ytd"), c.get("new_hires_ytd"), c.get("branches_count"), c.get("headcount_growth"),
             c.get("headcount_growth_pct"), c.get("payroll_growth_pct"), c.get("exits_confidence"),
             c.get("total_absence_amount"), c.get("total_deductions")),
        )

    for company, rows in d["branches"].items():
        for b in rows:
            cur.execute(
                """INSERT INTO branches
                   (company, branch, headcount, total_net, total_basic, avg_basic, total_absence_days,
                    total_absence_amount, total_deductions, transfers_in, transfers_out, outflow_estimate,
                    turnover_rate_estimate)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (company, b["branch"], b.get("headcount"), b.get("total_net"), b.get("total_basic"),
                 b.get("avg_basic"), b.get("total_absence_days"), b.get("total_absence_amount"),
                 b.get("total_deductions"), b.get("transfers_in"), b.get("transfers_out"),
                 b.get("outflow_estimate"), b.get("turnover_rate_estimate")),
            )

    for company, branches in d["branches_monthly"].items():
        for branch, rows in branches.items():
            for r in rows:
                cur.execute(
                    """INSERT INTO branches_monthly
                       (company, branch, month, month_name, headcount, total_net, total_basic,
                        absence_amount, absence_days, deductions, total_deductions)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (company, branch, r["month"], r.get("month_name"), r.get("headcount"), r.get("total_net"),
                     r.get("total_basic"), r.get("absence_amount"), r.get("absence_days"), r.get("deductions"),
                     r.get("total_deductions")),
                )

    for t in d.get("branch_transfers", []):
        cur.execute(
            """INSERT INTO branch_transfers
               (name, national_id, company, company_label, previous_branch, new_branch,
                effective_month, effective_month_name, basic)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (t.get("name"), t.get("national_id"), t.get("company"), t.get("company_label"),
             t.get("previous_branch"), t.get("new_branch"), t.get("effective_month"),
             t.get("effective_month_name"), t.get("basic")),
        )

    for e in d.get("employees", []):
        cur.execute(
            """INSERT INTO employees
               (national_id, job_no, name, company, company_label, branch, job_title, status,
                as_of_month, as_of_month_name, is_active, basic, net, housing, transport,
                other_allowance, overtime, total_allowances, gross, absence_days, absence_amount,
                deductions, total_deductions, gosi, advances, other_total, total_deducted)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (str(e.get("national_id")) if e.get("national_id") is not None else None, str(e.get("job_no")),
             e.get("name"), e.get("company"), e.get("company_label"), e.get("branch"), e.get("job_title"),
             e.get("status"), e.get("as_of_month"), e.get("as_of_month_name"), to_bool(e.get("is_active")),
             e.get("basic"), e.get("net"), e.get("housing"), e.get("transport"), e.get("other_allowance"),
             e.get("overtime"), e.get("total_allowances"), e.get("gross"), e.get("absence_days"),
             e.get("absence_amount"), e.get("deductions"), e.get("total_deductions"), e.get("gosi"),
             e.get("advances"), e.get("other_total"), e.get("total_deducted")),
        )

    for r in d.get("payroll_records", []):
        cur.execute(
            """INSERT INTO payroll_records
               (month, month_name, company, company_label, job_no, national_id, name, branch, job_title,
                status, basic, housing, transport, other_allowance, overtime, total_allowances, gross,
                absence_days, absence_amount, deductions, total_deductions, advances, gosi, other_total,
                total_deducted, net)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (r["month"], r.get("month_name"), r.get("company"), r.get("company_label"), str(r.get("job_no")),
             str(r.get("national_id")) if r.get("national_id") is not None else None, r.get("name"),
             r.get("branch"), r.get("job_title"), r.get("status"), r.get("basic"), r.get("housing"),
             r.get("transport"), r.get("other_allowance"), r.get("overtime"), r.get("total_allowances"),
             r.get("gross"), r.get("absence_days"), r.get("absence_amount"), r.get("deductions"),
             r.get("total_deductions"), r.get("advances"), r.get("gosi"), r.get("other_total"),
             r.get("total_deducted"), r.get("net")),
        )

    for m in d.get("movement_ledger", []):
        cur.execute(
            """INSERT INTO movement_ledger
               (national_id, employee_name, previous_company, previous_branch, new_company, new_branch,
                movement_type, previous_salary, new_salary, salary_change, effective_month, evidence)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (m.get("national_id"), m.get("employee_name"), m.get("previous_company"), m.get("previous_branch"),
             m.get("new_company"), m.get("new_branch"), m.get("movement_type"), m.get("previous_salary"),
             m.get("new_salary"), m.get("salary_change"), m.get("effective_month"), m.get("evidence")),
        )

    for o in d.get("overlap_cases", []):
        cur.execute(
            """INSERT INTO overlap_cases
               (name, national_id, company_1, company_1_label, company_2, company_2_label,
                overlap_months_names, salary_1, salary_2, potential_exposure, risk_level, review_status, evidence)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (o.get("name"), o.get("national_id"), o.get("company_1"), o.get("company_1_label"),
             o.get("company_2"), o.get("company_2_label"), o.get("overlap_months_names"), o.get("salary_1"),
             o.get("salary_2"), o.get("potential_exposure"), o.get("risk_level"), o.get("review_status"),
             o.get("evidence")),
        )

    for r in d.get("resolved_cases", []):
        cur.execute(
            """INSERT INTO resolved_cases
               (national_id, employee_name, previous_company, previous_branch, new_company, new_branch,
                movement_type, previous_salary, new_salary, salary_change, effective_month, evidence, resolution)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (r.get("national_id"), r.get("employee_name"), r.get("previous_company"), r.get("previous_branch"),
             r.get("new_company"), r.get("new_branch"), r.get("movement_type"), r.get("previous_salary"),
             r.get("new_salary"), r.get("salary_change"), r.get("effective_month"), r.get("evidence"),
             r.get("resolution")),
        )

    for rule, count in d.get("quality_summary", {}).items():
        cur.execute("INSERT INTO quality_summary (rule, count) VALUES (%s,%s)", (rule, count))

    for company, score in d.get("quality_scores", {}).items():
        cur.execute("INSERT INTO quality_scores (company, score) VALUES (%s,%s)", (company, score))

    for i in d.get("quality_issues_sample", []):
        cur.execute(
            """INSERT INTO quality_issues
               (rule, severity, company, month, file, sheet, source_row, employee_name, detail)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (i.get("rule"), i.get("severity"), i.get("company"), i.get("month"), i.get("file"),
             i.get("sheet"), str(i.get("source_row")), i.get("employee_name"), i.get("detail")),
        )

    for c in d.get("correction_log", []):
        cur.execute(
            """INSERT INTO correction_log
               (legacy_id, file, sheet, source_row, field, original, corrected, type, reason, confidence, status)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (c.get("id"), c.get("file"), c.get("sheet"), str(c.get("source_row")), c.get("field"),
             c.get("original"), c.get("corrected"), c.get("type"), c.get("reason"), c.get("confidence"),
             c.get("status")),
        )

    for f in d.get("files_summary", []):
        cur.execute(
            "INSERT INTO files_summary (file, company, company_label, month, month_name) VALUES (%s,%s,%s,%s,%s)",
            (f.get("file"), f.get("company"), f.get("company_label"), f.get("month"), f.get("month_name")),
        )

    conn.commit()
    cur.close()
    conn.close()
    print("Import complete.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 import_data.py /path/to/HR_DATA.json")
        sys.exit(1)
    main(sys.argv[1])
