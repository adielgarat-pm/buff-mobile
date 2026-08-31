/**
 * useAnchorRecoveryDismiss — local-device flag for "parent already saw the
 * Anchor Recovery prompt today on this device".
 *
 * Per pkg/anchor-recovery SPEC § OQ-P2-1 (option a), the prompt fires on
 * first dashboard open of the day. If the parent dismisses or interacts
 * with it, it does NOT re-fire on the same day even if the underlying
 * notification stays unread. If the parent simply closes the app without
 * interacting, opening again later the same day also does NOT re-fire.
 *
 * Storage: AsyncStorage, key `anchorRecovery.shown.{familyId}.{YYYY-MM-DD}`.
 * Local-device on purpose (mirrors useVibeDismiss): a parent on a different
 * device should still see the prompt — the local "already shown" flag is
 * per-session/per-device, not a family-wide commitment.
 *
 * No cleanup of old keys needed at MVP scale — tiny strings, one per family
 * per day.
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDayKey } from '../lib/dayKey';

// Local calendar day (see src/lib/dayKey.ts / audit C1) — the per-day dismiss
// gate must clear at the user's local midnight.
const getTodayKey = () => localDayKey();

export function useAnchorRecoveryDismiss(familyId: string | null) {
  const [shownToday, setShownToday] = useState(false);
  const [loading, setLoading]       = useState(true);

  const todayKey   = getTodayKey();
  const storageKey = familyId ? `anchorRecovery.shown.${familyId}.${todayKey}` : null;

  useEffect(() => {
    if (!storageKey) {
      setShownToday(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then(value => {
        if (!cancelled) {
          setShownToday(value === '1');
          setLoading(false);
        }
      })
      .catch(err => {
        if (__DEV__) console.warn('[useAnchorRecoveryDismiss] read failed:', err);
        if (!cancelled) {
          setShownToday(false);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [storageKey]);

  const markShown = useCallback(async () => {
    if (!storageKey) return;
    setShownToday(true);  // optimistic — local-only, no real failure mode
    try {
      await AsyncStorage.setItem(storageKey, '1');
    } catch (err) {
      if (__DEV__) console.warn('[useAnchorRecoveryDismiss] write failed:', err);
      // No rollback — parent already saw it for this session; persisting
      // is best-effort. Worst case they see the prompt again on next mount,
      // which gracefully degrades to the OQ-P2-1 (b) behavior.
    }
  }, [storageKey]);

  return { shownToday, markShown, loading };
}
