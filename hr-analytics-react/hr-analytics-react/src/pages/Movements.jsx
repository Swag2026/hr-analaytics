import React from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { DeltaBadge, Badge, EmptyState } from '../components/Atoms.jsx';
import DataTable from '../components/DataTable.jsx';
import { useModal, ModalHead } from '../context/ModalContext.jsx';
import { fmtSAR } from '../utils/format.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Movements() {
  const { data: HR_DATA } = useHrData();
  const { openModal, closeModal } = useModal();
  const { tt } = useLanguage();
  const ledger = HR_DATA.movement_ledger;

  function showTimeline(l) {
    openModal(
      <>
        <ModalHead title={l.name} onClose={closeModal} />
        <div className="modal-body">
          <div className="step-list">
            <div className="step done">
              <div className="dot">1</div>
              <div className="body"><div className="title">{l.previous_company_label} — {l.previous_branch || '—'}</div><div className="desc">{tt('الراتب الأساسي:')} {fmtSAR(l.previous_salary)}</div></div>
            </div>
            <div className={`step ${l.movement_type === 'TRANSFER' ? 'done' : 'active'}`}>
              <div className="dot">2</div>
              <div className="body"><div className="title">{tt(l.movement_type === 'TRANSFER' ? 'انتقال' : 'تداخل مؤقت')} {tt('في')} {l.effective_month_name} 2026</div><div className="desc">{tt(l.evidence || 'لم يُعثر على ملاحظة مصدر مباشرة')}</div></div>
            </div>
            <div className={`step ${l.movement_type === 'TRANSFER' ? 'done' : 'active'}`}>
              <div className="dot">3</div>
              <div className="body"><div className="title">{l.new_company_label} — {l.new_branch || '—'}</div><div className="desc">{tt('الراتب الأساسي:')} {fmtSAR(l.new_salary)} {l.salary_change_pct !== null ? `(${l.salary_change_pct > 0 ? '+' : ''}${l.salary_change_pct}%)` : ''}</div></div>
            </div>
          </div>
          {l.movement_type !== 'TRANSFER' ? <a className="btn primary mb-8" href="#/review-center">{tt('فتح في مركز المراجعة')}</a> : null}
        </div>
      </>
    );
  }

  const cols = [
    { key: 'name', label: 'الموظف' },
    { key: 'previous_company_label', label: 'من شركة' },
    { key: 'new_company_label', label: 'إلى شركة' },
    { key: 'effective_month_name', label: 'شهر النفاذ' },
    { key: 'previous_salary', label: 'الراتب قبل', render: (r) => fmtSAR(r.previous_salary) },
    { key: 'new_salary', label: 'الراتب بعد', render: (r) => fmtSAR(r.new_salary) },
    { key: 'salary_change_pct', label: 'نسبة التغيير', render: (r) => (r.salary_change_pct !== null ? <DeltaBadge pct={r.salary_change_pct} /> : '—') },
    { key: 'movement_type', label: 'النوع', render: (r) => (r.movement_type === 'TRANSFER' ? <Badge tone="low">{tt('نقل نظيف')}</Badge> : <Badge tone="critical">{tt('تداخل - يحتاج مراجعة')}</Badge>) },
  ];

  const flagged = ledger.filter((l) => l.movement_type !== 'TRANSFER');

  return (
    <>
      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">{tt('إجمالي حركات النقل المكتشفة')}</div><div className="value">{ledger.length}</div></div>
        <div className="kpi-card"><div className="label">{tt('نقل نظيف (بدون تداخل)')}</div><div className="value">{ledger.filter((l) => l.movement_type === 'TRANSFER').length}</div></div>
        <div className="kpi-card"><div className="label">{tt('نقل بتداخل يحتاج مراجعة')}</div><div className="value" style={{ color: 'var(--critical)' }}>{flagged.length}</div></div>
      </div>

      <div className="card mb-24">
        <div className="section-head"><h2>{tt('سجل الحركات (Workforce Movement Ledger)')}</h2><span className="hint">{tt('اضغط على أي حركة لعرض تفاصيلها وتاريخ الموظف الكامل')}</span></div>
        <DataTable columns={cols} rows={ledger} opts={{ search: false, onRowClick: showTimeline, exportFilename: 'سجل_حركة_الموظفين', exportSheetName: 'الحركة' }} />
      </div>

      <div className="card">
        <div className="section-head"><h2>{tt('الخط الزمني — أمثلة حقيقية من البيانات')}</h2></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {flagged.length === 0 ? <EmptyState icon="swap">{tt('لا توجد حركات معقدة حاليًا')}</EmptyState> : flagged.map((l, idx) => (
            <div className="flex items-center gap-16" key={idx} style={{ padding: 14, background: 'var(--paper)', borderRadius: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{l.name}</div>
                <div className="small text-muted">{l.previous_company_label} ({tt('حتى')} {l.effective_month_name}) ← {l.new_company_label}</div>
              </div>
              <Badge tone="critical">{tt('تداخل')}</Badge>
              <button className="btn sm" onClick={() => showTimeline(l)}>{tt('التفاصيل')}</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
