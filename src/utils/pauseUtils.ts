/**
 * pauseUtils — pure functions for Pause Mode state derivation.
 *
 * Extracted from useAppSettings so the logic is testable without
 * mocking supabase / react / the hook itself.
 */

export interface PauseSnapshot {
  pause_mode_active: boolean | null | undefined;
  pause_until: string | null | undefined;  // ISO timestamp
}

/**
 * Returns true if pause is currently in effect.
 *
 * Rules:
 *   - pause_mode_active = false / null / undefined → never active
 *   - pause_mode_active = true AND pause_until = null → active (indefinite)
 *   - pause_mode_active = true AND pause_until in the future → active
 *   - pause_mode_active = true AND pause_until in the past → NOT active
 *     (stale pause — UI treats as resumed; next mutation cleans up the row)
 *
 * `now` parameter overridable for testing.
 */
export function isPauseActive(
  snapshot: PauseSnapshot | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!snapshot?.pause_mode_active) return false;
  if (!snapshot.pause_until) return true;
  return new Date(snapshot.pause_until) > now;
}
