import React, { useMemo } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { ScoreRing, Badge } from '../components/Atoms.jsx';
import { BarChart } from '../components/charts/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { fmtNum } from '../utils/format.js';

const RULE_LABELS = {
  MISSING_NATIONAL_ID: 'رقم هوية مفقود', DUPLICATE_NATIONAL_ID_SAME_MONTH: 'تكرار رقم هوية بنفس الشهر',
  NON_POSITIVE_BASIC_SALARY: 'راتب أساسي صفري أو سالب', MISSING_BASIC_SALARY: 'راتب أساسي مفقود',
  EMPLOYEE_IN_MULTIPLE_COMPANIES_SAME_MONTH: 'موظف نشط بأكثر من شركة بنفس الشهر',
};
const RULE_SEVERITY = { MISSING_NATIONAL_ID: 'medium', DUPLICATE_NATIONAL_ID_SAME_MONTH: 'high', NON_POSITIVE_BASIC_SALARY: 'medium', MISSING_BASIC_SALARY: 'low', EMPLOYEE_IN_MULTIPLE_COMPANIES_SAME_MONTH: 'critical' };

export default function DataQuality() {
  const { data: HR_DATA, monthName, companyLabel } = useHrData();
  const { company } = useFilters();

  const scores = company ? { [company]: HR_DATA.quality_scores[company] } : HR_DATA.quality_scores;
  const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);
  const issues = HR_DATA.quality_issues_sample.filter((i) => !company || String(i.company).split('/').includes(company));

  const summary = useMemo(() => {
    const s = {};
    issues.forEach((i) => (s[i.rule] = (s[i.rule] || 0) + 1));
    return s;
  }, [issues]);

  const cols = [
    { key: 'rule', label: 'المشكلة', render: (r) => RULE_LABELS[r.rule] || r.rule },
    { key: 'severity', label: 'الخطورة', render: (r) => <Badge tone={RULE_SEVERITY[r.rule] || 'neutral'}>{r.severity}</Badge> },
    { key: 'company', label: 'الشركة', render: (r) => String(r.company).split('/').map(companyLabel).join(' / ') },
    { key: 'month', label: 'الشهر', render: (r) => monthName(r.month) },
    { key: 'file', label: 'الملف' },
    { key: 'sheet', label: 'الشيت' },
    { key: 'source_row', label: 'الصف المصدر' },
    { key: 'employee_name', label: 'الموظف' },
    { key: 'detail', label: 'التفصيل' },
  ];

  return (
    <>
      <div className="grid-2 mb-24">
        <div className="card flex items-center gap-16">
          <ScoreRing score={avgScore} size={100} />
          <div>
            <div className="small text-muted">متوسط درجة جودة البيانات</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{avgScore} / 100</div>
            <div className="small text-muted">قبل أي تنظيف تلقائي إضافي (Raw Score)</div>
          </div>
        </div>
        <div className="card">
          <div className="section-head"><h2>الدرجة حسب الشركة</h2></div>
          <BarChart labels={Object.keys(scores).map(companyLabel)} datasets={[{ label: 'الدرجة', data: Object.values(scores), color: '#A9803E' }]} opts={{ horizontal: true }} height={140} />
        </div>
      </div>

      <div className="kpi-grid mb-24">
        {Object.entries(summary).map(([rule, count]) => (
          <div className="kpi-card" key={rule}>
            <div className="label">{RULE_LABELS[rule] || rule} <Badge tone={RULE_SEVERITY[rule]}>{RULE_SEVERITY[rule]}</Badge></div>
            <div className="value">{fmtNum(count)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-head"><h2>سجل المشاكل (عينة حتى 500 من {Object.values(HR_DATA.quality_summary).reduce((a, b) => a + b, 0)})</h2></div>
        <DataTable columns={cols} rows={issues} opts={{ searchPlaceholder: 'ابحث عن موظف أو ملف...', searchFields: ['employee_name', 'file', 'detail'], exportFilename: 'مشاكل_جودة_البيانات', exportSheetName: 'جودة البيانات' }} />
      </div>
    </>
  );
}
