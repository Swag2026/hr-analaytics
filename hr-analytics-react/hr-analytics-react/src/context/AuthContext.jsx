import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { useLanguage } from './LanguageContext.jsx';
import { translateText } from '../i18n.js';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const { isEn } = useLanguage();
  const [token, setToken] = useState(() => localStorage.getItem('hr_auth_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('hr_auth_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [checking, setChecking] = useState(true);

  // Validate any stored token once on load (catches expired/invalid tokens early
  // instead of letting the first data fetch fail later).
  useEffect(() => {
    if (!token) { setChecking(false); return; }
    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error('invalid token'); return res.json(); })
      .then((u) => { setUser(u); localStorage.setItem('hr_auth_user', JSON.stringify(u)); })
      .catch(() => { setToken(null); setUser(null); localStorage.removeItem('hr_auth_token'); localStorage.removeItem('hr_auth_user'); })
      .finally(() => setChecking(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username, password) => {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(isEn ? translateText(detail?.detail || 'فشل تسجيل الدخول') : (detail?.detail || 'فشل تسجيل الدخول'));
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('hr_auth_token', data.access_token);
    localStorage.setItem('hr_auth_user', JSON.stringify(data.user));
  }, [isEn]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hr_auth_token');
    localStorage.removeItem('hr_auth_user');
  }, []);

  // Called by DataContext if a data fetch comes back 401 (token expired mid-session).
  const handleUnauthorized = useCallback(() => logout(), [logout]);

  return (
    <AuthContext.Provider value={{ token, user, checking, login, logout, handleUnauthorized, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
