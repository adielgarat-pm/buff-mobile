/**
 * Locale code + number formatting derived from the ACTIVE UI language
 * (i18next) — never from the device locale.
 *
 * Bare `toLocaleString()` / `toLocaleTimeString([])` default to the DEVICE
 * locale, which leaks the wrong format during View-as-Child preview (the same
 * three-source bug class guarded by i18nNoHardcodedCopy.test.ts; see PR #216).
 * i18nCatalogIntegrity.test.ts bans argument-less locale formatters — route
 * them through here instead.
 */
import i18n from '../i18n';

export const uiLocale = (): 'he-IL' | 'en-US' =>
  i18n.language === 'he' ? 'he-IL' : 'en-US';

/** Format a number in the active UI language's locale. */
export const formatNum = (n: number): string => n.toLocaleString(uiLocale());
