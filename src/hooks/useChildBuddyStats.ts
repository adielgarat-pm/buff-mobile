/**
 * useChildBuddyStats — Two count-only stats for the 5B MY STATS screen.
 *
 * Source SPEC: docs/sessions/teen-ui-with-buddy-character/SPEC.md
 *              + Q2 decision 2026-05-16: "Days Together" = days the child
 *              opened the app AND completed at least one task.
 *
 * Stats:
 *   - daysTogether    = COUNT(buddy_daily_check rows WHERE tasks_completed >= 1)
 *                       (one row per child per day; uniqueness guaranteed by
 *                       the schema constraint UNIQUE(child_profile_id, check_date))
 *   - tasksCompleted  = COUNT(daily_progress rows WHERE completed=true AND
 *                       revoked_at IS NULL)  — lifetime totals
 *
 * Both queries fire in parallel via Promise.all. `count: 'exact', head: true`
 * means Supabase returns only the count, not the rows themselves — efficient
 * for stat tiles.
 *
 * Pattern matches useBuddyRelationship: poll once on mount, expose `refetch`.
 * Realtime subscriptions deferred to a future package.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface ChildBuddyStats {
  daysTogether: number;
  tasksCompleted: number;
}

export function useChildBuddyStats(childId: string | null) {
  const [stats, setStats]     = useState<ChildBuddyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!childId) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [daysResult, tasksResult] = await Promise.all([
        supabase
          .from('buddy_daily_check')
          .select('*', { count: 'exact', head: true })
          .eq('child_profile_id', childId)
          .gte('tasks_completed', 1),
        supabase
          .from('daily_progress')
          .select('*', { count: 'exact', head: true })
          .eq('child_profile_id', childId)
          .eq('completed', true)
          .is('revoked_at', null),
      ]);

      if (daysResult.error || tasksResult.error) {
        const err = daysResult.error ?? tasksResult.error;
        console.error('[useChildBuddyStats] fetch error:', err);
        setError(err as unknown as Error);
        return;
      }

      setStats({
        daysTogether:   daysResult.count  ?? 0,
        tasksCompleted: tasksResult.count ?? 0,
      });
      setError(null);
    } catch (err) {
      console.error('[useChildBuddyStats] fetch exception:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { stats, loading, error, refetch };
}
