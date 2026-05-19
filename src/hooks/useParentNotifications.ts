/**
 * useParentNotifications — surfaces today's per-child parent_sos notifications
 * to the parent dashboard.
 *
 * Source SPEC: docs/sessions/daily-vibe-check/SPEC.md § Phase 4 (revised
 * during session 2026-05-17: badge-only on child card; no banner; no
 * manual mark-as-read in v1; auto-clear at midnight via today-filter).
 *
 * Scope intentionally narrow:
 *   - Filters to type='parent_sos' only. Other types (task_completed,
 *     reward_redeemed, quest_milestone) belong to pkg/parent-notification-
 *     feed (separate package).
 *   - Filters to today only. Yesterday's parent_sos rows are gone from
 *     the surface — they roll off naturally.
 *   - No is_read mutation in v1. The text + dot persist for the full day
 *     and disappear at midnight when the date filter rotates.
 *   - Realtime subscribed so a fresh SOS appears without manual refresh.
 *
 * Returns a Map<childId, ParentSosNotification> so callers can do a
 * cheap O(1) lookup per child card.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface ParentSosNotification {
  id:           string;
  child_id:     string;
  child_name:   string;
  created_at:   string;
}

/** Today's date as 'YYYY-MM-DD' UTC — matches the convention used by
 *  daily_progress.date + child_vibes.date elsewhere in the codebase. */
const getTodayKey = () => new Date().toISOString().split('T')[0];

export function useParentNotifications() {
  const { familyId } = useAuth();
  const [byChild, setByChild] = useState<Map<string, ParentSosNotification>>(new Map());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!familyId) {
      setByChild(new Map());
      setLoading(false);
      return;
    }

    const todayKey = getTodayKey();
    // ISO range for today (UTC). created_at >= start of UTC day < start of next day.
    const todayStart = `${todayKey}T00:00:00Z`;
    const tomorrow   = new Date(Date.parse(todayStart) + 24 * 60 * 60 * 1000)
                          .toISOString();

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, child_id, child_name, created_at')
        .eq('family_id', familyId)
        .eq('type', 'parent_sos')
        .gte('created_at', todayStart)
        .lt('created_at', tomorrow)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useParentNotifications] fetch error:', error);
        setByChild(new Map());
        return;
      }

      // Latest SOS per child (multiple unlikely in v1 but defensive).
      const next = new Map<string, ParentSosNotification>();
      for (const row of data ?? []) {
        if (!row.child_id) continue;
        if (!next.has(row.child_id)) {
          next.set(row.child_id, row as ParentSosNotification);
        }
      }
      setByChild(next);
    } catch (err) {
      console.error('[useParentNotifications] fetch exception:', err);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => { refetch(); }, [refetch]);

  // Realtime — re-fetch whenever a parent_sos notification appears for
  // this family. (Cheap re-fetch; we'd otherwise need to filter the
  // INSERT payload client-side anyway.)
  useEffect(() => {
    if (!familyId) return;
    const channel = supabase
      .channel(`parent-notifications-${familyId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const row = payload.new as { type?: string } | null;
          if (row?.type === 'parent_sos') refetch();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, refetch]);

  /** Convenience: was there an SOS for this child today? */
  const getSosForChild = useCallback(
    (childId: string): ParentSosNotification | null => byChild.get(childId) ?? null,
    [byChild],
  );

  return { byChild, loading, getSosForChild, refetch };
}
