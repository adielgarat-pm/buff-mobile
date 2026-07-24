/**
 * Task day-visibility rule — the single source of truth for "should this task
 * show today?". Used by every child-facing count + list so HQ and Quests can
 * never disagree again (the 2026-05-31 bug: HQ showed all tasks, Quests showed
 * only today's).
 *
 * The rule, mirrored from PhaseView + the Lovable web app:
 *   1. A task appears only on the weekdays in `scheduleDays`
 *      (0=Sun … 6=Sat). null/undefined → every day; [] → no day (paused).
 *   2. School-day-only tasks (`hideOnWeekend`) drop out on weekend days.
 *
 * Weekend-ness itself is family-specific (Friday depends on `friday_enabled`),
 * so callers pass `isWeekend` from `isWeekendToday(fridayEnabled)`.
 */

import type { Task } from '../types/task';
import { toDateKey } from '../lib/taskScheduling';

const ALL_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];

/** True if the task is scheduled on `dayOfWeek` (0=Sun … 6=Sat). */
export function isScheduledOnDay(
  task: Pick<Task, 'scheduleDays'>,
  dayOfWeek: number,
): boolean {
  // null/undefined → legacy/unset task, shows every day (safe default so no
  // existing task ever vanishes). An explicit [] means the parent paused it →
  // scheduled on NO day (hidden everywhere). This is the single source of truth.
  const days = task.scheduleDays == null ? ALL_DAYS : task.scheduleDays;
  return days.includes(dayOfWeek);
}

/**
 * True if the task should be visible today — the full child-screen predicate
 * (schedule day + weekend hide). `dayOfWeek` is injectable for tests.
 */
export function isTaskVisibleToday(
  task: Pick<Task, 'scheduleDays' | 'hideOnWeekend' | 'dueDate'>,
  isWeekend: boolean,
  dayOfWeek: number = new Date().getDay(),
  todayKey: string = toDateKey(),
): boolean {
  // One-time dated task (Capture transfers, camp days): visible ONLY on its
  // date — mirrors lib/taskScheduling.isTaskVisibleOn, which the Tasks tab
  // already uses. Before this, HQ ignored dueDate entirely (dated tasks have
  // scheduleDays=[] → hidden every day, including the day itself).
  if (task.dueDate) return task.dueDate === todayKey;
  if (!isScheduledOnDay(task, dayOfWeek)) return false;
  if (isWeekend && task.hideOnWeekend) return false;
  return true;
}
