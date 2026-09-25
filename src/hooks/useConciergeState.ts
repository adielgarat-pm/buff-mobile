/**
 * useConciergeState — the shared inputs for every dashboard concierge surface
 * (the standalone card and the line inside ResumeHandoffBanner), so both obey
 * the same rules: hidden after the family's first win, hidden for good after
 * "No thanks" (pkg/concierge-call, red-team review 2026-09-25).
 *
 * `refreshKey` should change whenever the dashboard refetches (e.g. the
 * children array identity), so a first win on the child's device hides the
 * offer without an app restart.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { COUNTED_SOURCES_FILTER } from '../lib/firstWinTelemetry';
import { dismissConcierge, isConciergeDismissed } from '../lib/concierge';

export interface ConciergeState {
  /** true once any child has a counted completion; null while unknown. */
  hasFirstWin: boolean | null;
  /** "No thanks" was chosen on this device. true until storage answers. */
  dismissed: boolean;
  dismiss: () => void;
}

export function useConciergeState(familyId: string | null | undefined, refreshKey?: unknown): ConciergeState {
  const [hasFirstWin, setHasFirstWin] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(true);

  // Reset when the family changes, so one family's answers never leak to another.
  useEffect(() => {
    setHasFirstWin(null);
    setDismissed(true);
  }, [familyId]);

  useEffect(() => {
    let alive = true;
    if (!familyId) return;
    void isConciergeDismissed(familyId).then((d) => { if (alive) setDismissed(d); });
    return () => { alive = false; };
  }, [familyId]);

  useEffect(() => {
    let alive = true;
    if (!familyId) return;
    void (async () => {
      try {
        const { count, error } = await supabase
          .from('daily_progress')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .eq('completed', true)
          .is('revoked_at', null)
          .or(COUNTED_SOURCES_FILTER);
        // Unknown (error) keeps the previous answer; null hides the offer.
        if (alive && !error && count != null) setHasFirstWin(count > 0);
      } catch { /* keep previous */ }
    })();
    return () => { alive = false; };
  }, [familyId, refreshKey]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void dismissConcierge(familyId);
  }, [familyId]);

  return { hasFirstWin, dismissed, dismiss };
}
