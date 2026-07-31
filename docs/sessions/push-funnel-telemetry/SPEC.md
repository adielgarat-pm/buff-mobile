# SPEC — pkg/push-funnel-telemetry

> **Status:** DRAFT for Adi — awaiting `approved, proceed`. Plan Mode.
> **Author:** Claude Code, 2026-07-31.
> **Why now:** [[project_kid_engagement_undeliverable_shared_device]] investigation found only **13/237 families reachable by push** and **1/548 `kid_engagement` ever delivered** — but every failure in the token-registration path is **silent** (`if (__DEV__) console.warn` only). We cannot see WHERE the funnel drops. This package makes it observable. It does **not** try to fix the funnel — measure first.

---

## 1. Goal / Non-goals
- **G:** emit a telemetry signal at every step of push-token registration so drop-off is visible in production.
- **Non-goals:** no funnel *fix*, no copy/routing change, no re-engagement work. Observability only.

## 2. What's silent today (the gap)
In `src/lib/pushTokens.ts` + `src/hooks/usePushRegistration.ts` + `src/components/NotificationGate.tsx`, these all fail invisibly in prod:
- pre-prompt shown / accepted / declined (NotificationGate)
- permission `granted` / `denied`
- `getPushToken()` returns **null or throws** (swallowed, `__DEV__`-only) ← the highest-suspicion silent failure
- `upsertDeviceToken()` error (swallowed)
- web branch: `registerWebPush` status

## 3. Design (client-only, Sentry-based — no schema change)
Add a tiny helper `src/lib/pushTelemetry.ts`:
```ts
// logPushStep(step, status, ctx?) → Sentry breadcrumb (always) +
// Sentry.captureMessage(level) ONLY on terminal failures, so quota stays ~0
// (fires only when an active user's registration actually fails — tiny n).
```
Instrument the steps above. **Strict no-PII:** log only `step`, `status`, `role`, `platform`, and error *message* — **never** the token string, email, display name, or profile id in the message body (profile id may go in Sentry `tags`/`user` which is already PII-scrubbed by `beforeSend`).

- **Breadcrumbs** for every step (context when something is captured).
- **`captureMessage`** (level `warning`) at the two terminal silent failures: `getPushToken → null/error` and `upsertDeviceToken → error`. Low volume by construction.
- Keep the existing `__DEV__` console warns.

> Alternative considered: a `push_funnel_events` table for exact per-step counts. Better for funnel math, but it's a schema + RLS insert-policy change. Deferred — Sentry is enough to find the drop at this tiny scale, and keeps this package pure client code / zero DB risk.

## 4. Platform parity
Instrument BOTH the native (Expo) and web (`registerWebPush`) branches. No native-only import at module top (keep Sentry usage lazy/guarded per [[feedback_native_import_sentry_blindspot]]).

## 5. Values Check
No user-facing change; no copy; no data collection beyond non-PII step/status. Passes all 9 trivially (nothing touches the child experience).

## 6. Files
`src/lib/pushTelemetry.ts` (new), `src/lib/pushTokens.ts`, `src/hooks/usePushRegistration.ts`, `src/components/NotificationGate.tsx`.

## 7. Tests
- Unit: `logPushStep` emits breadcrumb with expected shape; **asserts payload contains no token/email/display_name**.
- Unit: `getPushToken` null path triggers a `captureMessage`.
- Jest + typecheck green; verify web bundle builds (no native import leak).

## 8. Risk
Minimal, fully reversible (additive logging). No DB, no schema, no user-facing surface.
