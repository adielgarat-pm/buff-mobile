/**
 * pushTokens — low-level helpers for the FCM/APNs/Web token lifecycle.
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md
 * Pillar: IN-2026-05-19-02 (activity-based gating; tokens carry last_seen_at)
 *
 * These helpers are pure (no React) so they can be invoked from:
 *   - usePushRegistration on app foreground
 *   - Tests (mocking Notifications + supabase)
 *   - Future kid registration path (Phase 6) — reuses the same upsert
 */

import * as Notifications from 'expo-notifications';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import { supabase } from '../integrations/supabase/client';

export type TokenType = 'fcm-android' | 'fcm-ios' | 'fcm-web';

export interface RegistrationResult {
  status: 'registered' | 'permission_denied' | 'unsupported' | 'error';
  token?: string;
  error?: string;
}

/**
 * Detect the token_type for the current platform.
 * Web build (Phase 9) overrides this via webPushRegistration.ts.
 */
export function getTokenType(): TokenType | null {
  if (Platform.OS === 'android') return 'fcm-android';
  if (Platform.OS === 'ios') return 'fcm-ios';
  // Web is handled separately via Phase 9 (firebase/messaging web SDK).
  return null;
}

/**
 * Request notification permission via expo-notifications.
 * On Android 13+ this triggers the system POST_NOTIFICATIONS prompt.
 * On iOS this triggers the standard APNs permission dialog.
 *
 * Per OQ-A4: this should be called AFTER a pre-prompt screen has explained
 * the value — never cold on app launch.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const request = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return request.status === 'granted';
}

/**
 * Get the platform-specific push token.
 *
 * On Expo Go in development, this returns an Expo push token (routed through
 * Expo's push service to FCM/APNs). On EAS Build / production, this can return
 * a native FCM/APNs token directly if `getDevicePushTokenAsync` is used.
 *
 * For v1 we use `getExpoPushTokenAsync` for ease of dev — production will
 * migrate to `getDevicePushTokenAsync` when we have direct FCM credentials
 * (Phase 3 unblocks this — Edge Function will accept Expo tokens via Expo's
 * push gateway OR native FCM tokens directly).
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync();
    return tokenResult.data ?? null;
  } catch (err) {
    if (__DEV__) console.warn('[pushTokens] getPushToken failed:', err);
    return null;
  }
}

/**
 * Upsert a device_tokens row for this profile + token.
 * Returns true on success.
 *
 * Idempotent: same (profile_id, token) call multiple times bumps last_seen_at.
 * UNIQUE constraint on token + ON CONFLICT clause handles re-registrations
 * across profile switches (rare edge case).
 */
export async function upsertDeviceToken(
  profileId: string,
  token: string,
  tokenType: TokenType,
): Promise<boolean> {
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        profile_id: profileId,
        token,
        token_type: tokenType,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
  if (error) {
    if (__DEV__) console.warn('[pushTokens] upsertDeviceToken failed:', error.message);
    return false;
  }
  return true;
}

/**
 * ISO 3166-1 alpha-2 region from the DEVICE locale settings (e.g. 'IL', 'US').
 * Device settings, not IP geolocation — privacy posture for a children's app.
 * Null when the device exposes no region (some emulators / stripped browsers).
 */
function deviceCountry(): string | null {
  try {
    const region = Localization.getLocales()[0]?.regionCode;
    return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : null;
  } catch {
    // expo-localization unavailable in some Jest / bare environments
    return null;
  }
}

/**
 * Platform value for profiles.last_platform (web-to-native-cta SPEC §Phase 1):
 * native = Platform.OS ('android' | 'ios'); web is split by device class so
 * mobile-web (convertible to native) is distinguishable from desktop-web.
 * The UA sniff runs ONLY on web — never touches browser globals on native.
 */
function currentPlatform(): string {
  if (Platform.OS !== 'web') return Platform.OS;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios-web';
  if (/Android/i.test(ua)) return 'android-web';
  return 'desktop-web';
}

/**
 * Update profiles.last_seen_at for the current profile.
 * Called from usePushRegistration on every app foreground, regardless of
 * whether push registration succeeded — this drives the engagement scheduler
 * (E5, E6) + Edge Function activity-based suppression (IN-2026-05-19-02).
 *
 * Same write also stamps last_platform / last_platform_at (admin board
 * platform column) and last_country (device-locale region, migration 045) —
 * one heartbeat, both platforms, no extra round-trip.
 */
export async function bumpLastSeenAt(profileId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    last_seen_at: now,
    last_platform: currentPlatform(),
    last_platform_at: now,
  };
  const country = deviceCountry();
  if (country) update.last_country = country; // never overwrite with null
  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', profileId);
  if (error) {
    if (__DEV__) console.warn('[pushTokens] bumpLastSeenAt failed:', error.message);
    return false;
  }
  return true;
}

/**
 * Backfill families.platform from Platform.OS when it is still NULL.
 *
 * The canonical platform column is families.platform (migration 021), captured
 * at signup. That only tags NEW families — the pre-instrumentation cohort
 * (created before 2026-06-08) stays NULL forever. This fills it on the next app
 * open so the admin tester board can segment the existing testers too.
 *
 * Idempotent: the RPC writes ONLY when platform IS NULL, so it never overwrites
 * the real signup-source value and is a no-op once set.
 */
export async function backfillFamilyPlatform(profileId: string): Promise<void> {
  const { error } = await supabase.rpc('backfill_family_platform', {
    p_profile_id: profileId,
    p_platform: Platform.OS,
  });
  if (error && __DEV__) {
    console.warn('[pushTokens] backfillFamilyPlatform failed:', error.message);
  }
}
