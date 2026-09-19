import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../utils/icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import LangToggle from '../components/LangToggle.jsx';

// Each entry here is one Odoo-style "app" — a whole system with its own sidebar
// once you're inside it. Right now there is just the HR system; more systems
// (e.g. links to other internal tools) can be added to this list later.
const APPS = [
  { id: 'hr', to: '/dashboard', icon: 'users', color: 'brass', labelKey: 'appHr' },
];

export default function Apps() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="apps-screen">
      <header className="apps-header">
        <div className="apps-header-brand">
          <div className="mark">HR</div>
          <div>
            <div className="apps-title">{t('brandName', 'نظام التحليلات التنفيذية')}</div>
            <div className="apps-sub">{t('brandSub', 'مجموعة سواج · Group HR Analytics')}</div>
          </div>
        </div>
        <div className="apps-header-user">
          <LangToggle />
          <span>{user?.full_name || user?.username}</span>
          <button className="apps-logout" onClick={logout}>{t('logout', 'تسجيل الخروج')}</button>
        </div>
      </header>

      <div className="apps-body">
        <div className="apps-grid apps-grid-main">
          {APPS.map((a) => (
            <button
              key={a.id}
              className={`app-tile app-tile-lg color-${a.color}`}
              onClick={() => navigate(a.to)}
              type="button"
            >
              <span className="app-tile-icon"><Icon name={a.icon} size={34} /></span>
              <span className="app-tile-label">{t(a.labelKey, 'الموارد البشرية')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
