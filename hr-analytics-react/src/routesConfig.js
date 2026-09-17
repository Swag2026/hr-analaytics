import { fmtNum } from './utils/format.js';

// filters: which global topbar selects a page wants. Matches original `filters: {...}` per page
// (undefined key defaults to shown, false hides it — same semantics as the original).
export const ROUTES = [
  {
    id: 'dashboard', path: '/dashboard', title: 'لوحة التحكم التنفيذية',
    meta: (d) => defaultMeta(d), filters: {},
  },
  {
    id: 'companies', path: '/companies', title: 'الشركات',
    meta: () => 'مقارنة شاملة بين الشركات الأربع بناءً على بيانات أغسطس 2026', filters: { company: false, month: false },
  },
  {
    id: 'branches', path: '/branches', title: 'الفروع',
    meta: () => 'أداء الفروع عبر كل الشركات — بيانات أغسطس 2026 مع مؤشرات دوران وغياب حقيقية من بيانات الرواتب الشهرية',
    filters: { month: false },
  },
  {
    id: 'employees', path: '/employees', title: 'دليل الموظفين',
    meta: (d) => `${d.employees.length} موظف نشط بحسب بيانات أغسطس 2026`, filters: { month: false },
  },
  {
    id: 'payroll', path: '/payroll', title: 'الرواتب',
    meta: () => 'تفصيل مكونات الراتب — بيانات أغسطس 2026 ما لم يُحدد غير ذلك', filters: {},
  },
  {
    id: 'payroll-cost', path: '/payroll-cost', title: 'تكلفة الرواتب',
    meta: () => 'نمو تكلفة الرواتب مقابل نمو عدد الموظفين — يناير إلى أغسطس 2026', filters: { month: false },
  },
  {
    id: 'turnover', path: '/turnover', title: 'الدوران الوظيفي',
    meta: () => 'يناير - أغسطس 2026', filters: { month: false },
  },
  {
    id: 'movements', path: '/movements', title: 'حركة الموظفين',
    meta: () => 'سجل حركات النقل بين الشركات — مبني على تطابق رقم الهوية عبر الملفات الشهرية', filters: { month: false, company: false },
  },
  {
    id: 'risks', path: '/risks', title: 'مركز المخاطر',
    meta: () => 'HR Risk Center — كل المخاطر المكتشفة آليًا من بيانات الرواتب والحضور', filters: { month: false, company: false },
  },
  {
    id: 'exceptions', path: '/exceptions', title: 'استثناءات الرواتب',
    meta: () => 'كل الحالات المالية التي تحتاج تفسيرًا قبل اعتماد الأرقام', filters: { month: false, company: false },
  },
  {
    id: 'data-quality', path: '/data-quality', title: 'جودة البيانات',
    meta: (d) => `${d.meta.total_files} ملف · ${Object.values(d.quality_summary).reduce((a, b) => a + b, 0)} مشكلة مكتشفة`,
    filters: { month: false },
  },
  {
    id: 'review-center', path: '/review-center', title: 'مركز المراجعة',
    meta: () => 'Data Review Center — حالات تحتاج قرارًا بشريًا قبل اعتمادها في التقارير', filters: { company: false, month: false },
  },
  {
    id: 'correction-log', path: '/correction-log', title: 'سجل التعديلات',
    meta: () => 'كل تصحيح تلقائي تم تطبيقه على البيانات، مع درجة الثقة وسببه — القيم الأصلية غير الملف الأصلي لم تُمس إطلاقًا',
    filters: { company: false, month: false },
  },
  {
    id: 'upload', path: '/upload', title: 'رفع ملف رواتب جديد',
    meta: () => 'رفع ملف Excel شهري — يقرأ النظام الملف فعليًا ويحدّث بيانات الموظفين والرواتب',
    filters: { company: false, month: false },
  },
  {
    id: 'reports', path: '/reports', title: 'مركز التقارير',
    meta: () => 'كل التقارير في مكان واحد — عرض، تصفية، وتصدير', filters: { month: false },
  },
  {
    id: 'kpi-dictionary', path: '/kpi-dictionary', title: 'قاموس المؤشرات',
    meta: () => 'KPI Dictionary — تعريف كل مؤشر ومعادلته ومصدر بياناته', filters: { company: false, month: false },
  },
  {
    id: 'users', path: '/users', title: 'المستخدمون',
    meta: () => 'إدارة حسابات تسجيل الدخول — إضافة، تعديل الصلاحيات، تغيير كلمة المرور، أو حذف مستخدم (للمشرفين فقط)',
    filters: { company: false, month: false },
  },
  {
    id: 'settings', path: '/settings', title: 'الإعدادات',
    meta: () => 'إعدادات النظام — الأوزان والحدود والتعريفات (تُخزَّن حاليًا في هذه الجلسة فقط)', filters: { company: false, month: false },
  },
];

export function defaultMeta(d) {
  return `آخر تحديث: ${d.meta.last_updated} · البيانات مبنية من ${fmtNum(d.meta.total_files)} ملف مصدر فعلي`;
}

export function routeById(id) {
  return ROUTES.find((r) => r.id === id);
}
