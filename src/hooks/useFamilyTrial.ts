/**
 * useFamilyTrial — which BUFF Coach trial note (if any) this parent should see.
 *
 * Reads families.trial_started_at (member-readable; written only by the
 * start_trial_on_activation trigger), derives the phase with coachTrialPhase,
 * and remembers per family + phase that the note was dismissed. AsyncStorage
 * is localStorage on web, native storage on Android — same behaviour on both.
 * A storage failure just shows the note again; it never blocks anything.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { coachTrialPhase, coachTrialSeenKey, type CoachTrialPhase } from '../lib/coachTrial';

export function useFamilyTrial(): { phase: CoachTrialPhase; dismiss: () => void } {
  const { familyId, profile } = useAuth();
  const { isTrialActive, trialDaysLeft, hasRealEntitlement } = useSubscription();
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [seen, setSeen] = useState<boolean | null>(null); // null = not loaded yet

  const isChild = profile?.role === 'child';

  useEffect(() => {
    if (!familyId || isChild) { setTrialStartedAt(null); return; }
    let cancelled = false;
    supabase
      .from('families')
      .select('trial_started_at')
      .eq('id', familyId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn('[useFamilyTrial] read failed (non-fatal):', error.message);
        setTrialStartedAt((data as { trial_started_at?: string | null } | null)?.trial_started_at ?? null);
      });
    return () => { cancelled = true; };
    // premium_until changes (trial just granted) re-read the clock.
  }, [familyId, isChild, isTrialActive]);

  const rawPhase: CoachTrialPhase = isChild ? 'none' : coachTrialPhase({
    trialStartedAt, isTrialActive, trialDaysLeft, hasRealEntitlement, now: new Date(),
  });

  const key = familyId && rawPhase !== 'none' ? coachTrialSeenKey(familyId, rawPhase) : null;

  useEffect(() => {
    if (!key) { setSeen(null); return; }
    let cancelled = false;
    setSeen(null);
    AsyncStorage.getItem(key)
      .then(v => { if (!cancelled) setSeen(v === '1'); })
      .catch(() => { if (!cancelled) setSeen(false); });
    return () => { cancelled = true; };
  }, [key]);

  const dismiss = useCallback(() => {
    setSeen(true);
    if (key) AsyncStorage.setItem(key, '1').catch(() => { /* shows again next time — harmless */ });
  }, [key]);

  return { phase: seen === false ? rawPhase : 'none', dismiss };
}
