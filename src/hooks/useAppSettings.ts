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
import { isPauseActive as derivePauseActive } from '../utils/pauseUtils';

// Monotonic counter → each realtime channel gets a guaranteed-unique topic name.
// Date.now() alone can collide when an effect re-runs within the same millisecond
// (React dev double-invoke / fast familyId change): supabase then returns the
// already-subscribed channel, so the chained .on() runs "after subscribe()" and
// throws — which crashes (white-screens) the mounting screen. A counter can't collide.
let realtimeChannelSeq = 0;

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
  // Notification preferences (Phase 3a schema; enforced server-side in the
  // push-notification-fanout Edge Function — Phase 3b).
  notif_parent_alerts: boolean;     // def true  — alerts addressed to the parent
  notif_child_reminders: boolean;   // def false — kid engagement reminders
  notif_anchor_nudges: boolean;     // def true  — anchor-recovery nudges
  notif_activation_nudges: boolean; // def true  — activation nudges
  updated_at: string;
}

/** The user-togglable notification preference columns. */
export type NotifPrefKey =
  | 'notif_parent_alerts'
  | 'notif_child_reminders'
  | 'notif_anchor_nudges'
  | 'notif_activation_nudges';

export type PauseDuration =
  | { type: 'until'; days: number }  // pause_until = local midnight, N calendar days out ("today" = 1 = end of today)
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
      .channel(`app-settings-${familyId}-${Date.now()}-${++realtimeChannelSeq}`)
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
  // Pure logic extracted to src/utils/pauseUtils.ts so it's testable.
  // See that file for the full rule set and test coverage.
  const isPauseActive = derivePauseActive(settings);

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Pause the app for the family. `duration` controls auto-resume timing. */
  const togglePause = useCallback(async (duration: PauseDuration): Promise<{ error: Error | null }> => {
    if (!familyId) return { error: new Error('No family_id available') };

    // Calendar-day semantics: a pause always ends at LOCAL midnight, not a
    // rolling N×24h from the tap time. "Just today" (days = 1) → end of today
    // (tonight's midnight); "3 days" → 3 full calendar days; "1 week" → 7.
    let pauseUntil: string | null = null;
    if (duration.type === 'until') {
      const end = new Date();
      end.setHours(0, 0, 0, 0);                 // local start of today
      end.setDate(end.getDate() + duration.days); // local midnight, N calendar days out
      pauseUntil = end.toISOString();
    }

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

  /**
   * Set a notification preference column for the family. Optimistic + rollback.
   * The server-side Edge Function (push-notification-fanout) reads these before
   * dispatch and suppresses channels whose preference is off (Phase 3b).
   */
  const setNotifPref = useCallback(async (key: NotifPrefKey, value: boolean): Promise<{ error: Error | null }> => {
    if (!familyId) return { error: new Error('No family_id available') };

    // Optimistic
    if (settings) setSettings({ ...settings, [key]: value });

    const { error: updateError } = await supabase
      .from('app_settings')
      .update({ [key]: value } as never)
      .eq('family_id', familyId);

    if (updateError) {
      console.error(`[useAppSettings] setNotifPref(${key}) failed:`, updateError);
      await refetch(); // roll back optimistic update
      return { error: updateError as unknown as Error };
    }
    return { error: null };
  }, [familyId, settings, refetch]);

  /**
   * Toggle whether Friday is a school day for this family
   * (app_settings.friday_enabled). Family-level, mirroring Lovable.
   */
  const setFridayEnabled = useCallback(async (enabled: boolean): Promise<{ error: Error | null }> => {
    if (!familyId) return { error: new Error('No family_id available') };

    // Optimistic
    if (settings) setSettings({ ...settings, friday_enabled: enabled });

    const { error: updateError } = await supabase
      .from('app_settings')
      .update({ friday_enabled: enabled } as never)
      .eq('family_id', familyId);

    if (updateError) {
      console.error('[useAppSettings] setFridayEnabled failed:', updateError);
      await refetch(); // roll back optimistic update
      return { error: updateError as unknown as Error };
    }
    return { error: null };
  }, [familyId, settings, refetch]);

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
    fridayEnabled: settings?.friday_enabled ?? false,
    // Notification prefs (defaults mirror the DB column defaults)
    notifParentAlerts: settings?.notif_parent_alerts ?? true,
    notifChildReminders: settings?.notif_child_reminders ?? false,
    notifAnchorNudges: settings?.notif_anchor_nudges ?? true,
    notifActivationNudges: settings?.notif_activation_nudges ?? true,
    // Actions
    togglePause,
    resumePause,
    recordChildActivity,
    setFridayEnabled,
    setNotifPref,
    refetch,
  };
}
