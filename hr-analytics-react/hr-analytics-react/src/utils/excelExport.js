import * as XLSX from 'xlsx';

export function exportToExcel(filename, sheetName, headerLabels, rows) {
  try {
    const ws = XLSX.utils.aoa_to_sheet([headerLabels, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (sheetName || 'Sheet1').slice(0, 31));
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : filename + '.xlsx');
  } catch (err) {
    alert('تعذر إنشاء ملف Excel — تأكد من الاتصال بالإنترنت لتحميل مكتبة التصدير (SheetJS) عند أول استخدام.');
    console.error(err);
  }
}

// Export an array of plain objects using column defs {key,label,raw} — pulls RAW values, not rendered JSX.
export function exportObjectsToExcel(filename, sheetName, columns, rows) {
  const headerLabels = columns.map((c) => c.label);
  const dataRows = rows.map((r) => columns.map((c) => (c.raw ? c.raw(r) : r[c.key] ?? '')));
  exportToExcel(filename, sheetName, headerLabels, dataRows);
}

// Full multi-sheet workbook export — ported from PAGES.reports exportFullWorkbook().
export function exportFullWorkbook(HR_DATA, companyLabel, monthName, label) {
  try {
    const wb = XLSX.utils.book_new();
    const addSheet = (name, columns, rows) => {
      const headerLabels = columns.map((c) => c.label);
      const dataRows = rows.map((r) => columns.map((c) => (c.raw ? c.raw(r) : r[c.key] ?? '')));
      const ws = XLSX.utils.aoa_to_sheet([headerLabels, ...dataRows]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    };

    addSheet('ملخص الشركات', [
      { label: 'الشركة', key: 'label' }, { label: 'الموظفون', key: 'headcount' },
      { label: 'صافي الرواتب', key: 'total_net_payroll' }, { label: 'متوسط الأساسي', key: 'avg_basic' },
      { label: 'عدد الفروع', key: 'branches_count' }, { label: 'نمو الموظفين %', key: 'headcount_growth_pct' },
      { label: 'نمو الرواتب %', key: 'payroll_growth_pct' },
    ], HR_DATA.company_summary);

    addSheet('مسير الرواتب (أغسطس)', [
      { label: 'الاسم', key: 'name' }, { label: 'الشركة', key: 'company_label' }, { label: 'الفرع', key: 'branch' },
      { label: 'الوظيفة', key: 'job_title' }, { label: 'الحالة', key: 'status' }, { label: 'الأساسي', key: 'basic' },
      { label: 'السكن', key: 'housing' }, { label: 'المواصلات', key: 'transport' }, { label: 'العمل الإضافي', key: 'overtime' },
      { label: 'إجمالي البدلات', key: 'total_allowances' }, { label: 'أيام الغياب', key: 'absence_days' },
      { label: 'خصم الغياب', key: 'absence_amount' }, { label: 'الاقتطاعات', key: 'deductions' }, { label: 'السلف', key: 'advances' },
      { label: 'GOSI', key: 'gosi' }, { label: 'صافي الراتب', key: 'net' },
    ], HR_DATA.payroll_records.filter((r) => r.month === 8));

    addSheet('دليل الموظفين', [
      { label: 'رقم الموظف', key: 'job_no' }, { label: 'الاسم', key: 'name' }, { label: 'الشركة', key: 'company_label' },
      { label: 'الفرع', key: 'branch' }, { label: 'الوظيفة', key: 'job_title' }, { label: 'الحالة', key: 'status' },
      { label: 'نشط حاليًا', raw: (r) => (r.is_active ? 'نعم' : 'لا') }, { label: 'آخر ظهور', key: 'as_of_month_name' },
      { label: 'صافي الراتب', key: 'net' },
    ], HR_DATA.employees);

    Object.keys(HR_DATA.branches).forEach((c) => {
      if (HR_DATA.branches[c].length) {
        addSheet('فروع ' + companyLabel(c), [
          { label: 'الفرع', key: 'branch' }, { label: 'الموظفون', key: 'headcount' }, { label: 'إجمالي الرواتب', key: 'total_net' },
          { label: 'متوسط الأساسي', key: 'avg_basic' }, { label: 'أيام الغياب', key: 'total_absence_days' },
          { label: 'خصم الغياب', key: 'total_absence_amount' }, { label: 'الاقتطاعات', key: 'total_deductions' },
          { label: 'نقل وارد', key: 'transfers_in' }, { label: 'نقل صادر', key: 'transfers_out' },
          { label: 'معدل دوران تقديري %', key: 'turnover_rate_estimate' },
        ], HR_DATA.branches[c]);
      }
    });

    addSheet('التنقل بين الفروع', [
      { label: 'الاسم', key: 'name' }, { label: 'الشركة', key: 'company_label' }, { label: 'من فرع', key: 'previous_branch' },
      { label: 'إلى فرع', key: 'new_branch' }, { label: 'الشهر', key: 'effective_month_name' }, { label: 'الراتب الأساسي', key: 'basic' },
    ], HR_DATA.branch_transfers);

    addSheet('النقل بين الشركات', [
      { label: 'الاسم', key: 'employee_name' }, { label: 'من شركة', key: 'previous_company_label' },
      { label: 'إلى شركة', key: 'new_company_label' }, { label: 'الشهر', key: 'effective_month_name' },
      { label: 'الراتب قبل', key: 'previous_salary' }, { label: 'الراتب بعد', key: 'new_salary' }, { label: 'النوع', key: 'movement_type' },
    ], HR_DATA.movement_ledger);

    addSheet('حالات محلولة', [
      { label: 'الاسم', key: 'employee_name' }, { label: 'من شركة', key: 'previous_company' }, { label: 'إلى شركة', key: 'new_company' },
      { label: 'القرار', key: 'resolution' }, { label: 'الدليل', key: 'evidence' },
    ], HR_DATA.resolved_cases || []);

    addSheet('جودة البيانات', [
      { label: 'المشكلة', key: 'rule' }, { label: 'الخطورة', key: 'severity' }, { label: 'الشركة', key: 'company' },
      { label: 'الشهر', raw: (r) => monthName(r.month) }, { label: 'الملف', key: 'file' }, { label: 'الصف', key: 'source_row' },
      { label: 'الموظف', key: 'employee_name' }, { label: 'التفصيل', key: 'detail' },
    ], HR_DATA.quality_issues_sample);

    addSheet('سجل التعديلات', [
      { label: 'الملف', key: 'file' }, { label: 'الشيت', key: 'sheet' }, { label: 'الصف', key: 'source_row' },
      { label: 'الحقل', key: 'field' }, { label: 'القيمة الأصلية', key: 'original' }, { label: 'القيمة الجديدة', key: 'corrected' },
      { label: 'السبب', key: 'reason' }, { label: 'الثقة', key: 'confidence' }, { label: 'الحالة', key: 'status' },
    ], HR_DATA.correction_log);

    XLSX.writeFile(wb, `تقرير_شامل_${(label || 'HR').replace(/\s+/g, '_')}.xlsx`);
  } catch (err) {
    console.error(err);
    alert('تعذر إنشاء ملف Excel — تأكد من الاتصال بالإنترنت لتحميل مكتبة التصدير (SheetJS) عند أول استخدام.');
  }
}
