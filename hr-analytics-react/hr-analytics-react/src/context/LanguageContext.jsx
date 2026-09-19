import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { EN, translateText } from '../i18n.js';

const LanguageContext = createContext(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
  return ctx;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('hr_lang') || 'ar');

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
    localStorage.setItem('hr_lang', lang);
  }, [lang]);

  const toggleLang = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), []);

  // t('some.key') walks dot-paths in EN; falls back to the key itself when lang is 'ar'
  // or the key isn't translated (e.g. an Arabic nav-section label used directly as key).
  const t = useCallback((key, fallback) => {
    if (lang !== 'en') return fallback ?? key;
    const parts = key.split('.');
    let node = EN;
    for (const p of parts) {
      if (node == null) break;
      node = node[p];
    }
    return node ?? fallback ?? key;
  }, [lang]);

  // tt(arabicText) — word/phrase-level translation via the ARABIC_TO_ENGLISH
  // dictionary in i18n.js. Safe to call on any string (including ones with
  // interpolated numbers/dates); returns the original string unchanged in
  // Arabic mode or when no Arabic dictionary match is found.
  const tt = useCallback((value) => (lang === 'en' ? translateText(value) : value), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, tt, isEn: lang === 'en' }}>
      {children}
    </LanguageContext.Provider>
  );
}
