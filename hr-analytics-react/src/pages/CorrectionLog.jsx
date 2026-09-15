import React from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { Badge } from '../components/Atoms.jsx';
import DataTable from '../components/DataTable.jsx';

export default function CorrectionLog() {
  const { data: HR_DATA } = useHrData();
  const log = HR_DATA.correction_log;
  const avgConf = Math.round(log.reduce((s, l) => s + l.confidence, 0) / log.length);

  const cols = [
    { key: 'id', label: '#' },
    { key: 'file', label: 'الملف' },
    { key: 'sheet', label: 'الشيت' },
    { key: 'source_row', label: 'الصف' },
    { key: 'field', label: 'الحقل' },
    { key: 'original', label: 'القيمة الأصلية' },
    { key: 'corrected', label: 'القيمة الجديدة' },
    { key: 'type', label: 'نوع التصحيح' },
    { key: 'reason', label: 'السبب' },
    { key: 'confidence', label: 'الثقة', render: (r) => <Badge tone={r.confidence >= 95 ? 'low' : r.confidence >= 80 ? 'medium' : r.confidence >= 60 ? 'neutral' : 'critical'}>{r.confidence}</Badge> },
    { key: 'status', label: 'الحالة' },
  ];

  return (
    <>
      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">إجمالي التصحيحات</div><div className="value">{log.length}</div></div>
        <div className="kpi-card"><div className="label">متوسط درجة الثقة</div><div className="value">{avgConf}<span className="unit">/100</span></div></div>
        <div className="kpi-card"><div className="label">تصحيح تلقائي كامل (95+)</div><div className="value">{log.filter((l) => l.confidence >= 95).length}</div></div>
        <div className="kpi-card"><div className="label">يحتاج مراجعة (أقل من 60)</div><div className="value">{log.filter((l) => l.confidence < 60).length}</div></div>
      </div>

      <div className="card mb-24">
        <div className="section-head"><h2>سياسة الثقة المعتمدة</h2></div>
        <div className="grid-3" style={{ gap: 10 }}>
          <div className="card" style={{ padding: 12, background: 'var(--success-bg)' }}><div style={{ fontWeight: 800, color: 'var(--success)' }}>95-100</div><div className="small" style={{ color: 'var(--success)' }}>تصحيح تلقائي كامل</div></div>
          <div className="card" style={{ padding: 12, background: 'var(--warning-bg)' }}><div style={{ fontWeight: 800, color: 'var(--warning)' }}>80-94</div><div className="small" style={{ color: 'var(--warning)' }}>تصحيح تلقائي + تحذير</div></div>
          <div className="card" style={{ padding: 12, background: 'var(--info-bg)' }}><div style={{ fontWeight: 800, color: 'var(--info)' }}>60-79</div><div className="small" style={{ color: 'var(--info)' }}>لا يُصحَّح تلقائيًا — يحتاج مراجعة</div></div>
          <div className="card" style={{ padding: 12, background: 'var(--critical-bg)' }}><div style={{ fontWeight: 800, color: 'var(--critical)' }}>أقل من 60</div><div className="small" style={{ color: 'var(--critical)' }}>الاحتفاظ بالقيمة الأصلية + علامة خطأ</div></div>
        </div>
      </div>

      <div className="card">
        <div className="section-head"><h2>سجل كل تصحيح</h2></div>
        <DataTable columns={cols} rows={log} opts={{ searchPlaceholder: 'ابحث في الملفات...', searchFields: ['file', 'original', 'reason'], exportFilename: 'سجل_التعديلات', exportSheetName: 'التصحيحات' }} />
      </div>
    </>
  );
}
