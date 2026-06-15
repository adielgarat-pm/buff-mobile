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

/**
 * Partition predicate — does this task belong in the child's CURRENT visible
 * plan? Single source of truth for every "what does this child see now" surface
 * (child app + parent today-summaries), so off-routine rows can never leak into
 * a view as phantom incompletes:
 *   - off-routine active   → ONLY off-routine tasks
 *   - off-routine inactive → ONLY routine tasks
 */
export function isTaskInActivePlan(
  isOffRoutine: boolean | null | undefined,
  offRoutineUntil: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return (isOffRoutine ?? false) === isOffRoutineActive(offRoutineUntil, now);
}
