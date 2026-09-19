import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { ScoreRing, Badge } from '../components/Atoms.jsx';
import { BarChart, LineChart } from '../components/charts/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { useModal, ModalHead } from '../context/ModalContext.jsx';
import { fmtNum, fmtSAR } from '../utils/format.js';
import { Icon } from '../utils/icons.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

function branchScore(b) {
  const turnoverScore = Math.max(0, 100 - b.turnover_rate_estimate * 2.5);
  const absenceRatio = b.total_basic ? b.total_absence_amount / b.total_basic : 0;
  const absenceScore = Math.max(0, 100 - absenceRatio * 400);
  const deductionsRatio = b.total_basic ? b.total_deductions / b.total_basic : 0;
  const deductionsScore = Math.max(0, 100 - deductionsRatio * 400);
  const stabilityScore = Math.max(0, 100 - Math.abs(b.transfers_out) * 8);
  return Math.round(turnoverScore * 0.35 + absenceScore * 0.25 + deductionsScore * 0.15 + stabilityScore * 0.25);
}

export default function Branches() {
  const { data: HR_DATA, companyLabel } = useHrData();
  const { company, setCompany } = useFilters();
  const { tt } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    const c = searchParams.get('company');
    if (c) setCompany(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const list = useMemo(() => {
    const companies = company ? [company] : HR_DATA.meta.companies;
    let out = [];
    companies.forEach((c) => HR_DATA.branches[c].forEach((b) => out.push({ ...b, company: c, company_label: companyLabel(c), score: branchScore(b) })));
    return out.sort((a, b) => b.headcount - a.headcount);
  }, [HR_DATA, company, companyLabel]);

  const best = useMemo(() => [...list].sort((a, b) => b.score - a.score).slice(0, 3), [list]);
  const worst = useMemo(() => [...list].sort((a, b) => a.score - b.score).slice(0, 3), [list]);
  const transfers = useMemo(() => HR_DATA.branch_transfers.filter((t) => !company || t.company === company), [HR_DATA, company]);
  const topChart = list.slice(0, 15);

  function showBranchModal(b) {
    const monthly = (HR_DATA.branches_monthly[b.company] && HR_DATA.branches_monthly[b.company][b.branch]) || [];
    openModal(
      <>
        <ModalHead title={b.branch} onClose={closeModal} />
        <div className="modal-body">
          <div className="flex items-center gap-16 mb-24">
            <ScoreRing score={b.score} size={90} />
            <div>
              <div className="text-muted small">{b.company_label}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{tt('تقييم الفرع:')} {b.score}/100</div>
              <div className="small text-muted">{tt('دوران تقديري')} {b.turnover_rate_estimate}% · {b.transfers_in} {tt('نقل وارد')} · {b.transfers_out} {tt('نقل صادر')}</div>
            </div>
          </div>
          <div className="grid-3 mb-16">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('عدد الموظفين')}</div><div style={{ fontWeight: 800, fontSize: 18 }}>{fmtNum(b.headcount)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('إجمالي الرواتب')}</div><div style={{ fontWeight: 800, fontSize: 18 }}>{fmtSAR(b.total_net)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('متوسط الراتب')}</div><div style={{ fontWeight: 800, fontSize: 18 }}>{fmtSAR(b.avg_basic)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('إجمالي أيام الغياب')}</div><div style={{ fontWeight: 700 }}>{fmtNum(b.total_absence_days)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('خصم الغياب')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(b.total_absence_amount)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('الاقتطاعات')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(b.total_deductions)}</div></div>
          </div>
          <h4 className="mb-8">{tt('اتجاه الفرع الشهري (تكلفة الرواتب المنسوبة لهذا الفرع كل شهر)')}</h4>
          <div className="mb-16">
            <LineChart
              labels={monthly.map((m) => m.month_name)}
              datasets={[{ label: 'إجمالي الرواتب', data: monthly.map((m) => m.total_net), color: '#A9803E' }, { label: 'عدد الموظفين', data: monthly.map((m) => m.headcount), color: '#2A5D9C' }]}
              height={200}
            />
          </div>
          <a className="btn primary" href={`#/employees?company=${b.company}&branch=${encodeURIComponent(b.branch)}`}>
            {tt('عرض موظفي هذا الفرع')} <Icon name="chevronLeft" size={14} />
          </a>
        </div>
      </>
    );
  }

  const cols = [
    { key: 'branch', label: 'الفرع' },
    { key: 'company_label', label: 'الشركة' },
    { key: 'headcount', label: 'الموظفون' },
    { key: 'total_net', label: 'إجمالي الرواتب', render: (r) => fmtSAR(r.total_net) },
    { key: 'avg_basic', label: 'متوسط الراتب الأساسي', render: (r) => fmtSAR(r.avg_basic) },
    { key: 'total_absence_days', label: 'أيام الغياب (تراكمي)' },
    { key: 'total_absence_amount', label: 'خصم الغياب', render: (r) => fmtSAR(r.total_absence_amount) },
    { key: 'total_deductions', label: 'الاقتطاعات', render: (r) => fmtSAR(r.total_deductions) },
    { key: 'transfers_in', label: 'نقل وارد' },
    { key: 'transfers_out', label: 'نقل صادر' },
    { key: 'turnover_rate_estimate', label: 'معدل الدوران التقديري', render: (r) => `${r.turnover_rate_estimate}%` },
    { key: 'score', label: 'التقييم', render: (r) => <Badge tone={r.score >= 80 ? 'low' : r.score >= 60 ? 'medium' : 'high'}>{r.score}/100</Badge> },
  ];

  const tCols = [
    { key: 'name', label: 'الموظف' },
    { key: 'company_label', label: 'الشركة' },
    { key: 'previous_branch', label: 'من فرع' },
    { key: 'new_branch', label: 'إلى فرع' },
    { key: 'effective_month_name', label: 'شهر النقل' },
    { key: 'basic', label: 'الراتب الأساسي', render: (r) => fmtSAR(r.basic) },
  ];

  function rowHtml(b) {
    return (
      <div key={b.company + b.branch} className="flex justify-between items-center" style={{ padding: '9px 12px', background: 'var(--paper)', borderRadius: 8, cursor: 'pointer' }} onClick={() => showBranchModal(b)}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{b.branch}</div>
          <div className="small text-muted">{b.company_label} · {b.headcount} {tt('موظف')} · {tt('دوران')} {b.turnover_rate_estimate}%</div>
        </div>
        <span className={`badge ${b.score >= 80 ? 'low' : b.score >= 60 ? 'medium' : 'high'}`}>{b.score}</span>
      </div>
    );
  }

  return (
    <>
      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">{tt('عدد الفروع')}</div><div className="value">{list.length}</div></div>
        <div className="kpi-card"><div className="label">{tt('إجمالي الموظفين بالفروع')}</div><div className="value">{fmtNum(list.reduce((s, b) => s + b.headcount, 0))}</div></div>
        <div className="kpi-card"><div className="label">{tt('إجمالي رواتب الفروع')}</div><div className="value">{fmtSAR(list.reduce((s, b) => s + b.total_net, 0))}</div></div>
        <div className="kpi-card"><div className="label">{tt('إجمالي خصم الغياب')}</div><div className="value">{fmtSAR(list.reduce((s, b) => s + b.total_absence_amount, 0))}</div></div>
        <div className="kpi-card"><div className="label">{tt('النقل بين الفروع (يناير-أغسطس)')}</div><div className="value">{transfers.length}</div></div>
        <div className="kpi-card"><div className="label">{tt('متوسط تقييم الفروع')}</div><div className="value">{Math.round(list.reduce((s, b) => s + b.score, 0) / (list.length || 1))}<span className="unit">/100</span></div></div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-head"><h2>{tt('الأفضل أداءً')}</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{best.map(rowHtml)}</div>
        </div>
        <div className="card">
          <div className="section-head"><h2>{tt('الأقل أداءً / الأكثر احتياجًا للمراجعة')}</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{worst.map(rowHtml)}</div>
        </div>
      </div>

      <div className="card mb-24">
        <div className="section-head"><h2>{tt('عدد الموظفين حسب الفرع')}</h2></div>
        <BarChart labels={topChart.map((b) => b.branch)} datasets={[{ label: 'عدد الموظفين', data: topChart.map((b) => b.headcount) }]} opts={{ horizontal: true }} height={320} />
      </div>

      <div className="card mb-24">
        <div className="section-head"><h2>{tt('كل الفروع — مع مؤشرات الدوران والغياب')}</h2><span className="hint">{tt('قابل للتصدير Excel للتدقيق')}</span></div>
        <DataTable columns={cols} rows={list} opts={{ searchPlaceholder: 'ابحث عن فرع...', searchFields: ['branch', 'company_label'], onRowClick: showBranchModal, exportFilename: 'تقييم_الفروع', exportSheetName: 'الفروع' }} />
      </div>

      <div className="card">
        <div className="section-head"><h2>{tt('سجل النقل بين الفروع')}</h2><span className="hint">{tt('اكتُشف تلقائيًا من تغيّر الفرع بين شهرين متتاليين لنفس الموظف — كل شهر يُحسب على فرعه الفعلي في ذلك الشهر')}</span></div>
        <DataTable columns={tCols} rows={transfers} opts={{ searchPlaceholder: 'ابحث باسم الموظف...', searchFields: ['name', 'previous_branch', 'new_branch'], exportFilename: 'النقل_بين_الفروع', exportSheetName: 'نقل الفروع' }} />
      </div>
    </>
  );
}
