/**
 * LanguageContext
 *
 * Single source of truth for language + RTL in the BUFF mobile app.
 *
 * Responsibilities:
 *  1. Hydrate language on startup:
 *       AsyncStorage  →  (fallback) expo-localization device locale  →  'en'
 *  2. Call i18n.changeLanguage() so react-i18next hooks pick up the right strings.
 *  3. Apply I18nManager.forceRTL() BEFORE the first render cycle so the
 *     native layout engine uses the correct text direction from the start.
 *  4. Expose setLanguage() for language-picker UI (onboarding language step,
 *     parent/child settings).
 *  5. When RTL direction must change (en↔he), prompt the user to restart —
 *     the layout engine only reads forceRTL at startup.
 *
 * RTL strategy:
 *  - Hebrew is RTL; English is LTR.
 *  - I18nManager.forceRTL is set during LanguageProvider mount, before the
 *    tree renders, so the initial layout is always correct.
 *  - If the user switches language at runtime and RTL changes, we call
 *    forceRTL() and trigger an expo-updates reload. In Expo Go / dev builds
 *    where Updates.reloadAsync() is unavailable, an Alert asks for a manual
 *    restart — the new language strings are applied immediately, layout
 *    direction takes effect after the restart.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import * as Updates from 'expo-updates';
import i18n, { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '../i18n';
import { crossAlert } from '../platform';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LanguageContextType {
  /** Active language code, e.g. 'en' | 'he' */
  language:    SupportedLanguage;
  /** Whether the active language is RTL */
  isRTL:       boolean;
  /** 'ltr' | 'rtl' — ready to drop into flexDirection / writingDirection */
  direction:   'ltr' | 'rtl';
  /**
   * Change the app language. Persists to AsyncStorage and applies RTL.
   * If RTL direction changes, prompts the user to restart.
   */
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  /** True while the context is reading from AsyncStorage on first mount */
  isHydrating: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'buff_language';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a BCP-47 locale string to a supported language, or null. */
function localeToLang(locale: string): SupportedLanguage | null {
  const tag = locale.toLowerCase();
  if (tag.startsWith('he') || tag.startsWith('iw')) return 'he'; // iw = legacy Hebrew tag
  if (tag.startsWith('en')) return 'en';
  return null;
}

/** Derive the best initial language from device locales. */
function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();          // expo-localization v15+
    for (const loc of locales) {
      const lang = localeToLang(loc.languageTag);
      if (lang) return lang;
    }
  } catch {
    // expo-localization unavailable in some Jest / bare environments
  }
  return 'en';
}

/**
 * Apply a changed RTL layout direction. The native layout engine only reads
 * I18nManager.isRTL at startup, so a he↔en flip needs a full reload. We ask
 * first (a silent restart would be jarring), then reload via expo-updates. In
 * dev clients / Expo Go reloadAsync throws — the new strings + forceRTL flag
 * are already applied, so the flip lands on the next manual restart.
 */
async function reloadApp(): Promise<void> {
  crossAlert(
    i18n.t('language.restartTitle'),
    i18n.t('language.restartMessage'),
    [
      { text: i18n.t('language.restartCancel'), style: 'cancel' },
      {
        text: i18n.t('language.restartConfirm'),
        onPress: () => {
          Updates.reloadAsync().catch(() => {
            // dev client / Expo Go: cannot auto-reload; manual restart finishes it
          });
        },
      },
    ],
  );
}

// ─── Context ─────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<SupportedLanguage>('en');
  const [isHydrating, setIsHydrating] = useState(true);

  // ── Startup hydration ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // 1. Try persisted preference
        let resolved: SupportedLanguage | null = null;
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored === 'en' || stored === 'he') resolved = stored;
        } catch { /* ignore storage errors */ }

        // 2. Fall back to device locale
        if (!resolved) resolved = detectDeviceLanguage();

        const targetRTL = LANGUAGE_LABELS[resolved].isRTL;

        // 3. Apply RTL BEFORE state update so the layout engine sees it
        //    before the first real render pass.
        if (I18nManager.isRTL !== targetRTL) {
          I18nManager.forceRTL(targetRTL);
        }

        // 4. Sync i18next
        await i18n.changeLanguage(resolved);
        setLangState(resolved);
      } catch {
        // Hydration failed — fall back to English and continue
      } finally {
        setIsHydrating(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Runtime language change ────────────────────────────────────────────────
  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    const targetRTL  = LANGUAGE_LABELS[lang].isRTL;
    const dirChanged = I18nManager.isRTL !== targetRTL;

    // Persist first so the new language survives the pending reload
    await AsyncStorage.setItem(STORAGE_KEY, lang);

    // Update i18next — strings update immediately in all useTranslation() hooks
    await i18n.changeLanguage(lang);
    setLangState(lang);

    if (dirChanged) {
      // Must update the native layout direction, then restart
      I18nManager.forceRTL(targetRTL);
      await reloadApp();
    }
  }, []);

  const isRTL    = LANGUAGE_LABELS[language].isRTL;
  const direction: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, isRTL, direction, setLanguage, isHydrating }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

/**
 * Returns style helpers pre-computed for the active direction.
 * Drop `rtlStyle` onto any Text or View that needs direction-aware alignment.
 *
 * @example
 *   const { textAlign, rowReverse } = useRTLStyles();
 *   <Text style={{ textAlign }}>Hello</Text>
 *   <View style={[styles.row, rowReverse && styles.rowRev]}>…</View>
 */
export function useRTLStyles() {
  const { isRTL } = useLanguage();
  return {
    isRTL,
    textAlign:       isRTL ? ('right' as const)  : ('left' as const),
    textAlignCenter: 'center' as const,
    flexStart:       isRTL ? ('flex-end' as const)  : ('flex-start' as const),
    flexEnd:         isRTL ? ('flex-start' as const) : ('flex-end' as const),
    /** Flip a row's children for RTL. Use with flexDirection. */
    rowDirection:    isRTL ? ('row-reverse' as const) : ('row' as const),
    /** Writing direction for Text nodes (affects BiDi algorithm). */
    writingDirection: isRTL ? ('rtl' as const) : ('ltr' as const),
  };
}
