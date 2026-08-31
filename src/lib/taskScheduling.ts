/**
 * Task scheduling / visibility — single source of truth.
 *
 * Encodes the one-time (`dueDate`) vs recurring (`scheduleDays`) rule. For a
 * recurring task (dueDate undefined) it reproduces the existing inline filter in
 * PhaseView / GamerTasksScreen byte-for-byte, so behavior is unchanged for every
 * existing task. See pkg/parent-capture Phase 5.
 */

import type { Task } from '../types/task';
import { isWeekendDay } from '../utils/schoolDay';

/** Local YYYY-MM-DD for a Date (matches getDay()-based weekday logic). */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface VisibilityContext {
  /** Weekend per family rules (Sat always; Fri unless friday_enabled). */
  isWeekend: boolean;
}

/**
 * Is `task` visible on `dateKey` (YYYY-MM-DD, local)?
 *
 * - dueDate set  → ONE-TIME: visible iff dueDate === dateKey (scheduleDays and
 *   hideOnWeekend are ignored — a dated item is dated).
 * - dueDate unset → RECURRING: existing logic —
 *   scheduleDays.includes(weekday) && !(isWeekend && hideOnWeekend).
 */
export function isTaskVisibleOn(
  task: Task,
  dateKey: string,
  ctx: VisibilityContext,
): boolean {
  if (task.dueDate) {
    return task.dueDate === dateKey; // one-time
  }
  // recurring — mirrors utils/taskSchedule.ts: null/undefined scheduleDays
  // means EVERY day (all 7, incl. Saturday — aligned with the PR #233 backfill
  // and the create-task default in ParentTasksScreen; the old [0..5] default
  // here silently hid legacy null-days tasks on Saturday). An explicit []
  // (parent paused the task) is preserved and matches no day.
  const weekday = new Date(dateKey + 'T00:00:00').getDay();
  const scheduleDays = task.scheduleDays ?? [0, 1, 2, 3, 4, 5, 6];
  if (!scheduleDays.includes(weekday)) return false;
  if (ctx.isWeekend && task.hideOnWeekend) return false;
  return true;
}

/** The minimal task shape needed to count what's visible on a given day. */
export type CountableTask = Pick<Task, 'scheduleDays' | 'hideOnWeekend' | 'dueDate'> & {
  id: string;
};

/**
 * Count the tasks visible on `dateKey`, and how many of them are complete.
 *
 * This is the SINGLE rule the parent dashboard must share with the child
 * surfaces (PhaseView / GamerTasksScreen), so the parent's "X / Y" always
 * matches what the child actually sees. Before this, the parent dashboard
 * counted every assigned task (ignoring schedule days / weekend / one-time
 * dueDate), so the totals diverged and "all done" could never register
 * (audit H3). Off-routine partitioning is applied by the caller before this.
 */
export function countVisibleTasks(
  tasks: CountableTask[],
  completedIds: Set<string>,
  dateKey: string,
  ctx: VisibilityContext,
): { total: number; completed: number } {
  const visible = tasks.filter(t => isTaskVisibleOn(t as Task, dateKey, ctx));
  return {
    total: visible.length,
    completed: visible.filter(t => completedIds.has(t.id)).length,
  };
}

/** The task shape needed to reason about a multi-day window. */
export type WindowTask = Pick<Task, 'scheduleDays' | 'hideOnWeekend' | 'dueDate'>;

/**
 * The days in `dates` (each 'YYYY-MM-DD', local) on which `task` is scheduled,
 * applying the family weekend rule (Sat always; Fri unless `fridayEnabled`).
 */
export function scheduledDaysInWindow(
  task: WindowTask,
  dates: string[],
  fridayEnabled: boolean,
): string[] {
  return dates.filter(dk => {
    const weekday = new Date(dk + 'T00:00:00').getDay();
    return isTaskVisibleOn(task as Task, dk, { isWeekend: isWeekendDay(weekday, fridayEnabled) });
  });
}

/**
 * Completion rate (0–100) for `task` across the window, or `null` when the task
 * was never scheduled in it (so it's excluded from averages rather than counted
 * as 0%). Denominator = days actually SCHEDULED (not a fixed number); numerator =
 * completions on those scheduled days; clamped to ≤100 so a parent never sees a
 * nonsensical >100% (audit M7).
 */
export function completionRateOverWindow(
  task: WindowTask,
  dates: string[],
  fridayEnabled: boolean,
  completedDates: Set<string>,
): { rate: number; scheduledDays: number; completedDays: number } | null {
  const scheduled = scheduledDaysInWindow(task, dates, fridayEnabled);
  if (scheduled.length === 0) return null;
  const completedDays = scheduled.filter(dk => completedDates.has(dk)).length;
  return {
    rate: Math.min(100, (completedDays / scheduled.length) * 100),
    scheduledDays: scheduled.length,
    completedDays,
  };
}
