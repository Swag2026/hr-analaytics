import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { routeById } from '../routesConfig.js';
import { useModal } from '../context/ModalContext.jsx';

export default function Shell() {
  const location = useLocation();
  const id = location.pathname.replace('/', '') || 'dashboard';
  const route = routeById(id) || routeById('dashboard');
  const { closeModal } = useModal();

  useEffect(() => {
    closeModal();
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar route={route} />
        <main className="content" id="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
