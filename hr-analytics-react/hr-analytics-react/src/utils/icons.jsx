// Ported 1:1 from original ICONS map (raw SVG path fragments) + icon() helper.

export const ICON_PATHS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
  'map-pin': '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17" cy="8.5" r="2.6"/><path d="M15.5 14.2c2.7.5 5 2.6 5 5.8"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v0M18 15v0"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 6h6v6"/>',
  refresh: '<path d="M20 11A8 8 0 0 0 5.6 6.6L3 9M3 3v6h6"/><path d="M4 13a8 8 0 0 0 14.4 4.4L21 15M21 21v-6h-6"/>',
  swap: '<path d="M4 8h13M17 8l-3-3M17 8l-3 3"/><path d="M20 16H7M7 16l3-3M7 16l3 3"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 7.8-8 9-4.5-1.2-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  'check-list': '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 9l1.5 1.5L11 8"/><path d="M13 9h5"/><path d="M7 15l1.5 1.5L11 14"/><path d="M13 15h5"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/>',
  upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  'file-text': '<path d="M6 2h9l4 4v16H6z"/><path d="M15 2v4h4"/><path d="M9 13h6M9 17h6M9 9h2"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19V5.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  download: '<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="1"/><path d="M6 17v4h12v-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/>',
};

export function Icon({ name, size = 17, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
    />
  );
}

// Returns raw HTML string for the icon — used where we still build innerHTML-style strings (rare).
export function iconHtml(name, size = 17) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</svg>`;
}

export const NAV_SECTIONS = [
  { label: 'الرئيسية', items: [
    { id: 'dashboard', label: 'لوحة التحكم التنفيذية', icon: 'grid' },
  ]},
  { label: 'التحليل التنظيمي', items: [
    { id: 'companies', label: 'الشركات', icon: 'building' },
    { id: 'branches', label: 'الفروع', icon: 'map-pin' },
    { id: 'employees', label: 'الموظفون', icon: 'users' },
  ]},
  { label: 'الرواتب', items: [
    { id: 'payroll', label: 'الرواتب', icon: 'cash' },
    { id: 'run-payroll', label: 'تشغيل الرواتب', icon: 'grid' },
    { id: 'payroll-cost', label: 'تكلفة الرواتب', icon: 'trend' },
  ]},
  { label: 'القوى العاملة', items: [
    { id: 'turnover', label: 'الدوران الوظيفي', icon: 'refresh' },
    { id: 'movements', label: 'حركة الموظفين', icon: 'swap' },
  ]},
  { label: 'المخاطر والجودة', items: [
    { id: 'risks', label: 'مركز المخاطر', icon: 'alert' },
    { id: 'exceptions', label: 'استثناءات الرواتب', icon: 'flag' },
    { id: 'data-quality', label: 'جودة البيانات', icon: 'shield' },
    { id: 'review-center', label: 'مركز المراجعة', icon: 'check-list' },
    { id: 'correction-log', label: 'سجل التعديلات', icon: 'history' },
  ]},
  { label: 'الإدارة', items: [
    { id: 'upload', label: 'رفع الملفات', icon: 'upload' },
    { id: 'reports', label: 'مركز التقارير', icon: 'file-text' },
    { id: 'kpi-dictionary', label: 'قاموس المؤشرات', icon: 'book' },
    { id: 'users', label: 'المستخدمون', icon: 'users' },
    { id: 'settings', label: 'الإعدادات', icon: 'settings' },
  ]},
];
