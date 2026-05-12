/**
 * useAppSettings — Read/write the family's app_settings row.
 *
 * Source SPEC: docs/sessions/pause-mode/SPEC.md §Phases / Phase 1
 *
 * The app_settings table has one row per family. This hook fetches that
 * row, subscribes to realtime changes (so when one parent toggles pause
 * the other parent's device updates without a refresh), and exposes
 * actions to mutate pause state.
 *
 * Pause is the only piece of app_settings this hook surfaces directly
 * via convenient derived state. Other fields are accessible via
 * `settings` for callers that need them.
 *
 * Why centralize: pause logic is checked in multiple places (child task
 * gating, notification suppression, parent dashboard banner). One hook
 * = one source of truth.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface AppSettings {
  id: string;
  family_id: string;
  app_title: string;
  daily_goal: number;
  lesson_reminders_enabled: boolean;
  friday_enabled: boolean;
  pause_mode_active: boolean;
  pause_until: string | null;  // ISO timestamp or null = indefinite
  last_child_activity: string | null;
  updated_at: string;
}

export type PauseDuration =
  | { type: 'until'; days: number }  // pause_until = now() + N days
  | { type: 'indefinite' };           // pause_until = null

export function useAppSettings() {
  const { profile } = useAuth();
  const familyId = profile?.family_id ?? null;

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<Error | null>(null);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!familyId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle();

      if (queryError) {
        console.error('[useAppSettings] fetch error:', queryError);
        setError(queryError as unknown as Error);
        return;
      }

      setSettings(data as AppSettings | null);
    } catch (err) {
      console.error('[useAppSettings] fetch exception:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  // When one parent toggles pause, the other parent's UI should update
  // immediately. Subscribe to the app_settings row for this family.
  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`app-settings-${familyId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (payload.new) {
            setSettings(payload.new as AppSettings);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId]);

  // ── Derived: is pause currently active? ───────────────────────────────────
  // True when:
  //   pause_mode_active = true
  //   AND (pause_until IS NULL OR pause_until > now())
  //
  // If pause_until is in the past, treat as auto-resumed — the next
  // togglePause or refetch will clean up the stale state. Until then,
  // the UI behaves as resumed (no pause empty state shown).
  const isPauseActive = (() => {
    if (!settings?.pause_mode_active) return false;
    if (!settings.pause_until) return true; // indefinite pause
    return new Date(settings.pause_until) > new Date();
  })();

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Pause the app for the family. `duration` controls auto-resume timing. */
  const togglePause = useCallback(async (duration: PauseDuration): Promise<{ error: Error | null }> => {
    if (!familyId) return { error: new Error('No family_id available') };

    const pauseUntil =
      duration.type === 'indefinite'
        ? null
        : new Date(Date.now() + duration.days * 24 * 60 * 60 * 1000).toISOString();

    // Optimistic update
    if (settings) {
      setSettings({ ...settings, pause_mode_active: true, pause_until: pauseUntil });
    }

    const { error: updateError } = await supabase
      .from('app_settings')
      .update({ pause_mode_active: true, pause_until: pauseUntil } as never)
      .eq('family_id', familyId);

    if (updateError) {
      console.error('[useAppSettings] togglePause failed:', updateError);
      await refetch(); // roll back optimistic update
      return { error: updateError as unknown as Error };
    }

    return { error: null };
  }, [familyId, settings, refetch]);

  /** Resume the app immediately, regardless of pause_until. */
  const resumePause = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!familyId) return { error: new Error('No family_id available') };

    // Optimistic update
    if (settings) {
      setSettings({ ...settings, pause_mode_active: false, pause_until: null });
    }

    const { error: updateError } = await supabase
      .from('app_settings')
      .update({ pause_mode_active: false, pause_until: null } as never)
      .eq('family_id', familyId);

    if (updateError) {
      console.error('[useAppSettings] resumePause failed:', updateError);
      await refetch();
      return { error: updateError as unknown as Error };
    }

    return { error: null };
  }, [familyId, settings, refetch]);

  /** Update last_child_activity to now (used by child screens). */
  const recordChildActivity = useCallback(async (): Promise<void> => {
    if (!familyId) return;

    const now = new Date().toISOString();

    // Optimistic
    if (settings) {
      setSettings({ ...settings, last_child_activity: now });
    }

    await supabase
      .from('app_settings')
      .update({ last_child_activity: now } as never)
      .eq('family_id', familyId);
  }, [familyId, settings]);

  return {
    // State
    settings,
    loading,
    error,
    // Derived
    isPauseActive,
    pauseUntil: settings?.pause_until ?? null,
    pauseModeActive: settings?.pause_mode_active ?? false,
    lastChildActivity: settings?.last_child_activity ?? null,
    // Actions
    togglePause,
    resumePause,
    recordChildActivity,
    refetch,
  };
}
