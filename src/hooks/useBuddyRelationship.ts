/**
 * useBuddyRelationship — Read the buddy_relationships row for a child.
 *
 * Source SPEC: docs/sessions/buddy-v05-backend/SPEC.md
 *
 * The buddy_relationships table holds the V0.5 friendship-level state
 * (successful_days_count, friendship_level, has_pending_gift,
 * buddy_visible, etc.). Writes happen exclusively via the server-side
 * EOD function (compute_buddy_eod_for_child); this hook is read-only.
 *
 * Future packages will add:
 *  - Realtime subscription (so a level-up toast can fire when EOD bumps
 *    the level overnight without requiring app re-open)
 *  - Hooks for marking a gift as used (post-booster-mechanics package)
 *
 * For now: poll once on mount, expose `refetch` for manual refresh.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { BuddyRelationship } from '../types/buddy';

export function useBuddyRelationship(childId: string | null) {
  const [relationship, setRelationship] = useState<BuddyRelationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!childId) {
      setRelationship(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('buddy_relationships')
        .select('*')
        .eq('child_profile_id', childId)
        .maybeSingle();

      if (queryError) {
        console.error('[useBuddyRelationship] fetch error:', queryError);
        setError(queryError as unknown as Error);
        return;
      }

      setRelationship(data as BuddyRelationship | null);
      setError(null);
    } catch (err) {
      console.error('[useBuddyRelationship] fetch exception:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { relationship, loading, error, refetch };
}
