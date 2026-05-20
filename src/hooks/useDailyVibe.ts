/**
 * useDailyVibe — read/write the child's vibe row for today.
 *
 * Source SPEC: docs/sessions/daily-vibe-check/SPEC.md (Phase 1)
 *
 * One row per child per day in public.child_vibes (date is TEXT
 * 'YYYY-MM-DD', matching the existing daily_progress convention).
 * Inserting a vibe persists `low_power_mode` based on the level
 * chosen, so the row is source of truth and parent-side queries are
 * trivial.
 *
 * What this hook does NOT do:
 *   - shouldPrompt composition — caller does `!hasVibedToday &&
 *     !isPauseActive` (Pause-Mode wins, per SPEC Scenario C). Keeping
 *     this hook focused on vibe data avoids pulling app_settings here.
 *   - Notification insert on SOS — `sendSos()` only flips
 *     `parent_sos_sent = true` in Phase 1. The parent notification
 *     surface lands in Phase 4 of this package.
 *
 * Mirrors useAppSettings.ts shape: fetch + realtime + optimistic
 * action functions.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import {
  getTodayKey,
  isLowPowerActive,
  computeLowPowerForLevel,
  type VibeSnapshot,
  type VibeLevel,
  type VibeType,
} from '../utils/vibeUtils';

export type { VibeLevel, VibeType, VibeSnapshot };

/** BUFFs awarded by Instant Buff self-care card. Locked at SPEC § Decisions OQ5. */
export const INSTANT_BUFF_AMOUNT = 5;

export function useDailyVibe(childId: string | null) {
  const { familyId } = useAuth();
  const todayKey = getTodayKey();

  const [todayVibe, setTodayVibe] = useState<VibeSnapshot | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<Error | null>(null);

  // ── Initial fetch ────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!familyId || !childId) {
      setTodayVibe(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('child_vibes')
        .select('vibe_level, low_power_mode, parent_sos_sent, vibe_type, date')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .eq('date', todayKey)
        .maybeSingle();

      if (queryError) {
        console.error('[useDailyVibe] fetch error:', queryError);
        setError(queryError as unknown as Error);
        return;
      }

      setTodayVibe(data as VibeSnapshot | null);
    } catch (err) {
      console.error('[useDailyVibe] fetch exception:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [familyId, childId, todayKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // ── Realtime subscription ────────────────────────────────────────────
  // Subscribe to all child_vibes for this child; filter by today in the
  // handler. (postgres_changes only supports a single filter clause.)
  useEffect(() => {
    if (!familyId || !childId) return;

    const channel = supabase
      .channel(`child-vibes-${childId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'child_vibes',
          filter: `child_id=eq.${childId}`,
        },
        (payload) => {
          const row = payload.new as Partial<VibeSnapshot> | null;
          if (!row || row.date !== todayKey) return;
          setTodayVibe(row as VibeSnapshot);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, childId, todayKey]);

  // ── Derived ──────────────────────────────────────────────────────────
  const hasVibedToday = !!todayVibe;
  const isLowPower    = isLowPowerActive(todayVibe);
  const sosSent       = todayVibe?.parent_sos_sent ?? false;

  // ── Actions ──────────────────────────────────────────────────────────

  /**
   * Insert today's vibe row. Persists `low_power_mode` based on level
   * (see SPEC § Decisions NEW-2).
   *
   * Idempotent at the call-site: if a row already exists for today,
   * the insert will conflict on (child_id, date) at the DB level — for
   * Phase 1 we trust the UI to gate via `hasVibedToday`. If we hit
   * dupes in practice we'll add upsert in a later phase.
   */
  const recordVibe = useCallback(async (
    level: VibeLevel,
    type:  VibeType,
  ): Promise<{ error: Error | null }> => {
    if (!familyId || !childId) {
      return { error: new Error('No familyId/childId available') };
    }

    const lowPower = computeLowPowerForLevel(level);
    const optimisticRow: VibeSnapshot = {
      vibe_level:      level,
      low_power_mode:  lowPower,
      parent_sos_sent: false,
      vibe_type:       type,
      date:            todayKey,
    };
    setTodayVibe(optimisticRow);

    const { error: insertError } = await supabase
      .from('child_vibes')
      .insert({
        family_id:      familyId,
        child_id:       childId,
        date:           todayKey,
        vibe_level:     level,
        vibe_type:      type,
        low_power_mode: lowPower,
      } as never);

    if (insertError) {
      console.error('[useDailyVibe] recordVibe failed:', insertError);
      await refetch();  // roll back optimistic
      return { error: insertError as unknown as Error };
    }

    return { error: null };
  }, [familyId, childId, todayKey, refetch]);

  /**
   * Flip parent_sos_sent = true on today's row. Caller should gate the
   * SOS button on `isLowPower && !sosSent` so it can only fire once.
   *
   * The notification surfacing to the parent is Phase 4 of this package.
   */
  const sendSos = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!familyId || !childId) {
      return { error: new Error('No familyId/childId available') };
    }
    if (!todayVibe) {
      return { error: new Error('No vibe row yet — cannot send SOS') };
    }

    setTodayVibe({ ...todayVibe, parent_sos_sent: true });

    const { error: updateError } = await supabase
      .from('child_vibes')
      .update({ parent_sos_sent: true } as never)
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .eq('date', todayKey);

    if (updateError) {
      console.error('[useDailyVibe] sendSos failed:', updateError);
      await refetch();
      return { error: updateError as unknown as Error };
    }

    return { error: null };
  }, [familyId, childId, todayKey, todayVibe, refetch]);

  /**
   * Add INSTANT_BUFF_AMOUNT BUFFs to the child's credit_vault.
   * Mirrors the upsert pattern from useChildProgress.updateTotalBalance.
   *
   * Returns the new balance on success.
   */
  const awardInstantBuff = useCallback(async (): Promise<{
    error:      Error | null;
    newBalance: number | null;
  }> => {
    if (!familyId || !childId) {
      return { error: new Error('No familyId/childId available'), newBalance: null };
    }

    const { data: existing, error: selectError } = await supabase
      .from('credit_vault')
      .select('id, total_balance')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .maybeSingle();

    if (selectError) {
      console.error('[useDailyVibe] awardInstantBuff select failed:', selectError);
      return { error: selectError as unknown as Error, newBalance: null };
    }

    const currentBalance = existing?.total_balance ?? 0;
    const newBalance     = currentBalance + INSTANT_BUFF_AMOUNT;

    if (existing) {
      const { error: updateError } = await supabase
        .from('credit_vault')
        .update({ total_balance: newBalance } as never)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[useDailyVibe] awardInstantBuff update failed:', updateError);
        return { error: updateError as unknown as Error, newBalance: null };
      }
    } else {
      const { error: insertError } = await supabase
        .from('credit_vault')
        .insert({
          family_id:     familyId,
          child_id:      childId,
          total_balance: newBalance,
        } as never);

      if (insertError) {
        console.error('[useDailyVibe] awardInstantBuff insert failed:', insertError);
        return { error: insertError as unknown as Error, newBalance: null };
      }
    }

    return { error: null, newBalance };
  }, [familyId, childId]);

  return {
    // State
    todayVibe,
    loading,
    error,
    // Derived
    hasVibedToday,
    isLowPower,
    sosSent,
    // Actions
    recordVibe,
    sendSos,
    awardInstantBuff,
    refetch,
  };
}
