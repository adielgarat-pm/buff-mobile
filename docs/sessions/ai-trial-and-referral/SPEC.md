# SPEC — ai-trial-and-referral (v2, post expert-panel)

**Status:** DESIGN (target state). No code until Adi says `approved, proceed`.
**Branch:** `pkg/ai-trial-and-referral`
**Last updated:** 2026-07-01
**Reviewed by:** Product-Marketing, Product/UX, Architect, BUFF-Values panels (2026-07-01).
All four returned "not complete as written"; this v2 folds in their must-fixes.

---

## 1. Problem statement

**A — Token leak on FREE users.** `generate-child-insights` (Claude Haiku 4.5) has
**no server-side subscription gate** — family membership + 3/week only. On web,
`noIapPaywallHidden` treats everyone as subscribed → unlimited free token burn.
Constraint: **no LLM tokens on FREE users past their ~14-day trial.**

**B — Dashboard headline insight uses the wrong engine.** The top card renders the
**rule-based, static, age-agnostic** `useParentInsights[0]` — why it "never changes"
and gives a 15-yo kid-framed advice. The **age-aware LLM insight already exists** but
is buried in the full Insights screen.

**C — Referral drift.** Current `redeem_referral` grants on **code redemption**, caps
at **14 days total (non-stacking)**. Decided model: **+7 days per friend whose child
ACTIVATES, capped 7 days/calendar-month**, same clock.

---

## 2. Strategy — "Personal Coach" trial → convert, referral extends it

One entitlement clock (`premium_until`); one north-star (child activation).
- New family → 14-day full-Premium trial. Dashboard shows the **LLM insight** during
  trial/premium (fixes B).
- **Trial starts on CHILD ACTIVATION**, not signup — defends "register but never
  activate," and the LLM needs task data anyway.
- Post-expiry FREE → rule-based insight (unshamed) + a locked **Personal-Coach** teaser
  → the task-specific paywall (reuse `BUFF_MESSAGING.md §4.5` / `BUFF_BRAND.md §4`).
- Referral extends the same clock (+7/activated-friend, 7-day monthly cap) — NovoKid
  principle: bounded perk (~20% of a month) that doesn't cannibalize purchase.

---

## 3. Non-negotiable guards (from Values + child-safety review)

1. **Child path is bulletproof.** The activation → trial/referral grant must be
   **failure-isolated and non-blocking**: a child's task completion, BUFFs award, and
   BUDDY update MUST succeed even if the grant errors. (Trigger runs in the same txn
   but must never raise into the child write — see §6.3.)
2. **No child-facing exposure.** No child-mode or View-as-Child surface ever renders the
   402, the rule-based/LLM card, the locked strip, the ribbon, or the paywall.
3. **No child instrumentalization in copy.** Never show parent-facing framing that gates
   a reward on the child performing — banned strings: "get your child to finish a task
   to start your trial", "your friend's child hasn't activated yet." Referrer status may
   only be **positive** ("your friend joined 🎉"), never a child-performance nag.
4. **No free-tier shaming.** Drop rank-based "Basic." Name tiers by what they are:
   **"Weekly tip"** (rule-based) vs **"Personal coach"** (LLM). Keep the child's name
   out of the *locked* upsell; use it only in the *live* insight.

---

## 4. Behavior contract (end-to-end)

1. New family completes onboarding → `families.trial_started_at = NULL`. On child
   **activation** (§9 decision), a `SECURITY DEFINER` trigger sets
   `trial_started_at = now()` **once** (idempotent) and grants `premium_until = now()+14d`
   to all parent profiles.
2. Trial/premium → dashboard headline card shows the age-aware LLM insight. States in §7.
3. `generate-child-insights` returns **402 `{error:'premium_required'}`** unless the
   caller's family is entitled (full ladder, NOT grace period). Applies on web too.
4. Trial nears expiry → in-app warning (last 3 days) + **one FCM push at expiry**
   (email does not exist yet; push does). Expiry → FREE family sees the "Weekly tip"
   card + locked Personal-Coach strip → task-specific paywall.
5. Referral: when the invited family's child **activates**, both families get +7 days,
   capped so ≤7 days are granted to a family per calendar month (Asia/Jerusalem), with a
   **lifetime ceiling** (§9). Referrer sees positive status.
6. Daily cron nullifies expired `premium_until` (exists) — touches `profiles.premium_until`
   ONLY, never `families.trial_started_at`.

---

## 5. Instrumentation (do NOT defer — you can't tune a funnel blind)

Log events from day one (table `funnel_events` or existing analytics): `activation`,
`trial_started`, `trial_expiring`, `trial_expired`, `insight_viewed`, `paywall_viewed`,
`referral_shared`, `referral_completed`, `purchase`. Enables activation-rate,
trial→paid %, K-factor, and %-staying-free-via-referral.

---

## 6. Architecture (from Architect review)

