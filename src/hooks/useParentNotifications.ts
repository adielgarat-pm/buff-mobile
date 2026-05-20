/**
 * useParentNotifications — narrow selector on useNotificationsFeed for the
 * parent dashboard's per-child SOS surface (Vibe Check Phase 4b).
 *
 * Originally a standalone hook (pkg/daily-vibe-check Phase 4b, 2026-05-17).
 * Refactored 2026-05-20 in pkg/parent-notification-feed Phase 1 to be a thin
 * selector on top of `useNotificationsFeed` (OQ-B11 locked decision) — one
 * realtime channel per family per session instead of two.
 *
 * **Return shape preserved** so `ParentDashboardScreen` consumer stays
 * unchanged. Snapshot regression test guards against drift.
 *
 * Selection rules (unchanged from original):
 *   - type === 'parent_sos' only (drops other types — dashboard scope)
 *   - today only (UTC date match; yesterday's SOS rolls off naturally)
 *   - latest SOS per child (defensive against multiple-per-day)
 */

import { useCallback, useMemo } from 'react';
import { useNotificationsFeed } from './useNotificationsFeed';

export interface ParentSosNotification {
  id:           string;
  child_id:     string;
  child_name:   string;
  created_at:   string;
}

/** Today's date as 'YYYY-MM-DD' UTC — matches the convention used by
 *  daily_progress.date + child_vibes.date elsewhere in the codebase. */
const getTodayKey = () => new Date().toISOString().split('T')[0];

interface UseParentNotificationsResult {
  byChild:         Map<string, ParentSosNotification>;
  loading:         boolean;
  getSosForChild:  (childId: string) => ParentSosNotification | null;
  refetch:         () => Promise<void>;
}

export function useParentNotifications(): UseParentNotificationsResult {
  const { items, loading, refetch } = useNotificationsFeed();

  const byChild = useMemo(() => {
    const todayKey = getTodayKey();
    const map = new Map<string, ParentSosNotification>();
    for (const row of items) {
      if (row.type !== 'parent_sos') continue;
      if (!row.child_id) continue;
      // Today-only filter — extract UTC date portion of created_at
      const rowDate = row.created_at.split('T')[0];
      if (rowDate !== todayKey) continue;
      // Latest SOS per child (items are already ordered DESC by created_at,
      // so the FIRST one we encounter for a child is the most recent)
      if (!map.has(row.child_id)) {
        map.set(row.child_id, {
          id:         row.id,
          child_id:   row.child_id,
          child_name: row.child_name,
          created_at: row.created_at,
        });
      }
    }
    return map;
  }, [items]);

  const getSosForChild = useCallback(
    (childId: string): ParentSosNotification | null => byChild.get(childId) ?? null,
    [byChild],
  );

  return { byChild, loading, getSosForChild, refetch };
}
