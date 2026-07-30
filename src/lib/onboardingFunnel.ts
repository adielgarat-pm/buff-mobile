/**
 * onboardingFunnel — fire-and-forget instrumentation for the acquisition→
 * activation funnel (Phase 0 of onboarding-redesign).
 *
 * Writes to public.onboarding_events. The point is to see where families leak
 * BETWEEN "child created" and "child active" — the blind spot where the web PWA
 * dies (parent finishes setup, child never gets a working way in).
 *
 * Contract:
 *   - Never throws. Instrumentation must never break a user flow.
 *   - Skips silently when familyId is unknown — RLS requires a family scope, and
 *     the insert would be rejected anyway.
 *   - Backward-compatible with old app builds: they simply never write these
 *     rows (the table is invisible to them); no shared contract is changed.
 */
import { Platform } from 'react-native';
import { supabase } from '../integrations/supabase/client';

export type OnboardingEventType =
  | 'family_created'
  | 'child_created'
  | 'tasks_generated'
  | 'invite_shown'
  | 'invite_sent'
  | 'join_page_viewed'
  | 'child_first_open'
  | 'first_task_complete'
  | 'first_task_write_failed'
  | 'onboarding_resumed'
  | 'onboarding_abandoned_at_step'
  // Parent-capture ("Smart Organizer") usability funnel. Reuses this table
  // rather than adding a second event log — same family scope, same RLS, same
  // admin read policy. Tagged with source='parent_capture'.
  | 'capture_opened'
  | 'capture_consent_granted'
  // Discovery half of the same funnel (2026-07-29). Production showed that no
  // real family had ever run a capture, and we could not tell whether parents
  // never saw the entry card or saw it and were not convinced — opposite fixes.
  // These two make the difference visible. `source` = placement ('dashboard').
  /** The entry card actually rendered on the dashboard; deduped per app session. */
  | 'capture_entry_seen'
  /** The entry card was tapped. */
  | 'capture_entry_tapped'
  /** Parent tapped through to the WhatsApp community; `source` = placement. */
  | 'community_link_clicked'
  // AI coach insight funnel. These two are the ONLY parts of insight usage that
  // cannot be derived after the fact from table state (see scripts/insight-usage.sql):
  // a render and a tap leave no other trace. `source` = placement
  // ('dashboard' | 'insights_screen') on both.
  /** The AI insight card was actually rendered; `variant` = insight computed_at date. */
  | 'insight_viewed'
  /** The insight's CTA button was tapped; `variant` = cta_type. */
  | 'insight_cta_clicked'
  // Parent navigation audit (pkg/parent-ia-and-aha Phase 1) — "who are our
  // active parents and where do they go". `source` = tab route name (verbatim,
  // so it survives the tab rename), `method` = TabViewMethod, `variant` =
  // "{navSessionId}:{seq}" for per-session ordering. child_id is always null
  // (parent-surface telemetry only, never per-child — Pillar 2).
  | 'parent_tab_viewed';

/** How the parent tried to hand BUFF to the child's device. */
export type InviteMethod = 'qr' | 'https_link' | 'whatsapp' | 'copy' | 'share' | 'later_email';

/** How a parent tab came into focus, for the navigation audit. */
export type TabViewMethod = 'initial' | 'tab_press' | 'deep_link';

interface LogArgs {
  /** Required for RLS scope; the event is skipped if null/undefined. */
  familyId: string | null | undefined;
  eventType: OnboardingEventType;
  childId?: string | null;
  method?: InviteMethod | TabViewMethod | null;
  /** For first_task_complete: 'onboarding_first_task' (seed) vs 'child_authored'. */
  source?: string | null;
  /** Feature-flag / A-B cohort. */
  variant?: string | null;
  /** Acquisition context (utm/landing) captured on family_created. */
  acquisition?: Record<string, unknown> | null;
}

export async function logOnboardingEvent(args: LogArgs): Promise<void> {
  try {
    if (!args.familyId) return;
    await supabase.from('onboarding_events').insert({
      family_id:   args.familyId,
      child_id:    args.childId ?? null,
      event_type:  args.eventType,
      method:      args.method ?? null,
      source:      args.source ?? null,
      variant:     args.variant ?? null,
      acquisition: args.acquisition ?? null,
      platform:    Platform.OS,
    } as never);
  } catch {
    /* analytics must never break a flow */
  }
}
