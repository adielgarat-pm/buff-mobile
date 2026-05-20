/**
 * vibeUtils — pure functions for Daily Vibe Check state derivation.
 *
 * Extracted from useDailyVibe so the logic is testable without
 * mocking supabase / react / the hook itself.
 *
 * See docs/sessions/daily-vibe-check/SPEC.md § Schema Verified for
 * the authoritative child_vibes column contract.
 */

export type VibeLevel = 1 | 2 | 3 | 4 | 5;
export type VibeType  = 'emoji' | 'bars';

/** Shape of a single row in public.child_vibes, scoped to the fields the hook uses. */
export interface VibeSnapshot {
  vibe_level:      number;   // CHECK 1-5 at the DB
  low_power_mode:  boolean;
  parent_sos_sent: boolean;
  vibe_type:       string;   // 'emoji' | 'bars' in practice
  date:            string;   // 'YYYY-MM-DD'
}

/**
 * Today's date key as 'YYYY-MM-DD'.
 *
 * Uses UTC to match the existing `daily_progress.date` convention
 * (see useChildProgress.ts). For Israel (UTC+2/+3) the day rolls at
 * 02:00/03:00 local — acceptable for the MVP cohort. Logged as a
 * follow-up in INTEGRATION_LEARNINGS for the international-users
 * timeline.
 *
 * `now` parameter overridable for tests.
 */
export function getTodayKey(now: Date = new Date()): string {
  return now.toISOString().split('T')[0];
}

/**
 * Whether Low Power Mode should be active for the given vibe snapshot.
 *
 * Prefers the persisted `low_power_mode` column written at INSERT time
 * (see computeLowPowerForLevel). Falls back to recomputing from
 * `vibe_level <= 2` to handle the 4 legacy rows from Lovable that
 * predate the column being written.
 */
export function isLowPowerActive(snap: VibeSnapshot | null | undefined): boolean {
  if (!snap) return false;
  if (snap.low_power_mode) return true;
  return snap.vibe_level <= 2;
}

/**
 * Compute the value to persist in `low_power_mode` when inserting a
 * new vibe row. Locked at insert so the parent dashboard can query
 * `WHERE parent_sos_sent = true` or `WHERE low_power_mode = true`
 * without re-deriving from level.
 */
export function computeLowPowerForLevel(level: VibeLevel): boolean {
  return level <= 2;
}

/**
 * Minimal task shape required by trimTasksForLowPower — kept loose so
 * different Task types in the codebase (with extra fields) can pass.
 */
export interface TrimmableTask {
  id:         string;
  completed:  boolean;
  category?:  string;
}

/**
 * Trim a task list for Low Power Mode rendering.
 *
 * Rule (per SPEC § Scenario E "highest-priority pain-target + 1 self-care"):
 *   - If everything is already done, show the list as-is (kid's done!).
 *   - Otherwise: first incomplete task (tasks are already time-sorted by
 *     useChildData) + first incomplete self-care task (if different).
 *
 * Returns at most 2 tasks. Caller should only invoke this when low-power.
 *
 * No "priority" field exists on Task today, so "first incomplete" is the
 * MVP heuristic. If/when a priority field arrives, swap the first picker.
 */
export function trimTasksForLowPower<T extends TrimmableTask>(tasks: T[]): T[] {
  if (tasks.length === 0) return [];
  const incomplete = tasks.filter(t => !t.completed);
  if (incomplete.length === 0) return tasks;

  const first         = incomplete[0];
  const firstSelfCare = incomplete.find(t => t.category === 'self-care' && t.id !== first.id);

  return firstSelfCare ? [first, firstSelfCare] : [first];
}
