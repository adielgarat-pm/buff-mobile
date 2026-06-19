/**
 * useRewardLoopHealth — the felt-value signal for the Parent Insights screen.
 *
 * BUFFs only motivate if they convert to a real win. A child who earns but never
 * redeems stops feeling the value and disengages — a leading churn signal (PRD
 * "always close to a win"). This hook gathers the raw reward-loop signals so
 * selectInsightFraming can decide whether to nudge a small redemption (Layer C0).
 *
 * Reads only (no schema change):
 *   - store_rewards     → how many rewards are defined + the cheapest cost
 *   - reward_redemptions → approved redemptions in the last 14 days
 *   - credit_vault      → the child's current BUFF balance
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { RewardLoopSignals } from '../utils/insightFraming';

const REDEMPTION_WINDOW_DAYS = 14;

function empty(): RewardLoopSignals {
  return {
    rewardsCount:     0,
    cheapestCost:     null,
    balance:          0,
    redemptions14d:   0,
    isActiveRecently: false,
  };
}

/**
 * @param isActiveRecently passed in from useWeeklyStats (any active day in the
 *        last 7) — the C0b "earning but not redeeming" case only fires for a
 *        child who is actually showing up.
 */
export function useRewardLoopHealth(childId: string | null, isActiveRecently: boolean) {
  const { familyId } = useAuth();
  const [signals, setSignals] = useState<RewardLoopSignals>(empty());
  const [loading, setLoading] = useState(true);

  const analyze = useCallback(async () => {
    if (!familyId || !childId) {
      setSignals(empty());
      setLoading(false);
      return;
    }

    try {
      const since = new Date();
      since.setDate(since.getDate() - REDEMPTION_WINDOW_DAYS);
      const sinceIso = since.toISOString();

      const [rewardsRes, redemptionsRes, vaultRes] = await Promise.all([
        // Rewards still available to work toward (not already redeemed-out).
        supabase
          .from('store_rewards')
          .select('credits_needed')
          .eq('child_id', childId)
          .eq('is_redeemed', false),
        // Approved redemptions in the window (the loop actually closing).
        supabase
          .from('reward_redemptions')
          .select('id')
          .eq('child_id', childId)
          .eq('status', 'approved')
          .gte('resolved_at', sinceIso),
        supabase
          .from('credit_vault')
          .select('total_balance')
          .eq('family_id', familyId)
          .eq('child_id', childId)
          .maybeSingle(),
      ]);

      const rewards = (rewardsRes.data ?? []) as { credits_needed: number }[];
      const cheapestCost = rewards.length
        ? Math.min(...rewards.map(r => r.credits_needed))
        : null;

      setSignals({
        rewardsCount:     rewards.length,
        cheapestCost,
        balance:          (vaultRes.data as { total_balance?: number } | null)?.total_balance ?? 0,
        redemptions14d:   (redemptionsRes.data ?? []).length,
        isActiveRecently,
      });
    } catch (err) {
      console.error('[useRewardLoopHealth] error:', err);
      setSignals(empty());
    } finally {
      setLoading(false);
    }
  }, [familyId, childId, isActiveRecently]);

  useEffect(() => {
    setLoading(true);
    analyze();
  }, [analyze]);

  return { signals, loading, refetch: analyze };
}
