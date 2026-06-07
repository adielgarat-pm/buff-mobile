/**
 * Task day-visibility rule — the single source of truth for "should this task
 * show today?". Used by every child-facing count + list so HQ and Quests can
 * never disagree again (the 2026-05-31 bug: HQ showed all tasks, Quests showed
 * only today's).
 *
 * The rule, mirrored from PhaseView + the Lovable web app:
 *   1. A task appears only on the weekdays in `scheduleDays`
 *      (0=Sun … 6=Sat). null/empty → every day.
 *   2. School-day-only tasks (`hideOnWeekend`) drop out on weekend days.
 *
 * Weekend-ness itself is family-specific (Friday depends on `friday_enabled`),
 * so callers pass `isWeekend` from `isWeekendToday(fridayEnabled)`.
 */

import type { Task } from '../types/task';

const ALL_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];

/** True if the task is scheduled on `dayOfWeek` (0=Sun … 6=Sat). */
export function isScheduledOnDay(
  task: Pick<Task, 'scheduleDays'>,
  dayOfWeek: number,
): boolean {
  const days =
    task.scheduleDays && task.scheduleDays.length > 0 ? task.scheduleDays : ALL_DAYS;
  return days.includes(dayOfWeek);
}

/**
 * True if the task should be visible today — the full child-screen predicate
 * (schedule day + weekend hide). `dayOfWeek` is injectable for tests.
 */
export function isTaskVisibleToday(
  task: Pick<Task, 'scheduleDays' | 'hideOnWeekend'>,
  isWeekend: boolean,
  dayOfWeek: number = new Date().getDay(),
): boolean {
  if (!isScheduledOnDay(task, dayOfWeek)) return false;
  if (isWeekend && task.hideOnWeekend) return false;
  return true;
}
