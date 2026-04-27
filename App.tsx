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

import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { AuthProvider, useAuth }         from './src/contexts/AuthContext';
import { ModeProvider }                  from './src/contexts/ModeContext';
import { ThemeProvider, useTheme }       from './src/contexts/ThemeContext';
import RootNavigator                     from './src/navigation/RootNavigator';
import { initRevenueCat }                from './src/services/purchaseService';

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
    // until the first render completes).
    return <View style={{ flex: 1, backgroundColor: '#0F0F1A' }} />;
  }

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
        <AuthProvider>
          <RevenueCatInit />
          <ModeProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </ModeProvider>
        </AuthProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
