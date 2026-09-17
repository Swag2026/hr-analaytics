import React, { useRef, useState } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { Icon } from '../utils/icons.jsx';
import DataTable from '../components/DataTable.jsx';
import { Badge } from '../components/Atoms.jsx';
import { useApi } from '../hooks/useApi.js';

const SEVERITY_TONE = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };

export default function Upload() {
  const { data: HR_DATA, monthName, companyLabel, refresh } = useHrData();
  const { apiFetch } = useApi();
  const [company, setCompany] = useState(HR_DATA.meta.companies[0]);
  const [month, setMonth] = useState(HR_DATA.meta.months[HR_DATA.meta.months.length - 1] || 1);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState('drop'); // drop | uploading | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function pickFile(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.xlsx') && !f.name.toLowerCase().endsWith('.xlsm')) {
      setError('الملف يجب أن يكون بصيغة xlsx');
      return;
    }
    setFile(f);
    setError('');
  }

  async function submit() {
    if (!file) return;
    setPhase('uploading');
    setError('');
    try {
      const form = new FormData();
      form.append('company', company);
      form.append('company_label', companyLabel(company));
      form.append('month', month);
      form.append('file', file);
      const res = await apiFetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      setResult(data);
      setPhase('result');
      refresh();
    } catch (err) {
      setError(err.message || 'تعذر معالجة الملف');
      setPhase('error');
    }
  }

  function reset() {
    setPhase('drop');
    setFile(null);
    setResult(null);
    setError('');
  }

  return (
    <>
      {phase === 'drop' || phase === 'error' ? (
        <div className="card mb-24">
          <div className="table-toolbar mb-16" style={{ justifyContent: 'flex-start', gap: 16 }}>
            <div>
              <label className="small text-muted" style={{ display: 'block', marginBottom: 4 }}>الشركة</label>
              <select value={company} onChange={(e) => setCompany(e.target.value)}>
                {HR_DATA.meta.companies.map((c) => <option key={c} value={c}>{companyLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="small text-muted" style={{ display: 'block', marginBottom: 4 }}>الشهر</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{monthName(m) || m}</option>)}
              </select>
            </div>
          </div>

          <div
            className={`dropzone${drag ? ' drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
          >
            <Icon name="upload" size={38} />
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
              {file ? file.name : 'اسحب ملف Excel هنا'}
            </div>
            <div className="small text-muted mb-16">أو</div>
            <input ref={inputRef} type="file" accept=".xlsx,.xlsm" style={{ display: 'none' }} onChange={(e) => pickFile(e.target.files[0])} />
            <button className="btn primary" onClick={() => inputRef.current.click()}>اختر ملفًا</button>
            <div className="small text-muted" style={{ marginTop: 14 }}>
              يقرأ النظام الملف فعليًا (ليس محاكاة) — يكتشف الأعمدة تلقائيًا من عناوين الشيت، وأي تحميل لنفس الشركة والشهر يستبدل البيانات السابقة لهما.
            </div>
          </div>

          {error ? <p className="small" style={{ color: 'var(--critical)', marginTop: 12 }}>{error}</p> : null}

          {file ? (
            <div className="flex gap-8" style={{ marginTop: 16 }}>
              <button className="btn primary" onClick={submit}>معالجة ورفع الملف</button>
              <button className="btn ghost" onClick={reset}>إلغاء</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === 'uploading' ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>جارٍ قراءة الملف وتحليله...</div>
          <div className="small text-muted">اكتشاف الأعمدة، تنظيف القيم، فحص الجودة، والمطابقة مع البيانات الحالية</div>
        </div>
      ) : null}

      {phase === 'result' && result ? (
        <div className="card">
          <div className="section-head"><h2>نتيجة المعالجة: {result.filename}</h2></div>
          <div className="kpi-grid mb-16">
            <div className="kpi-card"><div className="label">الشيت المستخدم</div><div className="value" style={{ fontSize: 16 }}>{result.sheet}</div></div>
            <div className="kpi-card"><div className="label">عدد السجلات</div><div className="value">{result.row_count}</div></div>
            <div className="kpi-card"><div className="label">مشاكل مكتشفة</div><div className="value" style={{ color: result.issues.length ? 'var(--warning)' : 'var(--success)' }}>{result.issues.length}</div></div>
            <div className="kpi-card"><div className="label">تصحيحات تلقائية</div><div className="value" style={{ color: 'var(--success)' }}>{result.corrections.length}</div></div>
            <div className="kpi-card"><div className="label">درجة جودة البيانات</div><div className="value">{result.quality_score}<span className="unit">/100</span></div></div>
          </div>

          {result.issues.length ? (
            <div className="mb-16">
              <h4 className="mb-8">المشاكل المكتشفة</h4>
              <DataTable
                columns={[
                  { key: 'row', label: 'الصف' },
                  { key: 'rule', label: 'القاعدة' },
                  { key: 'severity', label: 'الخطورة', render: (r) => <Badge tone={SEVERITY_TONE[r.severity] || 'neutral'}>{r.severity}</Badge> },
                  { key: 'employee_name', label: 'الموظف' },
                  { key: 'detail', label: 'التفصيل' },
                ]}
                rows={result.issues}
                opts={{ search: false }}
              />
            </div>
          ) : null}

          {result.corrections.length ? (
            <div className="mb-16">
              <h4 className="mb-8">تصحيحات تلقائية طُبّقت</h4>
              <DataTable
                columns={[
                  { key: 'row', label: 'الصف' }, { key: 'field', label: 'الحقل' },
                  { key: 'original', label: 'القيمة الأصلية' }, { key: 'corrected', label: 'القيمة الجديدة' },
                  { key: 'reason', label: 'السبب' },
                ]}
                rows={result.corrections}
                opts={{ search: false }}
              />
            </div>
          ) : null}

          <button className="btn primary" onClick={reset}>رفع ملف آخر</button>
        </div>
      ) : null}

      <div className="card mt-24">
        <div className="section-head"><h2>سجل عمليات الرفع</h2></div>
        <UploadHistory />
      </div>
    </>
  );
}

function UploadHistory() {
  const { apiJson } = useApi();
  const { monthName, companyLabel } = useHrData();
  const [rows, setRows] = React.useState(null);

  React.useEffect(() => {
    apiJson('/api/upload/history').then(setRows).catch(() => setRows([]));
  }, [apiJson]);

  if (rows === null) return null;

  return (
    <DataTable
      columns={[
        { key: 'filename', label: 'الملف' },
        { key: 'company', label: 'الشركة', render: (r) => companyLabel(r.company) },
        { key: 'month_name', label: 'الشهر', render: (r) => r.month_name || monthName(r.month) },
        { key: 'row_count', label: 'السجلات' },
        { key: 'issues_count', label: 'المشاكل' },
        { key: 'quality_score', label: 'الجودة', render: (r) => `${r.quality_score}/100` },
        { key: 'uploaded_by_name', label: 'بواسطة' },
        { key: 'created_at', label: 'التاريخ', render: (r) => new Date(r.created_at).toLocaleString('ar-SA') },
      ]}
      rows={rows}
      opts={{ search: false }}
    />
  );
}
