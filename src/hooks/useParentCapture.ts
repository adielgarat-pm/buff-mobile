/**
 * useParentCapture — local store for confirmed parent-capture items.
 *
 * v1 persists to AsyncStorage (zero backend touch, zero production risk). The
 * `parent_items` Supabase table (migrations/019_parent_capture.sql) is the
 * eventual store — swap `loadRaw`/`persist` to Supabase calls when the feature
 * is approved. The hook's public shape stays the same.
 *
 * Gated by FEATURE_PARENT_CAPTURE — see docs/sessions/parent-capture/.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { PARENT_CAPTURE_CONFIG } from '../config/parentCaptureConfig';
import {
  childTaskFieldsFromParsed,
  groupByBucket,
  recencyPartition,
  todayISO,
} from '../lib/parentCapture/captureMapping';
import type { FamilyChild, ParentItem, ParsedItem } from '../types/parentCapture';

const keyFor = (familyId: string) =>
  `${PARENT_CAPTURE_CONFIG.STORE_KEY_PREFIX}${familyId}`;

export function useParentCapture() {
  const { familyId } = useAuth();
  const [allItems, setAllItems] = useState<ParentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!familyId) {
      setAllItems([]);
      setLoading(false);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(keyFor(familyId));
      setAllItems(raw ? (JSON.parse(raw) as ParentItem[]) : []);
    } catch (e) {
      console.error('[useParentCapture] load error:', e);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  const persist = useCallback(
    async (next: ParentItem[]) => {
      setAllItems(next);
      if (!familyId) return;
      try {
        await AsyncStorage.setItem(keyFor(familyId), JSON.stringify(next));
      } catch (e) {
        console.error('[useParentCapture] save error:', e);
      }
    },
    [familyId],
  );

  const addItems = useCallback(
    async (items: ParentItem[]) => {
      await persist([...items, ...allItems]);
    },
    [allItems, persist],
  );

  const updateItem = useCallback(
    async (id: string, changes: Partial<ParentItem>) => {
      await persist(allItems.map((it) => (it.id === id ? { ...it, ...changes } : it)));
    },
    [allItems, persist],
  );

  const archiveItem = useCallback(
    (id: string) => updateItem(id, { status: 'archived' }),
    [updateItem],
  );

  const markDone = useCallback(
    (id: string) => updateItem(id, { status: 'done' }),
    [updateItem],
  );

  const toggleReminder = useCallback(
    (id: string) => {
      const it = allItems.find((i) => i.id === id);
      return updateItem(id, { reminderOptIn: !it?.reminderOptIn });
    },
    [allItems, updateItem],
  );

  /**
   * Transfer a captured item into a child's existing task loop. Inserts a row
   * into `tasks` (recurring or one-time per the item). Returns the new task id,
   * or null on failure. Reuses the established tasks-insert path.
   */
  const transferToChild = useCallback(
    async (parsed: ParsedItem, childId: string): Promise<string | null> => {
      if (!familyId) return null;
      const f = childTaskFieldsFromParsed(parsed);
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          family_id: familyId,
          assigned_to: childId,
          title: f.title,
          time: f.time,
          category: f.category,
          credits: f.credits,
          schedule_days: f.scheduleDays,
          due_date: f.dueDate,
          proposed_by_child: false,
        } as never)
        .select('id')
        .single();
      if (error) {
        console.error('[useParentCapture] transfer error:', error.message);
        return null;
      }
      return (data as { id: string } | null)?.id ?? null;
    },
    [familyId],
  );

  const today = todayISO();
  const { active, archived } = useMemo(
    () => recencyPartition(allItems.filter((i) => i.status !== 'done'), today),
    [allItems, today],
  );
  const grouped = useMemo(() => groupByBucket(active, today), [active, today]);

  return {
    loading,
    allItems,
    active,
    archived,
    grouped,
    addItems,
    updateItem,
    archiveItem,
    markDone,
    toggleReminder,
    transferToChild,
    refetch,
  };
}

/** Read-only fetch of the family's children, for the confirm-card owner picker. */
export function useFamilyChildren() {
  const { familyId } = useAuth();
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!familyId) {
        setChildren([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('family_id', familyId)
        .eq('role', 'child')
        .eq('is_deleted', false);
      if (error) console.error('[useFamilyChildren] fetch error:', error.message);
      if (!alive) return;
      const rows = (data ?? []) as { id: string; display_name: string }[];
      setChildren(rows.map((r) => ({ id: r.id, displayName: r.display_name })));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [familyId]);

  return { children, loading };
}
