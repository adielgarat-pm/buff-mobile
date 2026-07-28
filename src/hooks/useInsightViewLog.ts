import { useEffect } from 'react';

import { logOnboardingEvent } from '../lib/onboardingFunnel';

/**
 * useInsightViewLog — records that the AI coach insight card was actually SEEN.
 *
 * Why this exists (red team 2026-07-28, finding F4): almost every insight metric
 * is derivable after the fact from table state — `child_insights.computed_at`
 * joined against `tasks` / `rewards` / `daily_progress` gives attribution and
 * activity lift retroactively, with no client instrumentation at all (see
 * `scripts/insight-usage.sql`). Two things are NOT derivable, because they leave
 * no trace anywhere: a card being rendered, and a CTA being tapped. This hook
 * covers the first; the CTA tap is logged inline at each button.
 *
 * Without it, "Delivery Rate" (insight generated) and "View Rate" (parent saw it)
 * are the same number, and a card that generates but never renders — which is
 * exactly the free-tier bug shape — is invisible.
 *
 * Contract:
 *   - Fires at most once per (child, placement) per JS session, so a parent
 *     re-focusing the dashboard tab does not inflate the count. Same
 *     module-level guard pattern as `useAutoCoachInsight`.
 *   - Fire-and-forget; `logOnboardingEvent` never throws.
 *
 * The dedup key deliberately EXCLUDES the insight version. `useSmartInsights`
 * updates `smartInsight` and `computedAt` as two separate setState calls, so a
 * render can briefly show a set insight with a null date — keying on the version
 * logged that render as a second, distinct view. Observed in prod 2026-07-28:
 * two rows 66ms apart for the same child, variants '2026-07-17' and 'unknown'.
 * The version is still sent as the payload (first value seen wins); it just
 * cannot create a duplicate. Undercounting a mid-session insight swap is the
 * safer error — insights change weekly, sessions do not.
 */

/** `childId|placement` keys already logged in this JS session. */
const loggedThisSession = new Set<string>();

/** Where the insight card was rendered. */
export type InsightPlacement = 'dashboard' | 'insights_screen';

export interface InsightViewLogOpts {
  familyId:   string | null | undefined;
  childId:    string | null;
  /** ISO timestamp of the insight on screen — identifies WHICH insight was seen. */
  computedAt: string | null;
  /** True only while the card is genuinely rendered (not merely loaded). */
  visible:    boolean;
  placement:  InsightPlacement;
}

export function useInsightViewLog(opts: InsightViewLogOpts): void {
  const { familyId, childId, computedAt, visible, placement } = opts;

  useEffect(() => {
    if (!visible || !familyId || !childId) return;
    // An insight with no computed_at is still a real view — bucket it rather
    // than dropping it, or pre-042 insights would silently never count.
    const version = computedAt ? computedAt.slice(0, 10) : 'unknown';
    const key = `${childId}|${placement}`;
    if (loggedThisSession.has(key)) return;
    loggedThisSession.add(key);
    void logOnboardingEvent({
      familyId,
      childId,
      eventType: 'insight_viewed',
      source:    placement,
      variant:   version,
    });
  }, [familyId, childId, computedAt, visible, placement]);
}