### 6.0 Phase 0 — SECURITY LOCKDOWN (must precede everything)
**AUDIT RESULT 2026-07-01 — CONFIRMED LIVE VULNERABILITY.**
- `profiles` grants table-level `UPDATE` to `authenticated` (and `anon`) — **no
  column restriction**.
- RLS policy "Users can update their own profile" = `USING/WITH CHECK (user_id = auth.uid())`
  — checks only ownership, **not which columns changed**.
- ∴ any authenticated user can run
  `UPDATE profiles SET premium_until = now()+interval '10 years', is_lifetime_access = true
  WHERE user_id = auth.uid()` and **self-grant lifetime premium today**, using the app's
  own anon key. The entire billing/entitlement model is currently bypassable. This is a
  standing vuln independent of this package.
- `referrals`: live grants are `INSERT, SELECT` only (no UPDATE) — the migration's broad
  UPDATE grant is NOT present live, so that specific concern is already closed. INSERT is
  still open (redeem is RPC-only, so acceptable, but worth a WITH CHECK later).

**Fix:** revoke blanket `UPDATE ON profiles` from `authenticated`/`anon`; re-grant
`UPDATE` **column-by-column** only on columns the client legitimately writes (display_name,
preferred_language, last_seen_at, avatar, birth_date, theme/settings, etc. — to be
enumerated from the code before applying). Entitlement columns (`premium_until`,
`is_lifetime_access`, `is_lifetime_founding`, `founding_member_number`, and new
`trial_started_at`) become writable ONLY via `SECURITY DEFINER` RPCs / service role.
**Requires careful column enumeration + Adi approval — it touches a LIVE app; a wrong
allowlist breaks settings/EditChild/last_seen_at writes.**

### 6.1 Server gate (Phase A — code-only on the edge fn, independent)
- New `SECURITY DEFINER` RPC `family_is_entitled(p_family_id)` mirroring the full ladder:
  `is_lifetime_access OR is_lifetime_founding OR premium_until > now()`. **Do NOT copy
  the grace-period branch** (expired 2026-05-01 — copying it re-opens the leak).
- Gate returns 402 JSON (`content-type: application/json`) before rate-limit + Anthropic.
- **Fix client mapping:** `useSmartInsights.ts:119` matches `message.includes('402')`,
  but `FunctionsHttpError.message` usually lacks the code → 402 falls through to
  'server'. Branch on `error.context?.status` / parsed JSON body instead.

### 6.2 Trial-start integrity
- Guard column `families.trial_started_at timestamptz` (single row per family = atomic
  once-ever): `UPDATE families SET trial_started_at=now() WHERE id=$1 AND trial_started_at IS NULL`.
  Grant `premium_until` only when that UPDATE affected a row. **Not** on `profiles`
  (N rows = race).

### 6.3 Activation → grant wiring
- Activation write today is a **raw client upsert** into `daily_progress`
  (`useChildProgress.ts:382`) — client-side granting is unreliable + racy.
- **Use an `AFTER INSERT OR UPDATE` trigger on `daily_progress` `WHEN NEW.completed`,
  SECURITY DEFINER**, guarded cheap: `IF NEW.completed AND (OLD IS NULL OR OLD.completed=false)`
  then early-exit unless `trial_started_at IS NULL` OR a pending referral exists. Definer
  rights are correct here (own-device child session can't UPDATE families/other profiles —
  same RLS wall as the EditChild-own-device bug). Scheduled reconcile = backstop only.
- Trigger must be wrapped so an error never aborts the child's completion txn.

### 6.4 Referral cap (Phase C)
- **Ledger, not derived:** partial grants (cap math yields <7) make count-based derivation
  double-count. Add `referral_grants(family_id, days_granted int, granted_month date)` (or
  columns on `referrals`). `granted_this_month = SUM(days_granted) WHERE granted_month =
  date_trunc('month', now() AT TIME ZONE 'Asia/Jerusalem')`; `add = LEAST(7, GREATEST(0, 7-granted))`.
- **Concurrency:** `pg_advisory_xact_lock(hashtext(family_id))` (or `FOR UPDATE`) around
  the grant; idempotent pending→completed transition per referral inside one txn.
- **Lifetime ceiling** per §9 decision.

### 6.5 Data model
- Keep `premium_until` as the single entitlement clock. Drive UI state from
  `families.trial_started_at` + `is_lifetime_*` + RC — **do not reverse-engineer** the
  source of `premium_until`.
- **Existing-user backfill (rollout)** per §9 decision — a conscious migration step, or the
  trigger silently gifts a fresh trial to every already-active family on their next tap.

---

## 7. UI — dashboard headline card state machine (from Product/UX review)

Card is driven by **true-entitlement-or-live-trial** computed from **family-max
`premium_until`** + `trial_started_at`, **independent of `isSubscribed`/`noIapPaywallHidden`**
(else web shows "subscribed" while the insight 402s). Rendered only for a parent NOT in
View-as-Child.

