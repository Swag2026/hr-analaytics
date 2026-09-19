import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const FiltersContext = createContext(null);

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within <FiltersProvider>');
  return ctx;
}

export function FiltersProvider({ children }) {
  const [company, setCompany] = useState('');
  const [month, setMonth] = useState(8);
  const location = useLocation();

  // Original app rebuilds (and resets) the filter <select>s on every route change.
  useEffect(() => {
    setCompany('');
    setMonth(8);
  }, [location.pathname]);

  return (
    <FiltersContext.Provider value={{ company, setCompany, month, setMonth }}>
      {children}
    </FiltersContext.Provider>
  );
}
