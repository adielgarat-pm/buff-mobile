import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonProgressRow {
  id:          string;
  lessonKey:   string;   // format: "${day}_${periodIndex}", e.g. "sunday_0"
  completed:   boolean;
  completedAt: string | null;
  credits:     number;
}

/**
 * Keyed map for O(1) lookups in render: lessonKey → LessonProgressRow.
 * Returned as `progressMap` from the hook.
 */
export type LessonProgressMap = Record<string, LessonProgressRow>;

/** Default credits awarded for completing one lesson period. */
export const LESSON_CREDITS = 5;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches and manages lesson completion state for one child on one date.
 *
 * @param date     ISO date string "YYYY-MM-DD". Pass today's key for daily quest.
 * @param childId  The profile.id of the child. Pass null to skip fetching.
 */
export function useLessonProgress(date: string, childId: string | null) {
  const { familyId } = useAuth();

  const [rows,        setRows]        = useState<LessonProgressRow[]>([]);
  const [progressMap, setProgressMap] = useState<LessonProgressMap>({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProgress = useCallback(async () => {
    if (!familyId || !childId || !date) {
      setRows([]);
      setProgressMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('lesson_progress')
        .select('id, lesson_key, completed, completed_at, credits')
        .eq('family_id', familyId)
        .eq('child_id',  childId)
        .eq('date',      date);

      if (fetchErr) {
        console.error('[useLessonProgress] fetch error:', fetchErr.message);
        setError(fetchErr.message);
        return;
      }

      const mapped: LessonProgressRow[] = (data ?? []).map(r => ({
        id:          r.id,
        lessonKey:   r.lesson_key,
        completed:   r.completed,
        completedAt: r.completed_at ?? null,
        credits:     r.credits ?? LESSON_CREDITS,
      }));

      setRows(mapped);
      setProgressMap(
        Object.fromEntries(mapped.map(r => [r.lessonKey, r]))
      );
    } catch (err) {
      console.error('[useLessonProgress] unexpected error:', err);
      setError('Failed to load lesson progress');
    } finally {
      setLoading(false);
    }
  }, [familyId, childId, date]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // ── Realtime ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!familyId || !childId) return;

    const channel = supabase
      .channel(`lesson-progress-${familyId}-${childId}-${date}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'lesson_progress',
          filter: `family_id=eq.${familyId}`,
        },
        () => { fetchProgress(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, childId, date, fetchProgress]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Mark a lesson as complete (optimistic update + DB write).
   *
   * Uses manual select-then-insert-or-update because the unique index uses
   * COALESCE(child_id, sentinel) and cannot be targeted with onConflict
   * via PostgREST.
   */
  const completeLesson = useCallback(async (
    lessonKey: string,
    credits:   number = LESSON_CREDITS,
  ): Promise<boolean> => {
    if (!familyId || !childId) return false;

    const now = new Date().toISOString();

    // Optimistic update
    setProgressMap(prev => ({
      ...prev,
      [lessonKey]: {
        id:          prev[lessonKey]?.id ?? '',
        lessonKey,
        completed:   true,
        completedAt: now,
        credits,
      },
    }));

    try {
      const existing = progressMap[lessonKey];

      if (existing?.id) {
        const { error: updateErr } = await supabase
          .from('lesson_progress')
          .update({ completed: true, completed_at: now })
          .eq('id', existing.id);

        if (updateErr) {
          console.error('[useLessonProgress] update error:', updateErr.message);
          await fetchProgress();
          return false;
        }
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('lesson_progress')
          .insert({
            family_id:    familyId,
            child_id:     childId,
            date,
            lesson_key:   lessonKey,
            completed:    true,
            completed_at: now,
            credits,
          })
          .select('id')
          .single();

        if (insertErr) {
          console.error('[useLessonProgress] insert error:', insertErr.message);
          await fetchProgress();
          return false;
        }

        // Patch the real id into the optimistic entry
        setProgressMap(prev => ({
          ...prev,
          [lessonKey]: { ...prev[lessonKey], id: inserted.id },
        }));
      }

      return true;
    } catch (err) {
      console.error('[useLessonProgress] completeLesson error:', err);
      await fetchProgress();
      return false;
    }
  }, [familyId, childId, date, progressMap, fetchProgress]);

  /**
   * Mark a lesson as incomplete (optimistic update + DB write).
   */
  const uncompleteLesson = useCallback(async (
    lessonKey: string,
  ): Promise<boolean> => {
    if (!familyId || !childId) return false;

    // Optimistic update
    setProgressMap(prev => ({
      ...prev,
      [lessonKey]: {
        ...prev[lessonKey],
        completed:   false,
        completedAt: null,
      },
    }));

    try {
      const existing = progressMap[lessonKey];

      if (!existing?.id) {
        // No DB row exists — optimistic state is already correct
        return true;
      }

      const { error: updateErr } = await supabase
        .from('lesson_progress')
        .update({ completed: false, completed_at: null })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('[useLessonProgress] uncomplete error:', updateErr.message);
        await fetchProgress();
        return false;
      }

      return true;
    } catch (err) {
      console.error('[useLessonProgress] uncompleteLesson error:', err);
      await fetchProgress();
      return false;
    }
  }, [familyId, childId, progressMap, fetchProgress]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const completedCount = rows.filter(r => r.completed).length;
  const totalCredits   = rows.filter(r => r.completed).reduce((sum, r) => sum + r.credits, 0);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    rows,
    progressMap,
    completedCount,
    totalCredits,
    loading,
    error,
    completeLesson,
    uncompleteLesson,
    refetch: fetchProgress,
  };
}
