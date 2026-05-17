/**
 * useBuddyRelationship — Read + mutate the buddy_relationships row for a child.
 *
 * Source SPEC: docs/sessions/buddy-v05-backend/SPEC.md (read hook)
 *              docs/sessions/teen-ui-with-buddy-character/SPEC.md (mutators)
 *
 * The buddy_relationships table holds the V0.5 friendship-level state
 * (successful_days_count, friendship_level, has_pending_gift,
 * buddy_visible, buddy_name, etc.). The EOD pg_cron function owns the
 * level/gift writes; this hook owns the kid-facing fields:
 *   - `buddy_visible` — toggled from Settings/Dashboard via setBuddyVisible
 *   - `buddy_name`    — set/cleared via setBuddyName
 *
 * Mutators follow the optimistic + refetch-on-error pattern used by
 * useAppSettings.togglePause (matching the existing project convention).
 *
 * Future packages will add:
 *  - Realtime subscription (so a level-up toast can fire when EOD bumps
 *    the level overnight without requiring app re-open)
 *  - Hooks for marking a gift as used (post-booster-mechanics package)
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

  /**
   * Toggle the buddy's visibility on the dashboard / 5A.
   * Optimistic update; on Supabase error, refetch restores server truth.
   */
  const setBuddyVisible = useCallback(
    async (visible: boolean): Promise<{ error: Error | null }> => {
      if (!childId) return { error: new Error('No childId') };

      if (relationship) {
        setRelationship({ ...relationship, buddy_visible: visible });
      }

      const { error: updateError } = await supabase
        .from('buddy_relationships')
        .update({ buddy_visible: visible, updated_at: new Date().toISOString() } as never)
        .eq('child_profile_id', childId);

      if (updateError) {
        console.error('[useBuddyRelationship] setBuddyVisible failed:', updateError);
        await refetch();
        return { error: updateError as unknown as Error };
      }

      return { error: null };
    },
    [childId, relationship, refetch]
  );

  /**
   * Set or clear the buddy's custom name. Pass `null` to revert to the
   * skin-default name (resolved at render time via getBuddyDefaultName).
   * Optimistic update; on Supabase error, refetch restores server truth.
   */
  const setBuddyName = useCallback(
    async (name: string | null): Promise<{ error: Error | null }> => {
      if (!childId) return { error: new Error('No childId') };

      if (relationship) {
        setRelationship({ ...relationship, buddy_name: name });
      }

      const { error: updateError } = await supabase
        .from('buddy_relationships')
        .update({ buddy_name: name, updated_at: new Date().toISOString() } as never)
        .eq('child_profile_id', childId);

      if (updateError) {
        console.error('[useBuddyRelationship] setBuddyName failed:', updateError);
        await refetch();
        return { error: updateError as unknown as Error };
      }

      return { error: null };
    },
    [childId, relationship, refetch]
  );

  return { relationship, loading, error, refetch, setBuddyVisible, setBuddyName };
}
