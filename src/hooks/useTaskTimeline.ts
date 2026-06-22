/**
 * useTaskTimeline — per-task completion grid for the last N days.
 *
 * For each task × day: resolved whether the task was scheduled that day
 * (respecting scheduleDays + hideOnWeekend + fridayEnabled), and whether
 * the child actually completed it.
 *
 * Weekend definition:
 *   - Saturday (6) is always weekend.
 *   - Friday (5) is weekend when !fridayEnabled (most Israeli families).
 *   International families with fridayEnabled = true treat Friday as a weekday.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { getPhaseForTime } from '../types/phase';
import type { Phase } from '../types/phase';
import type { TaskCategory } from '../types/task';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayStatus =
  | 'completed'     // child completed this task that day
  | 'missed'        // task was scheduled but not completed
  | 'not-scheduled' // task not assigned this day (weekend / specific days)
  | 'future';       // today or later — don't render as missed

export interface TaskDayCell {
  date:      string;     // YYYY-MM-DD
  dayOfWeek: number;     // 0 = Sunday … 6 = Saturday (JS convention)
  isWeekend: boolean;    // true for Sat always + Fri when !fridayEnabled
  status:    DayStatus;
}

export interface TaskTimelineRow {
  taskId:       string;
  title:        string;
  category:     TaskCategory | null;
  phase:        Phase;
  days:         TaskDayCell[];     // ordered oldest→newest
  /** Completion rate on scheduled weekdays only (0-100). null = no weekday data. */
  weekdayRate:  number | null;
  /** Completion rate on scheduled weekends only (0-100). null = no weekend data. */
  weekendRate:  number | null;
  overallRate:  number;            // scheduled days only
}

export interface CategorySummary {
  category:     TaskCategory | null;
  weekdayRate:  number | null;
  weekendRate:  number | null;
  overallRate:  number;
  taskCount:    number;
}

export interface TaskTimelineResult {
  rows:              TaskTimelineRow[];
  categorySummaries: CategorySummary[];
  loading:           boolean;
  /** True when any category shows weekday/weekend rate difference > 15pp. */
  hasWeekendPattern: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDateRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function isWeekend(dayOfWeek: number, fridayEnabled: boolean): boolean {
  if (dayOfWeek === 6) return true;             // Saturday always
  if (dayOfWeek === 5 && !fridayEnabled) return true; // Friday for Israeli families
  return false;
}

function isScheduledOnDay(
  scheduleDays: number[] | null | undefined,
  hideOnWeekend: boolean | undefined,
  dayOfWeek: number,
  weekend: boolean,
): boolean {
  if (hideOnWeekend && weekend) return false;
  if (!scheduleDays || scheduleDays.length === 0) return true; // every day
  return scheduleDays.includes(dayOfWeek);
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTaskTimeline(
  childId:       string | null,
  fridayEnabled: boolean = false,
  windowDays:    number  = 14,
): TaskTimelineResult {
  const { familyId } = useAuth();
  const [rows,    setRows]    = useState<TaskTimelineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!familyId || !childId) { setLoading(false); return; }

    const dates   = buildDateRange(windowDays);
    const todayStr = new Date().toISOString().split('T')[0];

    const [{ data: tasks }, { data: progress }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, time, category, schedule_days, hide_on_weekend, assigned_to')
        .eq('family_id', familyId)
        .or(`assigned_to.is.null,assigned_to.eq.${childId}`)
        .eq('is_off_routine', false),
      supabase
        .from('daily_progress')
        .select('task_id, date, completed')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .in('date', dates),
    ]);

    if (!tasks) { setLoading(false); return; }

    // Index progress by taskId+date for O(1) lookup
    const progressMap = new Map<string, boolean>();
    for (const p of progress ?? []) {
      progressMap.set(`${p.task_id}|${p.date}`, p.completed);
    }

