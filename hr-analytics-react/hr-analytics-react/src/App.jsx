import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { DataProvider, useHrData } from './context/DataContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { FiltersProvider } from './context/FiltersContext.jsx';
import Shell from './components/Shell.jsx';
import Loader from './components/Loader.jsx';
import Login from './pages/Login.jsx';
import Apps from './pages/Apps.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Companies from './pages/Companies.jsx';
import Branches from './pages/Branches.jsx';
import Employees from './pages/Employees.jsx';
import Payroll from './pages/Payroll.jsx';
import RunPayroll from './pages/RunPayroll.jsx';
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
import Users from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';

function DataGate({ children }) {
  const { data, loading } = useHrData();
  if (loading) return null;
  if (!data) return <Loader />;
  return children;
}

// Decides between the login screen and the authenticated app. DataProvider is
// only mounted once a token exists, since it needs the token to fetch data.
function AuthGate() {
  const { isAuthenticated, checking } = useAuth();
  if (checking) return null;
  if (!isAuthenticated) return <Login />;

  return (
    <DataProvider>
      <DataGate>
        <ModalProvider>
          <HashRouter>
            {/* FiltersProvider must be INSIDE HashRouter — it calls useLocation(),
                which only works for descendants of the Router. */}
            <FiltersProvider>
              <Routes>
                <Route path="/apps" element={<Apps />} />
                <Route element={<Shell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/run-payroll" element={<RunPayroll />} />
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
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="/" element={<Navigate to="/apps" replace />} />
                <Route path="*" element={<Navigate to="/apps" replace />} />
              </Routes>
            </FiltersProvider>
          </HashRouter>
        </ModalProvider>
      </DataGate>
    </DataProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </LanguageProvider>
  );
}
