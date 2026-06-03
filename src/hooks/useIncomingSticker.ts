/**
 * useIncomingSticker — surfaces the latest unseen parent→child sticker.
 *
 * Reads `public.stickers` for the active child (oldest-unseen-first so a
 * backlog drains in order) and exposes a `markSeen()` that flips `is_seen`.
 *
 * Session-mode agnostic (mirrors useDailyVibe): `childId` is
 * `previewChildId ?? profile.id`, and the stickers RLS accepts BOTH the
 * child's own auth session (child policies) AND the parent's session in
 * View-as-Child mode (parent family-scoped policies). So this works on a
 * shared device and on a kid's own ChildJoin device alike.
 *
 * Re-checks on screen focus so a sticker sent while the kid is mid-session
 * appears next time the dashboard regains focus (no realtime socket needed
 * for v1 — the dashboard is the kid's primary surface).
 */
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../integrations/supabase/client';

export interface IncomingSticker {
  id: string;
  sticker_type: string;
  message: string | null;
}

export function useIncomingSticker(childId: string | null) {
  const [sticker, setSticker] = useState<IncomingSticker | null>(null);

  const fetchUnseen = useCallback(async () => {
    if (!childId) return;
    const { data, error } = await supabase
      .from('stickers')
      .select('id, sticker_type, message')
      .eq('to_child_id', childId)
      .eq('is_seen', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      if (__DEV__) console.warn('[useIncomingSticker] fetch failed:', error.message);
      return;
    }
    if (data) setSticker(data as IncomingSticker);
  }, [childId]);

  useFocusEffect(
    useCallback(() => {
      void fetchUnseen();
    }, [fetchUnseen]),
  );

  const markSeen = useCallback(async () => {
    const current = sticker;
    setSticker(null); // optimistic — dismiss immediately
    if (!current) return;
    const { error } = await supabase
      .from('stickers')
      .update({ is_seen: true })
      .eq('id', current.id);
    if (error) {
      if (__DEV__) console.warn('[useIncomingSticker] markSeen failed:', error.message);
    }
  }, [sticker]);

  return { sticker, markSeen };
}
