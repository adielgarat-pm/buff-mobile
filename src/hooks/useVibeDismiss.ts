/**
 * useVibeDismiss — local-device flag for "kid dismissed today's Vibe Check
 * without rating".
 *
 * Per SPEC § Decisions OQ3, dismiss-without-rating respects kid autonomy
 * (Pillar 3): the modal closes, no DB row is inserted, and the prompt
 * does NOT re-fire on the same day.
 *
 * Storage: AsyncStorage, key `vibeCheck.dismissed.{childId}.{YYYY-MM-DD}`.
 * Local-device on purpose: a kid switching devices mid-day SHOULD see the
 * prompt again on the new device — it's a per-session check-in, not a
 * global decision. (Mirrors useWelcomeBack's per-device flag pattern.)
 *
 * No cleanup of old keys is needed at MVP scale — keys are tiny strings
 * and only one per child per day. Cleanup is a Phase 5+ polish if storage
 * pressure ever shows up.
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayKey } from '../utils/vibeUtils';

export function useVibeDismiss(childId: string | null) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading]         = useState(true);

  const todayKey   = getTodayKey();
  const storageKey = childId ? `vibeCheck.dismissed.${childId}.${todayKey}` : null;

  useEffect(() => {
    if (!storageKey) {
      setIsDismissed(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then(value => {
        if (!cancelled) {
          setIsDismissed(value === '1');
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn('[useVibeDismiss] read failed:', err);
        if (!cancelled) {
          setIsDismissed(false);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [storageKey]);

  const markDismissed = useCallback(async () => {
    if (!storageKey) return;
    setIsDismissed(true);  // optimistic — local-only, no real failure mode
    try {
      await AsyncStorage.setItem(storageKey, '1');
    } catch (err) {
      console.warn('[useVibeDismiss] write failed:', err);
      // No rollback — kid clicked dismiss, that's the truth for this session
      // even if persistence failed. Worst case they see the prompt again
      // tomorrow which is the same as not having dismissed at all.
    }
  }, [storageKey]);

  return { isDismissed, markDismissed, loading };
}
