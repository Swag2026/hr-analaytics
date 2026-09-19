import React, { useMemo, useState } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Icon } from '../utils/icons.jsx';
import { fmtSAR } from '../utils/format.js';

const inputSm = { width: '100%', minWidth: 70, border: '1px solid var(--line)', borderRadius: 5, padding: '5px 6px', fontFamily: 'inherit', fontSize: 12.5 };

function blankRow() {
  return {
    _key: Math.random().toString(36).slice(2),
    name: '', national_id: '', job_no: '', branch: '', job_title: '', status: 'أساسي',
    basic: 0, housing: 0, transport: 0, other_allowance: 0, overtime: 0,
    absence_days: 0, absence_amount: 0, deductions: 0, advances: 0, gosi: 0,
  };
}

function calc(r) {
  const total_allowances = (Number(r.housing) || 0) + (Number(r.transport) || 0) + (Number(r.other_allowance) || 0) + (Number(r.overtime) || 0);
  const gross = (Number(r.basic) || 0) + total_allowances;
  const total_deducted = (Number(r.absence_amount) || 0) + (Number(r.deductions) || 0) + (Number(r.gosi) || 0) + (Number(r.advances) || 0);
  const net = gross - total_deducted;
  return { total_allowances, gross, total_deducted, net };
}

export default function RunPayroll() {
  const { data: HR_DATA, companyLabel, monthName, refresh } = useHrData();
  const { apiJson } = useApi();
  const { tt } = useLanguage();

  const [company, setCompany] = useState(HR_DATA.meta.companies[0]);
  const [month, setMonth] = useState(HR_DATA.meta.months[HR_DATA.meta.months.length - 1] || 1);
  const [rows, setRows] = useState(() => loadFor(HR_DATA.meta.companies[0]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  function loadFor(c) {
    return HR_DATA.employees
      .filter((e) => e.company === c && e.is_active)
      .map((e) => ({
        _key: String(e.id),
        name: e.name, national_id: e.national_id || '', job_no: e.job_no || '',
        branch: e.branch || '', job_title: e.job_title || '', status: e.status || 'أساسي',
        basic: e.basic || 0, housing: e.housing || 0, transport: e.transport || 0,
        other_allowance: e.other_allowance || 0, overtime: 0,
        absence_days: 0, absence_amount: 0, deductions: 0, advances: 0, gosi: e.gosi || 0,
      }));
  }

  function onCompanyChange(c) {
    setCompany(c);
    setRows(loadFor(c));
    setDone(null);
  }

  function updateRow(key, field, value) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
  }

  function removeRow(key) {
    setRows((rs) => rs.filter((r) => r._key !== key));
  }

  function addRow() {
    setRows((rs) => [...rs, blankRow()]);
  }

  const totals = useMemo(() => {
    return rows.reduce((acc, r) => {
      const c = calc(r);
      acc.gross += c.gross; acc.net += c.net; acc.headcount += 1;
      return acc;
    }, { gross: 0, net: 0, headcount: 0 });
  }, [rows]);

  async function postPayroll() {
    if (!rows.length) return;
    if (!confirm(tt(`سيتم استبدال رواتب ${companyLabel(company)} لشهر ${monthName(month)} بهذه البيانات (${rows.length} موظف). متابعة؟`))) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        company, company_label: companyLabel(company), month: Number(month), month_name: monthName(month),
        rows: rows.map((r) => {
          const { _key, ...rest } = r;
          return { ...rest, basic: Number(rest.basic) || 0, housing: Number(rest.housing) || 0, transport: Number(rest.transport) || 0, other_allowance: Number(rest.other_allowance) || 0, overtime: Number(rest.overtime) || 0, absence_days: Number(rest.absence_days) || 0, absence_amount: Number(rest.absence_amount) || 0, deductions: Number(rest.deductions) || 0, advances: Number(rest.advances) || 0, gosi: Number(rest.gosi) || 0 };
        }),
      };
      const res = await apiJson('/api/payroll-records/run', { method: 'POST', body: JSON.stringify(payload) });
      setDone(res.count);
      refresh();
    } catch (err) {
      setError(err.message || tt('تعذر ترحيل الرواتب'));
    } finally {
      setBusy(false);
    }
  }

  const FIELDS = [
    ['name', 'الاسم', 'text', 160],
    ['national_id', 'رقم الهوية', 'text', 100],
    ['job_no', 'رقم الموظف', 'text', 80],
    ['branch', 'الفرع', 'text', 100],
    ['basic', 'الأساسي', 'number', 80],
    ['housing', 'السكن', 'number', 70],
    ['transport', 'المواصلات', 'number', 70],
    ['other_allowance', 'بدلات أخرى', 'number', 70],
    ['overtime', 'العمل الإضافي', 'number', 70],
    ['absence_days', 'أيام الغياب', 'number', 65],
    ['absence_amount', 'خصم الغياب', 'number', 70],
    ['deductions', 'الاستقطاعات', 'number', 70],
    ['advances', 'السلف', 'number', 65],
    ['gosi', 'GOSI', 'number', 65],
  ];

  return (
    <>
      <div className="card mb-16">
        <div className="table-toolbar mb-16" style={{ justifyContent: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label className="small text-muted" style={{ display: 'block', marginBottom: 4 }}>{tt('الشركة')}</label>
            <select value={company} onChange={(e) => onCompanyChange(e.target.value)}>
              {HR_DATA.meta.companies.map((c) => <option key={c} value={c}>{tt(companyLabel(c))}</option>)}
            </select>
          </div>
          <div>
            <label className="small text-muted" style={{ display: 'block', marginBottom: 4 }}>{tt('الشهر')}</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{tt(monthName(m)) || m}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="btn ghost sm" onClick={addRow} type="button"><Icon name="grid" size={13} /> {tt('إضافة موظف جديد لهذا التشغيل')}</button>
          </div>
        </div>

        {error ? <p className="small" style={{ color: 'var(--critical)' }}>{error}</p> : null}
        {done !== null ? (
          <div className="card mb-12" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            {tt('تم ترحيل رواتب')} {done} {tt('موظف بنجاح لشهر')} {tt(monthName(month))}. {tt('يمكنك الآن تحميل قسائم الرواتب من صفحة الموظفين.')}
          </div>
        ) : null}

        <div className="table-wrap">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {FIELDS.map(([key, label]) => <th key={key}>{tt(label)}</th>)}
                  <th>{tt('إجمالي الراتب')}</th>
                  <th>{tt('صافي الراتب')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const c = calc(r);
                  return (
                    <tr key={r._key}>
                      {FIELDS.map(([key, , type, w]) => (
                        <td key={key}>
                          <input
                            type={type}
                            value={r[key]}
                            onChange={(e) => updateRow(r._key, key, type === 'number' ? e.target.value : e.target.value)}
                            style={{ ...inputSm, width: w }}
                          />
                        </td>
                      ))}
                      <td style={{ fontWeight: 700 }}>{fmtSAR(c.gross)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--brass-dark)' }}>{fmtSAR(c.net)}</td>
                      <td><button className="btn danger sm" type="button" onClick={() => removeRow(r._key)}>{tt('إزالة')}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="small text-muted">
            {totals.headcount} {tt('موظف')} · {tt('إجمالي الراتب')}: <b>{fmtSAR(totals.gross)}</b> · {tt('صافي الرواتب')}: <b>{fmtSAR(totals.net)}</b>
          </div>
          <button className="btn primary" disabled={busy || !rows.length} onClick={postPayroll}>
            {busy ? tt('جارٍ الترحيل...') : tt('ترحيل الرواتب')}
          </button>
        </div>
      </div>
    </>
  );
}
