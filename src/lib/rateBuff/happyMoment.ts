/**
 * happyMoment — the positive-moment signal for the rate prompt (pure, unit tested).
 *
 * pkg/rate-happy-moment: the review ask should fire only when the parent is
 * looking at evidence of their kid's success, never on a neutral or bad day.
 * "Success" reuses the canonical winning-day rule (D-2026-06-14):
 * completed >= min(3, scheduled) — the same absolute-count rule every other
 * surface (BUDDY EOD, child screens, parent dashboard) already uses. No new
 * definition of a good day is introduced here.
 */
import type { ChildYesterdayRecap } from '../../utils/yesterdayRecapUtils';

/** Winning-day threshold for one child's recap (min(3, scheduled) rule). */
export function isWinningRecap(recap: Pick<ChildYesterdayRecap, 'totalScheduled' | 'totalCompleted'>): boolean {
  if (recap.totalScheduled <= 0) return false;
  return recap.totalCompleted >= Math.min(3, recap.totalScheduled);
}

/**
 * True when ANY child had a winning yesterday — the unified signal the
 * platform-split rate actions (native card / web banner) both gate on.
 */
export function hasWinningYesterday(
  recaps: Record<string, Pick<ChildYesterdayRecap, 'totalScheduled' | 'totalCompleted'>>,
): boolean {
  return Object.values(recaps).some(isWinningRecap);
}
