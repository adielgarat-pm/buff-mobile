/**
 * useOtaRestartToast (native) — Layer 3 of the OTA freshness plan.
 *
 * When expo-updates has downloaded a newer JS bundle DURING this session
 * (`isUpdatePending` — a prior-session pending update auto-applies at the next
 * cold start via ON_LOAD and never reaches here), offer the user a gentle,
 * dismissible "a fresh version is ready — refresh?" toast on a safe parent
 * surface. Applying is explicit (never auto), throttled once/day, and routed
 * through the shared reloadOnce() guard.
 *
 * Returns the toast view-model for <OtaRestartToast/> to render.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUpdates } from 'expo-updates';
import { useSafeSurface } from './useSafeSurface';
import { reloadOnce } from '../lib/reloadOnce';
import { logOtaStep } from '../lib/otaTelemetry';
import {
  isToastThrottled,
  TOAST_LAST_SHOWN_KEY,
  TOAST_THROTTLE_MS,
} from '../lib/otaToastThrottle';

export interface OtaToastVM {
  visible: boolean;
  refresh: () => void;
  dismiss: () => void;
}

const PLATFORM = Platform.OS;

export function useOtaRestartToast(): OtaToastVM {
  const { isUpdatePending } = useUpdates();
  const { safe, reason } = useSafeSurface();

  const [visible, setVisible] = useState(false);
  // undefined = throttle not read yet (stay conservative and don't show).
  const [lastShownAt, setLastShownAt] = useState<number | null | undefined>(undefined);
  // Once the user acts on the current pending update, don't re-show until a new one.
  const handledRef = useRef(false);
  // Dedupe suppression breadcrumbs per reason.
  const suppressedRef = useRef<string | null>(null);

  // Read the throttle timestamp once.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(TOAST_LAST_SHOWN_KEY)
      .then((raw) => {
        if (!alive) return;
        const n = raw ? parseInt(raw, 10) : NaN;
        setLastShownAt(Number.isFinite(n) ? n : null);
      })
      .catch(() => alive && setLastShownAt(null));
    return () => {
      alive = false;
    };
  }, []);

  // A new pending update resets the per-cycle guards.
  useEffect(() => {
    if (isUpdatePending) {
      handledRef.current = false;
      suppressedRef.current = null;
      logOtaStep('toast_pending_detected', { platform: PLATFORM });
    }
  }, [isUpdatePending]);

  // Decide whether to show.
  useEffect(() => {
    if (!isUpdatePending || visible || handledRef.current || lastShownAt === undefined) return;

    const now = Date.now();
    if (isToastThrottled(lastShownAt, now)) {
      if (suppressedRef.current !== 'throttled') {
        suppressedRef.current = 'throttled';
        logOtaStep('toast_suppressed', { platform: PLATFORM, status: 'throttled' });
      }
      return;
    }
    if (!safe) {
      if (suppressedRef.current !== reason) {
        suppressedRef.current = reason ?? 'unsafe';
        logOtaStep('toast_suppressed', { platform: PLATFORM, status: reason, surface: reason });
      }
      return;
    }

    // Show, and stamp the throttle at show time.
    setVisible(true);
    setLastShownAt(now);
    AsyncStorage.setItem(TOAST_LAST_SHOWN_KEY, String(now)).catch(() => undefined);
    logOtaStep('toast_shown', { platform: PLATFORM });
  }, [isUpdatePending, visible, safe, reason, lastShownAt]);

  const refresh = useCallback(() => {
    handledRef.current = true;
    setVisible(false);
    logOtaStep('toast_reload_tapped', { platform: PLATFORM });
    void reloadOnce('layer3_toast').then((ok) => {
      if (!ok) logOtaStep('toast_reload_error', { platform: PLATFORM, status: 'error' });
    });
  }, []);

  const dismiss = useCallback(() => {
    handledRef.current = true;
    setVisible(false);
    logOtaStep('toast_dismissed', { platform: PLATFORM });
  }, []);

  return { visible, refresh, dismiss };
}

// Re-exported so callers importing the throttle constant from the hook barrel
// keep working if the pure module moves.
export { TOAST_THROTTLE_MS };
