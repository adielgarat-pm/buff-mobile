/**
 * NotificationGate — top-level integration point for push notifications.
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md
 * Phases wired here: 2 (parent registration) + 5 (foreground handler) +
 *                    6 (kid registration) + 8 (kid local notifications)
 *
 * Responsibilities:
 *   1. Run setupNotifications() once at mount (foreground handler + Android channel)
 *   2. Run usePushRegistration() to track parent or kid token lifecycle
 *   3. Run useKidLocalNotifications() when current profile is a kid
 *   4. Show PushPermissionPrePrompt modal when permission is 'unknown' and
 *      profile is loaded
 *
 * Sits inside AuthProvider + ModeProvider but outside theme to avoid extra
 * re-renders on theme changes.
 *
 * For Phase 3 (FCM Edge Function dispatch) → tokens registered here are read
 * by the Edge Function. Tested end-to-end once Adi provides the Firebase
 * service account JSON.
 */

import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { usePushPromptDismiss } from '../hooks/usePushPromptDismiss';
import { useKidLocalNotifications } from '../hooks/useKidLocalNotifications';
import { setupNotifications } from '../lib/notificationHandler';
import { logPushStep } from '../lib/pushTelemetry';
import { PushPermissionPrePrompt } from '../screens/onboarding/PushPermissionPrePrompt';
import { PARENT_THEME as T } from '../theme';

// Mirrors the parent tab bar height in ParentTabs.tsx (height: 56 + insets.bottom).
// The denied-permission banner sits above BOTH the tab bar and the system nav bar
// so its CTA / dismiss stay tappable (was bottom:24 → collided with the Android
// navigation bar on 3-button / gesture devices, making the buttons unreachable).
const PARENT_TAB_BAR_HEIGHT = 56;

export const NotificationGate: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { permission, register } = usePushRegistration();
  // Persistent "don't nag" flag — survives web page reloads (the in-memory
  // useRef it replaced reset on every refresh, re-popping the pre-prompt) and
  // re-asks only after a week. Covers accept-that-failed loops too: an accept
  // that leaves permission 'unknown' (web register() error path) is dismissed
  // here so the modal can't immediately re-show.
  const { isDismissed: promptDismissed, markDismissed, loading: dismissLoading } =
    usePushPromptDismiss(profile?.id ?? null);
  // Kid local notifications — internally no-op when profile.role !== 'child'
  useKidLocalNotifications();

  const [promptVisible, setPromptVisible] = useState(false);
  // Denial-recovery banner: a 'denied' user can never see the OS dialog again,
  // so without this they stay dark forever. Dismissible per session.
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Run global setup once at mount
  useEffect(() => {
    setupNotifications().catch((err) => {
      if (__DEV__) console.warn('[NotificationGate] setupNotifications failed:', err);
    });
  }, []);

  // Decide whether to show the pre-prompt modal
  useEffect(() => {
    if (!profile) return;
    if (dismissLoading) return;       // wait until the persisted flag is read
    if (promptDismissed) {
      setPromptVisible(false);
      return;
    }
    if (permission === 'unknown') {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => {
        setPromptVisible(true);
        logPushStep('preprompt_shown', { role: profile.role });
      }, 1200);
      return () => clearTimeout(timer);
    }
    setPromptVisible(false);
  }, [profile, permission, promptDismissed, dismissLoading]);

  const handleAccept = async () => {
    setPromptVisible(false);
    logPushStep('preprompt_accepted', { role: profile?.role });
    // Mark dismissed BEFORE register(): on web a failed register() leaves
    // permission 'unknown', and without this the effect would re-pop the modal
    // 1.2s later in a loop. Re-ask is governed by the hook's interval.
    await markDismissed();
    await register();
  };

  const handleDecline = () => {
    setPromptVisible(false);
    logPushStep('preprompt_declined', { role: profile?.role });
    void markDismissed();
  };

  if (!profile) return null;

  // Show the recovery banner only to parents who actively denied the OS prompt.
  // (Kid/age routing to settings is Phase 5.) The pre-prompt and the banner are
  // mutually exclusive: 'unknown' → pre-prompt, 'denied' → banner.
  const showDeniedBanner =
    profile.role === 'parent' && permission === 'denied' && !bannerDismissed;

  return (
    <>
      <PushPermissionPrePrompt
        visible={promptVisible}
        audience={profile.role === 'parent' ? 'parent' : 'kid'}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
      {showDeniedBanner && (
        <View
          style={[styles.banner, { bottom: insets.bottom + PARENT_TAB_BAR_HEIGHT + 12 }]}
          accessibilityRole="alert"
        >
          <Text style={styles.bannerText}>{t('notifSettings.deniedBanner.text')}</Text>
          <View style={styles.bannerActions}>
            <TouchableOpacity onPress={() => { void Linking.openSettings(); }} accessibilityRole="button">
              <Text style={styles.bannerCta}>{t('notifSettings.deniedBanner.cta')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBannerDismissed(true)} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.bannerDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    // bottom is set dynamically from safe-area insets + tab bar height (see render).
    backgroundColor: T.text,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerText: { color: '#FFFFFF', fontSize: 14, flex: 1, paddingRight: 12 },
  bannerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerCta: { color: T.accentLight, fontSize: 14, fontWeight: '700' },
  bannerDismiss: { color: '#FFFFFF', fontSize: 16, opacity: 0.7 },
});
