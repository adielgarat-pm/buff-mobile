/**
 * useChildBuddyGifts — read buddy_gifts_history rows for a child.
 *
 * Source SPEC: docs/sessions/teen-ui-with-buddy-character/SPEC.md
 *              (BoostersCarousel feed for 5B + 5A)
 *
 * Returns the append-only gift log written by the EOD pg_cron function.
 * Polls once on mount; exposes `refetch` for foreground rehydration.
 * Realtime deferred to a later package (per SPEC Architectural Decision 8).
 *
 * Pattern mirrors useChildBuddyStats / useBuddyRelationship.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { BuddyGift } from '../types/buddy';

export function useChildBuddyGifts(childId: string | null) {
  const [gifts, setGifts]     = useState<BuddyGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!childId) {
      setGifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('buddy_gifts_history')
        .select('*')
        .eq('child_profile_id', childId)
        .order('given_at', { ascending: false });

      if (queryError) {
        console.error('[useChildBuddyGifts] fetch error:', queryError);
        setError(queryError as unknown as Error);
        return;
      }

      setGifts((data ?? []) as BuddyGift[]);
      setError(null);
    } catch (err) {
      console.error('[useChildBuddyGifts] fetch exception:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { gifts, loading, error, refetch };
}
