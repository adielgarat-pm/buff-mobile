/**
 * Buddy V0.5 backend types.
 *
 * Source of truth: Supabase tables created in pkg/buddy-v05-backend
 * (phase-1-migration.sql). Schema lives at:
 *   docs/sessions/buddy-v05-backend/phase-1-migration.sql
 *
 * Mirrors the relevant subset of generated Supabase types (kept narrow
 * and hand-written to avoid wiring the full generated Database type
 * into the project, which is scope creep for this package).
 */

export type BuddyGiftType =
  | 'theme_color'
  | 'double_buffs'
  | 'mood_pack'
  | 'skip_token'
  | 'reward_discount'
  | 'skin';

export interface BuddyRelationship {
  id: string;
  child_profile_id: string;

  friendship_level: 1 | 2 | 3 | 4 | 5;
  successful_days_count: number;

  current_skin_id: string | null;
  current_theme_color: string | null;
  buddy_name: string | null;
  buddy_visible: boolean;

  has_pending_gift: boolean;

  relationship_started_at: string;
  last_level_up_at: string | null;
  last_successful_day_date: string | null; // ISO date e.g. '2026-05-15'

  created_at: string;
  updated_at: string;
}

export interface BuddyGift {
  id: string;
  child_profile_id: string;
  gift_type: BuddyGiftType;
  gift_value: string | null;
  given_at_level: 2 | 3 | 4 | 5;
  given_at: string;
  used_at: string | null;
  is_used: boolean;
  created_at: string;
}

export interface BuddyDailyCheck {
  id: string;
  child_profile_id: string;
  check_date: string;        // ISO date
  tasks_assigned: number;
  tasks_completed: number;
  completion_rate: number;   // 0.00 - 1.00
  is_successful_day: boolean;
  created_at: string;
}

// ─── Friendship level logic (mirrors EOD SQL function) ────────────────────────

/**
 * V0.5 friendship level thresholds (in successful_days_count).
 * Levels 4 + 5 thresholds are documented for the future UI
 * (so "next level" affordances can show the right number) but
 * the EOD trigger only handles transitions to 2 and 3 in this package.
 */
export const FRIENDSHIP_LEVEL_THRESHOLDS: Record<2 | 3 | 4 | 5, number> = {
  2: 3,
  3: 10,
  4: 30,
  5: 100,
};

/**
 * What level a child should be at after N successful days.
 * Pure function — used by tests and by future UI to preview thresholds.
 */
export function levelForSuccessfulDays(days: number): 1 | 2 | 3 | 4 | 5 {
  if (days >= FRIENDSHIP_LEVEL_THRESHOLDS[5]) return 5;
  if (days >= FRIENDSHIP_LEVEL_THRESHOLDS[4]) return 4;
  if (days >= FRIENDSHIP_LEVEL_THRESHOLDS[3]) return 3;
  if (days >= FRIENDSHIP_LEVEL_THRESHOLDS[2]) return 2;
  return 1;
}

/**
 * Days remaining until the next level-up. Returns null at max level.
 */
export function daysUntilNextLevel(days: number): number | null {
  const next = levelForSuccessfulDays(days) + 1;
  if (next > 5) return null;
  return FRIENDSHIP_LEVEL_THRESHOLDS[next as 2 | 3 | 4 | 5] - days;
}
