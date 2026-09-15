import React from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FiltersContext.jsx';

export default function Topbar({ route }) {
  const { data, companyLabel, monthName, defaultMeta } = useHrData();
  const { company, setCompany, month, setMonth } = useFilters();
  const filters = route?.filters || {};

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1 id="page-title">{route?.title || ''}</h1>
        <div className="meta" id="page-meta">{route ? route.meta(data) : defaultMeta()}</div>
      </div>
      <div className="filters" id="global-filters">
        {filters.company !== false ? (
          <select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">كل الشركات</option>
            {data.meta.companies.map((c) => <option key={c} value={c}>{companyLabel(c)}</option>)}
          </select>
        ) : null}
        {filters.month !== false ? (
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            <option value="">كل الأشهر (يناير - أغسطس)</option>
            {data.meta.months.map((m) => <option key={m} value={m}>{monthName(m)} 2026</option>)}
          </select>
        ) : null}
      </div>
    </header>
  );
}
