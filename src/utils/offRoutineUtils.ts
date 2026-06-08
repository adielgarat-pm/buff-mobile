/**
 * offRoutineUtils — pure derivation for per-child "Off-Routine Day" mode.
 *
 * Mirror of pauseUtils, but simpler: the state is a single nullable timestamp
 * on the child's profile (`profiles.off_routine_until`).
 *   - null / undefined          → off
 *   - timestamp in the future   → active (until then)
 *   - timestamp in the past     → NOT active (stale; next toggle clears it)
 *
 * `now` overridable for testing.
 */
export function isOffRoutineActive(
  offRoutineUntil: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!offRoutineUntil) return false;
  return new Date(offRoutineUntil) > now;
}
