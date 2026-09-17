// Translations for the app "chrome" — navigation, buttons, page titles, login screen.
// Deep page content (table columns, KPI names, Arabic HR data) stays as-is for now;
// this covers the structural UI so the whole shell can switch to English.

export const EN = {
  // brand
  brandName: 'Executive Analytics System',
  brandSub: 'SWAG Group · Group HR Analytics',

  // nav sections (keyed by the Arabic label used in NAV_SECTIONS)
  'الرئيسية': 'Home',
  'التحليل التنظيمي': 'Organization',
  'الرواتب': 'Payroll',
  'القوى العاملة': 'Workforce',
  'المخاطر والجودة': 'Risk & Quality',
  'الإدارة': 'Administration',

  // nav items (keyed by route id)
  nav: {
    dashboard: 'Executive Dashboard',
    companies: 'Companies',
    branches: 'Branches',
    employees: 'Employees',
    payroll: 'Payroll',
    'payroll-cost': 'Payroll Cost',
    turnover: 'Turnover',
    movements: 'Movements',
    risks: 'Risk Center',
    exceptions: 'Payroll Exceptions',
    'data-quality': 'Data Quality',
    'review-center': 'Review Center',
    'correction-log': 'Correction Log',
    upload: 'Upload File',
    reports: 'Reports',
    'kpi-dictionary': 'KPI Dictionary',
    users: 'Users',
    settings: 'Settings',
  },

  // common actions
  logout: 'Logout',
  save: 'Save',
  cancel: 'Cancel',
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  search: 'Search...',
  backToApps: 'Back to apps',

  // login page
  loginTitle: 'Executive Analytics System',
  loginSubtitle: 'Sign in to continue',
  username: 'Username',
  password: 'Password',
  signIn: 'Sign In',

  // topbar filters
  allCompanies: 'All Companies',
  allMonths: 'All Months (Jan – Aug)',

  // apps launcher
  appsHeaderUserLogout: 'Logout',
};

export const AR = {
  brandName: 'نظام التحليلات التنفيذية',
  brandSub: 'مجموعة سواج · Group HR Analytics',
};
