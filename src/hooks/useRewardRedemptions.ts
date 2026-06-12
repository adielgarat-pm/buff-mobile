/**
 * useRewardRedemptions — child→parent reward redemption flow (pkg/reward-redemption).
 *
 * Two hooks over the `reward_redemptions` ledger table:
 *   - useRewardRedemptions(childId) — child side: request to redeem an existing
 *     reward (only ones they can afford), see their own open requests keyed by
 *     reward, and withdraw an own request.
 *   - usePendingRedemptions(childId?) — parent side: list NEW requests
 *     ('requested') for the family, approve one (atomic deduct via RPC) or
 *     "let's talk about it" (status 'discussing' — leaves the parent's view).
 *
 * Philosophy (BUFF_VALUES Pillar 2, mirror of useChildSuggestions): there is NO
 * decline. A parent either says "yes, let's do it" (→ approved, points deducted)
 * or "let's talk about it" (→ discussing). "Let's talk" is a two-sided RESET, not
 * a persistent open state: it leaves the parent's list immediately, the child
 * sees "your parent wants to talk" and taps "got it" (→ 'discussed', leaves the
 * child's view too), and after the IRL talk the child re-requests if they still
 * want it. The parent does NOT approve a discussed item directly. A child may
 * also withdraw their own request. Rewards are repeatable — the reward stays in
 * the catalog and can be redeemed again once affordable.
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

export type RedemptionStatus =
  | 'requested'   // child asked, awaiting parent
  | 'discussing'  // parent tapped "let's talk", awaiting the child to acknowledge
  | 'discussed'   // child tapped "got it" — closed; reward is re-requestable
  | 'approved'    // parent approved + deducted (terminal)
  | 'withdrawn';  // child cancelled (terminal)

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

  /**
   * "Got it 👍" — the child acknowledges that their parent wants to talk about
   * the request. Moves it to 'discussed' (terminal), which removes it from the
   * child's open list. The reward stays in the catalog and can be re-requested
   * after they talk. NOT a decline — it's a clean reset.
   */
  const acknowledge = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      // Optimistic: drop it from the open list immediately.
      setOpen(prev => prev.filter(r => r.id !== id));
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status: 'discussed' } as never)
        .eq('id', id);
      if (error) {
        console.error('[useRewardRedemptions] acknowledge error:', error.message);
        await refetch();
        return { error: error as unknown as Error };
      }
      return { error: null };
    },
    [refetch],
  );

  return { open, loading, openForReward, request, withdraw, acknowledge, refetch };
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
    // Only NEW requests reach the parent. Once they tap "let's talk" the row
    // becomes 'discussing' and leaves their view — "let's talk" is a reset, not
    // a persistent queue item (the child re-requests after the talk).
    let query = supabase
      .from('reward_redemptions')
      .select(SELECT_COLS)
      .eq('family_id', familyId)
      .eq('status', 'requested')
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

  /**
   * "Let's talk about it" — NOT a decline, and NOT a deduction. Moves the row to
   * 'discussing' (the child will see "your parent wants to talk") and removes it
   * from the parent's list immediately — it's a reset, not a queue item.
   */
  const markDiscussing = useCallback(
    async (id: string): Promise<{ error: Error | null }> => {
      // Optimistic: drop it from the pending list immediately.
      setPending(prev => prev.filter(r => r.id !== id));
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
