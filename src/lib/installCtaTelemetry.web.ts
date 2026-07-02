/**
 * installCtaTelemetry (web) — best-effort funnel logging for the native-install
 * CTA. See docs/sessions/web-to-native-cta/SPEC.md §4.4.
 *
 * Phase 1 (now): a safe no-op — dev-only console, no network. Phase 2 wires the
 * fire-and-forget POST to the `track-install-cta` edge function + the
 * `install_cta_events` table. All failures are swallowed here — telemetry must
 * NEVER affect the CTA UX.
 */
import type { InstallTarget } from './installTarget.web';

export type CtaEventType = 'impression' | 'click' | 'dismiss' | 'open_installed';
export type CtaPlacement = 'entry' | 'post-signup' | 'dashboard-nudge';

export function logInstallCtaEvent(
  eventType: CtaEventType,
  placement: CtaPlacement,
  target: InstallTarget,
  ctaId: string,
): void {
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[install-cta]', eventType, placement, target, ctaId);
    }
    // Phase 2: POST to `${SUPABASE_URL}/functions/v1/track-install-cta`
    // (fire-and-forget, verify_jwt off, bot-UA filtered). Intentionally omitted
    // in Phase 1 so no half-wired endpoint is called.
  } catch {
    /* telemetry must never throw */
  }
}
