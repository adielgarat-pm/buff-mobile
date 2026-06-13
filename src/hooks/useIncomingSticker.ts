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
 * View-as-Child of an OWN-DEVICE kid: the reveal is suppressed. Showing it
 * lets the parent's dismiss flip `is_seen` and consume the one-time surprise
 * before the kid ever opens their phone (Emmy's parents'-meeting sticker,
 * 2026-06-12). Shared-device kids (no linked auth user) still get the reveal
 * in preview — for them View-as-Child IS the kid's actual interface.
 *
 * Re-checks on screen focus so a sticker sent while the kid is mid-session
 * appears next time the dashboard regains focus (no realtime socket needed
 * for v1 — the dashboard is the kid's primary surface).
 */
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../integrations/supabase/client';
import { useMode } from '../contexts/ModeContext';

export interface IncomingSticker {
  id: string;
  sticker_type: string;
  message: string | null;
}

export function useIncomingSticker(childId: string | null) {
  const { isChildPreview } = useMode();
  const [sticker, setSticker] = useState<IncomingSticker | null>(null);

  const fetchUnseen = useCallback(async () => {
    if (!childId) return;
    if (isChildPreview) {
      const { data: child, error: childErr } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', childId)
        .maybeSingle();
      // Fail closed: if we can't tell whether the kid has their own device,
      // don't risk consuming their reveal.
      if (childErr || child?.user_id) return;
    }
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
  }, [childId, isChildPreview]);

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
