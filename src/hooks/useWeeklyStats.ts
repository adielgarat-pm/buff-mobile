/**
 * useWeeklyStats — per-day "active day" stats for the Parent Insights screen.
 *
 * Reads the SAME signals the BUDDY end-of-day function uses (no schema change):
 *   - assigned/day = tasks whose `schedule_days` include that weekday (empty
 *     schedule_days = every day, per the app's display convention)
 *   - completed/day = `daily_progress` rows with `completed && revoked_at IS NULL`
 * and applies the ONE shared active-day rule (`isActiveDay`, see successDay.ts /
 * D-2026-06-14-01). The two surfaces (BUDDY + Insights) therefore never disagree.
 *
 * Window: last 7 days + the prior 7 days, so week-over-week is REAL. If the prior
 * week has no usage at all (new family), `weekOverWeek` is `null` — the screen
 * hides the trend badge rather than inventing one (the no-dark-pattern Pillar; the
 * whole point of porting this as a paid feature is that every number is honest).
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { isActiveDay } from '../utils/successDay';

const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export interface DailyStat {
  /** ISO date "YYYY-MM-DD". */
  date:           string;
  /** Day of week 0=Sun … 6=Sat. */
  dow:            number;
  /** i18n key for the weekday short label, e.g. "day.mon". */
  dayKey:         string;
  tasksCompleted: number;
  tasksTotal:     number;
  /** Did the child have any tracked activity that day (any progress row)? */
  hasData:        boolean;
  /** Met the active-day bar (the shared count rule). */
  isActive:       boolean;
}

export interface WeeklyStats {
  /** Last 7 days, oldest → newest (for the 7-dot weekly map). */
  thisWeek:        DailyStat[];
  /** The prior 7 days, oldest → newest. */
  priorWeek:       DailyStat[];
  /** Active days in the last 7. */
  activeDays:      number;
  /** Active days in the prior 7 — null when the prior week had no usage. */
  priorActiveDays: number | null;
  /** REAL week-over-week delta in active days (this − prior), or null. */
  weekOverWeek:    number | null;
  /** Days in the last 7 with any tracked activity — gates the empty state (B5). */
  daysWithData:    number;
}

interface TaskRow {
  id:            string;
  schedule_days: number[] | null;
}
interface ProgressRow {
  date:       string;
  task_id:    string;
  completed:  boolean;
  revoked_at: string | null;
}

/** Build an N-day descending date list ending today (mirrors useParentInsights). */
function buildDates(count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/** A task is "assigned" on a weekday if it's scheduled then (empty = every day). */
function assignedOnDow(task: TaskRow, dow: number): boolean {
  const days = task.schedule_days;
  return !days || days.length === 0 || days.includes(dow);
}

function emptyStats(): WeeklyStats {
  return {
    thisWeek: [], priorWeek: [], activeDays: 0,
    priorActiveDays: null, weekOverWeek: null, daysWithData: 0,
  };
}

export function useWeeklyStats(childId: string | null) {
  const { familyId } = useAuth();
  const [stats,   setStats]   = useState<WeeklyStats>(emptyStats());
  const [loading, setLoading] = useState(true);

  const analyze = useCallback(async () => {
    if (!familyId || !childId) {
      setStats(emptyStats());
      setLoading(false);
      return;
    }

    try {
      // 14-day window: last 7 + prior 7.
      const dates = buildDates(14);

      const [{ data: tasksData }, { data: progressData }] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, schedule_days')
          .eq('family_id', familyId)
          .or(`assigned_to.is.null,assigned_to.eq.${childId}`),
        supabase
          .from('daily_progress')
          .select('date, task_id, completed, revoked_at')
          .eq('family_id', familyId)
          .in('date', dates)
          .or(`child_id.is.null,child_id.eq.${childId}`),
      ]);

      const tasks    = (tasksData ?? []) as TaskRow[];
      const progress = (progressData ?? []) as ProgressRow[];

      // Per-date completed counts (completed AND not revoked).
      const completedByDate = new Map<string, number>();
      const rowsByDate      = new Map<string, number>();
      for (const p of progress) {
        rowsByDate.set(p.date, (rowsByDate.get(p.date) ?? 0) + 1);
        if (p.completed && !p.revoked_at) {
          completedByDate.set(p.date, (completedByDate.get(p.date) ?? 0) + 1);
        }
      }

      // Oldest → newest so the weekly map reads left-to-right.
      const ordered = [...dates].reverse();
      const all: DailyStat[] = ordered.map(date => {
        const dow      = new Date(`${date}T00:00:00`).getDay();
        const assigned = tasks.filter(t => assignedOnDow(t, dow)).length;
        // Cap completed at assigned, exactly like the EOD does.
        const rawDone  = completedByDate.get(date) ?? 0;
        const done     = Math.min(rawDone, assigned);
        return {
          date,
          dow,
          dayKey:         `day.${DOW_KEYS[dow]}`,
          tasksCompleted: done,
          tasksTotal:     assigned,
          hasData:        (rowsByDate.get(date) ?? 0) > 0,
          isActive:       isActiveDay(done, assigned),
        };
      });

      const priorWeek = all.slice(0, 7);
      const thisWeek  = all.slice(7);

      const activeDays   = thisWeek.filter(d => d.isActive).length;
      const daysWithData = thisWeek.filter(d => d.hasData).length;

      // Real WoW only when the prior week actually has usage; else null (hidden).
      const priorHasData    = priorWeek.some(d => d.hasData);
      const priorActiveDays = priorHasData ? priorWeek.filter(d => d.isActive).length : null;
      const weekOverWeek    = priorActiveDays === null ? null : activeDays - priorActiveDays;

      setStats({ thisWeek, priorWeek, activeDays, priorActiveDays, weekOverWeek, daysWithData });
    } catch (err) {
      console.error('[useWeeklyStats] error:', err);
      setStats(emptyStats());
    } finally {
      setLoading(false);
    }
  }, [familyId, childId]);

  useEffect(() => {
    setLoading(true);
    analyze();
  }, [analyze]);

  return { stats, loading, refetch: analyze };
}
