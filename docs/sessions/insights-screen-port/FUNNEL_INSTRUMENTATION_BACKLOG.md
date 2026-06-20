# Insights Teaser → Paywall — Funnel Instrumentation & A/B (deferred backlog)

> **Status: NOT YET IMPLEMENTED — saved for execution later (Adi, 2026-06-19).**
> Decision: build the lightweight funnel events when convenient before/around launch;
> defer real A/B testing until there is meaningful free-user traffic.

## Why deferred (context)

- The dashboard now shows free users a **real insight teaser** (`pkg/insights-screen`,
  commits `edd29d6` clickable cue + `6cef926` free teaser) → tap opens the Paywall.
- **Current testers are mostly lifetime-premium**, so they never see the teaser and never
  convert → there is **no funnel data to collect or A/B to run yet**. Events would be dormant.
- A/B testing needs hundreds–thousands of users for significance; at ~20 testers it would give
  false confidence. So: **seed measurement first, A/B later.**

## Part 1 — Funnel instrumentation (small, do first)

Three events, mirroring the existing lightweight pattern in `src/lib/buffCatchTelemetry.ts`
(Sentry breadcrumb + dev console log, **no new table, no schema change** for v1).

| Event | Where to fire (hook point) | Payload |
|---|---|---|
| `insight_teaser_shown` | `ParentDashboardScreen.tsx` — the **free teaser branch** (`!isSubscribed && topInsight && !showLockedInsights`), on render (effect keyed to the insight id, fire once) | `{ childId, insightKey, completionRate }` |
| `paywall_opened_from_teaser` | `ParentDashboardScreen.tsx` — the teaser card `onPress` → `navigate('Paywall', …)` | `{ childId, source: 'insight_teaser' }` |
| `subscribed` | `src/hooks/useSubscription.ts` — after a successful `purchaseMonthly/Yearly/Lifetime` (or when the entitlement first flips active) | `{ plan, source }` |

**Attribution nuance (important):** to measure teaser → paywall → subscribe, pass a
`source: 'insight_teaser'` param when the teaser opens the Paywall, thread it through
`PaywallScreen`, and stamp it on the `subscribed` event. Otherwise you only get "a paywall was
opened" / "someone subscribed" with no link between them.

**Suggested file:** `src/lib/funnelTelemetry.ts` (copy the shape of `buffCatchTelemetry.ts`).

**Effort:** ~1–2h. No deps, no schema.

## Part 2 — Queryable aggregation (follow-up, only if needed)

v1 breadcrumbs confirm the funnel fires but aren't easily queryable. If/when you want real
conversion rates over time, add a small `funnel_events` Supabase table feeding the **admin
tester board** (`buff-mobile-admin-web`) — same deferral the BUFF Catch telemetry made
(`buff_catch_plays` table). Separate small package; needs a migration + GRANTs (see
`reference_mcp_table_grants`).

## Part 3 — A/B testing (later, when there is traffic)

- **Don't build a homegrown A/B harness.** Use **RevenueCat Experiments** (already integrated via
  `react-native-purchases`) — built for paywall/conversion variants, near-zero app code, free at
  this scale. Turn it on once there are hundreds+ of real free users.
- Candidate experiments once live: teaser **full** vs **blurred** reveal; teaser CTA copy
  ("מגמות, מפה שבועית ועוד" vs alternatives); paywall layout.
- Guardrail: don't call a winner until the variant has enough conversions for significance
  (rule of thumb: ≥ ~100 conversions/arm, not ~100 users).

## Cross-refs
- Teaser code: `src/screens/parent/ParentDashboardScreen.tsx` (free branch + `insightCtaRow`).
- Telemetry pattern: `src/lib/buffCatchTelemetry.ts`.
- Launch context: `docs/launch/BILLING_LAUNCH_CHECKLIST.md` (consider linking this there).
