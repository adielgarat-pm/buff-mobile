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
        .select('vibe_level, low_power_mode, parent_sos_sent, vibe_shared_with_parent, instant_buff_awarded, vibe_type, date')
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
  const vibeShared    = todayVibe?.vibe_shared_with_parent ?? false;

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
      vibe_shared_with_parent: false,
      instant_buff_awarded: false, // a fresh vibe row starts un-awarded
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
   * Flip vibe_shared_with_parent = true on today's row (pkg/vibe-share-
   * notification). The positive, kid-initiated counterpart of sendSos: it
   * fires migration 025's trigger → one child_vibe_shared notification per
   * parent. Caller should gate the share affordance on a non-low level
   * (isVibeShareable) and on `!vibeShared` so it fires at most once per day.
   *
   * Must run AFTER recordVibe has inserted today's row (the trigger is on
   * UPDATE) — the dashboards chain it: recordVibe().then(share && shareVibe()).
   */
  const shareVibe = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!familyId || !childId) {
      return { error: new Error('No familyId/childId available') };
    }
    if (!todayVibe) {
      return { error: new Error('No vibe row yet — cannot share vibe') };
    }

    setTodayVibe({ ...todayVibe, vibe_shared_with_parent: true });

    const { error: updateError } = await supabase
      .from('child_vibes')
      .update({ vibe_shared_with_parent: true } as never)
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .eq('date', todayKey);

    if (updateError) {
      console.error('[useDailyVibe] shareVibe failed:', updateError);
      await refetch();
      return { error: updateError as unknown as Error };
    }

    return { error: null };
  }, [familyId, childId, todayKey, todayVibe, refetch]);

  /**
   * Grant the +5 self-care Instant Buff — AT MOST ONCE per child per local day.
   * Uses the award_instant_buff RPC (migration 057), which is atomic AND
   * idempotent server-side (a one-shot flag on today's child_vibes row), so
   * reopening the app can no longer farm it (audit M6). The +5 amount is fixed
   * server-side. `already_awarded` is a SUCCESS (the self-care act happened; we
   * just don't double-credit) — never surface it as an error.
   */
  const awardInstantBuff = useCallback(async (): Promise<{
    error:      Error | null;
    newBalance: number | null;
  }> => {
    if (!familyId || !childId) {
      return { error: new Error('No familyId/childId available'), newBalance: null };
    }

    const { data, error } = await supabase.rpc('award_instant_buff', {
      p_child_id: childId,
      p_date:     todayKey,
    });

    if (error) {
      console.error('[useDailyVibe] awardInstantBuff RPC failed:', error);
      return { error: error as unknown as Error, newBalance: null };
    }
    const res = data as { ok: boolean; already_awarded?: boolean; new_balance?: number; error?: string } | null;
    if (!res?.ok) {
      console.error('[useDailyVibe] awardInstantBuff rejected:', res?.error);
      return { error: new Error(res?.error ?? 'award_failed'), newBalance: null };
    }

    // Reflect the now-set flag locally so the card stays hidden without a refetch.
    void refetch();
    return { error: null, newBalance: res.new_balance ?? null };
  }, [familyId, childId, todayKey, refetch]);

  return {
    // State
    todayVibe,
    loading,
    error,
    // Derived
    hasVibedToday,
    isLowPower,
    sosSent,
    vibeShared,
    // Instant Buff one-shot state (migration 057) — lets the card stay hidden
    // after a reload instead of re-appearing to be re-tapped (M6).
    instantBuffAwarded: todayVibe?.instant_buff_awarded ?? false,
    // Actions
    recordVibe,
    sendSos,
    shareVibe,
    awardInstantBuff,
    refetch,
  };
}
