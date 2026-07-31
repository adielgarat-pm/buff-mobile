import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { coerceWeekdays, type Activity, type ActivityWeekday, type NewActivity } from '../types/activities';

// ─── Row mapping ──────────────────────────────────────────────────────────────

interface ActivityRow {
  id: string;
  family_id: string;
  child_id: string | null;
  title: string;
  template_id: string | null;
  schedule_kind: 'recurring' | 'oneoff';
  weekday: string | null;   // legacy single day — kept one release for old builds
  weekdays: unknown;        // jsonb array of weekday tokens (054+); source of truth
  on_date: string | null;
  at_time: string | null;
  equipment: unknown;
  status: 'active' | 'archived' | 'proposed';
  created_by_child: boolean | null;
  created_at: string;
}

function rowToActivity(r: ActivityRow): Activity {
  const schedule: Activity['schedule'] =
    r.schedule_kind === 'recurring'
      // Read the 054 array; fall back to the legacy single `weekday` for any
      // un-backfilled / old-build-inserted row (weekdays IS NULL).
      ? { kind: 'recurring', weekdays: coerceWeekdays(r.weekdays) ?? (r.weekday ? [r.weekday as ActivityWeekday] : []) }
      : { kind: 'oneoff', date: r.on_date as string };
  return {
    id: r.id,
    familyId: r.family_id,
    childId: r.child_id,
    title: r.title,
    templateId: r.template_id,
    schedule,
    time: r.at_time,
    equipment: Array.isArray(r.equipment) ? (r.equipment as string[]) : [],
    status: r.status,
    createdByChild: r.created_by_child ?? false,
    createdAt: r.created_at,
  };
}

/**
 * Maps the discriminated schedule back to flat columns for insert/update.
 * Recurring rows dual-write the legacy `weekday = weekdays[0]` for one release
 * so a pre-OTA client still reading only `weekday` shows at least the first day
 * of a multi-day activity rather than a blank. One-off rows null both.
 */
function scheduleColumns(schedule: NewActivity['schedule']) {
  return schedule.kind === 'recurring'
    ? {
        schedule_kind: 'recurring',
        weekdays: schedule.weekdays,
        weekday: schedule.weekdays[0] ?? null,
        on_date: null,
      }
    : { schedule_kind: 'oneoff', weekdays: null, weekday: null, on_date: schedule.date };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches and manages a child's out-of-school activities.
 *
 * Returns rows where `child_id = childId` OR `child_id IS NULL` (family-wide),
 * mirroring the timetable lookup. Pass null to skip fetching.
 *
 * @param childId  The profile.id of the child whose activities to load.
 */
export function useActivities(childId: string | null) {
  const { familyId } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    if (!familyId || !childId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('activities')
        .select('*')
        .eq('family_id', familyId)
        .or(`child_id.eq.${childId},child_id.is.null`)
        .order('created_at', { ascending: true });

      if (fetchErr) {
        console.error('[useActivities] fetch error:', fetchErr.message);
        setError(fetchErr.message);
        return;
      }

      setActivities((data as ActivityRow[] | null ?? []).map(rowToActivity));
    } catch (err) {
      console.error('[useActivities] unexpected error:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [familyId, childId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // ── Realtime ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`activities-${familyId}-${childId ?? 'none'}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `family_id=eq.${familyId}`,
        },
        () => { fetchActivities(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, childId, fetchActivities]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addActivity = useCallback(async (
    input: NewActivity,
    opts?: { status?: 'active' | 'proposed'; createdByChild?: boolean },
  ): Promise<boolean> => {
    if (!familyId) return false;
    setSaving(true);
    setError(null);
    try {
      const { error: insertErr } = await supabase.from('activities').insert({
        family_id: familyId,
        child_id: input.childId,
        title: input.title,
        template_id: input.templateId,
        at_time: input.time,
        equipment: input.equipment,
        status: opts?.status ?? 'active',
        created_by_child: opts?.createdByChild ?? input.createdByChild ?? false,
        ...scheduleColumns(input.schedule),
      });
      if (insertErr) {
        console.error('[useActivities] insert error:', insertErr.message);
        setError(insertErr.message);
        return false;
      }
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('[useActivities] add error:', err);
      setError('Failed to add activity');
      return false;
    } finally {
      setSaving(false);
    }
  }, [familyId, fetchActivities]);

  const updateActivity = useCallback(async (
    id: string,
    changes: Partial<NewActivity>,
  ): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (changes.title !== undefined) payload.title = changes.title;
      if (changes.childId !== undefined) payload.child_id = changes.childId;
      if (changes.templateId !== undefined) payload.template_id = changes.templateId;
      if (changes.time !== undefined) payload.at_time = changes.time;
      if (changes.equipment !== undefined) payload.equipment = changes.equipment;
      if (changes.schedule !== undefined) Object.assign(payload, scheduleColumns(changes.schedule));

      const { error: updateErr } = await supabase
        .from('activities')
        .update(payload)
        .eq('id', id);
      if (updateErr) {
        console.error('[useActivities] update error:', updateErr.message);
        setError(updateErr.message);
        return false;
      }
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('[useActivities] update error:', err);
      setError('Failed to update activity');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchActivities]);

  /** Soft-delete: flips status to 'archived' (keeps history). */
  const archiveActivity = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const { error: archiveErr } = await supabase
        .from('activities')
        .update({ status: 'archived' })
        .eq('id', id);
      if (archiveErr) {
        console.error('[useActivities] archive error:', archiveErr.message);
        setError(archiveErr.message);
        return false;
      }
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('[useActivities] archive error:', err);
      setError('Failed to archive activity');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchActivities]);

  /** Parent approval: flip a child-proposed activity to active. */
  const approveActivity = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const { error: approveErr } = await supabase
        .from('activities')
        .update({ status: 'active' })
        .eq('id', id);
      if (approveErr) {
        console.error('[useActivities] approve error:', approveErr.message);
        setError(approveErr.message);
        return false;
      }
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('[useActivities] approve error:', err);
      setError('Failed to approve activity');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchActivities]);

  return {
    activities,
    loading,
    saving,
    error,
    addActivity,
    updateActivity,
    archiveActivity,
    approveActivity,
    refetch: fetchActivities,
  };
}
