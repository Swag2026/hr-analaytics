import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { Badge, Chip } from '../components/Atoms.jsx';
import DataTable from '../components/DataTable.jsx';
import { useModal, ModalHead } from '../context/ModalContext.jsx';
import { fmtSAR } from '../utils/format.js';
import { Icon } from '../utils/icons.jsx';
import { useApi } from '../hooks/useApi.js';
import { API_BASE_URL } from '../config.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const EMPTY_FORM = {
  name: '', company: '', branch: '', job_title: '', status: 'أساسي', national_id: '', job_no: '',
  basic: 0, housing: 0, transport: 0, other_allowance: 0, overtime: 0,
  absence_days: 0, absence_amount: 0, deductions: 0, advances: 0, gosi: 0,
};

function EmployeeForm({ initial, companies, companyLabel, onSubmit, onCancel, busy }) {
  const { tt } = useLanguage();
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="grid-3" style={{ gap: 10 }}>
        <div><label className="small text-muted">{tt('الاسم')}</label><input required value={form.name} onChange={set('name')} style={inputStyle} /></div>
        <div>
          <label className="small text-muted">{tt('الشركة')}</label>
          <select required value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value, company_label: companyLabel(e.target.value) }))} style={inputStyle}>
            <option value="">{tt('اختر')}</option>
            {companies.map((c) => <option key={c} value={c}>{tt(companyLabel(c))}</option>)}
          </select>
        </div>
        <div><label className="small text-muted">{tt('الفرع')}</label><input required value={form.branch} onChange={set('branch')} style={inputStyle} /></div>
        <div><label className="small text-muted">{tt('الوظيفة')}</label><input value={form.job_title || ''} onChange={set('job_title')} style={inputStyle} /></div>
        <div>
          <label className="small text-muted">{tt('الحالة')}</label>
          <select value={form.status} onChange={set('status')} style={inputStyle}>
            <option value="أساسي">{tt('أساسي')}</option>
            <option value="تحت التجربة">{tt('تحت التجربة')}</option>
          </select>
        </div>
        <div><label className="small text-muted">{tt('رقم الهوية')}</label><input value={form.national_id || ''} onChange={set('national_id')} style={inputStyle} /></div>
        <div><label className="small text-muted">{tt('رقم الموظف')}</label><input value={form.job_no || ''} onChange={set('job_no')} style={inputStyle} /></div>
      </div>
      <h4 className="mb-4 mt-8">{tt('مكونات الراتب')}</h4>
      <div className="grid-3" style={{ gap: 10 }}>
        {[
          ['basic', 'الراتب الأساسي'], ['housing', 'بدل السكن'], ['transport', 'بدل المواصلات'],
          ['other_allowance', 'بدلات أخرى'], ['overtime', 'العمل الإضافي'], ['absence_days', 'أيام الغياب'],
          ['absence_amount', 'خصم الغياب'], ['deductions', 'الاستقطاعات'], ['advances', 'السلف'], ['gosi', 'التأمينات (GOSI)'],
        ].map(([k, label]) => (
          <div key={k}><label className="small text-muted">{tt(label)}</label><input type="number" step="0.01" value={form[k] ?? 0} onChange={setNum(k)} style={inputStyle} /></div>
        ))}
      </div>
      <p className="small text-muted">{tt('صافي الراتب وإجمالي المستحقات تُحسب تلقائيًا من هذه القيم عند الحفظ.')}</p>
      <div className="flex gap-8">
        <button type="submit" className="btn primary" disabled={busy}>{tt(busy ? 'جارٍ الحفظ...' : 'حفظ')}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>{tt('إلغاء')}</button>
      </div>
    </form>
  );
}

const inputStyle = { width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: '7px 10px', fontFamily: 'inherit', fontSize: 13 };

