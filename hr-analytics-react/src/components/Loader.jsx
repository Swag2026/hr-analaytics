import React from 'react';
import { useHrData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Loader() {
  const { error, refresh } = useHrData();
  const { logout, user } = useAuth();

  return (
    <div className="loader-screen">
      <div className="loader-box">
        <div className="loader-mark">HR</div>
        <h1 style={{ margin: '0 0 8px', color: '#0E1B2E', fontSize: 22 }}>نظام التحليلات التنفيذية</h1>
        {error ? (
          <>
            <p style={{ margin: '0 0 20px', color: 'var(--critical)' }}>{error}</p>
            <button className="loader-import-btn" onClick={refresh} style={{ border: 'none' }}>إعادة المحاولة</button>
          </>
        ) : (
          <p style={{ margin: '0 0 20px', color: '#666B78' }}>جارٍ تحميل البيانات...</p>
        )}
        {user ? (
          <p style={{ margin: '16px 0 0' }}>
            <button className="btn ghost sm" onClick={logout}>تسجيل الخروج ({user.full_name || user.username})</button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
