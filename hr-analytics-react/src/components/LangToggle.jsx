import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function LangToggle({ className = '' }) {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`}
      onClick={toggleLang}
      title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <span className={lang === 'ar' ? 'active' : ''}>AR</span>
      <span className={lang === 'en' ? 'active' : ''}>EN</span>
    </button>
  );
}
