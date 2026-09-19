import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config.js';
import { useAuth } from './AuthContext.jsx';
import { useLanguage } from './LanguageContext.jsx';

const DataContext = createContext(null);

// The "slim" prototype this app was ported from used placeholder field names
// (name, previous_company_label, salary_change_pct, effective_month_name) for
// movement_ledger. The real backend instead uses employee_name / previous_company
// (raw key) / salary_change (absolute SAR) / effective_month (number). This
// normalizes either shape into the one the Movements page renders.
function normalizeMovementLedger(list, companyLabels, monthNames) {
  if (!Array.isArray(list)) return list;
  return list.map((l) => {
    const name = l.name ?? l.employee_name;
    const previousCompanyLabel = l.previous_company_label ?? companyLabels[l.previous_company] ?? l.previous_company;
    const newCompanyLabel = l.new_company_label ?? companyLabels[l.new_company] ?? l.new_company;
    const effectiveMonthName = l.effective_month_name ?? monthNames[l.effective_month] ?? l.effective_month;
    let salaryChangePct = l.salary_change_pct;
    if (salaryChangePct === undefined) {
      salaryChangePct = l.previous_salary ? Math.round((1000 * (l.new_salary - l.previous_salary)) / l.previous_salary) / 10 : null;
    }
    return { ...l, name, previous_company_label: previousCompanyLabel, new_company_label: newCompanyLabel, effective_month_name: effectiveMonthName, salary_change_pct: salaryChangePct };
  });
}

function normalizeData(json) {
  const companyLabels = json.meta?.company_labels || {};
  const monthNames = json.meta?.month_names || {};
  return {
    ...json,
    movement_ledger: normalizeMovementLedger(json.movement_ledger, companyLabels, monthNames),
  };
}

export function useHrData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useHrData must be used within <DataProvider>');
  return ctx;
}

export function DataProvider({ children }) {
  const { token, handleUnauthorized } = useAuth();
  const { isEn } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/hr-data`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) { handleUnauthorized(); throw new Error('انتهت الجلسة'); }
        if (!res.ok) throw new Error('تعذر تحميل البيانات من الخادم');
        return res.json();
      })
      .then((json) => { setData(normalizeData(json)); setError(''); })
      .catch((err) => setError(err.message || 'تعذر تحميل البيانات من الخادم'))
      .finally(() => setLoading(false));
  }, [token, handleUnauthorized]);

  useEffect(() => { refresh(); }, [refresh]);

  const monthName = useCallback((m) => {
    if (!data) return m;
    if (isEn) {
      const months = { 1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June', 7: 'July', 8: 'August' };
      return months[m] || m;
    }
    return data.meta.month_names[m] || m;
  }, [data, isEn]);
  const companyLabel = useCallback((c) => {
    if (!data) return c;
    if (isEn) {
      const labels = { Swag: 'SWAG', Laroche: 'La Roche', SwagGoldOasis: 'SWAG Gold – Oasis Mall', ViaSky: 'ViaSky' };
      return labels[c] || data.meta.company_labels[c] || c;
    }
    return data.meta.company_labels[c] || c;
  }, [data, isEn]);
  const defaultMeta = useCallback(
    () => (data
      ? isEn
        ? `Last updated: ${data.meta.last_updated} · Built from ${data.meta.total_files} actual source files`
        : `آخر تحديث: ${data.meta.last_updated} · البيانات مبنية من ${data.meta.total_files} ملف مصدر فعلي`
      : ''),
    [data, isEn]
  );

  const value = { data, error, loading, refresh, monthName, companyLabel, defaultMeta };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
