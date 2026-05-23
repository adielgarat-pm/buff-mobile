/**
 * yesterdayRecapUtils — pure functions for the Yesterday Recap feature.
 *
 * Extracted from useYesterdayRecap so the filter sieve (per F-2026-05-21-01)
 * is testable without mocking supabase / react.
 *
 * Source: docs/sessions/yesterday-recap/SPEC.md §IN
 */

import { isPauseActive, type PauseSnapshot } from './pauseUtils';

// ─── DB row shapes (snake_case matches Supabase columns) ──────────────────

export interface TaskRow {
  id:             string;
  family_id:      string;
  assigned_to:    string | null;
  title:          string;
  time:           string;
  category:       string;
  icon:           string | null;
  schedule_days:  number[] | null;
  created_at:     string;
}

export interface DailyProgressRow {
  task_id:   string;
  child_id:  string;
  date:      string;     // YYYY-MM-DD
  completed: boolean;
}

export interface ChildProfileRow {
  id:          string;
  created_at:  string | null;
}

// ─── Output shapes (camelCase, consumer-friendly) ─────────────────────────

export interface YesterdayTask {
  taskId:    string;
  title:     string;
  time:      string;
  category:  string;
  icon:      string | null;
  completed: boolean;
}

export interface ChildYesterdayRecap {
  childId:         string;
  tasks:           YesterdayTask[];
  totalScheduled:  number;
  totalCompleted:  number;
}

// ─── Date helpers ─────────────────────────────────────────────────────────

/**
 * Yesterday's date key in the same format `daily_progress.date` uses.
 *
 * Per SPEC §Open Decision 8: reuse the existing convention (UTC-derived
 * via `new Date().toISOString().split('T')[0]`) and subtract one day.
 * The underlying timezone behavior is intentionally NOT fixed here —
 * consistency with existing daily_progress rows is the priority for V1.
 */
export function getYesterdayDateKey(now: Date = new Date()): string {
  const y = new Date(now);
  y.setUTCDate(y.getUTCDate() - 1);
  return y.toISOString().split('T')[0];
}

/** Yesterday's weekday (0 = Sun … 6 = Sat), UTC-derived. */
export function getYesterdayWeekday(now: Date = new Date()): number {
  const y = new Date(now);
  y.setUTCDate(y.getUTCDate() - 1);
  return y.getUTCDay();
}

/** ISO timestamp for the end of yesterday (start of today, exclusive). UTC. */
export function getYesterdayEndIso(now: Date = new Date()): string {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return today.toISOString();
}

// ─── Sieve ────────────────────────────────────────────────────────────────

/**
 * Was this task eligible to appear in the child's yesterday recap?
 *
 * A task qualifies iff ALL of:
 *   1. It is assigned to this child
 *   2. It was created on or before the end of yesterday
 *   3. Yesterday's weekday is in its `schedule_days` (null/empty → all 7 days)
 *
 * The "task still exists in DB" check is implicit — deleted tasks are not
 * present in the input array (Supabase DELETE removes from query results).
 */
export function isTaskEligibleForChild(
  task:           TaskRow,
  childId:        string,
  yesterdayDow:   number,
  yesterdayEndIso: string,
): boolean {
  // 1. assigned to this child
  if (task.assigned_to !== childId) return false;

  // 2. created in time
  if (task.created_at > yesterdayEndIso) return false;

  // 3. scheduled for yesterday's weekday
  const days = Array.isArray(task.schedule_days) && task.schedule_days.length > 0
    ? task.schedule_days
    : [0, 1, 2, 3, 4, 5, 6];
  if (!days.includes(yesterdayDow)) return false;

  return true;
}

/**
 * Build a recap for one child: eligible tasks × yesterday's progress.
 *
 * Returns `null` if the child is too new (child.created_at is after the end
 * of yesterday) — caller should treat this as "no card for this child."
 */
export function buildChildYesterdayRecap(params: {
  child:          ChildProfileRow;
  yesterdayDow:   number;
  yesterdayDate:  string;
  yesterdayEndIso: string;
  tasks:          TaskRow[];
  dailyProgress:  DailyProgressRow[];
}): ChildYesterdayRecap | null {
  const { child, yesterdayDow, yesterdayDate, yesterdayEndIso, tasks, dailyProgress } = params;

  // Child created after yesterday ended → not in recap
  if (child.created_at && child.created_at > yesterdayEndIso) return null;

  const eligible = tasks.filter(t =>
    isTaskEligibleForChild(t, child.id, yesterdayDow, yesterdayEndIso),
  );

  // Build a fast lookup for completion rows belonging to this child + yesterday
  const completedIds = new Set(
    dailyProgress
      .filter(p =>
        p.child_id === child.id &&
        p.date     === yesterdayDate &&
        p.completed === true,
      )
      .map(p => p.task_id),
  );

  const yesterdayTasks: YesterdayTask[] = eligible.map(t => ({
    taskId:    t.id,
    title:     t.title,
    time:      t.time,
    category:  t.category,
    icon:      t.icon,
    completed: completedIds.has(t.id),
  }));

  return {
    childId:        child.id,
    tasks:          yesterdayTasks,
    totalScheduled: yesterdayTasks.length,
    totalCompleted: yesterdayTasks.filter(yt => yt.completed).length,
  };
}

// ─── Section-level visibility ─────────────────────────────────────────────

/**
 * Should the entire "Yesterday" section be hidden on the parent dashboard?
 *
 * Hide when:
 *   - Family is currently paused covering yesterday (V1 = current pause only;
 *     historical reconstruction across resumes is deferred per SPEC §3)
 *   - All children's recaps have zero scheduled tasks
 *
 * Note: empty `recaps` (no children at all) also yields true — the dashboard
 * has its own "no children" empty state above this section.
 */
export function shouldHideRecap(params: {
  pauseSnapshot:  PauseSnapshot | null | undefined;
  recaps:         ChildYesterdayRecap[];
  now?:           Date;
}): boolean {
  const { pauseSnapshot, recaps, now = new Date() } = params;

  if (isPauseActive(pauseSnapshot, now)) return true;

  if (recaps.length === 0) return true;

  const anyScheduled = recaps.some(r => r.totalScheduled > 0);
  return !anyScheduled;
}
