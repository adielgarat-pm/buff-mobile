/**
 * pushTelemetry — visibility into the push-token registration funnel.
 *
 * Source SPEC: docs/sessions/push-funnel-telemetry/SPEC.md
 *
 * Why: the token path (pushTokens.ts + usePushRegistration.ts + NotificationGate)
 * fails SILENTLY in production — every error is `if (__DEV__) console.warn`. Field
 * data showed ~13/237 families reachable by push and 1/548 kid_engagement ever
 * delivered, with no way to see WHERE the funnel drops. This helper emits a Sentry
 * breadcrumb at every step + a `captureMessage` on the terminal silent failures
 * (get_token → null/error, upsert → error), so the drop-off becomes observable.
 *
 * Same lightweight pattern as buffCatchTelemetry (breadcrumb + dev log, no schema).
 *
 * STRICT no-PII: this NEVER receives or logs the token string, email, display
 * name, or profile id — only step, status, platform, role, and a sanitized error
 * message. Do not add identifying fields to PushStepCtx.
 */
import * as Sentry from '@sentry/react-native';

export type PushStep =
  | 'preprompt_shown'
  | 'preprompt_accepted'
  | 'preprompt_declined'
  | 'permission_result'
  | 'get_token'
  | 'upsert_token'
  | 'web_register';

export interface PushStepCtx {
  /** 'parent' | 'child' — funnel segmentation, not identifying. */
  role?: string;
  /** Platform.OS or currentPlatform() ('android' | 'ios' | 'android-web' | …). */
  platform?: string;
  /** Step outcome: 'granted'|'denied'|'success'|'null'|'error'|'unsupported'|… */
  status?: string;
  /** Sanitized error message ONLY — never a token/email/name. */
  reason?: string;
}

/** Statuses that represent a terminal, otherwise-silent failure worth escalating. */
const FAILURE_STATUSES = new Set(['null', 'error']);

/**
 * Dedupe captureMessage per (step+status) per JS session so a user stuck in a
 * failing state that re-fires on every app foreground doesn't spam Sentry.
 * Breadcrumbs are always emitted (cheap ring buffer).
 */
const reported = new Set<string>();

export function logPushStep(step: PushStep, ctx: PushStepCtx = {}): void {
  Sentry.addBreadcrumb({
    category: 'push_registration',
    message: step,
    level: FAILURE_STATUSES.has(ctx.status ?? '') ? 'warning' : 'info',
    data: { ...ctx },
  });

  if (ctx.status && FAILURE_STATUSES.has(ctx.status)) {
    const key = `${step}:${ctx.status}`;
    if (!reported.has(key)) {
      reported.add(key);
      Sentry.captureMessage(`push_registration ${step} failed (${ctx.status})`, {
        level: 'warning',
        tags: { push_step: step, push_status: ctx.status, push_platform: ctx.platform ?? 'unknown' },
        extra: { reason: ctx.reason },
      });
    }
  }

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[push_registration] ${step}`, ctx);
  }
}
