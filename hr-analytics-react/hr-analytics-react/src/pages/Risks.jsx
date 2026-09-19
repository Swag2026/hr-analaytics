import React, { useMemo } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { RiskBadge, Chip } from '../components/Atoms.jsx';
import { fmtSAR, fmtPct } from '../utils/format.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const LEVEL_LABEL = { CRITICAL: 'حرج', HIGH: 'مرتفع', MEDIUM: 'متوسط', LOW: 'منخفض' };
const ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function Risks() {
  const { data: HR_DATA, companyLabel } = useHrData();
  const { tt } = useLanguage();

  const risks = useMemo(() => {
    const list = [];
    HR_DATA.overlap_cases.forEach((o) => {
      list.push({ title: 'احتمال صرف راتب مزدوج / تداخل بين شركتين', level: o.risk_level, employee: o.name, detail: `${o.company_1_label} و${o.company_2_label} خلال ${o.overlap_months_names} — تعرض محتمل ${fmtSAR(o.potential_exposure)}`, link: '/review-center', category: 'تداخل رواتب' });
    });
    const dupIssues = HR_DATA.quality_issues_sample.filter((i) => i.rule === 'DUPLICATE_NATIONAL_ID_SAME_MONTH');
    if (dupIssues.length) list.push({ title: 'بيانات مكررة', level: 'HIGH', employee: `${dupIssues.length} حالة`, detail: 'رقم هوية ظهر أكثر من مرة في نفس الشركة/الشهر — قد يعني ازدواج سجل الراتب', link: '/data-quality', category: 'جودة بيانات' });
    const missingId = HR_DATA.quality_summary['MISSING_NATIONAL_ID'] || 0;
    if (missingId) list.push({ title: 'بيانات ناقصة', level: missingId > 200 ? 'MEDIUM' : 'LOW', employee: `${missingId} سجل`, detail: 'رقم هوية غير مسجل لعدد من الموظفين، ما يصعّب مطابقتهم عبر الشركات', link: '/data-quality', category: 'جودة بيانات' });
    const lowScore = Object.entries(HR_DATA.quality_scores).filter(([, s]) => s < 70);
    lowScore.forEach(([c, s]) => list.push({ title: 'انخفاض جودة بيانات شركة', level: 'MEDIUM', employee: companyLabel(c), detail: `درجة جودة البيانات ${s}/100 — أقل من الحد الأدنى الموصى به (70)`, link: '/data-quality', category: 'جودة بيانات' }));
    const highGrowth = HR_DATA.company_summary.filter((c) => c.payroll_growth_pct > 30);
    highGrowth.forEach((c) => list.push({ title: 'ارتفاع تكلفة الرواتب', level: 'MEDIUM', employee: c.label, detail: `نمو رواتب بنسبة ${fmtPct(c.payroll_growth_pct)} منذ يناير — أعلى من نمو عدد الموظفين`, link: '/payroll-cost', category: 'تكلفة' }));
    return list.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  }, [HR_DATA, companyLabel]);

  return (
    <>
      <div className="kpi-grid mb-24">
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lv) => (
          <div className="kpi-card" key={lv}>
            <div className="label">{tt(LEVEL_LABEL[lv])}</div>
            <div className="value">{risks.filter((r) => r.level === lv).length}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="section-head"><h2>{tt('كل الحالات')}</h2></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {risks.map((r, idx) => (
            <a href={`#${r.link}`} key={idx} className="flex items-center justify-between" style={{ padding: '14px 16px', background: 'var(--paper)', borderRadius: 10 }}>
              <div className="flex items-center gap-12">
                <RiskBadge level={r.level} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>{tt(r.title)}</div>
                  <div className="small text-muted">{r.employee} — {tt(r.detail)}</div>
                </div>
              </div>
              <Chip>{tt(r.category)}</Chip>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
