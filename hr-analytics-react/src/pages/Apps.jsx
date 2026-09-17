import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NAV_SECTIONS, Icon } from '../utils/icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import LangToggle from '../components/LangToggle.jsx';

// One color per section — cycles if more sections are added later.
const SECTION_COLORS = ['brass', 'info', 'success', 'warning', 'critical', 'ink'];

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
        {NAV_SECTIONS.map((sec, i) => (
          <div className="apps-section" key={sec.label}>
            <div className="apps-section-label">{t(sec.label, sec.label)}</div>
            <div className="apps-grid">
              {sec.items.filter((it) => it.id !== 'users' || user?.role === 'admin').map((it) => (
                <button
                  key={it.id}
                  className={`app-tile color-${SECTION_COLORS[i % SECTION_COLORS.length]}`}
                  onClick={() => navigate(`/${it.id}`)}
                  type="button"
                >
                  <span className="app-tile-icon"><Icon name={it.icon} size={26} /></span>
                  <span className="app-tile-label">{t(`nav.${it.id}`, it.label)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
