import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_SECTIONS, Icon } from '../utils/icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import LangToggle from './LangToggle.jsx';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, isEn } = useLanguage();

  return (
    <aside className="sidebar" id="sidebar">
      <Link to="/apps" className="sidebar-brand" title={isEn ? 'Back to apps' : 'الرجوع إلى التطبيقات'}>
        <div className="mark">HR</div>
        <div className="name">{t('brandName', 'نظام التحليلات التنفيذية')}</div>
        <div className="sub">{t('brandSub', 'مجموعة سواج · Group HR Analytics')}</div>
      </Link>
      <div style={{ padding: '10px 20px 0' }}><LangToggle /></div>
      {NAV_SECTIONS.map((sec) => (
        <div className="nav-group" key={sec.label}>
          <div className="nav-label">{t(sec.label, sec.label)}</div>
          {sec.items.filter((it) => it.id !== 'users' || user?.role === 'admin').map((it) => (
            <NavLink
              key={it.id}
              to={`/${it.id}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon name={it.icon} />
              <span>{t(`nav.${it.id}`, it.label)}</span>
            </NavLink>
          ))}
        </div>
      ))}
      <div className="nav-group" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div className="nav-item" onClick={logout} style={{ cursor: 'pointer' }}>
          <Icon name="close" />
          <span>{t('logout', 'تسجيل الخروج')} {user ? `(${user.full_name || user.username})` : ''}</span>
        </div>
      </div>
    </aside>
  );
}
