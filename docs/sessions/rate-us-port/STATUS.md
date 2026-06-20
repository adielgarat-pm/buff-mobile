# STATUS — rate-us-port

| Phase | State | Date | Tests | Notes |
|---|---|---|---|---|
| 1 — Settings entry + gate sheet + DB write | BUILT (unverified on device) | 2026-06-20 | jest 470 (3 flaky-timeout under parallel load, pass isolated) · tsc 0 errors · i18n guards pass | `RateBuffSheet` + `submitReview` → existing `reviews` table, no migration |
| 2 — Passive nudge (Nudge Manager slot) | BUILT | 2026-06-20 | `reviewStatus` + `rateEligibility` unit tests (10) green | one-line `useRateNudgeRegistration` in dashboard; priority/cooldown inherited from PR #267 |
| 3 — Admin feedback view (admin-web) | BUILT (typecheck deferred to Vercel) | 2026-06-20 | n/a (admin-web deps not installed in worktree) | `FeedbackBoard` + `useFeedbackReviews` (raw-fetch GET, admin RLS) under the Tester Board |

## What shipped
- **Reuses Lovable's pipeline, zero DB work:** writes to `public.reviews` (existing table + RLS, verified
  2026-06-20). Happy 4–5★ → `status='pending'` (moderation → site testimonial); 1–3★ → `status='private'`
  (hidden from public, surfaced to Adi in the admin board). No CHECK constraint on `status`, no migration.
- **Sentiment gate, compliant:** Android happy path deep-links to Play (manual link, not the native API);
  the store is never *blocked* from unhappy users (FTC/Google review-gating guardrail, SPEC §4). Web high-
  intent is the in-house write only (no Google link). iOS deferred (must not gate `SKStoreReviewController`).
- **Nudge coordination:** rate registers as the lowest-priority passive nudge; install (20) beats rate (10),
  and the Manager's 7-day global cooldown + rate's own 90-day local cooldown stop banner overload.
- **Low-rating contact:** private feedback row + "we'd love to hear more" → WhatsApp (mailto fallback).

## Files
- `src/lib/rateBuff/` — reviewStatus, rateEligibility, submitReview, contactSupport, highIntentDestination(.android/.web)
- `src/components/rate/` — RateBuffSheet, RateNudge
- `src/screens/parent/ParentSettingsScreen.tsx` (row), `ParentDashboardScreen.tsx` (nudge line)
- `src/i18n/en.json` + `he.json` — `rate.*` (19 keys, balanced)
- `admin-web/` — FeedbackBoard, useFeedbackReviews, api.fetchRows, Dashboard wire

## Open (Adi inputs — SPEC §9)
1. **WhatsApp number** → set `SUPPORT_WHATSAPP` in `contactSupport.ts` (else mailto:adi@buffadhd.com).
2. **Copy redline** — `rate.*` keys (he/en) are CC drafts; warm/Pillar-2, ready for your edits.
3. **Hat-4 (device/web, logged-in parent):** the flow is auth-gated, so CC could not drive it past login.
   Verify: Settings → Rate BUFF → gate → stars/feedback → (Android) Play deep-link → WhatsApp/email.
4. **admin-web typecheck** confirmed by the Vercel build on merge (deps not installed in the worktree).

## Values Check
PASS (SPEC §8). Parent-facing, optional, dismissible; unhappy path empathetic + a human contact line.
