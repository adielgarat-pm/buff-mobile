/**
 * installCtaTelemetry (web) — best-effort funnel logging for the native-install
 * CTA. See docs/sessions/web-to-native-cta/SPEC.md §4.4.
 *
 * Fire-and-forget POST to the `track-install-cta` edge function (verify_jwt off,
 * bot-UA filtered, service-role insert into install_cta_events). ALL failures
 * are swallowed here — telemetry must NEVER affect the CTA UX or block anything.
 */
import { supabase } from '../integrations/supabase/client';
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
    // Fire-and-forget. Never await; swallow every error/rejection.
    void supabase.functions
      .invoke('track-install-cta', {
        body: { cta_id: ctaId, event_type: eventType, placement, target },
      })
      .catch(() => {});
  } catch {
    /* telemetry must never throw */
  }
}
