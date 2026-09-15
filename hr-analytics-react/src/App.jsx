import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useHrData } from './context/DataContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { FiltersProvider } from './context/FiltersContext.jsx';
import Shell from './components/Shell.jsx';
import Loader from './components/Loader.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Companies from './pages/Companies.jsx';
import Branches from './pages/Branches.jsx';
import Employees from './pages/Employees.jsx';
import Payroll from './pages/Payroll.jsx';
import PayrollCost from './pages/PayrollCost.jsx';
import Turnover from './pages/Turnover.jsx';
import Movements from './pages/Movements.jsx';
import Risks from './pages/Risks.jsx';
import Exceptions from './pages/Exceptions.jsx';
import DataQuality from './pages/DataQuality.jsx';
import ReviewCenter from './pages/ReviewCenter.jsx';
import CorrectionLog from './pages/CorrectionLog.jsx';
import Upload from './pages/Upload.jsx';
import Reports from './pages/Reports.jsx';
import KpiDictionary from './pages/KpiDictionary.jsx';
import Settings from './pages/Settings.jsx';

function Gate({ children }) {
  const { data, loading } = useHrData();
  if (loading) return null;
  if (!data) return <Loader />;
  return children;
}

export default function App() {
  return (
    <DataProvider>
      <Gate>
        <ModalProvider>
          <FiltersProvider>
            <HashRouter>
              <Routes>
                <Route element={<Shell />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/payroll-cost" element={<PayrollCost />} />
                  <Route path="/turnover" element={<Turnover />} />
                  <Route path="/movements" element={<Movements />} />
                  <Route path="/risks" element={<Risks />} />
                  <Route path="/exceptions" element={<Exceptions />} />
                  <Route path="/data-quality" element={<DataQuality />} />
                  <Route path="/review-center" element={<ReviewCenter />} />
                  <Route path="/correction-log" element={<CorrectionLog />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/kpi-dictionary" element={<KpiDictionary />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </HashRouter>
          </FiltersProvider>
        </ModalProvider>
      </Gate>
    </DataProvider>
  );
}
