import React, { useState } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { RiskBadge, Badge, EmptyState } from '../components/Atoms.jsx';
import { fmtSAR } from '../utils/format.js';
import { Icon } from '../utils/icons.jsx';

const ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const DECISION_LABELS = { DOUBLE_PAYMENT: 'تم اعتمادها كصرف مزدوج مؤكد', TRANSFER: 'تم اعتبارها نقلًا بين الشركات', DATA_ERROR: 'تم اعتبارها خطأ بيانات', CLOSED: 'تم إغلاق الحالة' };
const DECISION_COLORS = { DOUBLE_PAYMENT: 'critical', TRANSFER: 'low', DATA_ERROR: 'medium', CLOSED: 'neutral' };

export default function ReviewCenter() {
  const { data: HR_DATA } = useHrData();
  const [decisions, setDecisions] = useState({}); // in-memory only (prototype) — Backend should persist this

  const sorted = [...HR_DATA.overlap_cases].sort((a, b) => ORDER[a.risk_level] - ORDER[b.risk_level]);

  function decide(caseId, decision) {
    setDecisions((prev) => ({ ...prev, [caseId]: decision }));
  }

  const decidedCount = Object.keys(decisions).length;

  return (
    <>
      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">حالات تحتاج مراجعة</div><div className="value">{HR_DATA.overlap_cases.length}</div></div>
        <div className="kpi-card"><div className="label">إجمالي التعرض المالي المحتمل</div><div className="value" style={{ color: 'var(--critical)' }}>{fmtSAR(HR_DATA.overlap_cases.reduce((s, o) => s + o.potential_exposure, 0))}</div></div>
        <div className="kpi-card"><div className="label">{decidedCount ? `تم اتخاذ قرار في ${decidedCount} من ${HR_DATA.overlap_cases.length} حالة` : 'لم تُتخذ أي قرارات بعد في هذه الجلسة'}</div></div>
      </div>

      <div className="section-head mb-16"><h2>الحالات المفتوحة</h2><span className="hint">مرتبة حسب درجة الخطورة</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sorted.length === 0 ? (
          <EmptyState icon="check-list">لا توجد حالات مفتوحة حاليًا — كل الحالات المكتشفة تمت مراجعتها</EmptyState>
        ) : sorted.map((o, idx) => {
          const caseId = 'case' + idx;
          const isCrossSponsor = o.review_status.includes('CROSS_SPONSOR');
          const decision = decisions[caseId];
          return (
            <div className="card" key={caseId} style={{ borderRight: `3px solid ${o.risk_level === 'CRITICAL' ? 'var(--critical)' : 'var(--warning)'}` }}>
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="flex items-center gap-8 mb-8"><RiskBadge level={o.risk_level} /><span style={{ fontWeight: 900, fontSize: 16 }}>{o.name}</span></div>
                  <div className="small text-muted">رقم الهوية: {o.national_id}</div>
                </div>
                <span className="chip">تداخل: {o.overlap_months_names}</span>
              </div>

              <div className="grid-2 mb-12">
                <div className="card" style={{ padding: 12, background: 'var(--paper)' }}>
                  <div className="small text-muted">{o.company_1_label}</div>
                  <div style={{ fontWeight: 800 }}>{fmtSAR(o.salary_1)}</div>
                </div>
                <div className="card" style={{ padding: 12, background: 'var(--paper)' }}>
                  <div className="small text-muted">{o.company_2_label}</div>
                  <div style={{ fontWeight: 800 }}>{fmtSAR(o.salary_2)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-12" style={{ padding: '10px 14px', background: 'var(--critical-bg)', borderRadius: 8 }}>
                <span className="small" style={{ color: 'var(--critical)', fontWeight: 700 }}>القيمة المحتملة (غير مؤكدة كخسارة)</span>
                <span style={{ fontWeight: 900, color: 'var(--critical)' }}>{fmtSAR(o.potential_exposure)}</span>
              </div>

              <div className="card" style={{ padding: 12, background: isCrossSponsor ? 'var(--success-bg)' : 'var(--paper)', marginBottom: 4 }}>
                <div className="small" style={{ fontWeight: 700, marginBottom: 4 }}>{isCrossSponsor ? '✓ دليل من ملف المصدر (يرجّح أنها ليست صرفًا مزدوجًا):' : 'الدليل المتاح:'}</div>
                <div className="small text-muted">{o.evidence}</div>
              </div>

              <div className="flex gap-8" style={{ flexWrap: 'wrap', marginTop: 12 }}>
                <button className="btn danger sm" onClick={() => decide(caseId, 'DOUBLE_PAYMENT')}>اعتماد صرف مزدوج</button>
                <button className="btn sm" onClick={() => decide(caseId, 'TRANSFER')}>اعتبارها نقلًا</button>
                <button className="btn sm" onClick={() => decide(caseId, 'DATA_ERROR')}>اعتبارها خطأ بيانات</button>
                <button className="btn ghost sm" onClick={() => decide(caseId, 'CLOSED')}>إغلاق الحالة</button>
              </div>
              {decision ? (
                <div className="small mb-8" style={{ marginTop: 8 }}>
                  <Badge tone={DECISION_COLORS[decision]}><Icon name="check-list" size={12} /> {DECISION_LABELS[decision]}</Badge>{' '}
                  <span className="text-muted">(هذا القرار محفوظ مؤقتًا في هذه الجلسة فقط — عند الربط بالـ Backend سيُخزَّن بشكل دائم مع اسم المستخدم والتاريخ)</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {(HR_DATA.resolved_cases || []).length ? (
        <>
          <div className="section-head mb-16 mt-24"><h2>حالات تم حلّها</h2><span className="hint">قرارات معتمدة سابقًا من المستخدم — محفوظة هنا للتدقيق فقط</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {HR_DATA.resolved_cases.map((r, idx) => (
              <div className="flex justify-between items-center" key={idx} style={{ padding: '12px 16px', background: 'var(--success-bg)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--success)' }}>{r.employee_name}</div>
                  <div className="small" style={{ color: 'var(--success)' }}>{r.previous_company} ← → {r.new_company} · {r.resolution}</div>
                </div>
                <Badge tone="low">نقل مؤكد</Badge>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
