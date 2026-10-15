/**
 * RootErrorBoundary — catches any uncaught render/effect error in the app tree.
 *
 * Without it, a single throw anywhere (e.g. the Supabase realtime
 * "cannot add postgres_changes callbacks ... after subscribe()" error) unmounts
 * the whole tree: on web #root goes empty and the user is left on a blank page.
 *
 * Reporting: Sentry.ErrorBoundary sends the error through captureException, so
 * it passes the same beforeSend / beforeBreadcrumb PII scrubbing configured in
 * App.tsx. Dev builds have no DSN, so nothing leaves the device there.
 *
 * The fallback deliberately depends on NO app context (auth, mode, theme,
 * language): any of those providers may be the thing that crashed. Strings come
 * straight from the i18n instance, which LanguageProvider has already switched
 * to the active language.
 *
 * Copy approved by Adi (Option A, 2026-10-15): calm, no blame, the problem is
 * ours — the same screen may be seen by a kid or a parent on a shared device.
 */
import type { ReactNode } from 'react';
import * as Sentry from '@sentry/react-native';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import i18n from '../i18n';
import { LAVENDER_BG, VIOLET_ACCENT, VIOLET_DEEP, WHITE } from '../theme/palette';
import { restartApp } from '../lib/restartApp';

export function RootErrorFallback({ resetError }: { resetError: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const dir = i18n.dir();

  return (
    <View
      style={[
        styles.screen,
        // Web: React Navigation's stack sizes <body> from a --vh var it only
        // updates while mounted. Once the navigator has crashed, --vh is 0 and
        // every flex:1 ancestor collapses — size the fallback from the window.
        Platform.OS === 'web' && { minHeight: height },
        { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 20) + 24, direction: dir },
      ]}
    >
      {/* The crashed tree may have left a light (white) status bar; the
          fallback is always on lavender, so force dark icons. */}
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {i18n.t('errorBoundary.title')}
        </Text>
        <Text style={styles.body}>{i18n.t('errorBoundary.body')}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => { void restartApp(resetError); }}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        testID="error-boundary-retry"
      >
        <Text style={styles.ctaText}>{i18n.t('errorBoundary.cta')}</Text>
      </Pressable>
    </View>
  );
}

export function RootErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={scope => { scope.setTag('boundary', 'root'); }}
      fallback={({ resetError }) => <RootErrorFallback resetError={resetError} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LAVENDER_BG,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: VIOLET_DEEP,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: VIOLET_DEEP,
    opacity: 0.8,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: VIOLET_ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '700',
  },
});