| State | Condition | Shows |
|---|---|---|
| Loading | any source loading | skeleton |
| Trial — warming up | trial active, <3 days data / no LLM yet | `✨ Your AI coach is getting to know {name}…` (NOT a locked "come back" card) |
| Trial — active | trial active, LLM ready | LLM insight + `✨ AI coaching active` (countdown only last 3 days: `3 days of AI coaching left`) |
| Trial — gen failed / rate-limited | entitled but 402≠, 429/500 | fall back to rule-based insight, **no downgrade label** (they're entitled) |
| Premium | lifetime/founding/RC/family entitlement | LLM insight, subtle `✨` |
| Just subscribed | RC/lifetime true | drop ribbon + expiry framing immediately; never show "days left" to a payer |
| Expired — free | not entitled, trial consumed | rule-based "Weekly tip" (unlabeled/unshamed) + `🔒 Unlock personal coaching for {name} →` |
| Multi-child | — | show **most-recently-active** child's insight, not `children[0]` |

Web Expired branch: locked strip → **"Get it on the app / notify me"** (no Paddle),
not the paywall. Countdown/expiry is soft on both platforms (client-evaluated).

---

## 8. Activation-assist + conversion moments (from Marketing review)

- **Design the activation moment** (Adi's #1 fear, and the trigger for everything):
  first-task nudge / empty-state that sells the trophy moment; day-1 and day-3 reminder
  (push) to complete the first task. Without this the trial never starts and the card
  shows the weakest state during peak parent attention.
- **Expiry = the conversion event:** pre-expiry warning (last 3 days) + one FCM push at
  expiry + a **task-specific, child-named paywall** referencing the actual win during the
  trial (reuse §4.5; the generic "unlock features" framing is a documented anti-pattern).
- **Referrer feedback loop:** positive-only status ("your friend joined 🎉 / you earned
  +7 days") so the referrer stays engaged — but never a child-performance nag (§3.3).

---

## 9. Decisions — LOCKED by Adi (2026-07-01)

1. **Activation bar = active on 2 distinct days.** Not "first completion" (gameable in
   View-as-Child). The trial-start trigger and referral-completion fire only once a child
   has a completed task on **2 different calendar dates**.
2. **Existing families on rollout = backfill `trial_started_at = created_at`.** No fresh
   trial for already-active families (don't gift premium/tokens to long-time free users).
3. **Referral cap = monthly 7 days only.** No lifetime ceiling. *Accepted risk:* a
   well-connected parent referring ~1 activating friend/month can stay premium indefinitely
   — we instrument `%-staying-free-via-referral` (§5) and can add a lifetime cap later if
   the data shows abuse.
4. **Referred family reward = standard 14-day trial only.** Share message = "14 days of
   BUFF Premium, free." No extra bonus.
5. Defaults: monthly-cap rollover = OFF; month timezone = Asia/Jerusalem; expiry channel = FCM push.

---

## 10. Out of scope
- Real money %-off-next-payment referral (v2, needs billing session).
- Web paid billing (Paddle) — parked; web post-trial = "get the app / notify me."
- Any change to the child-facing loop.
- New LLM model/prompt redesign (Haiku 4.5 stays).

---

## 11. Phases (chunk-by-chunk, diff + approval each)

- **Phase 0 — Security lockdown** ✅ DONE (2026-07-01). Migration `035_protect_entitlement_columns.sql`
  applied + verified (client blocked from entitlement columns; benign writes + server writers
  unaffected). Chosen approach: targeted BEFORE UPDATE trigger (zero blast radius) instead of
  revoking the blanket grant.
- **Phase A — Server gate** ✅ DONE (2026-07-01). `family_is_entitled` RPC (migration 036,
  service_role-only, verified entitled→true/free→false), gate wired into
  `generate-child-insights` (deployed v12, verify_jwt preserved, before rate-limit+Anthropic),
  `useSmartInsights` 402 mapping fixed (reads HTTP status). Server-verified; full 402/200
  end-to-end pending Hat-3/4 (real founding vs free login). Billing dependency logged: rc-webhook
  must reflect monthly/yearly RC subs into premium_until before monthly billing launches.
- **Phase B — Trial clock + activation trigger** (`trial_started_at`, SECURITY DEFINER
  trigger, non-blocking child path). DDL → approval.
- **Phase C — Referral rewrite** (+7/activated-friend, ledger, monthly cap, advisory lock,
  lifetime ceiling). DDL → approval; flag existing-user impact.
- **Phase D — Card state machine + microcopy** (LLM insight on card, all states in §7,
  de-shamed copy, child-mode gating).
- **Phase E — Activation-assist + expiry conversion** (nudges, pre-expiry warning, FCM
  push, task-specific paywall) + instrumentation events (§5).
- **Phase F — Hat 1 + Hat 3 + doc sync + Values Check** incl. child-safety tests:
  (a) child completion/reward/BUDDY survive a grant-RPC error; (b) no child surface renders
  402/tier-label/lock/paywall.