export default function Employees() {
  const { data: HR_DATA, refresh, companyLabel } = useHrData();
  const { company, setCompany } = useFilters();
  const { tt } = useLanguage();
  const [searchParams] = useSearchParams();
  const { openModal, closeModal } = useModal();
  const { apiJson, apiFetch, token } = useApi();

  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('active');
  const [busy, setBusy] = useState(false);

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

  async function downloadPayslip(emp) {
    try {
      const res = await apiFetch(`/api/payslip/${emp.id}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${emp.job_no || emp.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || tt('تعذر تحميل قسيمة الراتب'));
    }
  }

  async function createEmployee(form) {
    setBusy(true);
    try {
      await apiJson('/api/employees', { method: 'POST', body: JSON.stringify(form) });
      refresh();
      closeModal();
    } catch (err) {
      alert(err.message || tt('تعذر إضافة الموظف'));
    } finally {
      setBusy(false);
    }
  }

  async function updateEmployee(id, form) {
    setBusy(true);
    try {
      await apiJson(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(form) });
      refresh();
      closeModal();
    } catch (err) {
      alert(err.message || tt('تعذر تحديث الموظف'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteEmployee(id) {
    if (!confirm(tt('هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.'))) return;
    setBusy(true);
    try {
      await apiJson(`/api/employees/${id}`, { method: 'DELETE' });
      refresh();
      closeModal();
    } catch (err) {
      alert(err.message || tt('تعذر حذف الموظف'));
    } finally {
      setBusy(false);
    }
  }

  function openCreateModal() {
    openModal(
      <>
        <ModalHead title={tt('إضافة موظف جديد')} onClose={closeModal} />
        <div className="modal-body">
          <EmployeeForm companies={HR_DATA.meta.companies} companyLabel={companyLabel} onSubmit={createEmployee} onCancel={closeModal} busy={busy} />
        </div>
      </>
    );
  }

  function openEditModal(emp) {
    openModal(
      <>
        <ModalHead title={`${tt('تعديل:')} ${emp.name}`} onClose={closeModal} />
        <div className="modal-body">
          <EmployeeForm initial={emp} companies={HR_DATA.meta.companies} companyLabel={companyLabel} onSubmit={(form) => updateEmployee(emp.id, form)} onCancel={closeModal} busy={busy} />
        </div>
      </>
    );
  }

  function showEmployeeModal(emp) {
    const history = HR_DATA.employee_history[emp.national_id] || [];
    const companies = [...new Set(history.map((h) => h.company_label))];
    openModal(
      <>
        <ModalHead title={emp.name} subtitle={`${emp.job_title} · ${tt(emp.company_label)} · ${emp.branch}`} onClose={closeModal} />
        <div className="modal-body">
          <div className="flex gap-8 mb-16">
            <button className="btn sm" onClick={() => openEditModal(emp)}><Icon name="settings" size={13} /> {tt('تعديل')}</button>
            <button className="btn sm" onClick={() => downloadPayslip(emp)}><Icon name="download" size={13} /> {tt('تحميل قسيمة الراتب')}</button>
            <button className="btn danger sm" onClick={() => deleteEmployee(emp.id)}>{tt('حذف')}</button>
          </div>
          <div className="grid-3 mb-16">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('الحالة')}</div><div style={{ fontWeight: 800 }}>{tt(emp.status)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('الراتب الأساسي')}</div><div style={{ fontWeight: 800 }}>{fmtSAR(emp.basic)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('صافي الراتب')}</div><div style={{ fontWeight: 800 }}>{fmtSAR(emp.net)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('بدل السكن')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.housing)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('بدل المواصلات')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.transport)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('بدلات أخرى')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.other_allowance)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('العمل الإضافي')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.overtime)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('إجمالي البدلات')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.total_allowances)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('إجمالي الراتب')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.gross)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('خصم الغياب')} ({emp.absence_days} {tt('يوم')})</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.absence_amount)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('اقتطاعات')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.deductions)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('السلف')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.advances)}</div></div>
          </div>
          <div className="grid-3 mb-24">
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('التأمينات (GOSI)')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.gosi)}</div></div>
            <div className="card" style={{ padding: 12 }}><div className="small text-muted">{tt('إجمالي المخصوم')}</div><div style={{ fontWeight: 700 }}>{fmtSAR(emp.total_deducted)}</div></div>
            <div className="card" style={{ padding: 12, background: 'var(--brass-light)' }}><div className="small" style={{ color: 'var(--brass-dark)' }}>{tt('صافي الراتب')}</div><div style={{ fontWeight: 800, color: 'var(--brass-dark)' }}>{fmtSAR(emp.net)}</div></div>
          </div>

          <h4 className="mb-12">{tt('تاريخ الشركة والراتب (من واقع ملفات الرواتب الشهرية)')}</h4>
          <div className="table-wrap mb-16">
            <table className="data-table">
              <thead><tr><th>{tt('الشهر')}</th><th>{tt('الشركة')}</th><th>{tt('الفرع')}</th><th>{tt('الوظيفة')}</th><th>{tt('الراتب الأساسي')}</th><th>{tt('صافي الراتب')}</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}><td>{tt(h.month_name)}</td><td>{tt(h.company_label)}</td><td>{h.branch}</td><td>{h.job_title}</td><td>{fmtSAR(h.basic)}</td><td>{fmtSAR(h.net)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {companies.length > 1 ? (
            <Chip>{tt('تنبيه: هذا الموظف ظهر في أكثر من شركة')} ({companies.join(' + ')}) — {tt('راجع')} <a href="#/review-center" style={{ color: 'var(--brass)', fontWeight: 700 }}>{tt('مركز المراجعة')}</a></Chip>
          ) : null}
          <p className="small text-muted mb-8" style={{ marginTop: 16 }}>{tt('رقم الهوية:')} {emp.national_id || tt('غير مسجل')} · {tt('رقم الموظف:')} {emp.job_no}</p>
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
    { key: 'status', label: 'الحالة', render: (r) => <Badge tone={r.status === 'أساسي' ? 'low' : 'medium'}>{tt(r.status)}</Badge> },
    { key: 'is_active', label: 'نشط حاليًا؟', render: (r) => r.is_active ? <Badge tone="low">{tt('نشط')}</Badge> : <Badge tone="neutral">{tt('غادر')} ({tt('آخر ظهور:')} {r.as_of_month_name})</Badge>, raw: (r) => (r.is_active ? 'نشط' : 'غادر') },
    { key: 'basic', label: 'الراتب الأساسي', render: (r) => fmtSAR(r.basic) },
    { key: 'net', label: 'صافي الراتب', render: (r) => fmtSAR(r.net) },
  ];

  return (
    <div className="card mb-16">
      <div className="table-toolbar">
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">{tt('كل الفروع')}</option>
            {branchOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{tt('كل الحالات')}</option>
            <option value="أساسي">{tt('أساسي')}</option>
            <option value="تحت التجربة">{tt('تحت التجربة')}</option>
          </select>
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="active">{tt('نشط حاليًا فقط')}</option>
            <option value="all">{tt('الكل (شامل من غادر الشركة)')}</option>
          </select>
        </div>
        <button className="btn primary sm" onClick={openCreateModal}><Icon name="grid" size={13} /> {tt('إضافة موظف')}</button>
      </div>
      <DataTable
        columns={cols}
        rows={rows}
        opts={{ searchPlaceholder: 'ابحث بالاسم أو رقم الموظف...', searchFields: ['name', 'job_no', 'job_title'], onRowClick: showEmployeeModal, exportFilename: 'دليل_الموظفين', exportSheetName: 'الموظفون' }}
      />
    </div>
  );
}
