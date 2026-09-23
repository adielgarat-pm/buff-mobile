/**
 * Weekly free taste of the AI coach (Freemium v2, D: Adi 2026-09-23).
 *
 * The module lives with the edge function (Deno) — dependency-free so Jest can
 * load it, same pattern as parse-capture/dateAnchors. Pins:
 *   - a non-entitled family gets exactly ONE insight per child per week;
 *   - the counter from an EARLIER week never blocks this week (this is what a
 *     family finishing its 14-day trial relies on — the old lifetime counter
 *     would have left them with zero);
 *   - the week boundary is Monday 00:00 UTC, matching the DB upsert.
 */
import {
  FREE_INSIGHTS_PER_WEEK,
  hasFreeWeeklyTaste,
  mondayUtc,
  weeklyCountThisWeek,
} from '../../../supabase/functions/generate-child-insights/tasteGate';

// Wednesday 2026-09-23 12:00 UTC → week of Monday 2026-09-21.
const NOW = new Date('2026-09-23T12:00:00Z');

describe('insight taste gate — weekly', () => {
  test('one free insight per week', () => {
    expect(FREE_INSIGHTS_PER_WEEK).toBe(1);
  });

  test('Monday boundary is UTC and matches date_trunc(week)', () => {
    expect(mondayUtc(NOW).toISOString()).toBe('2026-09-21T00:00:00.000Z');
    expect(mondayUtc(new Date('2026-09-21T00:00:00Z')).toISOString()).toBe('2026-09-21T00:00:00.000Z');
    expect(mondayUtc(new Date('2026-09-20T23:59:59Z')).toISOString()).toBe('2026-09-14T00:00:00.000Z'); // Sunday
  });

  test('no row / no week yet → taste available', () => {
    expect(hasFreeWeeklyTaste(null, NOW)).toBe(true);
    expect(hasFreeWeeklyTaste({ smart_insight_weekly_count: null, smart_insight_week_start: null }, NOW)).toBe(true);
  });

  test('already generated this week → no taste (any source: trial or taste)', () => {
    const row = { smart_insight_weekly_count: 1, smart_insight_week_start: '2026-09-21' };
    expect(weeklyCountThisWeek(row, NOW)).toBe(1);
    expect(hasFreeWeeklyTaste(row, NOW)).toBe(false);
  });

  test('3 generations during the trial last week do not block this week', () => {
    const row = { smart_insight_weekly_count: 3, smart_insight_week_start: '2026-09-14' };
    expect(weeklyCountThisWeek(row, NOW)).toBe(0);
    expect(hasFreeWeeklyTaste(row, NOW)).toBe(true);
  });

  test('a garbage week_start fails open to 0 only for the counter, never throws', () => {
    expect(weeklyCountThisWeek({ smart_insight_weekly_count: 5, smart_insight_week_start: 'nope' }, NOW)).toBe(0);
  });
});
