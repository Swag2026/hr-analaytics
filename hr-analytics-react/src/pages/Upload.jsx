import React, { useRef, useState } from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { Icon } from '../utils/icons.jsx';
import DataTable from '../components/DataTable.jsx';
import { Badge } from '../components/Atoms.jsx';

const STEPS = [
  { title: 'تحليل بنية الملف', desc: 'اكتشاف الشيتات، وموقع صف العناوين الفعلي في كل شيت (قد لا يكون الصف الأول)' },
  { title: 'تحديد الشركة والشهر', desc: 'من اسم الملف ومحتوى الشيت — تم التعرف على: لاروش، سبتمبر 2026' },
  { title: 'تطبيع الأعمدة', desc: 'توحيد أسماء الأعمدة المختلفة (مثل "اسم الموظف" و"اسم الموظف(AR)") إلى نموذج بيانات موحد' },
  { title: 'تنظيف القيم', desc: 'إزالة المسافات الزائدة، تحويل الأرقام النصية، توحيد صيغ التواريخ' },
  { title: 'اكتشاف الجداول الفرعية', desc: 'فصل صفوف "خروج"، "عودة من الإجازة"، "كفالة مشتركة" عن جدول الرواتب الرئيسي' },
  { title: 'مطابقة هوية الموظفين', desc: 'الربط عبر رقم الهوية، وإلا فرقم الموظف + الشركة' },
  { title: 'اكتشاف التكرار', desc: 'فحص تكرار رقم الهوية داخل نفس الملف' },
  { title: 'اكتشاف النقل والتداخل', desc: 'مقارنة رقم الهوية مع كل الشركات الأخرى لهذا الشهر' },
  { title: 'فحص إجمالي الرواتب', desc: 'مقارنة المجموع المحسوب بأي إجمالي معلن داخل الملف' },
  { title: 'حساب درجة جودة البيانات', desc: 'بناءً على عدد المشاكل المكتشفة نسبة لعدد السجلات' },
];

export default function Upload() {
  const { data: HR_DATA } = useHrData();
  const [phase, setPhase] = useState('drop'); // 'drop' | 'running' | 'result'
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState(new Set());
  const [drag, setDrag] = useState(false);
  const [approvedMsg, setApprovedMsg] = useState('');
  const intervalRef = useRef(null);

  function startPipeline() {
    if (phase === 'running') return;
    setPhase('running');
    setDoneSteps(new Set());
    setActiveStep(-1);
    setApprovedMsg('');
    let i = 0;
    intervalRef.current = setInterval(() => {
      if (i > 0) setDoneSteps((prev) => new Set(prev).add(i - 1));
      if (i < STEPS.length) {
        setActiveStep(i);
        i++;
      } else {
        clearInterval(intervalRef.current);
        setPhase('result');
      }
    }, 450);
  }

  function resetUpload() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('drop');
    setApprovedMsg('');
  }

  function approveData() {
    setApprovedMsg('تم اعتماد البيانات — ستُحدَّث كل المؤشرات ولوحة التحكم تلقائيًا فور ربط النظام بقاعدة البيانات الفعلية.');
  }

  const cols = [
    { key: 'company_label', label: 'الشركة' },
    { key: 'month_name', label: 'الشهر' },
    { key: 'file', label: 'اسم الملف' },
    { key: 'status', label: 'الحالة', render: () => <Badge tone="low">معتمد</Badge> },
  ];

  return (
    <>
      {phase === 'drop' ? (
        <div className="card mb-24">
          <div
            className={`dropzone${drag ? ' drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); startPipeline(); }}
          >
            <Icon name="upload" size={38} />
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>اسحب ملف Excel هنا</div>
            <div className="small text-muted mb-16">أو</div>
            <button className="btn primary" onClick={startPipeline}>اختر ملفًا</button>
            <div className="small text-muted" style={{ marginTop: 14 }}>صيغ مدعومة: xlsx · هذا النموذج يحاكي رفع ملف "سبتمبر 2026" لشركة لاروش كمثال توضيحي</div>
          </div>
        </div>
      ) : null}

      {phase === 'running' ? (
        <div className="card">
          <div className="section-head"><h2>معالجة الملف: مسير رواتب الموظفين شركة لاروش شهر09-2026.xlsx</h2></div>
          <div className="step-list">
            {STEPS.map((s, i) => (
              <div className={`step ${doneSteps.has(i) ? 'done' : i === activeStep ? 'active' : ''}`} key={i}>
                <div className="dot">{i + 1}</div>
                <div className="body"><div className="title">{s.title}</div><div className="desc">{s.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {phase === 'result' ? (
        <div className="card">
          <div className="section-head"><h2>نتيجة التحليل</h2></div>
          <div className="kpi-grid mb-16">
            <div className="kpi-card"><div className="label">الشركة المكتشفة</div><div className="value" style={{ fontSize: 18 }}>لاروش</div></div>
            <div className="kpi-card"><div className="label">الشهر المكتشف</div><div className="value" style={{ fontSize: 18 }}>سبتمبر 2026</div></div>
            <div className="kpi-card"><div className="label">عدد السجلات</div><div className="value">184</div></div>
            <div className="kpi-card"><div className="label">عدد الموظفين</div><div className="value">179</div></div>
            <div className="kpi-card"><div className="label">تصحيحات تلقائية</div><div className="value" style={{ color: 'var(--success)' }}>6</div></div>
            <div className="kpi-card"><div className="label">تحذيرات</div><div className="value" style={{ color: 'var(--warning)' }}>3</div></div>
            <div className="kpi-card"><div className="label">أخطاء تحتاج مراجعة</div><div className="value" style={{ color: 'var(--critical)' }}>1</div></div>
            <div className="kpi-card"><div className="label">درجة جودة البيانات</div><div className="value">89<span className="unit">/100</span></div></div>
          </div>
          <div className="card mb-16" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
            <div style={{ fontWeight: 800, color: 'var(--brass-dark)', marginBottom: 6 }}>تنبيهات تحتاج انتباهك قبل الاعتماد</div>
            <ul className="small" style={{ color: 'var(--brass-dark)', margin: 0, paddingRight: 18, lineHeight: 2 }}>
              <li>تم اكتشاف موظف برقم هوية مطابق لسجل نشط في "سواج" لنفس الشهر — أُضيف تلقائيًا إلى مركز المراجعة</li>
              <li>3 صفوف من نوع "خروج من الشركة" داخل شيت المتغيرات — لم تُدرج ضمن قائمة الرواتب الرئيسية</li>
              <li>تاريخ نصي واحد بصيغة غامضة (5/9/2026) — يحتاج تأكيد يدوي لأنه لا يطابق شهر الملف بوضوح</li>
            </ul>
          </div>
          <div className="flex gap-8">
            <button className="btn primary" onClick={approveData}>اعتماد البيانات</button>
            <button className="btn" onClick={resetUpload}>إلغاء وإعادة المحاولة</button>
          </div>
          {approvedMsg ? <div className="small" style={{ marginTop: 12 }}>{approvedMsg}</div> : null}
        </div>
      ) : null}

      <div className="card mt-24">
        <div className="section-head"><h2>الملفات المرفوعة سابقًا (32 ملف حقيقي)</h2></div>
        <DataTable columns={cols} rows={HR_DATA.files_summary} opts={{ searchPlaceholder: 'ابحث عن ملف...', searchFields: ['file'] }} />
      </div>
    </>
  );
}
