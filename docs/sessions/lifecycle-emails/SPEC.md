# SPEC — pkg/lifecycle-emails

> **Stage: DESIGN — awaiting Adi approval. No code yet.**
> Created 2026-07-17 from Adi's decision: automate drop-off / win-back emails,
> gated on onboarding consent, with in-email unsubscribe, sent from adi@buffadhd.com.

---

## Problem

Activation crisis (~5%): most parents never return after Day 0. Manual win-back
batches proved email works (~9% signup conversion in the June campaign; 3/18
parents returned within 48h of the 2026-07-14 batch) — but manual Gmail sends
don't scale, aren't consent-checked systematically, have no unsubscribe, and go
out from Adi's personal address.

## Goal

An automatic, consent-gated lifecycle email system that nudges families at the
exact step they dropped, from adi@buffadhd.com, with one-click unsubscribe.

## Non-goals (v1)

- Marketing broadcasts / newsletters (this is lifecycle only)
- Push notifications (FCM lifecycle is a separate package)
- A/B testing infrastructure
- Emails to children (NEVER — parents only, Pillar guardrail)

---

## Hard requirements (Adi, 2026-07-17)

1. **Consent gate:** send ONLY to parents with `profiles.marketing_consent = true`
   (the onboarding checkbox "אשמח לקבל מדי פעם טיפים ועדכונים"). No consent → no email, ever.
2. **In-email unsubscribe:** every email carries a one-click unsubscribe link
   (tokenized, no login) + `List-Unsubscribe` / `List-Unsubscribe-Post` headers.
   Unsubscribe sets `marketing_consent = false` immediately and is honored by all
   future sends (the consent gate re-checks at send time).
3. **Sender:** `adi@buffadhd.com` via a transactional email provider with
   SPF + DKIM + DMARC configured on buffadhd.com. No more personal Gmail.

## OAuth consent gap — IN SCOPE for v1 (Adi decision 2026-07-17)

Google-OAuth signups hardcode `marketing_consent: false`
(`src/screens/auth/AuthCallbackScreen.tsx:89`) — they never see the checkbox.
Real numbers (excluding deleted/legacy): 19 of 40 reachable parents signed up
via Google, ALL consent=false; email signups: 5 of 21 consented. Without fixing
this the sendable audience is 5 people.

v1 therefore includes a one-time consent ask for OAuth users (existing AND new):
same copy as the signup checkbox, shown once post-auth (next app open for
existing users), answer stored in `marketing_consent`, never re-asked
(track via `onboarding_data` key or a dedicated asked-at column — decide in
implementation). Android + Web parity required. NEVER default existing users
to true — explicit yes only.

---

## Triggers (v1)

All triggers: parent role, `marketing_consent = true`, not `is_deleted`,
exclude test/demo/internal accounts (reuse the exclusion list from
`scripts/activation-report.sql`), max ONE email per trigger per family,
and a global cool-down: no more than 1 lifecycle email per family per 72h.

| # | Trigger | Condition (evaluated daily) | Template |
|---|---------|------------------------------|----------|
| T1 | Signed up, no child | parent created >24h ago, family has no child profile | "ההגדרה לוקחת 2 דקות" |
| T2 | Child created, no first task | child exists >24h, zero completed `daily_progress` in family | existing "התוכנית של {ילד} מוכנה — נשארו 2 דקות" (proven in win-back) |
| T3 | First task done, then silent | ≥1 completion, none in last 3 days, family <14 days old | gentle Day-3 nudge |
| T4 | Trial expiring | `premium_until` (trial grant) expires in 2 days, no RC subscription | convert prompt |

Idempotency: `email_logs` gains `template_key` uniqueness per (profile, template)
— a family can never receive the same trigger email twice.

## Architecture

- **Candidate selection:** SQL views per trigger (read-only over `profiles`,
  `daily_progress`, `families`, `email_logs`).
- **Scheduler:** daily `pg_cron` job (same pattern as BUDDY EOD) at 17:00 IL —
  calls the send edge function with the day's candidates.
- **Sender:** new edge function `lifecycle-email-send` → transactional provider
  API (proposal: **Resend** — free tier 3k/month ≫ current volume; NEW DEPENDENCY
  + account, needs Adi approval + DNS records on buffadhd.com).
- **Unsubscribe:** new edge function `email-unsubscribe` (verify_jwt=false,
  HMAC-signed token carrying profile_id) → sets `marketing_consent=false`,
  logs to `email_logs`, shows a plain "הוסרת מהרשימה" page.
- **Logging:** every send/skip/unsubscribe appended to `email_logs`
  (columns exist; add `template_key` unique index migration).
- **Language:** template per `preferred_language` (he/en), Hebrew default for
  current cohort.

## Platform parity

Server-side only (pg_cron + edge functions) — no client code in v1, so
Android/Web parity is N/A by construction. Trigger T2's deep link uses
https://www.buffadhd.com (works on both platforms; App Link opens native).

## Schema changes (need approval — existing prod users affected)

1. Unique partial index on `email_logs (profile_id, template_key)` for lifecycle keys.
2. No new tables. No changes to `profiles` (consent column already exists;
   `marketing_consent` is parent-editable and NOT an entitlement column — no
   trigger-035 guard needed, but flag: unsubscribe function must be the only
   server-side writer).

## Values Check (BUFF_VALUES.md — 3×3)

**Pillar 1 (Intrinsic Motivation):** emails go to PARENTS only; copy is
help-framed ("the plan is ready"), never reward/pressure-framed; no
streak-shaming of the child. PASS
**Pillar 2 (Positive Coaching / privacy):** consent-gated, one-click out,
child data in emails limited to first name + count (as in approved win-back
copy); provider stores recipient email only; PII stays out of git. PASS
**Pillar 3 (Independence-Building):** nudges push toward the child doing the
first task themselves; no parent-does-it-for-them framing. PASS

## Phases

- **Phase 0 (Adi, manual):** create Resend account, add DNS records, approve dependency.
- **Phase 1:** migration (index) + unsubscribe edge function + token format. Tests.
- **Phase 2:** OAuth consent ask (client, Android+Web) — one-time prompt for
  Google-signup users, existing and new. Grows sendable audience from 5 → up to 24+.
- **Phase 3:** send function + T2 only (highest-value, proven copy), dry-run mode
  first (logs, no send). Adi reviews dry-run list, then arm.
- **Phase 4:** T1, T3, T4 + pg_cron schedule. T4 confirmed in scope (purchase
  chain production-proven by first paid order GPA.3315-…-38979, 2026-07-16).
- **Phase 5:** SPEC_SYNC — update INTEGRATION_LEARNINGS, RELEASE_QUEUE (client
  phase needs a build/OTA; server phases don't), STATUS.md rows per phase.

## Decisions (Adi, 2026-07-17)

1. Provider: **Resend** (free tier 3k/mo; only Adi-side task = account + DNS records).
2. Sender: **hello@buffadhd.com**, reply-to adi@buffadhd.com.
3. T4 trial-expiry email: **in v1**.
4. OAuth consent gap: **in v1** (Phase 2).
