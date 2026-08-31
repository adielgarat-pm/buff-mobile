import { useEffect } from 'react';

import { logOnboardingEvent } from '../lib/onboardingFunnel';

/**
 * useStepReachedLog — records that a parent actually REACHED a given onboarding
 * wizard step, once per family per JS session.
 *
 * Why this exists (pkg/onboarding-draft-and-funnel-telemetry, 2026-08-31):
 * `family_created` fires automatically at signup, but the child is only persisted
 * at Step 5 (`child_created` in UStep5_Preview). A parent who quits during Steps
 * 1-4 leaves an empty family and NO trace of which step lost them — the ~20%
 * "family created, no child" leak was structurally invisible. This logs each
 * data-entry step mount so the drop step becomes derivable: the max step reached
 * for a family that never fired `child_created` (see scripts/onboarding-funnel.sql).
 *
 * Contract (same posture as useInsightViewLog / entryTelemetry):
 *   - Fires at most once per (family, step) per JS session. A module-level Set —
 *     NOT a component ref and NOT persisted — is the correct "session" scope: a
 *     parent bouncing back and forth between steps in one sitting is one exposure
 *     per step; tomorrow's cold start is a fresh funnel. A persisted "seen once
 *     ever" flag would hide repeat abandonment, which is the signal we want.
 *   - Skips silently when familyId is unknown (RLS needs a family scope, and
 *     `logOnboardingEvent` would drop the row anyway). familyId exists by Step 1
 *     because the family is created at signup.
 *   - Fire-and-forget; `logOnboardingEvent` never throws.
 *   - child_id is deliberately null — parent-surface telemetry only (Pillar 2),
 *     same as parent_tab_viewed.
 */

/** Onboarding data-entry steps, in order. The value is the logged `variant`. */
export type OnboardingStepId =
  | '1_child_profile'
  | '2_goal'
  | '3_challenges'
  | '4_motivator'
  | '5_preview';

/** `familyId|stepId` keys already logged in this JS session. */
const loggedThisSession = new Set<string>();

export function useStepReachedLog(
  stepId: OnboardingStepId,
  familyId: string | null | undefined,
): void {
  useEffect(() => {
    if (!familyId) return;
    const key = `${familyId}|${stepId}`;
    if (loggedThisSession.has(key)) return;
    loggedThisSession.add(key);
    void logOnboardingEvent({
      familyId,
      eventType: 'onboarding_step_reached',
      source:    'onboarding',
      variant:   stepId,
    });
  }, [familyId, stepId]);
}

/** Test-only reset. Never call this from app code. */
export function __resetStepReachedLogForTests(): void {
  loggedThisSession.clear();
}
