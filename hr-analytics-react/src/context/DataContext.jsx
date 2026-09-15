import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const DataContext = createContext(null);

// The "slim" prototype this app was ported from used placeholder field names
// (name, previous_company_label, salary_change_pct, effective_month_name) for
// movement_ledger. The real generated HR_DATA.json instead uses
// employee_name / previous_company (raw key) / salary_change (absolute SAR) /
// effective_month (number). This normalizes either shape into the one the
// Movements page renders, without touching any other collection.
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
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const boot = useCallback((json) => {
    if (!json || !json.meta || !json.monthly || !json.payroll_records) {
      throw new Error('Invalid HR data');
    }
    setData(normalizeData(json));
    setError('');
  }, []);

  const importFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        boot(JSON.parse(reader.result));
      } catch (err) {
        setError('ملف JSON غير صالح أو لا يحتوي على بيانات النظام.');
      }
    };
    reader.onerror = () => setError('تعذر قراءة الملف.');
    reader.readAsText(file, 'utf-8');
  }, [boot]);

  useEffect(() => {
    // Same auto-load strategy as the original: try fetching HR_DATA.json next to
    // the app when served over http(s); otherwise fall straight to manual import.
    if (window.location.protocol !== 'file:') {
      fetch('/HR_DATA.json', { cache: 'no-store' })
        .then((res) => { if (!res.ok) throw new Error('JSON not found'); return res.json(); })
        .then((json) => { boot(json); setLoading(false); })
        .catch(() => { setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [boot]);

  const monthName = useCallback((m) => (data ? data.meta.month_names[m] || m : m), [data]);
  const companyLabel = useCallback((c) => (data ? data.meta.company_labels[c] || c : c), [data]);
  const defaultMeta = useCallback(
    () => (data ? `آخر تحديث: ${data.meta.last_updated} · البيانات مبنية من ${data.meta.total_files} ملف مصدر فعلي` : ''),
    [data]
  );

  const value = { data, error, loading, importFile, monthName, companyLabel, defaultMeta };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
