/**
 * useChildrenDashboard
 *
 * Fetches all children and their today's progress for the Parent Dashboard.
 *
 * Children:  profiles WHERE family_id = X AND role = 'child'
 * Tasks:     tasks WHERE family_id = X AND child_id = <childId>
 * Progress:  daily_progress WHERE family_id = X AND date = today AND child_id = <childId>
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface ChildSummary {
  childId:        string;
  displayName:    string;
  avatar:         string;
  created_at:     string | null;
  tasksCompleted: number;
  tasksTotal:     number;
  totalBalance:   number;
}

const getTodayKey = () => new Date().toISOString().split('T')[0];

export function useChildrenDashboard() {
  const { familyId } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!familyId) {
      setChildren([]);
      setLoading(false);
      return;
    }

    try {
      const todayKey = getTodayKey();

      // Step 1 — fetch children profiles by family_id + role (same as useFamilyMembers)
      console.log('[Dashboard] fetching children for familyId:', familyId);

      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, display_name, avatar, created_at')
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
              .select('id')
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

          return {
            childId:        child.id,
            displayName:    child.display_name ?? '—',
            avatar:         child.avatar       ?? '🚀',
            created_at:     child.created_at   ?? null,
            tasksTotal:     tasks?.length ?? 0,
            tasksCompleted: (tasks ?? []).filter(t => completedIds.has(t.id)).length,
            totalBalance:   vault?.total_balance ?? 0,
          };
        })
      );

      setChildren(summaries);
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!familyId) return;
    // Use a unique channel name each time to avoid "cannot add postgres_changes
    // callbacks after subscribe()" — which happens when the old channel isn't
    // fully removed before this effect re-runs (removeChannel is async).
    const channelName = `children-dashboard-${Date.now()}`;
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
