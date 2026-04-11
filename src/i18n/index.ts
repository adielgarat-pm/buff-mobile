/**
 * i18next initialisation — called once at app startup.
 *
 * Design decisions:
 *  - `initImmediate: false`  → synchronous init; `t()` works before the first
 *    render without an Suspense boundary or loading gate.
 *  - Language is set to 'en' here; LanguageContext immediately calls
 *    `changeLanguage()` with the persisted / device locale, so the correct
 *    language is applied before any screen renders.
 *  - Both namespaces are bundled (no lazy-loading needed at this scale).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import he from './he.json';

export type SupportedLanguage = 'en' | 'he';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'he'];

export const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; native: string; flag: string; isRTL: boolean }> = {
  en: { label: 'English', native: 'English', flag: '🇺🇸', isRTL: false },
  he: { label: 'Hebrew',  native: 'עברית',   flag: '🇮🇱', isRTL: true  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        he: { translation: he },
      },
      lng:           'en',       // overridden immediately by LanguageContext
      fallbackLng:   'en',
      // initImmediate was removed in i18next v26; init is synchronous by default
      // when no async backend is used (all resources are bundled inline).
      interpolation: {
        escapeValue: false,      // React handles XSS
      },
      saveMissing:   false,
    });
}

export default i18n;
