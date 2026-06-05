/**
 * useNotificationsFeed — generalized parent-side notifications surface.
 *
 * Source SPEC: docs/sessions/parent-notification-feed/SPEC.md § Phase 1.
 *
 * Single realtime channel per family per session — `useParentNotifications`
 * (the existing narrow dashboard hook) refactored to a thin selector on top
 * of this hook (OQ-B11 locked decision).
 *
 * Scope:
 *   - Fetches all `public.notifications` rows for `family_id`, ordered by
 *     created_at DESC, limit 50 (OQ-B9; no pagination v1)
 *   - Realtime subscription on INSERT / UPDATE for the family
 *   - Exposes mark-as-read + mark-all-as-read mutations with optimistic
 *     UI + rollback on RLS denial (OQ-B5 + OQ-B20)
 *   - Computes unread count (drives bell badge)
 *
 * What this hook does NOT do:
 *   - Push integration (sister package pkg/fcm-push-notifications)
 *   - Group by child (OQ-B3: time grouping only)
 *   - Filter by type (OQ-B4: chronological only in v1)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { isVisibleInFeed } from '../lib/notificationClass';

export interface FeedNotification {
  id:           string;
  family_id:    string;
  parent_id:    string;
  type:         string;
  child_id:     string | null;
  child_name:   string;
  entity_id:    string | null;
  entity_name:  string;
  is_read:      boolean;
  created_at:   string;
}

interface UseNotificationsFeedResult {
  items:        FeedNotification[];
  loading:      boolean;
  unreadCount:  number;
  /** Optimistic mark-as-read for a single row. */
  markRead:     (id: string) => Promise<void>;
  /** Bulk: mark all unread rows for the family as read. */
  markAllRead:  () => Promise<void>;
  refetch:      () => Promise<void>;
}

const INITIAL_FETCH_LIMIT = 50;

export function useNotificationsFeed(): UseNotificationsFeedResult {
  const { familyId } = useAuth();
  const [items, setItems] = useState<FeedNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!familyId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read, created_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(INITIAL_FETCH_LIMIT);

      if (error) {
        if (__DEV__) console.warn('[useNotificationsFeed] fetch error:', error.message);
        setItems([]);
        return;
      }
      setItems((data ?? []) as FeedNotification[]);
    } catch (err) {
      if (__DEV__) console.warn('[useNotificationsFeed] fetch exception:', err);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Realtime channel per family — guarded against Strict-Mode double-mount
  // and against Supabase's name-cached channel registry by using a unique
  // suffix per effect invocation.
  //
  // Why this matters (BUG-2026-05-23-01):
  //   - Previously the channel name was just `parent-feed-${familyId}`
  //     and the cleanup `supabase.removeChannel(channel)` returns a
  //     Promise (async). Strict-Mode double-invoke runs cleanup +
  //     immediately a fresh effect — the new `.channel(name)` returns
  //     the cached (still-subscribed) instance, then `.on(...)` throws
  //     "cannot add `postgres_changes` callbacks after `subscribe()`"
  //     and the dashboard render tree blows up in dev.
  //   - With anchor-recovery-ui (PR #67) merged, two hooks now consume
  //     useNotificationsFeed in a single render (useParentNotifications +
  //     useAnchorRecoveryPrompts), which made the collision deterministic.
  //
  // Fix shape:
  //   1. Channel name includes a per-mount random suffix → each effect
  //      invocation gets a brand-new registry entry; no name collision
  //      with stale entries still waiting for async removal.
  //   2. `refetch` is read via a ref instead of being in the effect's
  //      dep array, so familyId changes are the only trigger.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!familyId) return;
    // Random 6-char suffix — generated once per effect invocation
    const suffix = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`parent-feed-${familyId}-${suffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          refetchRef.current();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  // Optimistic mark-as-read for a single row.
  const markRead = useCallback(async (id: string) => {
    let prevValue: boolean | null = null;
    setItems((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        prevValue = n.is_read;
        return { ...n, is_read: true };
      }),
    );
    if (prevValue === true) return; // already read; no DB call needed

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      if (__DEV__) console.warn('[useNotificationsFeed] markRead failed:', error.message);
      // Rollback
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
    }
  }, []);

  // Bulk mark-all-as-read for the family.
  const markAllRead = useCallback(async () => {
    if (!familyId) return;
    const snapshot = items;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('family_id', familyId)
      .eq('is_read', false);

    if (error) {
      if (__DEV__) console.warn('[useNotificationsFeed] markAllRead failed:', error.message);
      setItems(snapshot);
    }
  }, [familyId, items]);

  // Badge counts only what the feed actually shows: unread ACTION items +
  // unread INFO items within the recency window. Same predicate as the feed
  // screen, so the badge number always equals the visible row count (OQ-N6).
  const unreadCount = useMemo(
    () => items.filter((n) => isVisibleInFeed(n)).length,
    [items],
  );

  return { items, loading, unreadCount, markRead, markAllRead, refetch };
}
