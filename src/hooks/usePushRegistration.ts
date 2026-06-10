/**
 * usePushRegistration — manages push token + last_seen_at lifecycle.
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md § Phase 2.
 *
 * Responsibilities:
 *   1. On profile load + permission granted → register/refresh device_token
 *   2. On every app foreground → bump profiles.last_seen_at (drives engagement
 *      scheduler E5/E6 + Edge Function activity-based suppression per
 *      IN-2026-05-19-02)
 *   3. Detect permission state — caller (pre-prompt screen) reads `permission`
 *      to decide whether to render the pre-prompt or skip
 *
 * This hook does NOT trigger the OS permission dialog itself — that happens
 * via the pre-prompt screen (UStepPushPermissionPrePrompt for parent;
 * ChildJoinPushPrePrompt for kid in Phase 6). Per OQ-A4 the pre-prompt
 * explains value before the system dialog appears.
 *
 * Returns:
 *   permission:    'unknown' | 'granted' | 'denied' | 'unsupported'
 *   tokenStatus:   'idle' | 'registering' | 'registered' | 'error'
 *   register():    async — call after pre-prompt user accepts; triggers
 *                  OS dialog (if not already granted) + registers token
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../contexts/AuthContext';
import {
  backfillFamilyPlatform,
  bumpLastSeenAt,
  getPushToken,
  getTokenType,
  requestNotificationPermission,
  upsertDeviceToken,
} from '../lib/pushTokens';

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';
export type TokenStatus = 'idle' | 'registering' | 'registered' | 'error';

interface UsePushRegistrationResult {
  permission: PermissionState;
  tokenStatus: TokenStatus;
  /** Trigger OS permission dialog + register token. Returns true on success. */
  register: () => Promise<boolean>;
}

export function usePushRegistration(): UsePushRegistrationResult {
  const { profile } = useAuth();
  const profileId = profile?.id ?? null;

  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('idle');

  // Guard against re-entering register() while one is in flight.
  const registering = useRef(false);

  /** Probe current permission without triggering the dialog. */
  const refreshPermission = useCallback(async () => {
    const tokenType = getTokenType();
    if (!tokenType) {
      setPermission('unsupported');
      return;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') setPermission('granted');
      else if (status === 'denied') setPermission('denied');
      else setPermission('unknown');
    } catch {
      setPermission('unknown');
    }
  }, []);

  /** Register: prompt (if needed) → token → upsert. */
  const register = useCallback(async (): Promise<boolean> => {
    if (registering.current) return false;
    if (!profileId) return false;
    const tokenType = getTokenType();
    if (!tokenType) {
      setPermission('unsupported');
      return false;
    }

    registering.current = true;
    setTokenStatus('registering');
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermission('denied');
        setTokenStatus('idle');
        return false;
      }
      setPermission('granted');

      const token = await getPushToken();
      if (!token) {
        setTokenStatus('error');
        return false;
      }

      const ok = await upsertDeviceToken(profileId, token, tokenType);
      setTokenStatus(ok ? 'registered' : 'error');
      return ok;
    } finally {
      registering.current = false;
    }
  }, [profileId]);

  /** On profile load: check permission. If already granted → silently refresh token. */
  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    (async () => {
      await refreshPermission();
      // If already granted, refresh token + last_seen on every mount.
      const { status } = await Notifications.getPermissionsAsync();
      if (cancelled) return;
      if (status === 'granted') {
        const tokenType = getTokenType();
        if (tokenType) {
          const token = await getPushToken();
          if (token && !cancelled) {
            await upsertDeviceToken(profileId, token, tokenType);
            setTokenStatus('registered');
          }
        }
      }
      // Bump last_seen_at regardless of permission state.
      await bumpLastSeenAt(profileId);
      // Backfill families.platform for the pre-instrumentation cohort (no-op
      // once set). Once per profile load is enough — platform doesn't change.
      await backfillFamilyPlatform(profileId);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, refreshPermission]);

  /** On every app foreground: bump last_seen_at + refresh token if granted. */
  useEffect(() => {
    if (!profileId) return;
    const onChange = async (next: AppStateStatus) => {
      if (next !== 'active') return;
      await bumpLastSeenAt(profileId);
      // If permission granted, also refresh token (FCM rotates rarely but it happens).
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        const tokenType = getTokenType();
        if (tokenType) {
          const token = await getPushToken();
          if (token) {
            await upsertDeviceToken(profileId, token, tokenType);
          }
        }
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [profileId]);

  return { permission, tokenStatus, register };
}
