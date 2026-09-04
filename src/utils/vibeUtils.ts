/**
 * vibeUtils — pure functions for Daily Vibe Check state derivation.
 *
 * Extracted from useDailyVibe so the logic is testable without
 * mocking supabase / react / the hook itself.
 *
 * See docs/sessions/daily-vibe-check/SPEC.md § Schema Verified for
 * the authoritative child_vibes column contract.
 */

import { localDayKey } from '../lib/dayKey';

export type VibeLevel = 1 | 2 | 3 | 4 | 5;
// 'bars' retained for the historical Gamer selector; 'battery' is the
// current Gamer selector (pkg/vibe-check-battery). vibe_type is free text
// at the DB (no CHECK constraint), so old rows keep their value.
export type VibeType  = 'emoji' | 'bars' | 'battery';

/** Shape of a single row in public.child_vibes, scoped to the fields the hook uses. */
export interface VibeSnapshot {
  vibe_level:      number;   // CHECK 1-5 at the DB
  low_power_mode:  boolean;
  parent_sos_sent: boolean;
  // pkg/vibe-share-notification — kid-initiated "share my (non-low) mood with
  // my parent" flag. Default false; flipping false→true fires migration 025's
  // trigger → one child_vibe_shared notification per parent.
  vibe_shared_with_parent: boolean;
  // One-shot flag: the +5 self-care Instant Buff was already granted today
  // (migration 057). Server-authoritative; the card reads it to stay hidden
  // after a reload instead of re-appearing to be farmed (audit M6).
  instant_buff_awarded: boolean;
  vibe_type:       string;   // 'emoji' | 'bars' | 'battery' in practice
  date:            string;   // 'YYYY-MM-DD'
}

/**
 * Today's date key as 'YYYY-MM-DD', in the child's LOCAL time.
 *
 * The vibe check (and every per-day loop it shares a boundary with:
 * daily_progress, streak) must roll at the child's local midnight. The old
 * implementation used UTC, which for negative-offset users rolled the day
 * mid-afternoon and re-prompted the vibe check twice a day (audit H5). Now
 * delegates to the shared local helper so it agrees with useChildProgress /
 * useChildrenDashboard. See src/lib/dayKey.ts.
 *
 * `now` parameter overridable for tests.
 */
export function getTodayKey(now: Date = new Date()): string {
  return localDayKey(now);
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
 * Whether a vibe level is eligible to be shared with a parent
 * (pkg/vibe-share-notification, D5). Only non-low moods (level ≥ 3) — low
 * moods belong to the SOS path, not the positive "share how I feel" path.
 */
export function isVibeShareable(level: VibeLevel): boolean {
  return level >= 3;
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
