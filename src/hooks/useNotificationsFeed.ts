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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

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

  // One Realtime channel per family per session (OQ-B11 + B19).
  useEffect(() => {
    if (!familyId) return;
    const channel = supabase
      .channel(`parent-feed-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          refetch();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, refetch]);

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

  const unreadCount = useMemo(
    () => items.filter((n) => !n.is_read).length,
    [items],
  );

  return { items, loading, unreadCount, markRead, markAllRead, refetch };
}
