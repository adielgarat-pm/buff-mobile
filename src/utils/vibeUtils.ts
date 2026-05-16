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
