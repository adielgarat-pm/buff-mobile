/**
 * useRewardRedemptions — child→parent reward redemption flow (pkg/reward-redemption).
 *
 * Two hooks over the `reward_redemptions` ledger table:
 *   - useRewardRedemptions(childId) — child side: request to redeem an existing
 *     reward (only ones they can afford), see their own open requests keyed by
 *     reward, and withdraw an own request.
 *   - usePendingRedemptions(childId?) — parent side: list open requests
 *     (requested + discussing) for the family, approve one (atomic deduct via
 *     RPC) or "let's talk about it" (status 'discussing').
 *
 * Philosophy (BUFF_VALUES Pillar 2, mirror of useChildSuggestions): there is NO
 * decline. A parent either says "yes, let's do it" (→ approved, points deducted)
 * or "let's talk about it" (→ discussing; the request stays open, points are NOT
 * touched). A child may withdraw their own request. Rewards are repeatable — the
 * reward stays in the catalog and can be redeemed again once affordable.
 *
 * The deduction is done by a SECURITY DEFINER RPC (approve_reward_redemption)
 * that locks the vault row and checks funds atomically — children only have
 * SELECT on credit_vault, and the balance must never be mutated non-atomically.
 *
 * The client is untyped (see integrations/supabase/client.ts), so inserts are
 * cast `as never`, consistent with the rest of the codebase.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export type RedemptionStatus = 'requested' | 'discussing' | 'approved' | 'withdrawn';

export interface RewardRedemption {
  id:            string;
  family_id:     string;
  child_id:      string;
  reward_id:     string;
  reward_title:  string;
  credits_spent: number;
  status:        RedemptionStatus;
  requested_at:  string;
  resolved_at:   string | null;
  resolved_by:   string | null;
}

const SELECT_COLS =
  'id, family_id, child_id, reward_id, reward_title, credits_spent, status, requested_at, resolved_at, resolved_by';

/** Minimal reward shape needed to open a redemption request. */
export interface RedeemableReward {
  id:             string;
  title:          string;
  credits_needed: number;
}

// ─── Child side ───────────────────────────────────────────────────────────────

export function useRewardRedemptions(childId: string | null) {
  const { familyId } = useAuth();
  const [open, setOpen] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!childId) {
      setOpen([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('reward_redemptions')
      .select(SELECT_COLS)
      .eq('child_id', childId)
      .in('status', ['requested', 'discussing'])
      .order('requested_at', { ascending: false });
    if (error) console.error('[useRewardRedemptions] fetch error:', error.message);
    setOpen((data ?? []) as RewardRedemption[]);
    setLoading(false);
  }, [childId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  /** Open redemption (requested/discussing) for a given reward, if any. */
  const openForReward = useCallback(
    (rewardId: string): RewardRedemption | undefined =>
      open.find(r => r.reward_id === rewardId),
    [open],
  );

  const request = useCallback(
    async (reward: RedeemableReward): Promise<{ error: Error | null }> => {
      if (!familyId || !childId) return { error: new Error('missing family or child') };

      const { error } = await supabase.from('reward_redemptions').insert({
        family_id:     familyId,
        child_id:      childId,
        reward_id:     reward.id,
        reward_title:  reward.title,
        credits_spent: reward.credits_needed,
      } as never);

      if (error) {
        console.error('[useRewardRedemptions] request error:', error.message);
        return { error: error as unknown as Error };
      }
      await refetch();
      return { error: null };
    },
    [familyId, childId, refetch],
  );

  const withdraw = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      // Optimistic: drop it from the open list immediately.
      setOpen(prev => prev.filter(r => r.id !== id));
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status: 'withdrawn' } as never)
        .eq('id', id);
      if (error) {
        console.error('[useRewardRedemptions] withdraw error:', error.message);
        await refetch();
        return { error: error as unknown as Error };
      }
      return { error: null };
    },
    [refetch],
  );

  return { open, loading, openForReward, request, withdraw, refetch };
}

// ─── Parent side ──────────────────────────────────────────────────────────────

export interface ApproveResult {
  ok:          boolean;
  error?:      string;
  new_balance?: number;
  balance?:    number;
  needed?:     number;
}

export function usePendingRedemptions(childId?: string | null) {
  const { familyId } = useAuth();
  const [pending, setPending] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!familyId) {
      setPending([]);
      setLoading(false);
      return;
    }
    let query = supabase
      .from('reward_redemptions')
      .select(SELECT_COLS)
      .eq('family_id', familyId)
      .in('status', ['requested', 'discussing'])
      .order('requested_at', { ascending: false });
    if (childId) query = query.eq('child_id', childId);

    const { data, error } = await query;
    if (error) console.error('[usePendingRedemptions] fetch error:', error.message);
    setPending((data ?? []) as RewardRedemption[]);
    setLoading(false);
  }, [familyId, childId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  /** "Yes, let's do it" — atomic deduct + mark approved via SECURITY DEFINER RPC. */
  const approve = useCallback(
    async (id: string): Promise<ApproveResult> => {
      const { data, error } = await supabase.rpc('approve_reward_redemption', {
        p_redemption_id: id,
      });
      if (error) {
        console.error('[usePendingRedemptions] approve error:', error.message);
        return { ok: false, error: error.message };
      }
      const result = (data ?? { ok: false, error: 'no_result' }) as ApproveResult;
      // Drop it from the list on success (it left the open set).
      if (result.ok) setPending(prev => prev.filter(r => r.id !== id));
      else await refetch();
      return result;
    },
    [refetch],
  );

  /** "Let's talk about it" — NOT a decline. Stays open; points untouched. */
  const markDiscussing = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      setPending(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'discussing' } : r)),
      );
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status: 'discussing' } as never)
        .eq('id', id);
      if (error) {
        console.error('[usePendingRedemptions] markDiscussing error:', error.message);
        await refetch();
        return { error: error as unknown as Error };
      }
      return { error: null };
    },
    [refetch],
  );

  return { pending, loading, approve, markDiscussing, refetch };
}
