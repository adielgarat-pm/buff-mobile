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

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { useKidLocalNotifications } from '../hooks/useKidLocalNotifications';
import { setupNotifications } from '../lib/notificationHandler';
import { PushPermissionPrePrompt } from '../screens/onboarding/PushPermissionPrePrompt';

export const NotificationGate: React.FC = () => {
  const { profile } = useAuth();
  const { permission, register } = usePushRegistration();
  // Kid local notifications — internally no-op when profile.role !== 'child'
  useKidLocalNotifications();

  const [promptVisible, setPromptVisible] = useState(false);
  // Prevent re-showing the pre-prompt after dismiss in the same session
  const dismissedThisSession = useRef(false);

  // Run global setup once at mount
  useEffect(() => {
    setupNotifications().catch((err) => {
      if (__DEV__) console.warn('[NotificationGate] setupNotifications failed:', err);
    });
  }, []);

  // Decide whether to show the pre-prompt modal
  useEffect(() => {
    if (!profile) return;
    if (dismissedThisSession.current) return;
    if (permission === 'unknown') {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setPromptVisible(true), 1200);
      return () => clearTimeout(timer);
    }
    setPromptVisible(false);
  }, [profile, permission]);

  const handleAccept = async () => {
    setPromptVisible(false);
    await register();
  };

  const handleDecline = () => {
    setPromptVisible(false);
    dismissedThisSession.current = true;
  };

  if (!profile) return null;

  return (
    <PushPermissionPrePrompt
      visible={promptVisible}
      audience={profile.role === 'parent' ? 'parent' : 'kid'}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
};
