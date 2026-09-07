/**
 * i18n index — exports all translation maps and the translation lookup helper.
 *
 * Design decision: We use a simple custom i18n implementation rather than
 * next-intl or i18next to keep the dependency count low and because our
 * needs are minimal (4 languages, no pluralisation rules, basic interpolation).
 *
 * The `getTranslations(lang)` function returns the translation map for a given
 * language code. The LanguageContext uses this to provide a `t()` function.
 */

import { en, Translations } from './en';
import { nl } from './nl';
import { de } from './de';
import { fr } from './fr';
import type { Language } from '@/types';

/** Map from language code to its translation object */
const TRANSLATIONS: Record<Language, Translations> = {
  en,
  nl,
  de,
  fr,
};

/**
 * Returns the translation object for the given language code.
 * Falls back to English if the language is not found.
 */
export function getTranslations(lang: Language): Translations {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}

/**
 * Resolves a dot-separated key path (e.g. "search.placeholder") against
 * a translation object and interpolates `{{key}}` placeholders.
 *
 * @param translations - Translation object for the current language
 * @param key          - Dot-notation key path
 * @param params       - Optional map of interpolation values
 * @returns              Translated string, or the key itself if not found
 *
 * @example
 *   resolvePath(en, 'search.noResults', { query: 'chocolate' })
 *   // => 'No products found for "chocolate".'
 */
export function resolvePath(
  translations: Translations,
  key: string,
  params?: Record<string, string | number>,
): string {
  const parts = key.split('.');
  // Walk the translation tree — supports unlimited nesting depth
  let current: unknown = translations;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') return key;
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current !== 'string') return key;

  // Replace {{placeholder}} tokens with provided values
  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replaceAll(`{{${k}}}`, String(v)),
      current,
    );
  }

  return current;
}

export type { Translations };
export { en, nl, de, fr };
