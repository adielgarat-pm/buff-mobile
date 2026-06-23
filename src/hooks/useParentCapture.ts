/**
 * useParentCapture — store for confirmed parent-capture items.
 *
 * Persists to the Supabase `parent_items` table (parent-only RLS,
 * migrations/019_parent_capture.sql). Durable + synced across the parent's
 * devices. The hook's public shape is unchanged, so the screens don't change.
 *
 * Gated by FEATURE_PARENT_CAPTURE — see docs/sessions/parent-capture/.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import {
  childTaskFieldsFromParsed,
  groupByBucket,
  recencyPartition,
  todayISO,
} from '../lib/parentCapture/captureMapping';
import type { FamilyChild, ParentItem, ParsedItem } from '../types/parentCapture';

const SELECT_COLS =
  'id, family_id, created_by, title, type, owner, child_id, child_name, child_task_id, due_date, due_time, recurrence, location, bring, event_type, status, reminder_opt_in, confidence, created_at';

function rowToItem(r: Record<string, any>): ParentItem {
  return {
    id: r.id,
    familyId: r.family_id,
    title: r.title,
    type: r.type,
    owner: r.owner,
    childId: r.child_id ?? null,
    childName: r.child_name ?? null,
    dueDate: r.due_date ?? null,
    dueTime: r.due_time ? String(r.due_time).slice(0, 5) : null, // "HH:MM"
    recurrence: r.recurrence ?? null,
    location: r.location ?? null,
    bring: Array.isArray(r.bring) ? r.bring : [],
    eventType: r.event_type,
    status: r.status,
    reminderOptIn: !!r.reminder_opt_in,
    confidence: r.confidence,
    childTaskId: r.child_task_id ?? null,
    createdAt: r.created_at,
  };
}

function itemToInsert(it: ParentItem, familyId: string, createdBy: string | null) {
  return {
    family_id: familyId,
    created_by: createdBy,
    title: it.title,
    type: it.type,
    owner: it.owner,
    child_id: it.childId,
    child_name: it.childName,
    child_task_id: it.childTaskId ?? null,
    due_date: it.dueDate,
    due_time: it.dueTime,
    recurrence: it.recurrence,
    location: it.location,
    bring: it.bring,
    event_type: it.eventType,
    status: it.status,
    reminder_opt_in: it.reminderOptIn,
    confidence: it.confidence,
  };
}

function changesToDb(c: Partial<ParentItem>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (c.title !== undefined) db.title = c.title;
  if (c.status !== undefined) db.status = c.status;
  if (c.reminderOptIn !== undefined) db.reminder_opt_in = c.reminderOptIn;
  if (c.childTaskId !== undefined) db.child_task_id = c.childTaskId;
  if (c.childId !== undefined) db.child_id = c.childId;
  if (c.childName !== undefined) db.child_name = c.childName;
  if (c.dueDate !== undefined) db.due_date = c.dueDate;
  if (c.dueTime !== undefined) db.due_time = c.dueTime;
  return db;
}

export function useParentCapture() {
  const { familyId, profile } = useAuth();
  const [allItems, setAllItems] = useState<ParentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!familyId) {
      setAllItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('parent_items')
      .select(SELECT_COLS)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });
    if (error) console.error('[useParentCapture] load error:', error.message);
    setAllItems(((data ?? []) as Record<string, any>[]).map(rowToItem));
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  const addItems = useCallback(
    async (items: ParentItem[]) => {
      if (!familyId || items.length === 0) return;
      const payloads = items.map((it) => itemToInsert(it, familyId, profile?.id ?? null));
      const { data, error } = await supabase
        .from('parent_items')
        .insert(payloads as never)
        .select(SELECT_COLS);
      if (error) {
        console.error('[useParentCapture] add error:', error.message);
        return;
      }
      const inserted = ((data ?? []) as Record<string, any>[]).map(rowToItem);
      setAllItems((prev) => [...inserted, ...prev]);
    },
    [familyId, profile?.id],
  );

  const updateItem = useCallback(async (id: string, changes: Partial<ParentItem>) => {
    setAllItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
    const db = changesToDb(changes);
    if (Object.keys(db).length === 0) return;
    const { error } = await supabase.from('parent_items').update(db as never).eq('id', id);
    if (error) console.error('[useParentCapture] update error:', error.message);
  }, []);

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
