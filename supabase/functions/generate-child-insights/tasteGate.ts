// Weekly free "taste" of the AI coach for families with NO entitlement.
//
// Freemium v2 (D: Adi 2026-09-23, docs/sessions/freemium-v2/SPEC.md): after the
// 14-day reverse trial a free family keeps ONE AI insight per child per WEEK.
// Before v2 the taste was ONE per child EVER (smart_insight_total_count,
// migration 048) — and because the trial itself spends the lifetime counter, a
// post-trial family would have got zero. The weekly counter already exists
// (smart_insight_weekly_count / smart_insight_week_start, reset per Monday by
// upsert_smart_insight), so no schema change is needed.
//
// Cost bound: at most FREE_INSIGHTS_PER_WEEK LLM calls per child per week for a
// non-paying family (entitled calls in the same week count too). Raising it is a
// pricing decision, not a tuning knob.
//
// Dependency-free so the app's Jest suite can load it (same pattern as
// parse-capture/dateAnchors.ts).

export const FREE_INSIGHTS_PER_WEEK = 1;

export interface WeeklyCounterRow {
  smart_insight_weekly_count: number | null;
  smart_insight_week_start:   string | null;   // 'YYYY-MM-DD' (Monday, UTC date)
}

/** Monday 00:00 UTC of the week containing `now` — mirrors the DB's
 *  date_trunc('week', CURRENT_DATE) used by upsert_smart_insight. */
export function mondayUtc(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

/** Generations already made for this child in the CURRENT week (0 when the
 *  stored counter belongs to an earlier week, or there is no row yet). */
export function weeklyCountThisWeek(row: WeeklyCounterRow | null | undefined, now: Date): number {
  if (!row || !row.smart_insight_week_start) return 0;
  const rowWeek = new Date(`${row.smart_insight_week_start.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(rowWeek.getTime())) return 0;
  if (rowWeek.getTime() < mondayUtc(now).getTime()) return 0;
  return row.smart_insight_weekly_count ?? 0;
}

/** True when a non-entitled family may still generate this week's free insight. */
export function hasFreeWeeklyTaste(row: WeeklyCounterRow | null | undefined, now: Date): boolean {
  return weeklyCountThisWeek(row, now) < FREE_INSIGHTS_PER_WEEK;
}
