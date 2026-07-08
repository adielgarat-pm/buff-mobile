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

/**
 * The day's success goal in absolute completed tasks — `LEAST(3, assigned)`.
 * A 1-2 task day has a reachable goal of 1-2; zero assigned tasks → goal 0
 * (a rest day, nothing to chase). Child surfaces (Focus Fuel, egg hatch,
 * ignition copy) MUST anchor on this, never on a % of the whole list
 * (D-2026-06-14).
 */
export function successGoal(assigned: number): number {
  return Math.max(0, Math.min(SUCCESS_DAY_FLOOR, Math.floor(assigned)));
}

/**
 * Focus Fuel fill — progress toward the count goal as a 0-100 percentage,
 * capped at 100 (completing beyond the goal keeps the bar full, it never
 * overflows). Zero-goal days (no tasks) show an empty bar.
 */
export function fuelProgressPct(completed: number, assigned: number): number {
  const goal = successGoal(assigned);
  if (goal === 0) return 0;
  return Math.min(100, Math.round((Math.max(0, completed) / goal) * 100));
}

/**
 * Egg crack stage keyed to COMPLETIONS, not a % of all tasks
 * (D-2026-06-14): 0 = intact, 1 = first crack (1 task done),
 * 2 = second crack (2 done), 3 = hatch (goal `successGoal(assigned)`
 * reached). On a 1-2 task day the egg hatches at 1-2 completions.
 */
export function eggCrackStage(completed: number, assigned: number): 0 | 1 | 2 | 3 {
  const goal = successGoal(assigned);
  if (goal === 0) return 0;
  if (completed >= goal) return 3;
  return Math.min(Math.max(0, Math.floor(completed)), 2) as 0 | 1 | 2;
}
