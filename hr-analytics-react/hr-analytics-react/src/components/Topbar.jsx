import React from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import LangToggle from './LangToggle.jsx';

export default function Topbar({ route }) {
  const { data, companyLabel, monthName, defaultMeta } = useHrData();
  const { company, setCompany, month, setMonth } = useFilters();
  const { t, tt } = useLanguage();
  const filters = route?.filters || {};
  const title = route ? t(`nav.${route.id}`, route.title) : '';
  const meta = tt(route ? route.meta(data) : defaultMeta());

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1 id="page-title">{title}</h1>
        <div className="meta" id="page-meta">{meta}</div>
      </div>
      <div className="filters" id="global-filters">
        {filters.company !== false ? (
          <select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">{t('allCompanies', 'كل الشركات')}</option>
            {data.meta.companies.map((c) => <option key={c} value={c}>{tt(companyLabel(c))}</option>)}
          </select>
        ) : null}
        {filters.month !== false ? (
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            <option value="">{t('allMonths', 'كل الأشهر (يناير - أغسطس)')}</option>
            {data.meta.months.map((m) => <option key={m} value={m}>{tt(monthName(m))} 2026</option>)}
          </select>
        ) : null}
        <LangToggle />
      </div>
    </header>
  );
}
