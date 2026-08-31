/**
 * dayKey — the single source of truth for "which calendar day is it for this
 * user right now", as a 'YYYY-MM-DD' string.
 *
 * IMPORTANT — this is LOCAL time, on purpose.
 *
 * The daily loop (task completion, streak, vibe check, per-day dismisses) must
 * roll over at the *child's* local midnight. The old implementation keyed the
 * day off `new Date().toISOString()` — i.e. UTC — which rolls at UTC midnight.
 * For any negative-UTC-offset user (all of the Americas — the English-first
 * launch market) UTC midnight lands in the local afternoon/evening (≈5pm US
 * Pacific, ≈8pm US Eastern). That flipped the day key mid-afternoon, so tasks
 * completed in the morning "disappeared" and the streak/goal reset during
 * prime after-school usage. See docs/PRE_LAUNCH_BUG_AUDIT_2026-08-30.md (C1/H5)
 * and docs/INTEGRATION_LEARNINGS.md.
 *
 * Read and write of the same per-day state MUST both go through this helper so
 * they always agree on the boundary. It mirrors `toDateKey` in
 * src/lib/taskScheduling.ts (task visibility already used local weekday/date),
 * so the daily-state key and the task-visibility key finally line up.
 *
 * Transition note: historical `daily_progress` / `child_vibes` rows written
 * before this change are keyed by the old UTC day. This is not migrated — those
 * are ephemeral per-day rows, and going forward every read and write is local,
 * so the two stay internally consistent. The only visible artifact is for a
 * user who updates the app mid-day: a completion banked earlier that day under
 * the old UTC key may read as incomplete once, for that one transition day.
 */

/** Today's (or `now`'s) local calendar day as 'YYYY-MM-DD'. */
export function localDayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
