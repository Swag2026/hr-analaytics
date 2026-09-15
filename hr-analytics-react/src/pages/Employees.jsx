import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { Badge, Chip } from '../components/Atoms.jsx';
import DataTable from '../components/DataTable.jsx';
import { useModal, ModalHead } from '../context/ModalContext.jsx';
import { fmtSAR } from '../utils/format.js';

export default function Employees() {
  const { data: HR_DATA } = useHrData();
  const { company, setCompany } = useFilters();
  const [searchParams] = useSearchParams();
  const { openModal, closeModal } = useModal();

  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('active');

  useEffect(() => {
    const c = searchParams.get('company');
    const b = searchParams.get('branch');
    if (c) setCompany(c);
    if (b) setBranch(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const branchOptions = useMemo(() => {
    const set = new Set(HR_DATA.employees.filter((e) => !company || e.company === company).map((e) => e.branch));
    return [...set].sort();
  }, [HR_DATA, company]);

  useEffect(() => {
    if (branch && !branchOptions.includes(branch)) setBranch('');
  }, [branchOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => HR_DATA.employees.filter((e) =>
    (!company || e.company === company) && (!branch || e.branch === branch) && (!status || e.status === status)
    && (scope === 'all' || e.is_active)
  ), [HR_DATA, company, branch, status, scope]);

  function showEmployeeModal(emp) {
    const history = HR_DATA.employee_history[emp.national_id] || [];
    const companies = [...new Set(history.map((h) => h.company_label))];
    openModal(
      <>
        <ModalHead title={emp.name} subtitle={`${emp.job_title} · ${emp.company_label} · ${emp.branch}`} onClose={closeModal} />
        <div className="modal-body">
          <div className="grid-3 mb-16">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">الحالة</div><div style={{ fontWeight: 800 }}>{emp.status}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">الراتب الأساسي</div><div style={{ fontWeight: 800 }}>{fmtSAR(emp.basic)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">صافي الراتب</div><div style={{ fontWeight: 800 }}>{fmtSAR(emp.net)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">بدل السكن</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.housing)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">بدل المواصلات</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.transport)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">بدلات أخرى</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.other_allowance)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">العمل الإضافي</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.overtime)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">إجمالي البدلات</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.total_allowances)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">إجمالي الراتب</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.gross)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">خصم الغياب ({emp.absence_days} يوم)</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.absence_amount)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">اقتطاعات</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.deductions)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">السلف</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.advances)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">التأمينات (GOSI)</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.gosi)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">إجمالي المخصوم</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.total_deducted)}</div></div>
            <div className="card" style={{ padding: 12, background: 'var(--brass-light)' }}><div className="small" style={{ color: 'var(--brass-dark)' }}>صافي الراتب</div><div style={{ fontWeight: 800, color: 'var(--brass-dark)' }}>{fmtSAR(emp.net)}</div></div>
          </div>

          <h4 className="mb-12">تاريخ الشركة والراتب (من واقع ملفات الرواتب الشهرية)</h4>
          <div className="table-wrap mb-16">
            <table className="data-table">
              <thead><tr><th>الشهر</th><th>الشركة</th><th>الفرع</th><th>الوظيفة</th><th>الراتب الأساسي</th><th>صافي الراتب</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}><td>{h.month_name}</td><td>{h.company_label}</td><td>{h.branch}</td><td>{h.job_title}</td><td>{fmtSAR(h.basic)}</td><td>{fmtSAR(h.net)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {companies.length > 1 ? (
            <Chip>تنبيه: هذا الموظف ظهر في أكثر من شركة ({companies.join(' + ')}) — راجع <a href="#/review-center" style={{ color: 'var(--brass)', fontWeight: 700 }}>مركز المراجعة</a></Chip>
          ) : null}
          <p className="small text-muted mb-8" style={{ marginTop: 16 }}>رقم الهوية: {emp.national_id || 'غير مسجل'} · رقم الموظف: {emp.job_no}</p>
        </div>
      </>
    );
  }

  const cols = [
    { key: 'job_no', label: 'رقم الموظف' },
    { key: 'name', label: 'الاسم' },
    { key: 'company_label', label: 'الشركة' },
    { key: 'branch', label: 'الفرع' },
    { key: 'job_title', label: 'الوظيفة' },
    { key: 'status', label: 'الحالة', render: (r) => <Badge tone={r.status === 'أساسي' ? 'low' : 'medium'}>{r.status}</Badge> },
    { key: 'is_active', label: 'نشط حاليًا؟', render: (r) => r.is_active ? <Badge tone="low">نشط</Badge> : <Badge tone="neutral">غادر (آخر ظهور: {r.as_of_month_name})</Badge>, raw: (r) => (r.is_active ? 'نشط' : 'غادر') },
    { key: 'basic', label: 'الراتب الأساسي', render: (r) => fmtSAR(r.basic) },
    { key: 'net', label: 'صافي الراتب', render: (r) => fmtSAR(r.net) },
  ];

  return (
    <div className="card mb-16">
      <div className="table-toolbar">
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">كل الفروع</option>
            {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="أساسي">أساسي</option>
            <option value="تحت التجربة">تحت التجربة</option>
          </select>
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="active">نشط حاليًا فقط</option>
            <option value="all">الكل (شامل من غادر الشركة)</option>
          </select>
        </div>
      </div>
      <DataTable
        columns={cols}
        rows={rows}
        opts={{ searchPlaceholder: 'ابحث بالاسم أو رقم الموظف...', searchFields: ['name', 'job_no', 'job_title'], onRowClick: showEmployeeModal, exportFilename: 'دليل_الموظفين', exportSheetName: 'الموظفون' }}
      />
    </div>
  );
}
