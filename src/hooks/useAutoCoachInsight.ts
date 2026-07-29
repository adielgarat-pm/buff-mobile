import { useEffect } from 'react';

/**
 * Lazy auto-generate for the AI coach insight (pkg/dashboard-ai-insight).
 *
 * Extracted from ParentInsightsScreen's Phase E effect so the Parent Dashboard
 * and the Insights screen share ONE set of cost guards instead of two copies:
 *  - entitled (or an unspent free taste) — never trigger a 402'd call
 *  - enough real data (activeDays >= 2, matches the activation bar)
 *  - respect the server's weekly cap (generationsLeft)
 *  - a saved insight from the CURRENT week is reused, never regenerated;
 *    an insight from a previous week is refreshed once (D: Adi 2026-07-14 —
 *    an insight stays valid until the next one is computed, no hard expiry)
 *  - at most ONE attempt per child per week across all screens/mounts in this
 *    JS session (module-level guard), so a failing server isn't hammered on
 *    every dashboard visit
 */

/**
 * Free "taste" insights per child for a family with no entitlement. MUST match
 * FREE_INSIGHTS_PER_CHILD in supabase/functions/generate-child-insights — the
 * server is the authority; a mismatch here only costs a wasted 402.
 */
export const FREE_INSIGHTS_PER_CHILD = 1;

/** Monday (local) of the current week as YYYY-MM-DD — mirrors the server's week window. */
function currentWeekMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().split('T')[0];
}

// childId|mondayISO keys that already attempted an auto-generate this session.
const attemptedThisWeek = new Set<string>();

export interface AutoCoachInsightOpts {
  childId:            string | null;
  smartInsight:       unknown | null;
  /** ISO timestamp of the saved insight (null = none / unknown). */
  computedAt:         string | null;
  loadingState:       boolean;
  generating:         boolean;
  generationsLeft:    number;
  hasRealEntitlement: boolean;
  activeDays:         number;
  /**
   * Lifetime insights already generated for this child (migration 048).
   * Below FREE_INSIGHTS_PER_CHILD the entitlement gate is skipped — see the
   * taste-gate note above. Defaults to "already used" so a caller that has not
   * loaded it yet cannot accidentally spend a free generation.
   */
  totalCount?:        number;
  generate:           () => Promise<void>;
}

export function useAutoCoachInsight(opts: AutoCoachInsightOpts): void {
  const {
    childId, smartInsight, computedAt, loadingState, generating,
    generationsLeft, hasRealEntitlement, activeDays, generate,
    totalCount = FREE_INSIGHTS_PER_CHILD,
  } = opts;

  useEffect(() => {
    if (!childId || loadingState || generating) return;  // wait for the saved-insight check
    const monday = currentWeekMonday();
    // A current-week insight is fresh — reuse it. A previous-week one stays on
    // screen (with its date stamp) but is eligible for a weekly refresh.
    if (smartInsight && (!computedAt || computedAt.slice(0, 10) >= monday)) return;
    // Taste-then-gate: the first FREE_INSIGHTS_PER_CHILD are generated for every
    // family, entitled or not (red team F1 — before this, a free Android parent
    // could never see the AI at all, so we were asking people to pay for a thing
    // they had never experienced). Mirrors the server gate in
    // generate-child-insights; the server is the authority, this only avoids a
    // call we know would 402.
    const hasFreeTaste = totalCount < FREE_INSIGHTS_PER_CHILD;
    if (!hasRealEntitlement && !hasFreeTaste) return;
    if (generationsLeft <= 0) return;                    // respect the weekly cap
    if (activeDays < 2) return;                          // need real data
    const key = `${childId}|${monday}`;
    if (attemptedThisWeek.has(key)) return;              // one attempt per child per week
    attemptedThisWeek.add(key);
    void generate();
  }, [childId, smartInsight, computedAt, loadingState, generating,
      generationsLeft, hasRealEntitlement, activeDays, generate]);
}
