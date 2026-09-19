import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHrData } from '../context/DataContext.jsx';
import { RiskBadge, Badge } from '../components/Atoms.jsx';
import DataTable from '../components/DataTable.jsx';
import { fmtSAR } from '../utils/format.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Exceptions() {
  const { data: HR_DATA } = useHrData();
  const navigate = useNavigate();
  const { tt } = useLanguage();

  const rows = HR_DATA.overlap_cases.map((o) => ({
    employee: o.name, company: `${o.company_1_label} / ${o.company_2_label}`, month: o.overlap_months_names,
    type: 'احتمال صرف مزدوج', amount: o.potential_exposure, risk: o.risk_level, status: o.review_status, evidence: o.evidence,
  }));

  const cols = [
    { key: 'employee', label: 'الموظف' },
    { key: 'company', label: 'الشركتان' },
    { key: 'month', label: 'شهر التداخل' },
    { key: 'type', label: 'نوع المشكلة', render: (r) => tt(r.type) },
    { key: 'amount', label: 'المبلغ المحتمل', render: (r) => <b>{fmtSAR(r.amount)}</b> },
    { key: 'risk', label: 'درجة الخطورة', render: (r) => <RiskBadge level={r.risk} /> },
    { key: 'status', label: 'الحالة', render: (r) => <Badge tone="neutral">{tt(r.status.includes('CROSS_SPONSOR') ? 'كفالة مشتركة - راجع الدليل' : 'قيد التحقيق')}</Badge> },
  ];

  return (
    <>
      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">{tt('عدد الاستثناءات المفتوحة')}</div><div className="value">{rows.length}</div></div>
        <div className="kpi-card"><div className="label">{tt('إجمالي التعرض المالي المحتمل')}</div><div className="value" style={{ color: 'var(--critical)' }}>{fmtSAR(rows.reduce((s, r) => s + r.amount, 0))}</div></div>
        <div className="kpi-card"><div className="label">{tt('قيد التحقيق')}</div><div className="value">{rows.filter((r) => r.status.includes('UNDER_INVEST')).length}</div></div>
      </div>
      <div className="card">
        <div className="section-head"><h2>{tt('سجل الاستثناءات')}</h2></div>
        <DataTable columns={cols} rows={rows} opts={{ search: false, onRowClick: () => navigate('/review-center') }} />
      </div>
    </>
  );
}
