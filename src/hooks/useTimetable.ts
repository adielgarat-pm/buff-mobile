import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { Timetable } from '../types/timetable';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { Timetable } from '../types/timetable';
export type {
  WeekDay,
  PeriodInfo,
} from '../types/timetable';
export {
  WEEK_DAYS,
  WEEK_DAYS_WITH_FRIDAY,
  WEEK_DAY_LABELS,
  WEEK_DAY_LABELS_EN,
} from '../types/timetable';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches and saves the timetable for a specific child.
 *
 * Lookup order:
 *   1. Row where assigned_to = childId  (child-specific schedule)
 *   2. Row where assigned_to IS NULL    (family-wide fallback)
 *
 * @param childId  The profile.id of the child whose timetable to load.
 *                 Pass null to skip fetching (e.g. while auth is loading).
 */
export function useTimetable(childId: string | null) {
  const { familyId } = useAuth();

  const [timetable, setTimetable] = useState<Timetable>({});
  const [rowId,     setRowId]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTimetable = useCallback(async () => {
    if (!familyId || !childId) {
      setTimetable({});
      setRowId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Try child-specific timetable first
      const { data: childRow, error: childErr } = await supabase
        .from('timetables')
        .select('id, data')
        .eq('family_id', familyId)
        .eq('assigned_to', childId)
        .maybeSingle();

      if (childErr) {
        console.error('[useTimetable] child fetch error:', childErr.message);
        setError(childErr.message);
        return;
      }

      if (childRow) {
        setRowId(childRow.id);
        setTimetable((childRow.data as Timetable) ?? {});
        return;
      }

      // 2. Fall back to family-wide timetable (assigned_to IS NULL)
      const { data: familyRow, error: familyErr } = await supabase
        .from('timetables')
        .select('id, data')
        .eq('family_id', familyId)
        .is('assigned_to', null)
        .maybeSingle();

      if (familyErr) {
        console.error('[useTimetable] family fetch error:', familyErr.message);
        setError(familyErr.message);
        return;
      }

      setRowId(familyRow?.id ?? null);
      setTimetable((familyRow?.data as Timetable) ?? {});
    } catch (err) {
      console.error('[useTimetable] unexpected error:', err);
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, [familyId, childId]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // ── Realtime ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`timetable-${familyId}-${childId ?? 'family'}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'timetables',
          filter: `family_id=eq.${familyId}`,
        },
        () => { fetchTimetable(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, childId, fetchTimetable]);

  // ── Save ───────────────────────────────────────────────────────────────────

  /**
   * Persists the timetable.
   *
   * @param data        The full timetable to save.
   * @param assignedTo  Who owns this timetable.
   *                    - Omitted / undefined → uses childId (per-child, default)
   *                    - Explicit null        → family-wide (assigned_to = NULL)
   *                    - Explicit UUID string → saves for a different child
   *
   * Uses manual select-then-insert-or-update because the unique index is
   * expression-based (COALESCE) and cannot be targeted with onConflict.
   */
  const saveTimetable = useCallback(async (
    data:        Timetable,
    assignedTo?: string | null,
  ): Promise<boolean> => {
    if (!familyId) return false;

    const targetAssignedTo = assignedTo === undefined ? childId : assignedTo;

    setSaving(true);
    setError(null);

    try {
      if (rowId && assignedTo === undefined) {
        // Fast path: we already know the row id for this child's timetable
        const { error: updateErr } = await supabase
          .from('timetables')
          .update({ data, updated_at: new Date().toISOString() })
          .eq('id', rowId);

        if (updateErr) {
          console.error('[useTimetable] update error:', updateErr.message);
          setError(updateErr.message);
          return false;
        }
      } else {
        // Look up whether a row exists for the target assigned_to
        let existingQuery = supabase
          .from('timetables')
          .select('id')
          .eq('family_id', familyId);

        existingQuery = targetAssignedTo
          ? existingQuery.eq('assigned_to', targetAssignedTo)
          : existingQuery.is('assigned_to', null);

        const { data: existing, error: lookupErr } = await existingQuery.maybeSingle();

        if (lookupErr) {
          console.error('[useTimetable] lookup error:', lookupErr.message);
          setError(lookupErr.message);
          return false;
        }

        if (existing) {
          const { error: updateErr } = await supabase
            .from('timetables')
            .update({ data, updated_at: new Date().toISOString() })
            .eq('id', existing.id);

          if (updateErr) {
            console.error('[useTimetable] update error:', updateErr.message);
            setError(updateErr.message);
            return false;
          }

          if (assignedTo === undefined) setRowId(existing.id);
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from('timetables')
            .insert({
              family_id:   familyId,
              assigned_to: targetAssignedTo,
              data,
            })
            .select('id')
            .single();

          if (insertErr) {
            console.error('[useTimetable] insert error:', insertErr.message);
            setError(insertErr.message);
            return false;
          }

          if (assignedTo === undefined) setRowId(inserted.id);
        }
      }

      // Only update local state when saving the currently loaded child's timetable
      if (assignedTo === undefined) setTimetable(data);
      return true;
    } catch (err) {
      console.error('[useTimetable] save error:', err);
      setError('Failed to save timetable');
      return false;
    } finally {
      setSaving(false);
    }
  }, [familyId, childId, rowId]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    timetable,
    loading,
    saving,
    error,
    saveTimetable,
    refetch: fetchTimetable,
  };
}
