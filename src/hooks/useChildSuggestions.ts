/**
 * useChildSuggestions — child→parent "deal-making" (pkg/child-suggest).
 *
 * Two hooks over the `child_suggestions` table:
 *   - useChildSuggestions(childId) — child side: submit a task/reward idea,
 *     list own ideas with status, withdraw an own idea.
 *   - usePendingSuggestions(childId?) — parent side: list open suggestions
 *     (pending + discussing) for the family, mark one "approved" (after the
 *     real task/reward has been created) or "discussing" ("let's talk").
 *
 * Design (BUFF_PRD §165/§227 "deal-making"; BUFF_VALUES Pillar 2): there is
 * NO decline. A parent either says yes (→ status 'approved', a real
 * task/reward is created on the parent screen) or "let's talk about it"
 * (→ status 'discussing'). A child may withdraw their own idea.
 *
 * The client is untyped (see integrations/supabase/client.ts), so inserts
 * are cast `as never`, consistent with the rest of the codebase.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export type SuggestionKind = 'task' | 'reward';
export type SuggestionStatus = 'pending' | 'discussing' | 'approved' | 'withdrawn';

export interface ChildSuggestion {
  id:                string;
  family_id:         string;
  child_id:          string;
  kind:              SuggestionKind;
  title:             string;
  emoji:             string | null;
  status:            SuggestionStatus;
  created_at:        string;
  resolved_at:       string | null;
  resolved_by:       string | null;
  created_entity_id: string | null;
}

const SELECT_COLS =
  'id, family_id, child_id, kind, title, emoji, status, created_at, resolved_at, resolved_by, created_entity_id';

// ─── Child side ───────────────────────────────────────────────────────────────

interface SubmitInput {
  kind:   SuggestionKind;
  title:  string;
  emoji?: string | null;
}

export function useChildSuggestions(childId: string | null) {
  const { familyId } = useAuth();
  const [suggestions, setSuggestions] = useState<ChildSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!childId) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('child_suggestions')
      .select(SELECT_COLS)
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    if (error) console.error('[useChildSuggestions] fetch error:', error.message);
    setSuggestions((data ?? []) as ChildSuggestion[]);
    setLoading(false);
  }, [childId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  const submit = useCallback(
    async ({ kind, title, emoji }: SubmitInput): Promise<{ error: Error | null }> => {
      if (!familyId || !childId) return { error: new Error('missing family or child') };
      const trimmed = title.trim();
      if (!trimmed) return { error: new Error('empty title') };

      const { error } = await supabase.from('child_suggestions').insert({
        family_id: familyId,
        child_id:  childId,
        kind,
        title:     trimmed,
        emoji:     kind === 'reward' ? (emoji?.trim() || null) : null,
      } as never);

      if (error) {
        console.error('[useChildSuggestions] submit error:', error.message);
        return { error: error as unknown as Error };
      }
      await refetch();
      return { error: null };
    },
    [familyId, childId, refetch],
  );

  const withdraw = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      // Optimistic: drop it from the list immediately.
      setSuggestions(prev => prev.filter(s => s.id !== id));
      const { error } = await supabase
        .from('child_suggestions')
        .update({ status: 'withdrawn' } as never)
        .eq('id', id);
      if (error) {
        console.error('[useChildSuggestions] withdraw error:', error.message);
        await refetch();
        return { error: error as unknown as Error };
      }
      return { error: null };
    },
    [refetch],
  );

  return { suggestions, loading, submit, withdraw, refetch };
}

// ─── Parent side ────────────────────────────────────────────────────────────

export function usePendingSuggestions(childId?: string | null) {
  const { familyId, profile } = useAuth();
  const [suggestions, setSuggestions] = useState<ChildSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!familyId) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    let query = supabase
      .from('child_suggestions')
      .select(SELECT_COLS)
      .eq('family_id', familyId)
      .in('status', ['pending', 'discussing'])
      .order('created_at', { ascending: false });
    if (childId) query = query.eq('child_id', childId);

    const { data, error } = await query;
    if (error) console.error('[usePendingSuggestions] fetch error:', error.message);
    setSuggestions((data ?? []) as ChildSuggestion[]);
    setLoading(false);
  }, [familyId, childId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  // Called by the parent screen AFTER the real task/reward row has been created.
  const markApproved = useCallback(
    async (id: string, createdEntityId: string): Promise<{ error: Error | null }> => {
      setSuggestions(prev => prev.filter(s => s.id !== id));
      const { error } = await supabase
        .from('child_suggestions')
        .update({
          status:            'approved',
          resolved_at:       new Date().toISOString(),
          resolved_by:       profile?.id ?? null,
          created_entity_id: createdEntityId,
        } as never)
        .eq('id', id);
      if (error) {
        console.error('[usePendingSuggestions] markApproved error:', error.message);
        await refetch();
        return { error: error as unknown as Error };
      }
      return { error: null };
    },
    [profile?.id, refetch],
  );

  // "Let's talk about it" — not a decline. Surfaces a warm conversation prompt
  // to the child; the idea stays open until the parent later approves it.
  const markDiscussing = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      setSuggestions(prev =>
        prev.map(s => (s.id === id ? { ...s, status: 'discussing' } : s)),
      );
      const { error } = await supabase
        .from('child_suggestions')
        .update({
          status:      'discussing',
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.id ?? null,
        } as never)
        .eq('id', id);
      if (error) {
        console.error('[usePendingSuggestions] markDiscussing error:', error.message);
        await refetch();
        return { error: error as unknown as Error };
      }
      return { error: null };
    },
    [profile?.id, refetch],
  );

  return { suggestions, loading, markApproved, markDiscussing, refetch };
}
