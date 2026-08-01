/**
 * useFirstLaunchFreshness (native) — Layer 1 of the OTA freshness plan.
 *
 * On the VERY FIRST launch after install (and only then), briefly hold the
 * splash while expo-updates' native ON_LOAD downloader fetches any newer OTA,
 * and apply it before first paint — so a brand-new user's session 1 runs current
 * JS, not the (possibly weeks-old) bundle embedded in the store binary.
 *
 * Design invariants (from the reviewed SPEC — App.tsx has NO error boundary, so
 * every branch here must provably release the gate):
 *  - POLL `isUpdatePending` (do NOT call checkForUpdateAsync/fetchUpdateAsync —
 *    that races the native ON_LOAD downloader). We reload only once it's pending.
 *  - HARD wall-clock timeout (Promise-independent setTimeout) releases the gate
 *    regardless of network — captive-portal / hung-TCP safe.
 *  - fail-open on EVERY branch: dev, !isEnabled, flag set, flag-read throw,
 *    timeout, any error → release and continue on the embedded bundle.
 *  - persist the once-per-install flag BEFORE reloadAsync (crash-loop guard); a
 *    failed flag write → fail-open, do NOT reload.
 *  - late fetch (arriving after the timeout) must NOT reload (single-shot).
 *
 * Only benefits a binary that EMBEDS this code → rides vc69+. No-op on web/dev.
 */
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useUpdates } from 'expo-updates';
import { reloadOnce } from '../lib/reloadOnce';
import { logOtaStep } from '../lib/otaTelemetry';
import { decideFirstLaunch, shouldReloadOnPending } from '../lib/firstLaunchDecision';

export const FLAG_KEY = 'buff.firstLaunchFreshnessDone';
export const FRESHNESS_BUDGET_MS = 2500;

type Phase = 'checking' | 'gate' | 'done';

export function useFirstLaunchFreshness(): { pending: boolean } {
  const { isUpdatePending } = useUpdates();
  const [phase, setPhase] = useState<Phase>('checking');

  const timedOutRef = useRef(false);
  const actedRef = useRef(false);
  const startedAtRef = useRef(0);
  const platform = Platform.OS;

  // Mount: hard wall-clock backstop + one flag read.
  useEffect(() => {
    let alive = true;
    startedAtRef.current = Date.now();

    const release = (p: Phase = 'done') => {
      if (alive) setPhase(p);
    };

    // Backstop: releases the gate on the timer edge, independent of any network
    // or storage promise resolving.
    const timer = setTimeout(() => {
      if (!alive || actedRef.current) return;
      timedOutRef.current = true;
      logOtaStep('fl_timeout', { platform, ms: Date.now() - startedAtRef.current });
      // Mark this install's attempt done so later launches don't re-gate.
      AsyncStorage.setItem(FLAG_KEY, '1').catch(() => undefined);
      release('done');
    }, FRESHNESS_BUDGET_MS);

    (async () => {
      let flag: string | null = null;
      let readOk = true;
      try {
        flag = await AsyncStorage.getItem(FLAG_KEY);
      } catch {
        readOk = false; // treat a read failure as "already done" — fail-open
      }
      if (!alive) return;

      const decision = decideFirstLaunch({
        flag: readOk ? flag : '1',
        enabled: Updates.isEnabled,
        isDev: __DEV__,
      });

      if (decision === 'skip') {
        if (!Updates.isEnabled || __DEV__) logOtaStep('fl_disabled', { platform });
        release('done');
        return;
      }
      // Genuine first launch — keep gating; the isUpdatePending effect or the
      // timer resolves it. Flag is written only right before a reload (or on
      // timeout), so a run killed before then retries harmlessly next launch.
      logOtaStep('fl_poll_started', { platform });
      release('gate');
    })();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [platform]);

  // React to the native ON_LOAD download completing this session.
  useEffect(() => {
    if (
      !shouldReloadOnPending({
        gated: phase === 'gate',
        isUpdatePending,
        timedOut: timedOutRef.current,
        acted: actedRef.current,
      })
    ) {
      return;
    }
    actedRef.current = true;

    (async () => {
      logOtaStep('fl_became_pending', { platform, ms: Date.now() - startedAtRef.current });
      try {
        // Flag BEFORE reload — the fresh bundle must see "done" so it skips the
        // gate instead of re-entering it (crash-loop guard).
        await AsyncStorage.setItem(FLAG_KEY, '1');
      } catch (err) {
        logOtaStep('fl_error', {
          platform,
          status: 'flag_write',
          reason: err instanceof Error ? err.message : String(err),
        });
        setPhase('done'); // fail-open, do NOT reload without a durable marker
        return;
      }
      const ok = await reloadOnce('layer1_first_launch');
      if (ok) {
        logOtaStep('fl_reloaded', { platform, ms: Date.now() - startedAtRef.current });
        // reloadAsync tears down the context; the splash holds until then.
      } else {
        setPhase('done'); // reload unavailable/in-flight — release
      }
    })();
  }, [phase, isUpdatePending, platform]);

  return { pending: phase !== 'done' };
}
