/**
 * Task scheduling / visibility — single source of truth.
 *
 * Encodes the one-time (`dueDate`) vs recurring (`scheduleDays`) rule. For a
 * recurring task (dueDate undefined) it reproduces the existing inline filter in
 * PhaseView / GamerTasksScreen byte-for-byte, so behavior is unchanged for every
 * existing task. See pkg/parent-capture Phase 5.
 */

import type { Task } from '../types/task';

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
  // recurring — identical to the prior inline filters
  const weekday = new Date(dateKey + 'T00:00:00').getDay();
  const scheduleDays = task.scheduleDays ?? [0, 1, 2, 3, 4, 5];
  if (!scheduleDays.includes(weekday)) return false;
  if (ctx.isWeekend && task.hideOnWeekend) return false;
  return true;
}
