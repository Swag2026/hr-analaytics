from .db import query


def get_hr_data():
    companies = query("SELECT company, label FROM companies ORDER BY sort_order")
    company_codes = [c["company"] for c in companies]
    company_labels = {c["company"]: c["label"] for c in companies}

    months = query("SELECT month, month_name FROM months ORDER BY month")
    month_list = [m["month"] for m in months]
    month_names = {str(m["month"]): m["month_name"] for m in months}

    meta_row = query("SELECT last_updated, current_period FROM meta WHERE id = 1")
    files_summary = query(
        "SELECT file, company, company_label, month, month_name FROM files_summary ORDER BY month, company"
    )

    meta = {
        "companies": company_codes,
        "company_labels": company_labels,
        "months": month_list,
        "month_names": month_names,
        "total_files": len(files_summary),
        "last_updated": meta_row[0]["last_updated"] if meta_row else None,
        "current_period": meta_row[0]["current_period"] if meta_row else None,
    }

    monthly = {c: [] for c in company_codes}
    for r in query(
        """SELECT company, month, month_name, headcount, total_basic, total_net, total_gross,
                  total_allowances, total_deductions, total_gosi, total_advances,
                  total_absence_amount, total_absence_days, total_overtime, avg_basic, avg_net
           FROM monthly_stats ORDER BY company, month"""
    ):
        company = r.pop("company")
        monthly.setdefault(company, []).append(r)

    company_summary = query(
        """SELECT company, label, headcount, total_net_payroll, avg_basic, exits_ytd, new_hires_ytd,
                  branches_count, headcount_growth, headcount_growth_pct, payroll_growth_pct,
                  exits_confidence, total_absence_amount, total_deductions
           FROM company_summary"""
    )
    order_index = {c: i for i, c in enumerate(company_codes)}
    company_summary.sort(key=lambda r: order_index.get(r["company"], 999))

    branches = {c: [] for c in company_codes}
    for r in query(
        """SELECT company, branch, headcount, total_net, total_basic, avg_basic, total_absence_days,
                  total_absence_amount, total_deductions, transfers_in, transfers_out, outflow_estimate,
                  turnover_rate_estimate
           FROM branches ORDER BY company, headcount DESC"""
    ):
        company = r.pop("company")
        branches.setdefault(company, []).append(r)

    branches_monthly = {c: {} for c in company_codes}
    for r in query(
        """SELECT company, branch, month, month_name, headcount, total_net, total_basic,
                  absence_amount, absence_days, deductions, total_deductions
           FROM branches_monthly ORDER BY company, branch, month"""
    ):
        company = r.pop("company")
        branch = r.pop("branch")
        branches_monthly.setdefault(company, {}).setdefault(branch, []).append(r)

    branch_transfers = query(
        """SELECT name, national_id, company, company_label, previous_branch, new_branch,
                  effective_month, effective_month_name, basic
           FROM branch_transfers ORDER BY effective_month"""
    )

    employees = query(
        """SELECT id, national_id, job_no, name, company, company_label, branch, job_title, status,
                  as_of_month, as_of_month_name, is_active, basic, net, housing, transport,
                  other_allowance, overtime, total_allowances, gross, absence_days, absence_amount,
                  deductions, total_deductions, gosi, advances, other_total, total_deducted
           FROM employees ORDER BY company, branch, name"""
    )

    payroll_records = query(
        """SELECT id, month, month_name, company, company_label, job_no, national_id, name, branch, job_title,
                  status, basic, housing, transport, other_allowance, overtime, total_allowances, gross,
                  absence_days, absence_amount, deductions, total_deductions, advances, gosi, other_total,
                  total_deducted, net
           FROM payroll_records ORDER BY month, company, name"""
    )

    # employee_history is derived from payroll_records grouped by national_id (same as the
    # original generator did), rather than stored separately.
    employee_history = {}
    for r in query(
        """SELECT national_id, month, month_name, company, company_label, branch, job_title, status,
                  basic, net, absence_days, absence_amount, deductions, total_deductions
           FROM payroll_records WHERE national_id IS NOT NULL ORDER BY national_id, month"""
    ):
        nid = r.pop("national_id")
        employee_history.setdefault(nid, []).append(r)

    movement_ledger = query(
        """SELECT national_id, employee_name, previous_company, previous_branch, new_company, new_branch,
                  movement_type, previous_salary, new_salary, salary_change, effective_month, evidence
           FROM movement_ledger ORDER BY effective_month"""
    )

    overlap_cases = query(
        """SELECT o.id, o.name, o.national_id, o.company_1, o.company_1_label, o.company_2, o.company_2_label,
                  o.overlap_months_names, o.salary_1, o.salary_2, o.potential_exposure, o.risk_level,
                  o.review_status, o.evidence,
                  rd.decision, rd.decided_by_name, rd.decided_at
           FROM overlap_cases o
           LEFT JOIN review_decisions rd ON rd.case_id = o.id
           ORDER BY o.id"""
    )

    resolved_cases = query(
        """SELECT national_id, employee_name, previous_company, previous_branch, new_company, new_branch,
                  movement_type, previous_salary, new_salary, salary_change, effective_month, evidence, resolution
           FROM resolved_cases"""
    )

    quality_summary = {r["rule"]: r["count"] for r in query("SELECT rule, count FROM quality_summary")}
    quality_scores = {r["company"]: r["score"] for r in query("SELECT company, score FROM quality_scores")}

    quality_issues_sample = query(
        """SELECT issue_id, rule, severity, company, month, file, sheet, source_row, employee_name, detail
           FROM quality_issues ORDER BY issue_id"""
    )

    correction_log = query(
        """SELECT id, file, sheet, source_row, field, original, corrected, type, reason, confidence, status
           FROM correction_log ORDER BY id"""
    )

    return {
        "meta": meta,
        "monthly": monthly,
        "company_summary": company_summary,
        "branches": branches,
        "branches_monthly": branches_monthly,
        "branch_transfers": branch_transfers,
        "employees": employees,
        "employee_history": employee_history,
        "payroll_records": payroll_records,
        "movement_ledger": movement_ledger,
        "overlap_cases": overlap_cases,
        "resolved_cases": resolved_cases,
        "quality_summary": quality_summary,
        "quality_scores": quality_scores,
        "quality_issues_sample": quality_issues_sample,
        "correction_log": correction_log,
        "files_summary": files_summary,
    }
