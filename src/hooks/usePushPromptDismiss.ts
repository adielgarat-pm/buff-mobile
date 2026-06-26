/**
 * usePushPromptDismiss — persistent "don't nag me about notifications" flag.
 *
 * The push pre-prompt (PushPermissionPrePrompt) only shows while OS permission
 * is 'unknown'. Before this hook the "already asked this session" guard was an
 * in-memory useRef. That guard never survived a web page reload, so on web the
 * pre-prompt re-popped after every refresh — and could loop within a single
 * session when register() failed and left permission 'unknown' (web
 * registerWebPush() returning 'error' never flips permission off 'unknown').
 *
 * This persists the dismissal across reloads on BOTH platforms (AsyncStorage
 * resolves to localStorage on web, native storage on Android) and re-asks only
 * after REASK_INTERVAL_MS.
 *
 * Storage: AsyncStorage, key `pushPrePrompt.dismissedAt.{profileId}` → epoch ms.
 * Per-profile so a parent and a kid sharing a device decide independently.
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// After a "maybe later" (or a failed accept) wait a week before re-asking.
const REASK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export function usePushPromptDismiss(profileId: string | null) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading]         = useState(true);

  const storageKey = profileId ? `pushPrePrompt.dismissedAt.${profileId}` : null;

  useEffect(() => {
    if (!storageKey) {
      setIsDismissed(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then(value => {
        if (cancelled) return;
        const ts = value ? parseInt(value, 10) : NaN;
        const suppressed = Number.isFinite(ts) && Date.now() - ts < REASK_INTERVAL_MS;
        setIsDismissed(suppressed);
        setLoading(false);
      })
      .catch(err => {
        console.warn('[usePushPromptDismiss] read failed:', err);
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
      await AsyncStorage.setItem(storageKey, String(Date.now()));
    } catch (err) {
      console.warn('[usePushPromptDismiss] write failed:', err);
      // No rollback — the user dismissed, that's the truth for this session
      // even if persistence failed. Worst case they see it again next reload.
    }
  }, [storageKey]);

  return { isDismissed, markDismissed, loading };
}
