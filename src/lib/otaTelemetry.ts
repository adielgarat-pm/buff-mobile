/**
 * otaTelemetry — visibility into the OTA freshness client (layers 1+3 of the
 * release-freshness plan; see docs/sessions/first-launch-freshness/SPEC.md).
 *
 * Layer 1 (first-launch) and Layer 3 (restart toast) both apply silently or with
 * a single gentle prompt; without instrumentation we cannot see how often they
 * fire, how long layer 1 costs, or whether anyone taps the toast. This emits a
 * Sentry breadcrumb at every step and a `captureMessage` only on a terminal
 * failure (a reload that errors), deduped per JS session.
 *
 * Same lightweight pattern as pushTelemetry (#426) / buffCatchTelemetry.
 *
 * STRICT no-PII: never receives or logs a token, email, name, or profile id —
 * only step, status, platform, surface, elapsed ms, and a sanitized reason.
 */
import * as Sentry from '@sentry/react-native';

export type OtaStep =
  // Layer 1 — first-launch freshness
  | 'fl_poll_started'
  | 'fl_became_pending'
  | 'fl_reloaded'
  | 'fl_timeout'
  | 'fl_disabled'
  | 'fl_error'
  // Layer 3 — restart toast
  | 'toast_pending_detected'
  | 'toast_shown'
  | 'toast_suppressed'
  | 'toast_reload_tapped'
  | 'toast_dismissed'
  | 'toast_reload_error';

export interface OtaStepCtx {
  /** Platform.OS ('android' | 'ios' | 'web'). */
  platform?: string;
  /** Step outcome, e.g. 'ok' | 'timeout' | 'error' | a suppression reason. */
  status?: string;
  /** Elapsed ms (layer 1 poll window). */
  ms?: number;
  /** Non-identifying surface tag, e.g. the current route name for a suppression. */
  surface?: string;
  /** Sanitized error message ONLY — never a token/email/name. */
  reason?: string;
}

/** Steps that represent a terminal failure worth escalating past a breadcrumb. */
const FAILURE_STEPS = new Set<OtaStep>(['fl_error', 'toast_reload_error']);

/** Dedupe captureMessage per step per JS session so a stuck state can't spam. */
const reported = new Set<string>();

export function logOtaStep(step: OtaStep, ctx: OtaStepCtx = {}): void {
  const isFailure = FAILURE_STEPS.has(step);

  Sentry.addBreadcrumb({
    category: 'ota_freshness',
    message: step,
    level: isFailure ? 'warning' : 'info',
    data: { ...ctx },
  });

  if (isFailure && !reported.has(step)) {
    reported.add(step);
    Sentry.captureMessage(`ota_freshness ${step}`, {
      level: 'warning',
      tags: { ota_step: step, ota_platform: ctx.platform ?? 'unknown' },
      extra: { reason: ctx.reason, surface: ctx.surface },
    });
  }

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[ota_freshness] ${step}`, ctx);
  }
}
