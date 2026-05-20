/**
 * webPushRegistration — stub for Expo Web (Phase 9, deferred verification).
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md § Phase 9.
 *
 * When the Expo Web build is enabled (F-073 Phase 2 of the broader roadmap),
 * this module is the entry point for Firebase Web SDK + Service Worker
 * push registration. The Edge Function (Phase 3) does NOT change — it just
 * picks the FCM web payload format when the token_type is 'fcm-web'.
 *
 * v1 status: SCAFFOLDING ONLY.
 *   - `firebase` npm package is NOT installed (separate approval needed per OQ-A2)
 *   - This file logs + returns null until the dep is added + a real Firebase
 *     web config is provided
 *   - `web/firebase-messaging-sw.js` Service Worker file is NOT yet written
 *
 * To activate Phase 9 (when web build ships):
 *   1. `npm install firebase` (separate Adi approval)
 *   2. Add Firebase web config to environment / runtime config
 *   3. Write `web/firebase-messaging-sw.js` per Firebase docs
 *   4. Replace the stub below with the real registration code (use the
 *      same `upsertDeviceToken` from pushTokens.ts; token_type='fcm-web')
 */

import { Platform } from 'react-native';
import { upsertDeviceToken } from './pushTokens';

export interface WebRegistrationResult {
  status: 'registered' | 'unsupported' | 'permission_denied' | 'not_implemented';
  token?: string;
}

/**
 * Stub: returns 'not_implemented' until Firebase web SDK is installed.
 * Called from usePushRegistration on web platform.
 */
export async function registerWebPushToken(
  profileId: string,
): Promise<WebRegistrationResult> {
  if (Platform.OS !== 'web') {
    return { status: 'unsupported' };
  }

  // Phase 9 v1.1: implement when firebase web SDK is installed
  // const messaging = getMessaging(firebaseApp);
  // const permission = await Notification.requestPermission();
  // if (permission !== 'granted') return { status: 'permission_denied' };
  // const token = await getToken(messaging, { vapidKey: '...' });
  // await upsertDeviceToken(profileId, token, 'fcm-web');
  // return { status: 'registered', token };

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(
      '[webPushRegistration] stub — firebase web SDK not installed; deferred to web build activation',
    );
  }
  // Touch the import so Platform tree-shake doesn't dead-code it
  void upsertDeviceToken;
  void profileId;
  return { status: 'not_implemented' };
}
