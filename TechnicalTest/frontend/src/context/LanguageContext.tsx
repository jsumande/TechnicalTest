'use client';

/**
 * Language context.
 *
 * Provides:
 *  - `lang`    — the currently selected language code
 *  - `setLang` — setter that persists the choice to localStorage
 *  - `t(key, params?)` — translate a dot-notation key with optional interpolation
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslations, resolvePath } from '@/i18n';
import type { Language } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'foodsearch_lang';
const DEFAULT_LANG: Language = 'en';
const VALID_LANGS: Language[] = ['en', 'nl', 'de', 'fr'];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && VALID_LANGS.includes(stored)) {
        setLangState(stored);
      }
    } catch {
      // localStorage may not be available
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Silently fail
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translations = getTranslations(lang);
    return resolvePath(translations, key, params);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside a <LanguageProvider>');
  }
  return ctx;
}