    const result: TaskTimelineRow[] = tasks.map(task => {
      const scheduleDays: number[] | null = task.schedule_days ?? null;
      const hideOnWeekend: boolean = task.hide_on_weekend ?? false;

      const dayCells: TaskDayCell[] = dates.map(dateStr => {
        const d          = new Date(dateStr + 'T12:00:00');
        const dayOfWeek  = d.getDay(); // 0=Sun…6=Sat
        const weekend    = isWeekend(dayOfWeek, fridayEnabled);
        const scheduled  = isScheduledOnDay(scheduleDays, hideOnWeekend, dayOfWeek, weekend);
        const isToday    = dateStr === todayStr;
        const isFuture   = dateStr > todayStr;

        let status: DayStatus;
        if (isFuture || isToday) {
          status = 'future';
        } else if (!scheduled) {
          status = 'not-scheduled';
        } else {
          const completed = progressMap.get(`${task.id}|${dateStr}`);
          status = completed ? 'completed' : 'missed';
        }

        return { date: dateStr, dayOfWeek, isWeekend: weekend, status };
      });

      // Rates (scheduled days only, past days only)
      const weekdayScheduled = dayCells.filter(c => !c.isWeekend && c.status !== 'not-scheduled' && c.status !== 'future');
      const weekendScheduled = dayCells.filter(c =>  c.isWeekend && c.status !== 'not-scheduled' && c.status !== 'future');
      const allScheduled     = dayCells.filter(c => c.status !== 'not-scheduled' && c.status !== 'future');

      const weekdayRate = avg(weekdayScheduled.map(c => c.status === 'completed' ? 100 : 0));
      const weekendRate = avg(weekendScheduled.map(c => c.status === 'completed' ? 100 : 0));
      const overallRate = avg(allScheduled.map(c => c.status === 'completed' ? 100 : 0)) ?? 0;

      return {
        taskId:      task.id,
        title:       task.title,
        category:    (task.category ?? null) as TaskCategory | null,
        phase:       getPhaseForTime(task.time),
        days:        dayCells,
        weekdayRate,
        weekendRate,
        overallRate,
      };
    });

    // Sort: by category, then by overallRate asc (struggling tasks first)
    result.sort((a, b) => {
      const catCmp = (a.category ?? 'z').localeCompare(b.category ?? 'z');
      if (catCmp !== 0) return catCmp;
      return a.overallRate - b.overallRate;
    });

    // Category summaries
    const catMap = new Map<string, TaskTimelineRow[]>();
    for (const r of result) {
      const k = r.category ?? 'other';
      const arr = catMap.get(k) ?? [];
      arr.push(r);
      catMap.set(k, arr);
    }
    const categorySummaries: CategorySummary[] = [];
    catMap.forEach((taskRows, cat) => {
      const wd = taskRows.map(r => r.weekdayRate).filter((x): x is number => x !== null);
      const we = taskRows.map(r => r.weekendRate).filter((x): x is number => x !== null);
      const all = taskRows.map(r => r.overallRate);
      categorySummaries.push({
        category:    cat === 'other' ? null : cat as TaskCategory,
        weekdayRate: avg(wd),
        weekendRate: avg(we),
        overallRate: avg(all) ?? 0,
        taskCount:   taskRows.length,
      });
    });

    const hasWeekendPattern = categorySummaries.some(c =>
      c.weekdayRate !== null && c.weekendRate !== null &&
      Math.abs(c.weekdayRate - c.weekendRate) > 15
    );

    setRows(result);
    setLoading(false);

    // Not stored — compute inline; just update state
    // (categorySummaries exposed via return below)
    setCatSummaries(categorySummaries);
    setWeekendPattern(hasWeekendPattern);
  }, [familyId, childId, fridayEnabled, windowDays]);

  const [catSummaries,   setCatSummaries]   = useState<CategorySummary[]>([]);
  const [weekendPattern, setWeekendPattern] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);

  return { rows, categorySummaries: catSummaries, hasWeekendPattern: weekendPattern, loading };
}
