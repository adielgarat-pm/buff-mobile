/**
 * useYesterdayRecap — Parent-dashboard read-only view of yesterday's task
 * completion per child.
 *
 * Source SPEC: docs/sessions/yesterday-recap/SPEC.md
 * Filter sieve: src/utils/yesterdayRecapUtils.ts (F-2026-05-21-01)
 *
 * Why a separate hook (not extending useChildrenDashboard):
 *   - Different date scope (yesterday, not today)
 *   - Different realtime subscription needs (tasks + daily_progress for one
 *     specific date — not the today-rolling subscriptions in dashboard hooks)
 *   - Caller can compose: parent dashboard renders <Today> always, and
 *     <Yesterday> conditionally (shouldHide may be true). Keeping them
 *     independent avoids re-renders cascading.
 *
 * Pause snapshot is consumed via useAppSettings (already realtime-subscribed
 * elsewhere on the parent dashboard) — no duplicate channel.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from './useAppSettings';
import {
  buildChildYesterdayRecap,
  getYesterdayDateKey,
  getYesterdayEndIso,
  getYesterdayWeekday,
  shouldHideRecap,
  type ChildProfileRow,
  type ChildYesterdayRecap,
  type DailyProgressRow,
  type TaskRow,
} from '../utils/yesterdayRecapUtils';

export interface UseYesterdayRecapResult {
  recapByChildId: Record<string, ChildYesterdayRecap>;
  shouldHide:     boolean;
  yesterdayDate:  string;
  loading:        boolean;
  error:          Error | null;
  refetch:        () => void;
}

export function useYesterdayRecap(): UseYesterdayRecapResult {
  const { familyId }            = useAuth();
  const { settings: appSettings } = useAppSettings();

  // Date context — computed once per render. Hook caller re-mounts at midnight
  // via the date-key change cascade (or app reload), which is acceptable for V1.
  const dateCtx = useMemo(() => {
    const now = new Date();
    return {
      yesterdayDate:   getYesterdayDateKey(now),
      yesterdayDow:    getYesterdayWeekday(now),
      yesterdayEndIso: getYesterdayEndIso(now),
    };
  }, []);

  const [children,       setChildren]       = useState<ChildProfileRow[]>([]);
  const [tasks,          setTasks]          = useState<TaskRow[]>([]);
  const [dailyProgress,  setDailyProgress]  = useState<DailyProgressRow[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<Error | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!familyId) {
      setChildren([]);
      setTasks([]);
      setDailyProgress([]);
      setLoading(false);
      return;
    }

    try {
      const [childrenRes, tasksRes, progressRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, created_at')
          .eq('family_id', familyId)
          .eq('role', 'child'),
        supabase
          .from('tasks')
          .select('id, family_id, assigned_to, title, time, category, icon, schedule_days, created_at')
          .eq('family_id', familyId),
        supabase
          .from('daily_progress')
          .select('task_id, child_id, date, completed')
          .eq('family_id', familyId)
          .eq('date', dateCtx.yesterdayDate),
      ]);

      if (childrenRes.error) throw childrenRes.error;
      if (tasksRes.error)    throw tasksRes.error;
      if (progressRes.error) throw progressRes.error;

      setChildren((childrenRes.data ?? []) as ChildProfileRow[]);
      setTasks((tasksRes.data ?? []) as TaskRow[]);
      setDailyProgress((progressRes.data ?? []) as DailyProgressRow[]);
      setError(null);
    } catch (err) {
      console.error('[useYesterdayRecap] fetch error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [familyId, dateCtx.yesterdayDate]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  // ── Realtime ─────────────────────────────────────────────────────────────
  // Refetch when relevant rows change. We don't try to merge fine-grained
  // updates — yesterday's data is small per family (typically <20 rows) so a
  // full refetch is cheap and avoids subtle merge bugs.
  useEffect(() => {
    if (!familyId) return;

    const channelName = `yesterday-recap-${familyId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks',          filter: `family_id=eq.${familyId}` },
        fetchAll,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_progress', filter: `family_id=eq.${familyId}` },
        fetchAll,
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, fetchAll]);

  // ── Derive ───────────────────────────────────────────────────────────────
  const recapByChildId = useMemo<Record<string, ChildYesterdayRecap>>(() => {
    const out: Record<string, ChildYesterdayRecap> = {};
    for (const child of children) {
      const recap = buildChildYesterdayRecap({
        child,
        yesterdayDow:    dateCtx.yesterdayDow,
        yesterdayDate:   dateCtx.yesterdayDate,
        yesterdayEndIso: dateCtx.yesterdayEndIso,
        tasks,
        dailyProgress,
      });
      if (recap) out[child.id] = recap;
    }
    return out;
  }, [children, tasks, dailyProgress, dateCtx]);

  const shouldHide = useMemo(() => shouldHideRecap({
    pauseSnapshot: appSettings,
    recaps:        Object.values(recapByChildId),
  }), [appSettings, recapByChildId]);

  return {
    recapByChildId,
    shouldHide,
    yesterdayDate: dateCtx.yesterdayDate,
    loading,
    error,
    refetch: fetchAll,
  };
}
