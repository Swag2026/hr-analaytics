import React from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { BarChart, LineChart } from '../components/charts/Charts.jsx';
import DataTable from '../components/DataTable.jsx';
import { fmtNum } from '../utils/format.js';
import { Icon } from '../utils/icons.jsx';
import { PALETTE } from '../components/charts/chartSetup.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Turnover() {
  const { data: HR_DATA, monthName, companyLabel } = useHrData();
  const { tt } = useLanguage();
  const cs = HR_DATA.company_summary;
  const totalExits = cs.reduce((s, c) => s + c.exits_ytd, 0);
  const totalHires = cs.reduce((s, c) => s + c.new_hires_ytd, 0);
  const avgHc = Math.round(cs.reduce((s, c) => s + c.headcount, 0));
  const turnoverRate = Math.round((1000 * totalExits) / avgHc) / 10;
  const months = HR_DATA.meta.months;

  const cols = [
    { key: 'label', label: 'الشركة' },
    { key: 'headcount', label: 'عدد الموظفين الحالي' },
    { key: 'exits_ytd', label: 'مغادرات (تقديري)' },
    { key: 'new_hires_ytd', label: 'تعيينات (تقديري)' },
    { key: 'rate', label: 'معدل الدوران التقريبي', render: (r) => `${Math.round((1000 * r.exits_ytd) / r.headcount) / 10}%` },
  ];

  return (
    <>
      <div className="card mb-24" style={{ borderRight: '3px solid var(--warning)', background: 'var(--warning-bg)' }}>
        <div className="flex items-center gap-12">
          <span><Icon name="info" size={20} /></span>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--brass-dark)' }}>{tt('ملاحظة دقة البيانات')}</div>
            <div className="small" style={{ color: 'var(--brass-dark)' }}>
              {tt('أرقام "المغادرات" في هذه الصفحة مستخرجة من ملاحظات "متغيرات الشهر" النصية داخل ملفات الإكسل، وهي سجلات تراكمية غير موحدة الصياغة بين الأشهر. اعتبرها تقديرًا أوليًا فقط إلى أن يتم اعتمادها من الموارد البشرية — راجع')}{' '}
              <a href="#/correction-log" style={{ color: 'var(--brass-dark)', fontWeight: 700 }}>{tt('سجل التعديلات')}</a> {tt('لتفاصيل المعالجة.')}
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid mb-24">
        <div className="kpi-card"><div className="label">{tt('إجمالي المغادرات (تقديري)')} <Icon name="info" size={12} /></div><div className="value">{fmtNum(totalExits)}</div></div>
        <div className="kpi-card"><div className="label">{tt('إجمالي التعيينات الجديدة (تقديري)')}</div><div className="value">{fmtNum(totalHires)}</div></div>
        <div className="kpi-card"><div className="label">{tt('معدل الدوران التقريبي')}</div><div className="value">{turnoverRate}<span className="unit">%</span></div></div>
        <div className="kpi-card"><div className="label">{tt('صافي التغيير في القوى العاملة')}</div><div className="value">{fmtNum(totalHires - totalExits)}</div></div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-head"><h2>{tt('الدوران حسب الشركة (تقديري تراكمي)')}</h2></div>
          <BarChart labels={cs.map((c) => c.label)} datasets={[{ label: 'مغادرات', data: cs.map((c) => c.exits_ytd), color: '#AF2E2E' }, { label: 'تعيينات', data: cs.map((c) => c.new_hires_ytd), color: '#1F7A5C' }]} height={280} />
        </div>
        <div className="card">
          <div className="section-head"><h2>{tt('اتجاه عدد الموظفين الشهري (مؤشر غير مباشر على الاستقرار)')}</h2></div>
          <LineChart
            labels={months.map(monthName)}
            datasets={HR_DATA.meta.companies.map((c, i) => ({ label: companyLabel(c), data: months.map((m) => HR_DATA.monthly[c][m - 1].headcount), color: PALETTE.series[i] }))}
            height={280}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-head"><h2>{tt('تفصيل حسب الشركة')}</h2></div>
        <DataTable columns={cols} rows={cs} opts={{ search: false }} />
      </div>
    </>
  );
}
