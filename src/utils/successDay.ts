/**
 * successDay — the ONE shared definition of an "active day" (BUFF's good day).
 *
 * Source of truth: the BUDDY end-of-day function `compute_buddy_eod_for_child`
 * (D-2026-06-14-01). A day is successful when the child completed an absolute
 * SMALL count of tasks — not a percentage of the whole list:
 *
 *     successful = assigned > 0 AND completed >= LEAST(3, assigned)
 *
 * Why a count, not a %: kids carry a median of 9 (up to 20) tasks/day, so a
 * 70%-of-all bar is effectively unreachable and BUDDY almost never grows. The
 * EOD switched to this count rule; the Parent Insights screen MUST use the exact
 * same definition so the two surfaces never contradict each other. Import this —
 * never re-hardcode a threshold or a % in a screen/hook.
 *
 * Vocabulary (DESIGN.md, Adi 2026-06-19): a day that meets the bar is an
 * "active day" (יום פעיל); an off-day is a "rest day" (יום מנוחה). No "ignition".
 */

/** The absolute floor of completed tasks for an active day — `LEAST(3, assigned)`. */
export const SUCCESS_DAY_FLOOR = 3;

/**
 * Is this day an "active day"? Mirrors the SQL EOD rule exactly:
 * `assigned > 0 AND completed >= LEAST(SUCCESS_DAY_FLOOR, assigned)`.
 *
 * A day with zero assigned tasks is NOT active (nothing to show up for) and is
 * framed as a rest day, never a failure.
 */
export function isActiveDay(completed: number, assigned: number): boolean {
  return assigned > 0 && completed >= Math.min(SUCCESS_DAY_FLOOR, assigned);
}
