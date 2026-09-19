import React from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useModal, ModalHead } from '../context/ModalContext.jsx';
import { Icon } from '../utils/icons.jsx';
import { fmtNum, fmtSAR } from '../utils/format.js';
import { exportFullWorkbook } from '../utils/excelExport.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const REPORT_GROUPS = [
  { label: 'تقارير تنفيذية', reports: [
    { name: 'التقرير التنفيذي', desc: 'ملخص شامل جاهز لعرضه على CEO / CHRO / CFO', link: '#exec' },
    { name: 'التقرير الشهري', desc: 'أداء الشهر الحالي مقابل الشهر السابق', link: '/payroll' },
    { name: 'مقارنة الشركات', link: '/companies', desc: 'جدول مقارنة شامل بين الشركات الأربع' },
    { name: 'أداء الفروع', link: '/branches', desc: 'تقييم كل فرع وترتيبه' },
  ]},
  { label: 'القوى العاملة', reports: [
    { name: 'تقرير القوى العاملة', link: '/employees', desc: 'دليل الموظفين الكامل مع الفلاتر' },
    { name: 'الدوران الوظيفي', link: '/turnover', desc: 'التعيينات والمغادرات ومعدل الدوران' },
    { name: 'حركة الموظفين', link: '/movements', desc: 'النقل الداخلي وبين الشركات' },
  ]},
  { label: 'الرواتب والتكلفة', reports: [
    { name: 'تحليل الرواتب', link: '/payroll', desc: 'تفصيل مكونات الراتب والتوزيع' },
    { name: 'تكلفة الرواتب', link: '/payroll-cost', desc: 'نمو التكلفة مقابل نمو القوى العاملة' },
  ]},
  { label: 'المخاطر والجودة', reports: [
    { name: 'مخاطر الموارد البشرية', link: '/risks', desc: 'كل المخاطر المصنّفة بالخطورة' },
    { name: 'استثناءات الرواتب', link: '/exceptions', desc: 'حالات التداخل والصرف المحتمل المزدوج' },
    { name: 'جودة البيانات', link: '/data-quality', desc: 'درجة الجودة وتفصيل المشاكل لكل ملف' },
  ]},
];

export default function Reports() {
  const { data: HR_DATA, companyLabel, monthName } = useHrData();
  const { openModal, closeModal } = useModal();
  const { tt } = useLanguage();

  function simulateExport(name, format) {
    if (format === 'excel') {
      exportFullWorkbook(HR_DATA, companyLabel, monthName, name);
      return;
    }
    openModal(
      <>
        <ModalHead title={`${tt('تصدير PDF:')} ${tt(name)}`} onClose={closeModal} />
        <div className="modal-body">
          <p className="small text-muted">{tt('لإنتاج PDF حقيقي الآن دون خادم: افتح الصفحة المطلوبة ثم استخدم زر')} <b>{tt('طباعة')}</b> {tt('في المتصفح واختر "حفظ كـ PDF". عند ربط النظام بخادم لاحقًا يمكن توليد PDF مباشرة بنفس تنسيق الشركة.')}</p>
          <button className="btn primary mt-12" onClick={() => window.print()}><Icon name="print" size={14} /> {tt('فتح نافذة الطباعة الآن')}</button>
        </div>
      </>
    );
  }

  return (
    <>
      {REPORT_GROUPS.map((g) => (
        <div className="section" key={g.label}>
          <div className="section-head"><h2>{tt(g.label)}</h2></div>
          <div className="grid-3">
            {g.reports.map((r) => (
              <div className="card" key={r.name}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{tt(r.name)}</div>
                <div className="small text-muted mb-16">{tt(r.desc)}</div>
                <div className="flex gap-8">
                  <a href={r.link.startsWith('#') ? r.link : `#${r.link}`} className="btn sm">{tt('عرض')}</a>
                  <button className="btn ghost sm" onClick={() => simulateExport(r.name, 'excel')}><Icon name="download" size={13} /> Excel</button>
                  <button className="btn ghost sm" onClick={() => simulateExport(r.name, 'pdf')}><Icon name="print" size={13} /> PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card" id="exec" style={{ marginTop: 8 }}>
        <div className="section-head"><h2>{tt('التقرير التنفيذي — معاينة')}</h2><span className="hint">{tt('جاهز للعرض على CEO / CHRO / HR Director / CFO')}</span></div>
        <div className="grid-2">
          <div>
            <h4 className="mb-8">{tt('ملخص تنفيذي')}</h4>
            <p className="small text-muted mb-16">
              {tt('تُدير المجموعة')} {HR_DATA.meta.companies.length} {tt('شركات بإجمالي')} {fmtNum(HR_DATA.employees.length)} {tt('موظف نشط حتى أغسطس 2026، بإجمالي رواتب صافية شهرية قدرها')} {fmtSAR(HR_DATA.company_summary.reduce((s, c) => s + c.total_net_payroll, 0))}.
            </p>
            <h4 className="mb-8">{tt('أهم المخاطر')}</h4>
            <p className="small text-muted mb-16">
              {tt('تم رصد')} {HR_DATA.overlap_cases.length} {tt('حالة تداخل موظف بين شركتين بتعرض مالي محتمل قدره')} {fmtSAR(HR_DATA.overlap_cases.reduce((s, o) => s + o.potential_exposure, 0))} — {tt('تفاصيلها في مركز المراجعة.')}
            </p>
          </div>
          <div>
            <h4 className="mb-8">{tt('الإجراءات المقترحة')}</h4>
            <ul className="small text-muted" style={{ paddingRight: 18, lineHeight: 2 }}>
              <li>{tt('مراجعة حالتي التداخل المفتوحتين في مركز المراجعة خلال هذا الأسبوع')}</li>
              <li>{tt('تأكيد آلية "الكفالة المشتركة" رسميًا لتفادي تكرار ظهورها كحالة حرجة كل شهر')}</li>
              <li>{tt('رفع درجة جودة بيانات سواج')} ({HR_DATA.quality_scores.Swag}/100) {tt('بإكمال أرقام الهوية الناقصة')}</li>
              <li>{tt('متابعة نمو تكلفة رواتب سواج جولد')} (+{HR_DATA.company_summary.find((c) => c.company === 'SwagGoldOasis')?.payroll_growth_pct}%) {tt('في ظل توسع الفروع')}</li>
            </ul>
          </div>
        </div>
        <div className="flex gap-8 mt-16">
          <button className="btn primary" onClick={() => simulateExport('التقرير التنفيذي', 'excel')}><Icon name="download" size={14} /> {tt('تحميل Excel')}</button>
          <button className="btn" onClick={() => simulateExport('التقرير التنفيذي', 'pdf')}><Icon name="print" size={14} /> {tt('تحميل PDF')}</button>
          <button className="btn ghost" onClick={() => window.print()}><Icon name="print" size={14} /> {tt('طباعة')}</button>
        </div>
      </div>
    </>
  );
}
