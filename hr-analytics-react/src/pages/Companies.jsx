import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHrData } from '../context/DataContext.jsx';
import { ScoreRing, DeltaBadge, Badge } from '../components/Atoms.jsx';
import { BarChart } from '../components/charts/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { fmtNum, fmtSAR } from '../utils/format.js';
import { Icon } from '../utils/icons.jsx';

export default function Companies() {
  const { data: HR_DATA } = useHrData();
  const navigate = useNavigate();

  const scoreFor = useMemo(() => {
    const maxAvg = Math.max(...HR_DATA.company_summary.map((x) => x.avg_basic));
    return (c) => {
      const q = HR_DATA.quality_scores[c.company] || 70;
      const stability = Math.max(0, 100 - Math.abs(c.headcount_growth_pct));
      const payCompetitive = Math.round((100 * c.avg_basic) / maxAvg);
      return Math.round(q * 0.4 + stability * 0.3 + payCompetitive * 0.3);
    };
  }, [HR_DATA]);

  const cols = [
    { key: 'label', label: 'الشركة' },
    { key: 'headcount', label: 'الموظفون', render: (r) => fmtNum(r.headcount) },
    { key: 'total_net_payroll', label: 'إجمالي الرواتب', render: (r) => fmtSAR(r.total_net_payroll) },
    { key: 'avg_basic', label: 'متوسط الراتب الأساسي', render: (r) => fmtSAR(r.avg_basic) },
    { key: 'branches_count', label: 'عدد الفروع' },
    { key: 'new_hires_ytd', label: 'تعيينات (تراكمي)' },
    { key: 'exits_ytd', label: 'مغادرات (تراكمي)', render: (r) => <>{fmtNum(r.exits_ytd)} <Icon name="info" size={12} /></> },
    { key: 'headcount_growth_pct', label: 'نمو الموظفين', render: (r) => <DeltaBadge pct={r.headcount_growth_pct} /> },
    { key: 'payroll_growth_pct', label: 'نمو الرواتب', render: (r) => <DeltaBadge pct={r.payroll_growth_pct} /> },
    { key: 'score', label: 'تقييم HR', render: (r) => { const s = scoreFor(r); return <Badge tone={s >= 80 ? 'low' : s >= 60 ? 'medium' : 'high'}>{s}/100</Badge>; }, raw: (r) => scoreFor(r) },
  ];

  return (
    <>
      <div className="kpi-grid">
        {HR_DATA.company_summary.map((c) => {
          const score = scoreFor(c);
          return (
            <a key={c.company} className="kpi-card" href={`#/branches?company=${c.company}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--ink)' }}>{c.label}</div>
                  <div className="small text-muted">{c.branches_count} فرع</div>
                </div>
                <ScoreRing score={score} size={54} />
              </div>
              <div className="flex justify-between">
                <div><div className="small text-muted">الموظفون</div><div style={{ fontWeight: 800 }}>{fmtNum(c.headcount)}</div></div>
                <div><div className="small text-muted">صافي الرواتب</div><div style={{ fontWeight: 800 }}>{fmtSAR(c.total_net_payroll)}</div></div>
              </div>
              <DeltaBadge pct={c.headcount_growth_pct} />
            </a>
          );
        })}
      </div>

      <div className="card mb-24">
        <div className="section-head"><h2>جدول المقارنة الشامل</h2><span className="hint">اضغط على أي شركة للانتقال إلى فروعها</span></div>
        <DataTable
          columns={cols}
          rows={HR_DATA.company_summary}
          opts={{ search: false, onRowClick: (r) => navigate(`/branches?company=${r.company}`), exportFilename: 'مقارنة_الشركات', exportSheetName: 'الشركات' }}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-head"><h2>عدد الموظفين حسب الشركة</h2></div>
          <BarChart labels={HR_DATA.company_summary.map((c) => c.label)} datasets={[{ label: 'عدد الموظفين', data: HR_DATA.company_summary.map((c) => c.headcount) }]} height={260} />
        </div>
        <div className="card">
          <div className="section-head"><h2>متوسط الراتب الأساسي</h2></div>
          <BarChart labels={HR_DATA.company_summary.map((c) => c.label)} datasets={[{ label: 'متوسط الراتب الأساسي', data: HR_DATA.company_summary.map((c) => c.avg_basic), color: '#2A5D9C' }]} height={260} />
        </div>
      </div>
    </>
  );
}
