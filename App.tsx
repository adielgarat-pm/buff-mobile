/**
 * App.tsx — root component.
 *
 * Provider order (outer → inner, each reads from its parent):
 *   SafeAreaProvider         — inset measurements (must wrap everything)
 *     GestureHandlerRootView — gesture system
 *       LanguageProvider     — i18n + RTL (must be outermost so ALL children
 *                               can call useTranslation() and useLanguage())
 *       AuthProvider         — Supabase auth, profile, session
 *         ModeProvider       — parent vs child view mode (reads profile.role)
 *           ThemeProvider    — child colour theme (persisted per device)
 *             AppContent     — reads theme.statusBar → StatusBar style
 *               RootNavigator
 *
 * LanguageProvider is placed outside AuthProvider deliberately:
 * - The login/signup screens need translations before any user is logged in.
 * - It calls i18n.changeLanguage() and I18nManager.forceRTL() during its own
 *   mount, before any screen renders.
 * - While isHydrating is true, AppContent renders a blank view so there is no
 *   flash of untranslated content and no RTL/LTR flicker.
 */

// i18n must be imported before any component that calls useTranslation()
import './src/i18n';

import * as Sentry from '@sentry/react-native';

import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { AuthProvider, useAuth }         from './src/contexts/AuthContext';
import { ModeProvider }                  from './src/contexts/ModeContext';
import { ThemeProvider, useTheme }       from './src/contexts/ThemeContext';
import { LAVENDER_BG }                    from './src/theme/palette';
import RootNavigator                     from './src/navigation/RootNavigator';
import { initRevenueCat }                from './src/services/purchaseService';
import { NotificationGate }              from './src/components/NotificationGate';
import { resolveChildLang }              from './src/lib/i18nString';
import { setupPwa }                      from './src/lib/setupPwa';

// Make the web build installable as a PWA (inject manifest + apple-* meta tags
// and register the service worker). No-op on native (the native app is the
// "installed app").
setupPwa();

// Sentry crash + error monitoring.
// DSN is only set in production/preview EAS profiles (eas.json env), keeping
// dev builds Sentry-off so local crashes don't burn quota. PII scrubbing is
// aggressive because BUFF is a children's app — emails, display names, and IP
// must never leave the device.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
      delete event.user.ip_address;
    }
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    if (typeof breadcrumb.message === 'string') {
      breadcrumb.message = breadcrumb.message.replace(
        /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
        '[email]',
      );
    }
    return breadcrumb;
  },
});

/**
 * RevenueCatInit — sits inside AuthProvider.
 * Calls initRevenueCat whenever the signed-in user changes.
 * Renders nothing; side-effect only.
 */
function RevenueCatInit() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      initRevenueCat(user.id).catch(err =>
        console.warn('[RevenueCat] init error (non-fatal):', err)
      );
    }
  }, [user]);
  return null;
}

/**
 * ChildLanguageBinder — sits inside AuthProvider (so it can read the profile)
 * AND inside LanguageProvider (so it can call setLanguage).
 *
 * On a child's OWN device (ChildJoin persistent session, profile.role ===
 * 'child') the device language must follow the parent-set per-child language,
 * not the AsyncStorage default. When the resolved child language differs from
 * the active language we call setLanguage(): it persists the choice (so the
 * next launch hydrates correctly with no refetch) and, if the RTL direction
 * changes, runs the same one-time restart prompt as any language change.
 *
 * Parent devices (role !== 'child') are untouched — their language stays the
 * device/AsyncStorage value resolved by LanguageProvider.
 *
 * The ref guards against re-binding the same (child, language) pair when the
 * profile object identity churns on refetch, so setLanguage (and its restart
 * prompt) fires at most once per resolved language.
 */
function ChildLanguageBinder() {
  const { profile } = useAuth();
  const { language, setLanguage } = useLanguage();
  const lastBound = useRef<string | null>(null);

  useEffect(() => {
    if (profile?.role !== 'child') return;

    const target = resolveChildLang(profile, language);
    const key = `${profile.id}:${target}`;
    if (lastBound.current === key) return;
    lastBound.current = key;

    if (target !== language) {
      setLanguage(target).catch(err =>
        console.warn('[ChildLanguageBinder] setLanguage failed (non-fatal):', err)
      );
    }
  }, [profile, language, setLanguage]);

  return null;
}

/**
 * AppContent — lives inside all providers.
 * Suppresses rendering until LanguageProvider has resolved the persisted
 * language and applied the correct RTL state.
 */
function AppContent() {
  const { isHydrating } = useLanguage();
  const { theme }       = useTheme();

  if (isHydrating) {
    // Blank screen during the ~1 AsyncStorage read.
    // Keeps the native splash visible (Expo splashscreen will still overlay
    // until the first render completes). Lavender (Pastel home base) instead of
    // the old cold #0F0F1A — the app's first painted surface (auth/onboarding) is
    // LIGHT, so this avoids a dark flash on launch (color-consolidation).
    return <View style={{ flex: 1, backgroundColor: LAVENDER_BG }} />;
  }

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <RootNavigator />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
        <AuthProvider>
          <RevenueCatInit />
          <ChildLanguageBinder />
          <ModeProvider>
            <ThemeProvider>
              <AppContent />
              <NotificationGate />
            </ThemeProvider>
          </ModeProvider>
        </AuthProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
