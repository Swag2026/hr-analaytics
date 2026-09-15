import React, { useState } from 'react';

const KPIS = [
  { name: 'إجمالي الموظفين (Headcount)', def: 'عدد الموظفين النشطين (أساسي + تحت التجربة) في نهاية الفترة المختارة', formula: 'COUNT(سجلات الرواتب النشطة لآخر شهر في الفترة)', source: 'شيتات "الأساسي" و"تحت التجربة" في كل ملف رواتب شهري', interp: 'الأفضل متابعته كسلسلة زمنية أكثر من رقم منفرد' },
  { name: 'إجمالي الرواتب (صافي)', def: 'مجموع صافي الرواتب المصروفة لكل الموظفين خلال الشهر', formula: 'SUM(صافي الراتب) لكل موظف نشط في الشهر', source: 'عمود "صافي الراتب" في كل شيت رواتب', interp: 'يقارن دائمًا مع نمو عدد الموظفين لرصد أي نمو غير طبيعي في التكلفة' },
  { name: 'متوسط الراتب الأساسي', def: 'متوسط الراتب الأساسي لكل الموظفين النشطين', formula: 'SUM(الراتب الأساسي) ÷ عدد الموظفين', source: 'عمود "الراتب الأساسي"', interp: 'مؤشر تنافسية الأجور بين الشركات والفروع' },
  { name: 'الدوران الوظيفي (Turnover)', def: 'نسبة الموظفين الذين غادروا الشركة خلال فترة معينة', formula: '(عدد المغادرين ÷ متوسط عدد الموظفين) × 100', source: 'ملاحظات "متغيرات الشهر" (خروج) — ⚠️ يحتاج توحيد صياغة قبل الاعتماد الكامل', interp: 'معدل مرتفع باستمرار يستدعي مراجعة أسباب الاستقالة والفرص البديلة' },
  { name: 'النقل الداخلي (Internal Transfer)', def: 'موظف انتقل بين شركتين أو فرعين ضمن نفس المجموعة دون فجوة توظيف', formula: 'تطابق رقم الهوية بين شركتين بدون تداخل شهري', source: 'مطابقة رقم الهوية عبر ملفات الشركات المختلفة + ملاحظات المصدر', interp: 'لا يُحتسب كخروج من المجموعة على مستوى Group KPI، لكن يُحتسب كخروج من الشركة السابقة' },
  { name: 'تداخل بين الشركات (Cross-Company Overlap)', def: 'رقم هوية ظهر نشطًا في شركتين مختلفتين بنفس الشهر', formula: 'وجود سجل راتب فعّال لنفس رقم الهوية في شركتين لنفس الشهر', source: 'مطابقة Normalized_Data عبر الشركات', interp: 'لا يُفترض تلقائيًا أنه صرف مزدوج — قد يعكس ترتيب كفالة مشترك، يتطلب تأكيدًا بشريًا دائمًا' },
  { name: 'تقييم الفرع (Branch Score)', def: 'درجة مركّبة من 100 تقيس أداء الفرع', formula: 'وزن الحضور + وزن الدوران + وزن كفاءة الرواتب + وزن استقرار القوى العاملة + وزن العمل الإضافي + وزن جودة البيانات (الأوزان قابلة للتعديل من الإعدادات)', source: 'مركّب من عدة مصادر بيانات', interp: 'أقل من 60 يستدعي مراجعة تشغيلية للفرع' },
  { name: 'درجة جودة البيانات (Data Quality Score)', def: 'نسبة سلامة سجلات الشركة من مشاكل مثل نقص رقم الهوية أو التكرار', formula: '100 − (عدد المشاكل ÷ عدد السجلات × 100)', source: 'قواعد فحص الجودة (Data_Quality_Report)', interp: 'أقل من 70 يعني أن نتائج التحليل لهذه الشركة يجب قراءتها بحذر إضافي' },
  { name: 'تكلفة الموظف (Cost per Employee)', def: 'متوسط تكلفة الرواتب لكل موظف شهريًا', formula: 'إجمالي صافي الرواتب ÷ عدد الموظفين', source: 'مشتق من إجمالي الرواتب وعدد الموظفين', interp: 'يُستخدم لمقارنة الكفاءة النسبية بين الفروع والشركات' },
];

export default function KpiDictionary() {
  const [q, setQ] = useState('');
  const filtered = KPIS.filter((k) => k.name.toLowerCase().includes(q.toLowerCase()) || k.def.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="table-toolbar mb-16">
        <div className="search-box" style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', marginTop: 11, marginRight: 11, color: 'var(--text-faint)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          </span>
          <input type="text" placeholder="ابحث عن مؤشر..." style={{ paddingRight: 34, minWidth: 280 }} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((k) => (
          <div className="card" key={k.name}>
            <div style={{ fontWeight: 900, fontSize: 14.5, color: 'var(--ink)', marginBottom: 10 }}>{k.name}</div>
            <div className="grid-2" style={{ gap: 20 }}>
              <div>
                <div className="small" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>التعريف</div>
                <div className="small mb-12">{k.def}</div>
                <div className="small" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>طريقة الحساب</div>
                <div className="mono small mb-12" style={{ background: 'var(--paper)', padding: '8px 10px', borderRadius: 6 }}>{k.formula}</div>
              </div>
              <div>
                <div className="small" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>مصدر البيانات</div>
                <div className="small mb-12">{k.source}</div>
                <div className="small" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>طريقة التفسير</div>
                <div className="small">{k.interp}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
