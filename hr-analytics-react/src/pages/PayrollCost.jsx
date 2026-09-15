import React, { useMemo } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { LineChart } from '../components/charts/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { DeltaBadge } from '../components/Atoms.jsx';
import { fmtPct, fmtSAR } from '../utils/format.js';
import { Icon } from '../utils/icons.jsx';

export default function PayrollCost() {
  const { data: HR_DATA, monthName } = useHrData();
  const { company } = useFilters();

  const calc = useMemo(() => {
    const companies = company ? [company] : HR_DATA.meta.companies;
    const months = HR_DATA.meta.months;
    const hc = months.map((m) => companies.reduce((s, c) => s + HR_DATA.monthly[c][m - 1].headcount, 0));
    const net = months.map((m) => companies.reduce((s, c) => s + HR_DATA.monthly[c][m - 1].total_net, 0));
    const perEmployee = hc.map((h, i) => (h ? Math.round(net[i] / h) : 0));
    const hcGrowth = (100 * (hc[7] - hc[0])) / hc[0];
    const payrollGrowth = (100 * (net[7] - net[0])) / net[0];
    const gap = payrollGrowth - hcGrowth;
    const hcIndex = hc.map((h) => Math.round((1000 * h) / hc[0]) / 10);
    const netIndex = net.map((n) => Math.round((1000 * n) / net[0]) / 10);
    return { months, hc, net, perEmployee, hcGrowth, payrollGrowth, gap, alert: gap > 15, hcIndex, netIndex };
  }, [HR_DATA, company]);

  const cols = [
    { key: 'label', label: 'الشركة' },
    { key: 'headcount_growth_pct', label: 'نمو الموظفين', render: (r) => <DeltaBadge pct={r.headcount_growth_pct} /> },
    { key: 'payroll_growth_pct', label: 'نمو الرواتب', render: (r) => <DeltaBadge pct={r.payroll_growth_pct} /> },
    { key: 'gap', label: 'الفجوة', render: (r) => { const g = r.payroll_growth_pct - r.headcount_growth_pct; return <span className={g > 15 ? 'badge critical' : ''}>{fmtPct(g, true)}</span>; } },
    { key: 'total_net_payroll', label: 'تكلفة أغسطس', render: (r) => fmtSAR(r.total_net_payroll) },
  ];

  return (
    <>
      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">نمو عدد الموظفين (يناير-أغسطس)</div><div className="value">{fmtPct(calc.hcGrowth, true)}</div></div>
        <div className="kpi-card"><div className="label">نمو تكلفة الرواتب (يناير-أغسطس)</div><div className="value">{fmtPct(calc.payrollGrowth, true)}</div></div>
        <div className="kpi-card"><div className="label">تكلفة الموظف شهريًا (أغسطس)</div><div className="value">{fmtSAR(calc.perEmployee[7])}</div></div>
        <div className="kpi-card" style={calc.alert ? { borderColor: 'var(--critical)' } : undefined}>
          <div className="label">الفجوة بين نمو الرواتب ونمو العدد</div>
          <div className="value" style={calc.alert ? { color: 'var(--critical)' } : undefined}>{fmtPct(calc.gap, true)}</div>
        </div>
      </div>

      {calc.alert ? (
        <div className="card mb-24" style={{ borderRight: '3px solid var(--critical)', background: 'var(--critical-bg)' }}>
          <div className="flex items-center gap-12">
            <span style={{ fontSize: 20 }}><Icon name="alert" size={22} /></span>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--critical)' }}>تنبيه: نمو الرواتب أعلى بكثير من نمو عدد الموظفين</div>
              <div className="small" style={{ color: 'var(--critical)' }}>الفرق {fmtPct(calc.gap)} — قد يعكس زيادات رواتب، ترقيات، عمل إضافي مرتفع، أو تصنيف خاطئ للبيانات. يستحق مراجعة يدوية.</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-head"><h2>نمو الرواتب مقابل نمو عدد الموظفين (مؤشر = 100 في يناير)</h2></div>
          <LineChart labels={calc.months.map(monthName)} datasets={[{ label: 'مؤشر عدد الموظفين', data: calc.hcIndex, color: '#2A5D9C' }, { label: 'مؤشر تكلفة الرواتب', data: calc.netIndex, color: '#AF2E2E' }]} opts={{ beginAtZero: false }} height={280} />
        </div>
        <div className="card">
          <div className="section-head"><h2>تكلفة الموظف الشهرية</h2></div>
          <LineChart labels={calc.months.map(monthName)} datasets={[{ label: 'تكلفة الموظف', data: calc.perEmployee, color: '#A9803E' }]} height={280} />
        </div>
      </div>

      <div className="card">
        <div className="section-head"><h2>تفصيل النمو حسب الشركة</h2></div>
        <DataTable columns={cols} rows={HR_DATA.company_summary.filter((c) => !company || c.company === company)} opts={{ search: false }} />
      </div>
    </>
  );
}
