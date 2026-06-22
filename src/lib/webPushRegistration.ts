/**
 * webPushRegistration — Web Push subscription via the browser's PushManager API.
 *
 * No Firebase SDK needed. Web Push is a W3C standard supported by Chrome/Edge/Firefox
 * and Safari 16.4+ (PWA installed via "Add to Home Screen" over HTTPS only).
 *
 * Flow:
 *   1. Request Notification permission.
 *   2. Subscribe via SW pushManager with the VAPID public key.
 *   3. Upsert the subscription (endpoint + p256dh + auth) to push_subscriptions.
 *
 * The VAPID public key lives in app.json extra.vapidPublicKey, exposed at runtime
 * via expo-constants. The private key is a Supabase secret (VAPID_PRIVATE_KEY)
 * read only by the push-notification-fanout Edge Function.
 *
 * Limitation: iOS requires the PWA to be installed from Safari (Add to Home Screen)
 * and served over HTTPS. Push will silently return 'unsupported' on non-installed
 * iOS Safari and on localhost.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../integrations/supabase/client';

export interface WebRegistrationResult {
  status: 'registered' | 'unsupported' | 'permission_denied' | 'error' | 'not_implemented';
  endpoint?: string;
  error?: string;
}

/** Convert a base64url string to a Uint8Array (needed by pushManager.subscribe). */
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Register a Web Push subscription for this profile and persist it to
 * push_subscriptions. Idempotent — calling again on an already-subscribed
 * browser upserts the same endpoint with a refreshed updated_at.
 */
export async function registerWebPush(
  profileId: string,
  familyId?: string,
): Promise<WebRegistrationResult> {
  if (Platform.OS !== 'web') {
    return { status: 'unsupported' };
  }

  // Service workers and Push API are not available on localhost non-HTTPS
  // or on non-installed iOS Safari.
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return { status: 'unsupported' };
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { status: 'permission_denied' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;

    const vapidPublicKey =
      Constants.expoConfig?.extra?.vapidPublicKey as string | undefined;
    if (!vapidPublicKey) {
      console.error('[webPush] vapidPublicKey missing from app.json extra');
      return { status: 'error', error: 'vapid_key_missing' };
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64urlToUint8Array(vapidPublicKey),
    });

    const json = subscription.toJSON();
    const endpoint = json.endpoint ?? '';
    const p256dh = json.keys?.p256dh ?? '';
    const authKey = json.keys?.auth ?? '';

    if (!endpoint || !p256dh || !authKey) {
      return { status: 'error', error: 'invalid_subscription_keys' };
    }

    // Resolve family_id: use the provided value or look it up from the profile.
    let resolvedFamilyId = familyId;
    if (!resolvedFamilyId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', profileId)
        .maybeSingle();
      resolvedFamilyId = prof?.family_id ?? undefined;
    }
    if (!resolvedFamilyId) {
      return { status: 'error', error: 'family_id_missing' };
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        profile_id: profileId,
        family_id: resolvedFamilyId,
        endpoint,
        p256dh,
        auth_key: authKey,
      },
      { onConflict: 'profile_id,endpoint' },
    );

    if (error) {
      console.error('[webPush] upsert failed:', error.message);
      return { status: 'error', error: error.message };
    }

    return { status: 'registered', endpoint };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[webPush] registration failed:', message);
    return { status: 'error', error: message };
  }
}

/**
 * Remove the push subscription for this browser from push_subscriptions and
 * unsubscribe from the PushManager. Call on sign-out or notification opt-out.
 */
export async function unregisterWebPush(profileId: string): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('profile_id', profileId)
        .eq('endpoint', endpoint);
      await sub.unsubscribe();
    }
  } catch (err) {
    if (__DEV__) console.warn('[webPush] unregister failed:', err);
  }
}
