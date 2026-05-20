/**
 * notificationHandler — global setup for expo-notifications behavior.
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md § Phase 5.
 *
 * Configures:
 *   1. setNotificationHandler — what to do when a notification arrives while
 *      app is in foreground. Per OQ-A11: suppress tray, surface as in-app
 *      toast.
 *   2. Android notification channel (Android 8+ required)
 *   3. Listener registration (tap responses, foreground receipts)
 *
 * Called once at app boot from App.tsx (before render).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let setupDone = false;

/**
 * Run once at app boot. Idempotent (safe to call multiple times).
 */
export async function setupNotifications(): Promise<void> {
  if (setupDone) return;
  setupDone = true;

  // Foreground behavior per OQ-A11: suppress tray, the app will surface an
  // in-app toast via the listener instead. shouldShowBanner=false matches
  // the locked decision; we still consume the data.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });

  // Android requires a channel for any notification to land in the tray.
  // BUFF uses a single 'default' channel; per-type channels are v1.1.
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BUFF',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#8b5cf6',
        sound: 'default',
      });
    } catch (err) {
      if (__DEV__) console.warn('[notificationHandler] channel setup failed:', err);
    }
  }
}
