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

  // A number of legacy pages contain their copy directly in JSX. Translating
  // the rendered text nodes here keeps those pages in sync without duplicating
  // business logic or changing the Arabic data returned by the API.
  useEffect(() => {
    const textNodes = new Map();
    const attributes = new Map();
    let translating = false;
    const watchedAttributes = ['placeholder', 'title', 'aria-label'];

    const visit = (root) => {
      if (!root || translating) return;
      translating = true;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (node.parentElement && !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
          if (!textNodes.has(node)) textNodes.set(node, node.nodeValue);
          node.nodeValue = lang === 'en' ? translateText(textNodes.get(node)) : textNodes.get(node);
        }
        node = walker.nextNode();
      }
      if (root.querySelectorAll) {
        root.querySelectorAll('*').forEach((element) => {
          watchedAttributes.forEach((attribute) => {
            if (!element.hasAttribute(attribute)) return;
            if (!attributes.has(element)) attributes.set(element, {});
            if (attributes.get(element)[attribute] === undefined) {
              attributes.get(element)[attribute] = element.getAttribute(attribute);
            }
            const original = attributes.get(element)[attribute];
            element.setAttribute(attribute, lang === 'en' ? translateText(original) : original);
          });
        });
      }
      translating = false;
    };

    const restore = () => {
      textNodes.forEach((original, node) => {
        if (node.isConnected) node.nodeValue = original;
      });
      attributes.forEach((values, element) => {
        if (!element.isConnected) return;
        Object.entries(values).forEach(([attribute, original]) => element.setAttribute(attribute, original));
      });
    };

    visit(document.body);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          const original = textNodes.get(mutation.target) || mutation.target.nodeValue;
          if (!textNodes.has(mutation.target)) textNodes.set(mutation.target, original);
          if (!translating && lang === 'en') mutation.target.nodeValue = translateText(original);
        } else {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) visit(node.nodeType === Node.TEXT_NODE ? node.parentElement : node);
          });
        }
      });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    return () => {
      observer.disconnect();
      restore();
    };
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

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isEn: lang === 'en' }}>
      {children}
    </LanguageContext.Provider>
  );
}
