# SPEC — rate-us-port

**Status:** DESIGN (target state). No code until Adi says `approved, proceed`.
**Last updated:** 2026-06-20
**Branch (proposed):** `pkg/rate-us-port`
**Sibling session:** `pkg/pwa-install-nudge` (**PR #267, MERGED to main 2026-06-20**) owns the passive-nudge
coordination — the "Nudge Manager" single-slot system, now live in `src/lib/nudges/`. This SPEC is a
**consumer** of that contract — it does not define or edit any Nudge Manager file. The contract was
written *anticipating* rate: `NudgeId` already includes `'rate'`, `NUDGE_PRIORITY.rate = 10` is set, and
the dashboard slot comment already reserves "rate banner (pkg/rate-us-port, future)". Integration is small.

---

## 1. Problem statement (grounded)

Lovable's web app already ships a "rate us" flow, and it is **smart** — not a dumb store link. The
mechanism is a live pipeline we can reuse as-is:

- **Table `public.reviews`** (live in the mobile Supabase project): columns `rating`, `review_text`,
  **`status`** (moderation), `detected_lang`, `translated_text_en`, `display_name` / `display_name_en`,
  `family_id`, `user_id`.
- **RLS is already exactly what this flow needs (verified 2026-06-20 — no migration required):**
  - `INSERT` (authenticated): `WITH CHECK (user_id = auth.uid())` → a parent writes their own review.
  - `SELECT` (anon + authenticated): `status = 'approved'` → the public site reads only approved rows.
  - `SELECT` / `UPDATE` (admin via `has_role(...,'admin')`) → Adi's moderation.
  - `UPDATE` (own + `status='pending'`) → user can edit while pending.
- **Output surface:** approved rows → [`landing-web/src/data/reviews.json`](../../../landing-web/src/data/reviews.json)
  → [`TestimonialsSection.tsx`](../../../landing-web/src/components/TestimonialsSection.tsx) on buffadhd.com.
  The 3 current testimonials (Tamar / Noa / Shani) came out of this pipeline.

**The gap:** the mobile app (`buff-mobile`, Android native + Expo Web PWA) has **no** entry into this
pipeline. There is no "Rate BUFF" surface at all. We need to port the Lovable flow — keeping the *smart*
part (rating gate + moderated testimonial engine) — and split the high-intent destination per platform.

**Who rates:** parents only. Kids never log in (memory `kids_never_login`); the surface lives in
**Parent Settings**, so the rater is always an authenticated parent → matches the `INSERT` RLS cleanly.

---

## 2. Decisions already made (Adi, 2026-06-20)

1. **Web high-intent destination:** **in-house only for v1** — write to the existing `reviews` table
   (→ moderated → testimonials). **No Google-review link in v1** (avoids review-gating exposure on a
   third-party platform + no Google Business Profile exists yet). Revisit post-launch if a GBP is created.
2. **Sentiment gate:** *yes*, via a **manual deep-link** (not the native In-App Review API). Happy (4–5★)
   → Play listing (Android); not-happy (1–3★) → private feedback, never the store. **Compliance guardrail
   (§4.5):** never *block* an unhappy parent from the public store — only refrain from proactively handing
   them the link. The Play listing stays reachable.
3. **Low-rating path (Adi's explicit requirement):** the feedback must reach Adi, with a contact option.
   → writes to `reviews` as **private**, surfaced in the **Admin Tester Board** (admin-web), **plus** a
   "We'd love to hear more" button that opens **WhatsApp** (pre-filled) for a direct line. (Research §4.)

---

## 3. Target state

### One logical contract, platform-split action
A single "Rate BUFF" flow. Entry is identical on both platforms; only the **high-intent destination**
differs (native store vs. web in-house + optional Google link). The not-happy path is identical on both.

### The flow

1. **Gate:** "Enjoying BUFF?" → `Yes` / `Not really`.
2. **Yes (high intent):**
   - Mini-form: star rating + optional one-line text → write to `reviews`, `status='pending'`,
     `user_id = auth.uid()`, `family_id`, `display_name` from profile, `detected_lang` from app language.
     Toast: "Thank you 💛".
   - **Then**, only if rating ≥ 4, a secondary CTA:
     - **Android:** "Help more parents find us" → deep-link
       `https://play.google.com/store/apps/details?id=com.buffapp.mobile` (via `Linking`).
     - **Web:** **no secondary CTA in v1** — the in-house `reviews` write *is* the high-intent action
       (→ moderated → site testimonial). No Google link (decision §2.1).
3. **Not really (1–3★):** progressive disclosure — the "what could we improve?" free-text field appears
   only once rating < 4 (don't burden happy raters). Write to `reviews` with the low rating as **private**
   (§4 status handling) — **never** appears publicly, **no** store CTA ever. Then offer a **"We'd love to
   hear more"** button → opens **WhatsApp** pre-filled (Adi's direct line). Toast: "Thanks — that helps 🙏".
   The private row surfaces in the **Admin Tester Board** so Adi sees every low rating in one place (§6).

This reproduces Lovable's smart behaviour *and* the compliant version of the industry gate (§4): every
happy parent feeds the testimonial engine Adi controls; only 4–5★ parents are *offered* Play (never
blocked from it); unhappy parents are routed to private feedback **plus a human contact line** — which for
a habit-fragile, founder-led app is a churn-saver, not just damage control.

### Two surfaces

1. **Always-available entry (ships independently):** a row in **Parent Settings → About**: "Rate BUFF".
   This is **not** a passive nudge — it has zero coordination dependency and can ship without the
   install session. Opens the gate sheet on demand.
2. **Passive nudge (depends on the Nudge Manager):** an opportunistic prompt that surfaces for an
   **engaged + retained** parent. This participates in the single passive-nudge slot owned by
   `pkg/pwa-install-nudge` (see §5). It is the **lowest-priority** nudge and must never co-appear with
   the install nudge or any care prompt.

---

## 4. Competitor research + compliance (grounds the design, 2026-06-20)

### 4.1 The two-step satisfaction gate is the industry standard
"Ask satisfaction first, route accordingly" is what the leading apps do — examples gathered:
**Headspace** ("How's your head today?"), **Grammarly** (progress-framed "Is your writing improving?" →
No opens a feedback form), **Asana** ("Has Asana helped you stay on track?" → No opens a support path),
plus Instagram/Duolingo. Native review APIs keep users in-flow and pull **3–5× more responses** than a
raw store link. ([appfollow](https://appfollow.io/blog/how-to-ask-for-app-reviews),
[mobileaction](https://www.mobileaction.co/blog/how-to-improve-app-store-rating/))

### 4.2 …but pure sentiment-gating is a policy/legal risk — and we adapt for it
- **Google** explicitly prohibits "review gating" (filtering by satisfaction before sending to a public
  review) for Google reviews. ([seologist](https://www.seologist.com/knowledge-sharing/what-is-review-gating-and-why-does-it-violate-googles-review-policies/))
- **FTC Fake Reviews Rule** (final Aug 2024, effective Oct 21 2024; first enforcement letters Dec 2025)
  targets **"suppression of negative reviews"** — civil penalties up to ~$53K/violation.
  ([Sidley](https://datamatters.sidley.com/2024/08/30/u-s-ftcs-new-rule-on-fake-and-ai-generated-reviews-and-social-media-bots/),
  [FTC](https://www.ftc.gov/news-events/news/press-releases/2025/12/ftc-warns-10-companies-about-possible-violations-agencys-new-consumer-review-rule))
- **Apple** does not explicitly ban a custom satisfaction pre-prompt, but `SKStoreReviewController`
  itself **cannot be conditioned on sentiment** (the system decides timing; max 3 prompts/year).

**How this SPEC stays clean:**
- Android v1 uses a **manual deep-link**, and we **never block** the unhappy user from the store — the
  difference between "not proactively handing the link" (fine) and "suppressing" (not fine).
- **Web high-intent is first-party** (our own `reviews` → our own site), which is *curation of genuine
  first-party testimonials*, not gating a third-party platform. No Google link in v1.
- **iOS (future):** if we ever adopt `SKStoreReviewController`, it must fire **unconditionally** on a
  success event — **not** behind the sentiment gate. Flagged for the iOS package.

### 4.3 Timing & frequency (industry numbers → our `eligible()`)
- **Trigger after a positive moment** (reward redemption / a good day), **never** at onboarding, after a
  crash/error, or mid-routine. ([criticalmoments](https://criticalmoments.io/blog/skstorereviewcontroller_guide_with_examples))
- **Qualify** returning users: installed **≥ 7 days**, **≥ 3 sessions**, retained.
- **Frequency:** ~**90-day cooldown** between asks, lifetime cap ≈ 3/yr.
  → This is the rate nudge's **own local cooldown** inside `eligible()`, layered **above** the Nudge
  Manager's 7-day *global* cooldown (§5). Two layers = zero overload.
- **This resolves the open "engagement threshold":** *positive moment + retained ≥ 7 days*, with a
  90-day local cooldown.

### 4.4 Low-rating handling (NN/g + support-escalation research)
- **Progressive disclosure:** reveal the "what went wrong?" field only when rating < 4 — don't clutter the
  form for happy raters. ([NN/g](https://www.nngroup.com/articles/user-feedback/))
- **Support-escalation:** immediately after a low rating, offer a direct contact path ("would you like us
  to reach out?") rather than a dead-end form. ([qualaroo](https://qualaroo.com/blog/respond-to-negative-feedback-from-customers/))
- BUFF's adaptation (Adi decision §2.3): private `reviews` row → **Admin Tester Board** + a **WhatsApp**
  contact button. Empathetic copy ("what could we improve?") — passes Values Pillar 2.

---

## 4.5 `status` handling for the not-happy path (no schema change)

The not-happy path must store the feedback but keep it out of the public `status='approved'` set.
**Preferred (zero-risk):** write low-intent feedback as `status='pending'` with the low rating — RLS
already hides non-approved rows from the public `SELECT`, and Adi simply never approves them. This needs
**no new status value and no migration**.
*Implementation check:* confirm whether `reviews.status` has a CHECK constraint / enum. If it permits a
dedicated value (e.g. `'private'`), use it for clarity; otherwise stay on `'pending'`. Either way, no DDL.

---

## 5. Coordination contract (real, merged — `src/lib/nudges/`)

The passive rate nudge plugs into the live single-slot **Nudge Manager** (PR #267). The exact API:

```ts
// src/lib/nudges/types.ts
export type NudgeId = 'install' | 'rate';            // 'rate' already declared
export interface PassiveNudge { id; priority; eligible: () => boolean|Promise<boolean>; render: () => ReactNode; }
export const NUDGE_PRIORITY = { install: 20, rate: 10 };   // rate already lowest

// src/lib/nudges/nudgeManager.ts
registerNudge(nudge: PassiveNudge): void              // call once at dashboard mount
markNudgeDismissed(): Promise<void>                   // starts the 7-day GLOBAL cooldown
useActiveNudge({ suppressed }): PassiveNudge | null   // dashboard renders the one winner
```

**Guarantees the Manager already enforces (we get them for free):**
- One slot, one winner = highest `priority` among eligible → install (20) beats rate (10) every time.
- **Global cooldown `GLOBAL_COOLDOWN_DAYS = 7`** — after ANY passive nudge is dismissed, *all* are
  suppressed for 7 days. So a parent can't get install today and rate tomorrow. (This is the exact
  "don't overload" guarantee Adi asked for.)
- `suppressed` (passed by the dashboard) hides the slot on child-owned sessions / when a care prompt is up.
- `eligible()` throwing = "not eligible", never crashes the dashboard.

**Rate registers exactly like install does** (mirror of `useInstallNudgeRegistration`):
- `id: 'rate'`, `priority: NUDGE_PRIORITY.rate`.
- `eligible()` (sync/async): **web** → only if `isStandalone()` (installed PWA); a non-installed browser
  visitor should see *install*, not rate, and the priority order already guarantees that. **native** →
  always platform-eligible. **AND** engagement threshold met (retained + positive signal — §9 Q2) **AND**
  not previously rated (local flag) **AND** the nudge's own local cooldown elapsed.
- `render()` → the **same `RateBuffSheet`** the Settings entry opens; on dismiss call `markNudgeDismissed()`
  then the dashboard's `onDismiss` (identical to install's banner).

**Dashboard wiring = one import + one line** added next to the existing install registration
([`ParentDashboardScreen.tsx`](../../../src/screens/parent/ParentDashboardScreen.tsx):78-82):
```ts
useInstallNudgeRegistration(() => setNudgeDismissed(true));
useRateNudgeRegistration(() => setNudgeDismissed(true));   // ← the only dashboard change
const activeNudge = useActiveNudge({ suppressed: isChildPreview || nudgeDismissed });
// existing slot render at :428  {activeNudge?.render() ?? null}  needs NO change
```

**Hard boundary:** rate-us writes **no** file under `src/lib/nudges/` and does not touch the install
component/hook. It only *adds* its own `RateNudge` registration + the one dashboard line above. The Manager,
priorities, and cooldown are already done.

---

## 6. Proposed approach (for review — not self-approved)

### No new dependency, no schema/RLS change
- DB write uses the existing Supabase client + the existing `INSERT` RLS. **Verified — no migration.**
- Store deep-link uses React Native `Linking` (already in use). **No `expo-store-review` for v1** — the
  native In-App Review API is deliberately avoided (it cannot be sentiment-gated per Google policy, and
  it won't display until the app is publicly listed). Revisit post-launch as a separate package.

### Platform-split is ONLY the high-intent destination (rate itself is cross-platform)
Unlike install (web-only → native no-op file), the rate flow runs on **both** platforms; its sheet,
DB write, Settings entry, and nudge registration are **shared single files**. The *only* `.android`/`.web`
split is the high-intent destination, per the Parity rule (unify the signal, split the action):
- `src/lib/rateBuff/highIntentDestination.android.ts` → opens the Play listing via `Linking`
  (`https://play.google.com/store/apps/details?id=com.buffapp.mobile`).
- `src/lib/rateBuff/highIntentDestination.web.ts` → no store; returns the optional Google-review link (or
  null). High-intent on web is satisfied by the in-house `reviews` write itself.
- One logical contract `getHighIntentCta(): { label; url } | null`; native never imports web-only code and
  vice-versa (memory `native_import_sentry_blindspot`).

### Components (mirroring the install pattern where it applies)
- `src/components/rate/RateBuffSheet.tsx` — the gate + the two mini-forms (shared, both platforms).
- `src/components/rate/RateNudge.tsx` — `useRateNudgeRegistration(onDismiss)`, the **rate analogue of
  `InstallNudge.web.tsx`** but **not** platform-split (rate is cross-platform). Registers `id:'rate'` and
  renders `RateBuffSheet` in the slot. No native no-op file needed.
- `src/lib/rateBuff/submitReview.ts` — the DB write (rating, text, status, detected_lang, display_name,
  family_id, user_id) via the existing Supabase client + INSERT RLS.
- `src/lib/rateBuff/contactSupport.ts` — opens the WhatsApp deep-link
  (`https://wa.me/<number>?text=<prefilled>`) for the low-rating "we'd love to hear more" button. Needs
  Adi's WhatsApp number (§9). Falls back to `mailto:adi@buffadhd.com` if WhatsApp can't open.
- Settings row in [`ParentSettingsScreen.tsx`](../../../src/screens/parent/ParentSettingsScreen.tsx) →
  About, mirroring the install entry already there (`ParentSettingsScreen.tsx`:162). Always present.
- Dashboard: the one-line `useRateNudgeRegistration(...)` from §5 (phase 2).
- **Admin Tester Board (admin-web — separate repo/deploy):** a small "Feedback / low ratings" view that
  reads `reviews` rows with low/private status, so every low rating lands in one place for Adi. This is a
  distinct deploy (Vercel, auto-deploys from main) — treat as a **Phase 3** add-on, not a blocker for the
  in-app flow. (Memory `admin_tester_board`.)

### i18n
All copy via `t()` (i18next) per memory `i18n_three_language_sources` — **never** read copy off
`useLanguage()` (leaked device lang in View-as-Child 3×). New keys under a `rate.*` namespace in
[`en.json`](../../../src/i18n/en.json) + [`he.json`](../../../src/i18n/he.json). The i18n guard test stays green.

### Out of scope (flag, don't pull)
- ❌ Native In-App Review API (`expo-store-review`) — post-launch, separate package.
- ❌ Auto-translation he↔en at write time — v1 stores raw text + `detected_lang`; translation happens at
  moderation time (manual now, edge-function later). Don't block on translation infra.
- ❌ Auto-export `reviews` → `reviews.json` on the site (currently manual). Separate task.
- ❌ Defining the Nudge Manager — owned by `pkg/pwa-install-nudge`.
- ❌ A smart "win-moment" trigger (rate after a reward redemption / N good days) — backlog; v1 surfaces
  are Settings (always) + the passive slot (lowest priority).

---

## 7. Capabilities & Bottlenecks (Capability Check)

| # | What | This package |
|---|---|---|
| 1 | What CC can do | Settings row, gate sheet, the platform-split high-intent destination, the `reviews` write, i18n (en/he), jest + typecheck + code-review, web verification via `npm run web` + preview tools. |
| 2 | What CC will do | Phase-by-phase in Plan Mode with diffs. Phase 1 = Settings + gate sheet + DB write (independent). Phase 2 = the `useRateNudgeRegistration` one-liner into the **already-merged** Manager. |
| 3 | What Adi must do herself | (a) Provide the **Google Business Profile review URL** (or confirm web high-intent is in-house-only for v1). (b) Approve final copy (Pillar 2). (c) Decide the **engagement threshold** for the passive rate nudge. (d) Moderate incoming `reviews` (approve → testimonial). (e) Real-device Hat-4: confirm the Play deep-link opens the listing on a real Android device + the rate banner never co-appears with the install banner (global cooldown). |
| 4 | Where the bottleneck is | None external — the Manager (PR #267) is merged, RLS + table exist, no migration. Only product inputs from Adi (copy, engagement threshold, Google URL). |

---

## 8. Values Check (mandatory — 9 questions)

Parent-facing feedback feature. Passes with a copy guardrail; the sentiment gate is *protective*, not manipulative (it shields unhappy parents from being pushed to a public store and routes them to a heard, private channel).

### Pillar 1 — Intrinsic Motivation
1. *Want it without a reward?* — N/A to the child; a parent affordance. **Pass.**
2. *Moves toward a self-chosen reward?* — Neutral; untouched. **Pass.**
3. *"I want" vs "I must"?* — Fully optional, dismissible, never blocking. **Pass.**

### Pillar 2 — Positive Coaching
1. *Shaming / comparative / failure-framed?* — No. "Enjoying BUFF?" not "rate us or else". Unhappy path is empathetic ("what could we improve?"), never guilt. **Pass (guardrail below).**
2. *Child-failure empathy?* — No child failure state; parent-only surface. **Pass.**
3. *BUDDY suffering/loss mechanic?* — None. **Pass.**

### Pillar 3 — Independence-Building
1. *More capable without the app?* — Neutral. **Pass.**
2. *Child has a voice?* — Parent action; fully dismissible. **Pass.**
3. *Still necessary in 6 months?* — Yes — a standing feedback/testimonial channel. **Pass.**

**Copy guardrail (Pillar 2 + memory `marketing_why_what`):** lead with feeling/outcome, never FOMO or
obligation. Final copy → Adi.

**Verdict: PASS** — proceed to ROADMAP on Adi's approval.

---

## 9. Open questions for Adi

1. ~~Web high-intent~~ — **resolved (§2.1):** in-house only for v1, no Google link.
2. ~~Engagement threshold~~ — **resolved by research (§4.3):** positive moment + retained ≥ 7 days, 90-day
   local cooldown. Confirm the "positive moment" signal (reward redemption vs. a good-completion day).
3. **WhatsApp number** for the low-rating contact button (`contactSupport.ts`). Falls back to
   `mailto:adi@buffadhd.com` if not provided.
4. **Copy** for the gate + both mini-forms + the WhatsApp pre-fill (he/en) — accept CC drafts then redline,
   or you write them?
5. **`status` value** for the not-happy path — fine to keep low rows as `'pending'`-and-never-approved
   (zero DDL), or a dedicated `'private'` value? (Implementation check: does `reviews.status` have a CHECK
   constraint?)
