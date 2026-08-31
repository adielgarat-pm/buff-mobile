/**
 * useChildrenDashboard
 *
 * Fetches all children and their today's progress for the Parent Dashboard.
 *
 * Children:  profiles WHERE family_id = X AND role = 'child'
 * Tasks:     tasks WHERE family_id = X AND child_id = <childId>
 * Progress:  daily_progress WHERE family_id = X AND date = today AND child_id = <childId>
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { isTaskInActivePlan } from '../utils/offRoutineUtils';
import { localDayKey } from '../lib/dayKey';
import { countVisibleTasks } from '../lib/taskScheduling';
import { isWeekendToday } from '../utils/schoolDay';

export interface ChildSummary {
  childId:        string;
  displayName:    string;
  avatar:         string;
  created_at:     string | null;
  tasksCompleted: number;
  tasksTotal:     number;
  totalBalance:   number;
  // child-access-paths: how this child accesses BUFF (own_phone|home_device|
  // shared_device|null). Drives the dashboard "moment" re-entry card.
  accessMode:     string | null;
}

// Local calendar day (see src/lib/dayKey.ts / audit C1) — must match the day
// key useChildProgress writes, or the parent dashboard reads the wrong day.
const getTodayKey = () => localDayKey();

// Raw `tasks` row shape for the columns this hook selects.
interface RawTaskRow {
  id:              string;
  is_off_routine:  boolean | null;
  schedule_days:   number[] | null;
  hide_on_weekend: boolean | null;
  due_date:        string | null;
}

export function useChildrenDashboard() {
  const { familyId } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  // `loading` gates a full-screen / full-section spinner in consumers (incl.
  // RootNavigator line 83, which UNMOUNTS the NavigationContainer while true).
  // It must only block on the FIRST load. Realtime-triggered refetches (e.g. the
  // child-profile INSERT during onboarding's UStep5) must update `children`
  // SILENTLY — otherwise toggling `loading` back to true mid-onboarding remounts
  // the navigator and, on web (no nav-state persistence, UStep params live only
  // in memory), resets the flow to the first step. See IN-2026-06-28.
  const hasLoaded = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    if (!familyId) {
      setChildren([]);
      hasLoaded.current = true;
      setLoading(false);
      return;
    }

    try {
      const todayKey = getTodayKey();

      // Step 1 — fetch children profiles by family_id + role (same as useFamilyMembers)
      console.log('[Dashboard] fetching children for familyId:', familyId);

      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, display_name, avatar, created_at, off_routine_until, access_mode')
        .eq('family_id', familyId)
        .eq('role', 'child')
        .eq('is_deleted', false); // hide children a parent has removed (soft delete)

      console.log('[Dashboard] raw result:', JSON.stringify(profiles), 'error:', profilesErr?.message ?? null);
      console.log('[Dashboard] profiles rows:', profiles?.length ?? 0, 'error:', profilesErr?.message ?? 'none');

      if (profilesErr || !profiles || profiles.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      // Family weekend rule (Fri unless friday_enabled; Sat always) — needed to
      // day-filter the task counts the same way the child screens do (H3).
      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('friday_enabled')
        .eq('family_id', familyId)
        .maybeSingle();
      const isWeekend = isWeekendToday((appSettings as { friday_enabled?: boolean } | null)?.friday_enabled ?? false);

      // Step 2 — tasks + progress for all children in parallel
      const summaries = await Promise.all(
        profiles.map(async (child): Promise<ChildSummary> => {
          const [
            { data: tasks },
            { data: progress },
            { data: vault },
          ] = await Promise.all([
            supabase
              .from('tasks')
              .select('id, is_off_routine, schedule_days, hide_on_weekend, due_date')
              .eq('family_id', familyId)
              .eq('assigned_to', child.id),
            supabase
              .from('daily_progress')
              .select('task_id')
              .eq('family_id', familyId)
              .eq('child_id', child.id)
              .eq('date', todayKey)
              .eq('completed', true),
            supabase
              .from('credit_vault')
              .select('total_balance')
              .eq('family_id', familyId)
              .eq('child_id', child.id)
              .maybeSingle(),
          ]);

          const completedIds = new Set((progress ?? []).map(p => p.task_id));

          // Off-routine partition (mirrors useChildData) — never count off-routine
          // rows as phantom incompletes when the child is on a normal day.
          const inPlanTasks = ((tasks ?? []) as RawTaskRow[]).filter(t =>
            isTaskInActivePlan(t.is_off_routine, child.off_routine_until)
          );

          // Day-filter the SAME way the child screens do (schedule days, weekend,
          // one-time dueDate), so the parent's "X / Y" matches what the child
          // sees and "all done" can actually register (H3).
          const counts = countVisibleTasks(
            inPlanTasks.map(t => ({
              id:            t.id,
              scheduleDays:  t.schedule_days ?? undefined,
              hideOnWeekend: t.hide_on_weekend ?? undefined,
              dueDate:       t.due_date ?? undefined,
            })),
            completedIds,
            todayKey,
            { isWeekend },
          );

          return {
            childId:        child.id,
            displayName:    child.display_name ?? '—',
            avatar:         child.avatar       ?? '🚀',
            created_at:     child.created_at   ?? null,
            tasksTotal:     counts.total,
            tasksCompleted: counts.completed,
            totalBalance:   vault?.total_balance ?? 0,
            accessMode:     (child as { access_mode?: string | null }).access_mode ?? null,
          };
        })
      );

      setChildren(summaries);
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
    } finally {
      hasLoaded.current = true;
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    // `fetch` identity changes with familyId; reset the first-load gate on an
    // account switch so the new family gets a fresh blocking load.
    hasLoaded.current = false;
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!familyId) return;
    // Use a unique channel name each time to avoid "cannot add postgres_changes
    // callbacks after subscribe()" — which happens when the old channel isn't
    // fully removed before this effect re-runs (removeChannel is async).
    // Date.now() alone can collide on a same-millisecond effect re-run (React dev
    // double-invoke) → supabase returns the already-subscribed channel → ".on()
    // after subscribe()" throws. A random suffix makes the topic truly unique.
    const channelName = `children-dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      // Re-fetch when a child profile is inserted (e.g. end of onboarding flow)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles'       }, fetch)
      .on('postgres_changes', { event: '*',      schema: 'public', table: 'daily_progress' }, fetch)
      .on('postgres_changes', { event: '*',      schema: 'public', table: 'credit_vault'   }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, fetch]);

  return { children, loading, refetch: fetch };
}
