import React, { useMemo } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { KpiCard, RiskBadge, EmptyState } from '../components/Atoms.jsx';
import { DualAxisTrendChart, BarChart } from '../components/charts/Charts.jsx';
import { fmtSAR, fmtPct } from '../utils/format.js';

export default function Dashboard() {
  const { data: HR_DATA, monthName, companyLabel } = useHrData();
  const { company, month } = useFilters();
  const m = month || 8;

  const totals = useMemo(() => {
    const companies = company ? [company] : HR_DATA.meta.companies;
    let headcount = 0, net = 0, basic = 0, gosi = 0, overtime = 0, advances = 0;
    let prevHeadcount = 0, prevNet = 0;
    companies.forEach((c) => {
      const rows = HR_DATA.monthly[c];
      const cur = rows.find((r) => r.month === Number(m));
      const prev = rows.find((r) => r.month === Number(m) - 1) || rows[0];
      if (cur) { headcount += cur.headcount; net += cur.total_net; basic += cur.total_basic; gosi += cur.total_gosi; overtime += cur.total_overtime; advances += cur.total_advances; }
      if (prev) { prevHeadcount += prev.headcount; prevNet += prev.total_net; }
    });
    return {
      headcount, net, basic, gosi, overtime, advances, prevHeadcount, prevNet,
      hcDelta: prevHeadcount ? (100 * (headcount - prevHeadcount)) / prevHeadcount : 0,
      netDelta: prevNet ? (100 * (net - prevNet)) / prevNet : 0,
    };
  }, [HR_DATA, company, m]);

  const hiresExits = useMemo(() => {
    const companies = company ? [company] : HR_DATA.meta.companies;
    let hires = 0, exits = 0;
    HR_DATA.company_summary.filter((c) => companies.includes(c.company)).forEach((c) => { hires += c.new_hires_ytd; exits += c.exits_ytd; });
    return { hires, exits };
  }, [HR_DATA, company]);

  const insights = useMemo(() => {
    const companies = company ? [company] : HR_DATA.meta.companies;
    const list = [];
    const cs = HR_DATA.company_summary.filter((c) => companies.includes(c.company));

    const byPayrollGrowth = [...cs].sort((a, b) => b.payroll_growth_pct - a.payroll_growth_pct);
    if (byPayrollGrowth[0]) {
      list.push({ title: 'أعلى نمو في الرواتب', desc: `ارتفعت رواتب ${byPayrollGrowth[0].label} بنسبة ${fmtPct(byPayrollGrowth[0].payroll_growth_pct)} منذ يناير`, severity: byPayrollGrowth[0].payroll_growth_pct > 25 ? 'HIGH' : 'MEDIUM', scope: byPayrollGrowth[0].label });
    }
    const byHcDrop = [...cs].sort((a, b) => a.headcount_growth_pct - b.headcount_growth_pct);
    if (byHcDrop[0] && byHcDrop[0].headcount_growth_pct < 0) {
      list.push({ title: 'أكبر انخفاض في عدد الموظفين', desc: `تراجع عدد موظفي ${byHcDrop[0].label} بنسبة ${fmtPct(Math.abs(byHcDrop[0].headcount_growth_pct))} منذ يناير`, severity: 'MEDIUM', scope: byHcDrop[0].label });
    }
    let allBranches = [];
    companies.forEach((c) => HR_DATA.branches[c].forEach((b) => allBranches.push({ ...b, company: c, company_label: companyLabel(c) })));
    const byCost = [...allBranches].sort((a, b) => b.total_net - a.total_net)[0];
    if (byCost) {
      list.push({ title: 'أعلى فرع تكلفة', desc: `فرع "${byCost.branch}" يمثل أعلى تكلفة رواتب بواقع ${fmtSAR(byCost.total_net)} لعدد ${byCost.headcount} موظف`, severity: 'MEDIUM', scope: byCost.company_label });
    }
    HR_DATA.overlap_cases.forEach((o) => {
      if (companies.includes(o.company_1) || companies.includes(o.company_2)) {
        list.push({ title: 'تداخل موظف بين شركتين', desc: `${o.name} يظهر نشطًا في ${o.company_1_label} و${o.company_2_label} خلال ${o.overlap_months_names} — تعرض محتمل ${fmtSAR(o.potential_exposure)}`, severity: o.risk_level, scope: 'مركز المراجعة' });
      }
    });
    const scores = Object.entries(HR_DATA.quality_scores).filter(([c]) => companies.includes(c));
    const lowest = scores.sort((a, b) => a[1] - b[1])[0];
    if (lowest) {
      list.push({ title: 'أدنى درجة جودة بيانات', desc: `${companyLabel(lowest[0])} بدرجة ${lowest[1]}/100 — راجع صفحة جودة البيانات للتفاصيل`, severity: lowest[1] < 70 ? 'HIGH' : 'MEDIUM', scope: companyLabel(lowest[0]) });
    }
    return list.slice(0, 6);
  }, [HR_DATA, company, companyLabel]);

  const trend = useMemo(() => {
    const companies = company ? [company] : HR_DATA.meta.companies;
    const months = HR_DATA.meta.months;
    const hcSeries = months.map((mm) => companies.reduce((s, c) => s + HR_DATA.monthly[c][mm - 1].headcount, 0));
    const netSeries = months.map((mm) => companies.reduce((s, c) => s + HR_DATA.monthly[c][mm - 1].total_net, 0));
    return { months, hcSeries, netSeries };
  }, [HR_DATA, company]);

  const topBranches = useMemo(() => {
    const companies = company ? [company] : HR_DATA.meta.companies;
    let allBranches = [];
    companies.forEach((c) => HR_DATA.branches[c].forEach((b) => allBranches.push({ ...b, company: c })));
    allBranches.sort((a, b) => b.headcount - a.headcount);
    return allBranches.slice(0, 10);
  }, [HR_DATA, company]);

  const kpis = [
    { label: 'إجمالي الموظفين', value: totals.headcount, unit: 'موظف', delta: totals.hcDelta, to: '/employees' },
    { label: 'إجمالي الرواتب (صافي)', value: fmtSAR(totals.net), delta: totals.netDelta, to: '/payroll' },
    { label: 'متوسط الراتب الأساسي', value: fmtSAR(Math.round(totals.basic / (totals.headcount || 1))), to: '/payroll' },
    { label: 'التعيينات (تراكمي)', value: hiresExits.hires, unit: 'موظف', to: '/movements', caveat: true },
    { label: 'المغادرات (تراكمي)', value: hiresExits.exits, unit: 'موظف', to: '/turnover', caveat: true },
    { label: 'إجمالي التأمينات (GOSI)', value: fmtSAR(totals.gosi), to: '/payroll' },
    { label: 'إجمالي العمل الإضافي', value: fmtSAR(totals.overtime), to: '/payroll' },
    { label: 'حالات تحتاج مراجعة', value: HR_DATA.overlap_cases.length, unit: 'حالة', to: '/review-center', tone: 'critical' },
  ];

  return (
    <>
      <div className="kpi-grid">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-head"><h2>اتجاه عدد الموظفين والرواتب</h2><span className="hint">يناير – أغسطس 2026</span></div>
          <DualAxisTrendChart
            labels={trend.months.map(monthName)}
            barData={trend.hcSeries} lineData={trend.netSeries}
            barLabel="عدد الموظفين" lineLabel="صافي الرواتب"
            y1Title="عدد الموظفين" y2Title="صافي الرواتب (﷼)" height={260}
          />
        </div>
        <div className="card">
          <div className="section-head"><h2>مقارنة الشركات — صافي الرواتب (أغسطس)</h2></div>
          <BarChart
            labels={HR_DATA.company_summary.map((c) => c.label)}
            datasets={[{ label: 'صافي الرواتب', data: HR_DATA.company_summary.map((c) => c.total_net_payroll) }]}
            height={260}
          />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>أهم ملاحظات الموارد البشرية</h2>
          <span className="hint">مستخرجة تلقائيًا من بيانات أغسطس 2026 مقارنة بالأشهر السابقة</span>
        </div>
        <div className="grid-3">
          {insights.map((i, idx) => (
            <div className="insight" key={idx}>
              <div className="top"><div className="title">{i.title}</div><RiskBadge level={i.severity} /></div>
              <div className="desc">{i.desc}</div>
              <div className="meta">{i.scope}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-head"><h2>ترتيب الفروع حسب عدد الموظفين</h2><a href="#/branches" className="btn ghost sm">عرض الكل</a></div>
          <BarChart
            labels={topBranches.map((b) => b.branch)}
            datasets={[{ label: 'عدد الموظفين', data: topBranches.map((b) => b.headcount), color: '#2A5D9C' }]}
            opts={{ horizontal: true }} height={280}
          />
        </div>
        <div className="card">
          <div className="section-head"><h2>حالات تحتاج مراجعة</h2><a href="#/review-center" className="btn ghost sm">مركز المراجعة</a></div>
          <div className="flex" style={{ flexDirection: 'column', gap: 10 }}>
            {HR_DATA.overlap_cases.length === 0 ? <EmptyState icon="check-list">لا توجد حالات تداخل حاليًا</EmptyState> : HR_DATA.overlap_cases.map((o, idx) => (
              <div className="flex justify-between items-center" key={idx} style={{ padding: '10px 12px', background: 'var(--paper)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{o.name}</div>
                  <div className="small text-muted">{o.company_1_label} ↔ {o.company_2_label} · تداخل {o.overlap_months_names}</div>
                </div>
                <RiskBadge level={o.risk_level} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
