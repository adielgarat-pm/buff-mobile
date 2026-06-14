/**
 * useChildStreak — the child's current daily streak, server-derived per child.
 *
 * Calls the `child_task_streak` RPC (migration 029), which counts the run of
 * consecutive calendar days (ending today or yesterday, UTC) on which the child
 * completed >=1 task, read live from `daily_progress`. This replaces the old
 * per-DEVICE streak (AsyncStorage `pet_state.daily_streak`), which on a shared
 * device gave every sibling the same number. Because it's computed from history
 * there's nothing to backfill — existing kids get their real streak at once.
 *
 * Session-mode agnostic (mirrors useIncomingSticker / useDailyVibe): `childId`
 * is `previewChildId ?? profile.id`, and `daily_progress` RLS accepts both the
 * child's own session and the parent's family-scoped session (View-as-Child).
 *
 * Refetches on focus so the badge reflects a task just completed on the Quests
 * tab when the child returns to HQ.
 */
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../integrations/supabase/client';

export function useChildStreak(childId: string | null) {
  const [streak, setStreak] = useState(0);

  const refetch = useCallback(async () => {
    if (!childId) {
      setStreak(0);
      return;
    }
    const { data, error } = await supabase.rpc('child_task_streak', { p_child_id: childId });
    if (error) {
      if (__DEV__) console.warn('[useChildStreak] rpc failed:', error.message);
      return; // keep the last good value rather than flashing 0 on a transient error
    }
    setStreak(typeof data === 'number' ? data : 0);
  }, [childId]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return { streak, refetch };
}
