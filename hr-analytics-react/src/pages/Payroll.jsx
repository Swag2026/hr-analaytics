import React, { useMemo } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { LineChart, BarChart, DoughnutChart } from '../components/charts/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { fmtSAR } from '../utils/format.js';

export default function Payroll() {
  const { data: HR_DATA, monthName, companyLabel } = useHrData();
  const { company, month } = useFilters();
  const m = Number(month || 8);

  function totalsFor(companyFilter, mo) {
    const companies = companyFilter ? [companyFilter] : HR_DATA.meta.companies;
    const agg = { total_basic: 0, total_net: 0, total_gross: 0, total_allowances: 0, total_deductions: 0, total_gosi: 0, total_advances: 0, total_absence_amount: 0, total_overtime: 0, headcount: 0 };
    companies.forEach((c) => {
      const row = HR_DATA.monthly[c][mo - 1];
      Object.keys(agg).forEach((k) => (agg[k] += row[k]));
    });
    return agg;
  }

  const t = useMemo(() => totalsFor(company, m), [HR_DATA, company, m]);
  const companies = company ? [company] : HR_DATA.meta.companies;

  const trend = useMemo(() => {
    const months = HR_DATA.meta.months;
    return { months, basic: months.map((mo) => totalsFor(company, mo).total_basic), net: months.map((mo) => totalsFor(company, mo).total_net) };
  }, [HR_DATA, company]);

  const topBranches = useMemo(() => {
    let allBranches = [];
    companies.forEach((c) => HR_DATA.branches[c].forEach((b) => allBranches.push(b)));
    allBranches.sort((a, b) => b.total_net - a.total_net);
    return allBranches.slice(0, 10);
  }, [HR_DATA, company]);

  const distribution = useMemo(() => {
    const emps = HR_DATA.employees.filter((e) => !company || e.company === company);
    const buckets = [0, 2000, 3000, 4000, 5000, 7000, 10000, 20000, 999999];
    const bucketLabels = ['<2K', '2-3K', '3-4K', '4-5K', '5-7K', '7-10K', '10-20K', '20K+'];
    const counts = new Array(bucketLabels.length).fill(0);
    emps.forEach((e) => {
      for (let i = 0; i < buckets.length - 1; i++) { if (e.basic >= buckets[i] && e.basic < buckets[i + 1]) { counts[i]++; break; } }
    });
    return { bucketLabels, counts };
  }, [HR_DATA, company]);

  const regRows = HR_DATA.payroll_records.filter((r) => r.month === m && (!company || r.company === company));
  const regCols = [
    { key: 'name', label: 'اسم الموظف' },
    { key: 'company_label', label: 'الشركة' },
    { key: 'branch', label: 'الفرع' },
    { key: 'job_title', label: 'الوظيفة' },
    { key: 'status', label: 'الحالة', render: (r) => <span className={`badge ${r.status === 'أساسي' ? 'low' : 'medium'}`}>{r.status}</span> },
    { key: 'basic', label: 'الأساسي', render: (r) => fmtSAR(r.basic) },
    { key: 'housing', label: 'السكن', render: (r) => fmtSAR(r.housing) },
    { key: 'transport', label: 'المواصلات', render: (r) => fmtSAR(r.transport) },
    { key: 'other_allowance', label: 'بدلات أخرى', render: (r) => fmtSAR(r.other_allowance) },
    { key: 'overtime', label: 'العمل الإضافي', render: (r) => fmtSAR(r.overtime) },
    { key: 'total_allowances', label: 'إجمالي البدلات', render: (r) => fmtSAR(r.total_allowances) },
    { key: 'gross', label: 'إجمالي الراتب', render: (r) => fmtSAR(r.gross) },
    { key: 'absence_days', label: 'أيام الغياب' },
    { key: 'absence_amount', label: 'خصم الغياب', render: (r) => fmtSAR(r.absence_amount) },
    { key: 'deductions', label: 'اقتطاعات', render: (r) => fmtSAR(r.deductions) },
    { key: 'advances', label: 'سلف', render: (r) => fmtSAR(r.advances) },
    { key: 'gosi', label: 'التأمينات (GOSI)', render: (r) => fmtSAR(r.gosi) },
    { key: 'total_deducted', label: 'إجمالي المخصوم', render: (r) => fmtSAR(r.total_deducted) },
    { key: 'net', label: 'صافي الراتب', render: (r) => <b>{fmtSAR(r.net)}</b> },
  ];

  return (
    <>
      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">الراتب الأساسي</div><div className="value">{fmtSAR(t.total_basic)}</div></div>
        <div className="kpi-card"><div className="label">إجمالي البدلات</div><div className="value">{fmtSAR(t.total_allowances)}</div></div>
        <div className="kpi-card"><div className="label">العمل الإضافي</div><div className="value">{fmtSAR(t.total_overtime)}</div></div>
        <div className="kpi-card"><div className="label">إجمالي الاستقطاعات</div><div className="value">{fmtSAR(t.total_deductions)}</div></div>
        <div className="kpi-card"><div className="label">التأمينات (GOSI)</div><div className="value">{fmtSAR(t.total_gosi)}</div></div>
        <div className="kpi-card"><div className="label">السلف</div><div className="value">{fmtSAR(t.total_advances)}</div></div>
        <div className="kpi-card"><div className="label">خصم الغياب</div><div className="value">{fmtSAR(t.total_absence_amount)}</div></div>
        <div className="kpi-card"><div className="label">صافي الرواتب</div><div className="value" style={{ color: 'var(--brass-dark)' }}>{fmtSAR(t.total_net)}</div></div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-head"><h2>اتجاه الرواتب الشهري</h2></div>
          <LineChart labels={trend.months.map(monthName)} datasets={[{ label: 'الراتب الأساسي', data: trend.basic, color: '#A9803E' }, { label: 'صافي الرواتب', data: trend.net, color: '#0E1B2E' }]} height={270} />
        </div>
        <div className="card">
          <div className="section-head"><h2>تركيبة الراتب ({monthName(m)})</h2></div>
          <DoughnutChart labels={['أساسي', 'بدلات', 'عمل إضافي', 'استقطاعات وتأمينات']} data={[t.total_basic, t.total_allowances, t.total_overtime, t.total_deductions + t.total_gosi]} colors={['#0E1B2E', '#A9803E', '#2A5D9C', '#AF2E2E']} height={270} />
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-head"><h2>مقارنة الشركات — صافي الرواتب</h2></div>
          <BarChart labels={HR_DATA.company_summary.map((c) => c.label)} datasets={[{ label: 'صافي الرواتب', data: HR_DATA.company_summary.map((c) => c.total_net_payroll) }]} height={260} />
        </div>
        <div className="card">
          <div className="section-head"><h2>مقارنة الفروع — أعلى 10 حسب إجمالي الرواتب</h2></div>
          <BarChart labels={topBranches.map((b) => b.branch)} datasets={[{ label: 'إجمالي الرواتب', data: topBranches.map((b) => b.total_net), color: '#1F7A5C' }]} opts={{ horizontal: true }} height={260} />
        </div>
      </div>

      <div className="card mb-24">
        <div className="section-head"><h2>توزيع الرواتب الأساسية بين الموظفين</h2><span className="hint">{monthName(m)} · {company ? companyLabel(company) : 'كل الشركات'}</span></div>
        <BarChart labels={distribution.bucketLabels} datasets={[{ label: 'عدد الموظفين', data: distribution.counts, color: '#A9803E' }]} height={260} />
      </div>

      <div className="card">
        <div className="section-head"><h2>مسير رواتب الموظفين — تفصيل كامل</h2><span className="hint">{monthName(m)} · {company ? companyLabel(company) : 'كل الشركات'} · كل مكونات الراتب كما وردت في ملفات الرواتب الأصلية</span></div>
        <DataTable columns={regCols} rows={regRows} opts={{ searchPlaceholder: 'ابحث باسم الموظف أو الفرع أو الوظيفة...', searchFields: ['name', 'branch', 'job_title'], exportFilename: `مسير_رواتب_${company || 'كل_الشركات'}_${monthName(m)}`, exportSheetName: 'مسير الرواتب' }} />
      </div>
    </>
  );
}
