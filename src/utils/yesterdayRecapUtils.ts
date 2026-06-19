/**
 * yesterdayRecapUtils — pure functions for the Yesterday Recap feature.
 *
 * Extracted from useYesterdayRecap so the filter sieve (per F-2026-05-21-01)
 * is testable without mocking supabase / react.
 *
 * Source: docs/sessions/yesterday-recap/SPEC.md §IN
 */

import { isPauseActive, type PauseSnapshot } from './pauseUtils';
import { isOffRoutineActive } from './offRoutineUtils';

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
  is_off_routine: boolean | null;
}

export interface DailyProgressRow {
  task_id:   string;
  child_id:  string;
  date:      string;     // YYYY-MM-DD
  completed: boolean;
}

export interface ChildProfileRow {
  id:                string;
  created_at:        string | null;
  off_routine_until: string | null;
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
 *   1. It is not an off-routine task (those carry no routine-completion meaning;
 *      shown as ○ they are a FALSE failure signal — F off-routine-leak-fix)
 *   2. It is assigned to this child
 *   3. It was created on or before the end of yesterday
 *   4. Yesterday's weekday is in its `schedule_days` (null → all 7 days; [] → none, paused)
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
  // 1. off-routine tasks never belong in the routine recap
  if (task.is_off_routine) return false;

  // 2. assigned to this child
  if (task.assigned_to !== childId) return false;

  // 3. created in time
  if (task.created_at > yesterdayEndIso) return false;

  // 4. scheduled for yesterday's weekday
  // null → legacy, counts on every day. [] → parent paused the task → no day.
  const days = Array.isArray(task.schedule_days)
    ? task.schedule_days
    : [0, 1, 2, 3, 4, 5, 6];
  if (!days.includes(yesterdayDow)) return false;

  return true;
}

/**
 * Build a recap for one child: eligible tasks × yesterday's progress.
 *
 * Returns `null` if the child is too new (child.created_at is after the end
 * of yesterday), or if the child is CURRENTLY in an off-routine window — in
 * both cases the caller treats it as "no card for this child."
 *
 * Off-routine suppression mirrors Pause V1: we only suppress for an *active*
 * window (we never reconstruct historical windows, since `off_routine_until`
 * stores the end only — no start). Routine tasks shown as missed on an
 * opted-out day would be a false failure signal, so an active off-routine
 * child gets no card rather than a misleading one.
 */
export function buildChildYesterdayRecap(params: {
  child:          ChildProfileRow;
  yesterdayDow:   number;
  yesterdayDate:  string;
  yesterdayEndIso: string;
  tasks:          TaskRow[];
  dailyProgress:  DailyProgressRow[];
  now?:           Date;
}): ChildYesterdayRecap | null {
  const { child, yesterdayDow, yesterdayDate, yesterdayEndIso, tasks, dailyProgress, now = new Date() } = params;

  // Child created after yesterday ended → not in recap
  if (child.created_at && child.created_at > yesterdayEndIso) return null;

  // Child currently on an off-routine day → suppress (no false routine-missed signal)
  if (isOffRoutineActive(child.off_routine_until, now)) return null;

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
