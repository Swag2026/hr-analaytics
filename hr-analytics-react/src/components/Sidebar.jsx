import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS, Icon } from '../utils/icons.jsx';

export default function Sidebar() {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <div className="mark">HR</div>
        <div className="name">نظام التحليلات التنفيذية</div>
        <div className="sub">مجموعة سواج · Group HR Analytics</div>
      </div>
      {NAV_SECTIONS.map((sec) => (
        <div className="nav-group" key={sec.label}>
          <div className="nav-label">{sec.label}</div>
          {sec.items.map((it) => (
            <NavLink
              key={it.id}
              to={`/${it.id}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon name={it.icon} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
