/**
 * useAnchorRecoveryPrompts — narrow selector on useNotificationsFeed for
 * the parent dashboard's Anchor Recovery prompt surface.
 *
 * Source SPEC: docs/sessions/anchor-recovery/SPEC.md § Phase 2.
 * Sibling: docs/sessions/parent-notification-feed/SPEC.md (shared feed
 * underlying source).
 *
 * Mirrors `useParentNotifications` pattern (thin selector + one realtime
 * channel per family per session via the shared `useNotificationsFeed`).
 *
 * Selection rules:
 *   - type === 'anchor_recovery'
 *   - is_read === false (parent hasn't dismissed/interacted)
 *   - child_id IS NOT NULL (defensive — every anchor_recovery row should
 *     have a kid; orphans get silently filtered)
 *
 * Multi-kid families produce multiple prompts in the array; the modal UI
 * collapses them into a single multi-kid view (SPEC § Behavior Contract
 * Scenario "multi-kid").
 */

import { useMemo, useCallback } from 'react';
import { useNotificationsFeed } from './useNotificationsFeed';

export interface AnchorRecoveryNotification {
  id:           string;
  child_id:     string;
  child_name:   string;
  created_at:   string;
}

interface UseAnchorRecoveryPromptsResult {
  prompts:        AnchorRecoveryNotification[];
  loading:        boolean;
  /** Marks every currently-visible prompt as read. Used after parent
   *  dismisses, picks Vibe, or picks Meds — all three resolve the prompt. */
  resolveAll:     () => Promise<void>;
  refetch:        () => Promise<void>;
}

export function useAnchorRecoveryPrompts(): UseAnchorRecoveryPromptsResult {
  const { items, loading, markRead, refetch } = useNotificationsFeed();

  const prompts = useMemo<AnchorRecoveryNotification[]>(() => {
    const list: AnchorRecoveryNotification[] = [];
    for (const row of items) {
      if (row.type !== 'anchor_recovery') continue;
      if (row.is_read) continue;
      if (!row.child_id) continue;
      list.push({
        id:         row.id,
        child_id:   row.child_id,
        child_name: row.child_name,
        created_at: row.created_at,
      });
    }
    return list;
  }, [items]);

  const resolveAll = useCallback(async () => {
    for (const p of prompts) {
      await markRead(p.id);
    }
  }, [prompts, markRead]);

  return { prompts, loading, resolveAll, refetch };
}
