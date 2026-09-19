import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../config.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { translateText } from '../i18n.js';

export function useApi() {
  const { token, handleUnauthorized } = useAuth();
  const { isEn } = useLanguage();

  const apiFetch = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error(isEn ? translateText('انتهت الجلسة — الرجاء تسجيل الدخول مرة أخرى') : 'انتهت الجلسة — الرجاء تسجيل الدخول مرة أخرى');
    }
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      throw new Error(isEn ? translateText(detail?.detail || 'حدث خطأ غير متوقع') : (detail?.detail || 'حدث خطأ غير متوقع'));
    }
    return res;
  }, [token, handleUnauthorized, isEn]);

  const apiJson = useCallback(async (path, options = {}) => {
    const res = await apiFetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    return res.json();
  }, [apiFetch]);

  return { apiFetch, apiJson, token };
}
