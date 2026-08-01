# SPEC — first-launch-freshness (OTA freshness, client side · layers 1+3)

**Status:** DESIGN (target state). No code until Adi says `approved, proceed`.
**Slug:** `first-launch-freshness`
**Last updated:** 2026-08-01 (v2 — revised after architect / UX-values / adversarial-risk review)
**Companion:** `pkg/ota-freshness-ci` (PR #428, MERGED) delivered layers 2+4 (auto-OTA gated on CI + fingerprint drift guard). This package is the **client half** — layers 1+3.

> **Review note (v2):** three independent reviews (architect, UX/values, adversarial-risk) returned **GO-WITH-CHANGES / ACCEPTABLE-WITH-MITIGATIONS — no NO-GO**. Their required changes are folded in below; §9 records the synthesis. The most important correction: Layer 1 must **poll `isUpdatePending`**, not call `checkForUpdateAsync`/`fetchUpdateAsync` itself.

---

## 1. Problem statement (grounded)

**Observed (Keren, 2026-07-31):** installed BUFF from Play Friday morning → hit bugs already fixed on `main`. Root cause traced this session:

1. The Play binary is **vc68 (1.8.2), built 2026-07-13** (confirmed via `eas build:list`; runtime fingerprint `e4983c15…`) — ~3 weeks old. A fresh install runs the **JS bundle embedded in that binary**, i.e. code from July 13.
2. `expo-updates` is `checkAutomatically: ON_LOAD` + `fallbackToCacheTimeout: 0` (verified `app.json`). On first launch the native layer launches **instantly from the embedded bundle** and downloads any newer OTA **in the background**; the OTA applies only on the **next** cold start. So a brand-new user's **session 1 — the activation-critical moment — always runs the old embedded code.**
3. Existing users get a downloaded OTA only when they next cold-start, which on Android can be **days** away (the OS keeps the process warm).

Two gaps, two layers:
- **Layer 1 — first-launch freshness:** a *fresh install* should reach current JS **in session 1**. The Keren case.
- **Layer 3 — restart-to-apply:** an *existing user* holding a downloaded OTA should be gently offered to apply it, not wait for an indeterminate cold start.

**Already handled elsewhere:** the *new-binary* signal ("a higher versionCode exists on Play") ships today via `useVersionGate` (expo-in-app-updates, flexible flow, App.tsx:195). See §2.

---

## 2. The "newer version" signals (reconciliation — critical)

BUFF has **three** freshness signals; they must not collide or double-prompt. This SPEC owns rows 2 and 3.

| # | Signal | Mechanism | Prompt | Surface | Status |
|---|---|---|---|---|---|
| 1 | New **binary** on Play track | `expo-in-app-updates` (`useVersionGate`, flexible) | Play sheet + Play's "restart to install" snackbar | Android native | **Shipped** (App.tsx:195) |
| 2 | New **OTA** at a **fresh install's** session 1 | **Layer 1** — poll `isUpdatePending`, silent apply on splash | none (silent) | Android native | **This SPEC** |
| 3 | New **OTA** for an **existing user** (downloaded this session) | **Layer 3** — dismissible toast → `reloadAsync()` | our toast (safe surfaces only) / web reload banner | Android native + Web | **This SPEC** |

**Collision rules (revised per review):**
- Layers 1 and 3 are mutually exclusive by trigger: Layer 1 runs only when the first-launch flag is **unset** and sets it; Layer 3 runs only when the flag is **set**.
- **Layer 1 ↔ binary (row 1):** on a fresh install, `useVersionGate` may open Play's flexible sheet the same moment Layer 1 reloads; the JS reload dismisses the Play sheet UI (the native download survives; Play re-offers later). Cosmetic — accepted for v1.
- **Layer 3 ↔ binary (row 1):** **v1 does NOT suppress Layer 3 while a Play binary download is in flight.** (Rationale: reading that state requires adding an exposed `updateInFlight` to `useVersionGate`, which §4 keeps out of scope. The two prompts are different surfaces and Layer 3 is throttled once/day, so a rare overlap is acceptable.) Promoting a minimal `updateInFlight` signal into `useVersionGate` is a **follow-up**, not v1.
- **All `reloadAsync()` calls route through one `reloadOnce()` helper** (module-level in-flight boolean) so no two callers (Layer 1, Layer 3, LanguageContext RTL) can double-reload.

---

## 3. Target state

### Layer 1 — first-launch freshness (Android native)

On the **very first launch after install** (flag unset), while the native splash is up:

- **Do NOT call `checkForUpdateAsync`/`fetchUpdateAsync`.** With `ON_LOAD` the native controller is *already* downloading any newer OTA in the background; an independent JS fetch races it (redundant fetch, or `reloadAsync` firing mid-download → throws or wastes the reload). Instead **poll `Updates.useUpdates().isUpdatePending`** (or `addUpdatesStateChangeListener`) and, the moment it turns true within the budget, call `reloadOnce()`.
- **Budget: a wall-clock ~2.5–3 s (remote-tunable constant), NOT 6 s.** Implemented as `Promise.race([pendingBecameTrue, setTimeout(budget)])` — the timer edge releases the gate **independently of any network call** (captive-portal/hung-TCP safe). If the OTA doesn't become pending in time → fail-open on the embedded bundle.
- **Fail-open is an acceptance criterion, not a hope.** The gate state `pending` defaults such that **every** branch — dev, `!Updates.isEnabled`, no-update, timeout, any throw, a throwing/hung AsyncStorage read — releases it via a single `finally`/timer. There is **no error boundary in `App.tsx`**, so all native + storage access lives inside the hook's effect in try/catch/finally; nothing in render body. The only branch that legitimately never releases is the success path (because `reloadAsync` tears down the JS context).
- **Ordering (crash-loop guard):** persist `buff.firstLaunchFreshnessDone=1` and **`await` it BEFORE `reloadOnce()`**. If the flag write fails → **fail-open, do not reload** (never reload without a durable "don't retry" marker). This, plus expo-updates' native automatic rollback on a boot-crashing update (confirm not disabled), prevents a fresh-install crash loop.
- **Late-fetch guard:** once the timeout branch fires, a late-resolving background download must **not** trigger a reload; it just stays pending and applies next cold start (or via Layer 3). Single-shot.
- The flag guarantees Layer 1 runs **once per install**.

**Cost acknowledged (measured hypothesis, not assumed win):** when it does reload, session 1's JS re-initializes twice (i18n, `Sentry.init`, providers, auth, RevenueCat) and the splash re-shows — time-to-interactive roughly doubles. This is why the budget is short and remote-tunable, and why success is judged against a **session-1 activation read + telemetry elapsed-ms**, not asserted. Keep the splash **silent but with subtle branded motion** (breathing logo / shimmer) so the wait reads as "loading," never "stuck" — **no "Updating…" text** (invites the "why slow?" read and needs Pillar-2 copy).

**Hard constraint (stated loudly):** Layer 1 only benefits installs of a **binary that already embeds the layer-1 code**. An OTA of layer-1 code cannot help a fresh vc68 install (its embedded bundle predates it). **Layer 1 must ride the next binary cut (vc69+); no effect until then.**

### Layer 3 — restart-to-apply (Android native + Web)

When an OTA has been **downloaded this session** (`Updates.useUpdates().isUpdatePending === true`) on an existing user's device:

- Show a **gentle, dismissible toast** with the verb on a labeled button (statement, not a question) — **copy APPROVED by Adi 2026-08-01**:
  - **EN:** *"A fresh version of BUFF is ready ✨"* · **[Refresh now]** / **[Later]**
  - **HE:** *"גרסה חדשה של BUFF מוכנה ✨"* · **[רענון]** / **[אחר כך]**
- **Never auto-reload.** Reload (via `reloadOnce()`, wrapped in try/catch) fires only on explicit **[Refresh now]**.
- **Throttle:** at most once/day (AsyncStorage timestamp written at **toast-shown**, not at dismiss — so a second same-session `isUpdatePending` flip can't re-toast). Dismiss remembered for the day.
- **Safe-surface predicate (single gate — subsumes the child-surface rule).** Show **only** when *all* hold:
  1. parent-authenticated top-level read-mostly surface (Dashboard / Rewards / Activities / Insights list), **AND**
  2. not View-as-Child, **AND**
  3. not Pause Mode, **AND**
  4. no editor/modal/sheet/onboarding/`crossAlert` open, **AND**
  5. app is **foreground** (`AppState === 'active'`) — never fire while backgrounded/returning, **AND**
  6. a **settle delay** has elapsed (~a few seconds after the surface loads) — never greet a parent the instant they enter, **AND**
  7. no **celebration/animation** in flight (`GlobalConfetti` / `GlobalRewardPop`, App.tsx:210-211) — a reload must not step on a positive moment (Pillar 2), **AND**
  8. not during a **paywall / purchase / subscription** flow — never interrupt a conversion moment.

  This protects a child's flow (65% shared-device), a parent's mid-edit work (naming a reward, editing a task, packing list), a positive moment, and a conversion — all from a one-tap state-discarding reload. (Gates 5–8 added on Adi's request, 2026-08-01.)
- **`isUpdatePending` scope:** fires only for OTAs whose download completes **during the current session** — a prior-session pending update auto-applies at the next cold start (that's `ON_LOAD`) and never reaches this toast. That is exactly the warm-process "process alive for days" case Layer 3 targets. After apply, `isUpdatePending` resets to false (applied update becomes `currentlyRunning`).
- **Web split:** on Expo Web the equivalent is a build-version check → `location.reload()` toast (same pattern the in-app-updates SPEC §Web describes). No new dependency.

---

## 4. Proposed approach (for review — not self-approved)

### No new dependency
`expo-updates ~29.0.18` is installed and active. Layers 1+3 use only its public API (`useUpdates`/`isUpdatePending`, `reloadAsync`, `isEnabled`, optionally `addUpdatesStateChangeListener`). `expo-in-app-updates` (already present) is **not** touched in v1.

### Integration points (confirmed in Plan Mode against real code)
- **Layer 1 — platform-split hook** `useFirstLaunchFreshness.ts` (native) / `.web.ts` (no-op — web is fresh per load) / `.ios.ts` (no-op **as a product gate**: no iOS binary in market yet — *not* an API limit; expo-updates OTA works on iOS, so a future iOS enable is a one-line change). Returns `{ pending: boolean }`.
  - Wired in `AppContent` **alongside** the existing `isHydrating` gate (App.tsx:197): render the existing lavender splash while `pending || isHydrating`. Adds subtle motion to that splash. No new launch screen.
  - Lazy/native-safe per `native_import_sentry_blindspot` — all `expo-updates` access inside the effect, `Updates.isEnabled`-guarded, try/catch/finally; never a top-level native import.
- **Layer 3 — platform-split hook** `useOtaRestartToast.ts` (native `useUpdates`) / `.web.ts` (build-version check) / `.ios.ts` (native, same as android) driving a minimal **`<UpdateReadyToast/>`** (no toast component exists today — v1 adds a small non-blocking one, no dependency). Mounted beside `<AlertHost/>`, safe-surface-gated.
- **`reloadOnce()`** shared helper (module-level in-flight guard, try/catch) — the single entry point for every `reloadAsync`.
- **Telemetry** (reuse the #426 `pushTelemetry`/Sentry-breadcrumb pattern): Layer 1 → `poll_started / became_pending / reloaded / timeout / disabled / error` (+ elapsed ms); Layer 3 → `pending_detected / toast_shown / reload_tapped / dismissed / suppressed_<reason>`. Measure-first.

### Fingerprint safety (learned this session)
- **No `app.json` change.** Do **not** raise `fallbackToCacheTimeout` in config — it moves the native fingerprint (needs a new binary) and taxes every cold start for everyone. Layer 1 is JS-driven, first-launch-scoped.
- Adding `src/` source files does **not** move the runtime fingerprint (only native/deps/config do) → layers 1+3 are OTA-deliverable, **except** Layer 1's *benefit* (needs the embedding binary, §3).
- **Layer 3 reach is conditional on a fingerprint match.** Before publishing the Layer-3 OTA, run the #428 drift guard: the current `main` fingerprint must equal the field binary's runtime. **Confirmed 2026-08-01: `main` = `e4983c15` = vc68 — matched (CI-verified), so Layer 3 is deliverable to vc68 today.** Re-verify at publish time; state reach as conditional, not assumed.

### Out of scope (flag, don't pull)
- ❌ Any **behavioral** change to `expo-in-app-updates` / `useVersionGate` (binary signal — shipped). *(Exposing a read-only `updateInFlight` for Layer-3 suppression is a named follow-up, not v1 — see §2.)*
- ❌ `app.json` `updates` config / versionCode strategy changes.
- ❌ iOS-specific first-launch tuning (shared native hook; no iOS binary yet).
- ❌ A custom launch/splash screen — Layer 1 reuses the existing hydrating splash.

---

## 5. Capabilities & Bottlenecks (Capability Check)

| # | What | This package |
|---|---|---|
| 1 | CC can do | Both platform-split hooks + the toast component + `reloadOnce`, wire into App.tsx, telemetry, typecheck, jest, code-review, draft copy. |
| 2 | CC will do | Plan Mode, phase-by-phase, diffs. **Layer 3 first** (OTA-shippable, lower risk), **Layer 1 second** (rides vc69). |
| 3 | Adi must do | (a) Approve copy (Pillar-2). (b) **Real-device Hat-4** for Layer 1 — only truly verifiable by installing a binary that embeds it, publishing a newer OTA, then doing a **fresh install** to confirm session-1 freshness (no emulator/web shortcut). (c) Trigger the vc69 build that carries Layer 1. |
| 4 | Bottleneck | Layer 1's proof needs **vc69 + a newer OTA + a clean install**. Layer 3 is verifiable now (force a preview OTA, observe the toast on emulator/web). |

---

## 6. Values Check (mandatory — 9 questions)

Infrastructure (app freshness), not a child-motivation mechanic. Passes with one copy guardrail.

### Pillar 1 — Intrinsic Motivation
1. *Want it without a virtual reward?* — **Pass — contingent** on the §3 safe-surface predicate (excludes View-as-Child + Pause Mode + editors); Layer 3 must never interrupt a child's or a parent's flow. Layer 1 is silent.
2. *Moves toward a self-chosen reward?* — Neutral; untouched. **Pass.**
3. *"I want" vs "I must"?* — Layer 1 silent; Layer 3 dismissible, throttled, never auto. **Pass.**

### Pillar 2 — Positive Coaching
1. *Ever shaming / comparative / failure-framed?* — No. "A fresh version is ready ✨," never "you're out of date." **Pass (copy guardrail).**
2. *Child failure → empathy or pressure?* — No child failure state. **Pass.**
3. *BUDDY suffering / loss / anger?* — None. **Pass.**

### Pillar 3 — Independence-Building
1. *More capable without the app?* — Neutral (infra); no dependency. **Pass.**
2. *Child has a voice?* — Layer 3 user-controlled; Layer 1 invisible/no demand. **Pass.**
3. *Still necessary in 6 months?* — Yes, plumbing for as long as we ship via stores. **Pass (intentional infra exception).**

**Copy guardrail (Pillar 2):** any string that could appear on a child-visible device must be plain and warm; never frame staleness as the user's fault. Final copy → Adi per `feedback_kid_microcopy_pillar1`.

**Verdict: PASS** (Pillar 1 Q1 contingent on the §3 predicate) — proceed to ROADMAP on Adi's approval.

---

## 7. Build & delivery (ONE package — Adi's call, 2026-08-01)

Built as a **single package** — one branch, one PR — carrying both layers together (not phased into separate merges). The layers still *deliver* on their natural channels, but they ship as one unit of work:

- **On merge → OTA:** Layer 3 (the restart toast) reaches existing vc68 users immediately (fingerprint match to vc68 confirmed this session).
- **On the vc69 cut → binary:** Layer 1 (first-launch freshness) activates for fresh installs from that binary forward. Layer 1 is harmless on existing installs before then (it never fires — the flag path only matters at install time on the embedding binary).

So: one package, one review, one merge → an OTA that lights up Layer 3, and Layer 1 baked into the next binary you cut anyway. Internal build order within the package (CC's call): Layer 3 first (lower risk, OTA-verifiable), Layer 1 second — but both land in the same PR.

---

## 8. Decisions & open questions

**Resolved (Adi, 2026-08-01):**
- ✅ **Copy** — approved as drafted (§3 Layer 3).
- ✅ **Build shape** — ONE package (§7), not phased merges.

**Still open:**
1. **Layer 1 budget** — CC will start at **2.5 s** (remote-tunable, so low-stakes) unless Adi objects. *(Explained: it's how long first-launch waits on the splash for the fresh code before opening with the embedded code.)*
2. **Layer 3 predicate — extra gates 5–8** (foreground-only, settle delay, not-during-celebration, not-during-paywall) — CC recommends all four; paywall + celebration are the high-value ones. Confirm?
3. **`updateInFlight` follow-up** — leave binary↔OTA-toast suppression out of v1 (accept rare overlap), promote later? (Reviewer-recommended.)

---

## 9. Review synthesis (v1 → v2 — what the three reviews changed)

All three: **GO-WITH-CHANGES / ACCEPTABLE-WITH-MITIGATIONS. No NO-GO.** Changes folded into v2:

- **Mechanism (architect #1, risk FM-2/3):** Layer 1 now **polls `isUpdatePending`** instead of calling `checkForUpdateAsync`/`fetchUpdateAsync` — removes the race with the native ON_LOAD controller. Flag persisted **before** reload; failed flag write → fail-open; late fetch never yanks mid-session.
- **Provable fail-open (architect #4, risk FM-1/4/5):** wall-clock `Promise.race` timeout independent of the network; single `finally` releases the splash gate on every branch; bounded fail-open AsyncStorage read; corrected the false "existing users byte-for-byte untouched" claim (all users now pay one bounded async read).
- **§2/§4 contradiction (architect #3):** dropped binary↔toast suppression from v1 (the state doesn't exist and §4 keeps `useVersionGate` out of scope); named it a follow-up.
- **Surface predicate (UX #2/3):** replaced "parent-surface only" with one "safe idle surface" predicate covering View-as-Child, Pause Mode, and open editors/modals — protects both child flow and parent mid-edit work.
- **Budget + motion (UX #1, risk FM-7):** 6 s → ~2.5 s remote-tunable; silent-but-animated splash; double-boot cost acknowledged as a measured hypothesis.
- **Copy (UX #4):** brand added to Hebrew; verb moved to labeled buttons; message as statement.
- **Layer 3 hardening (risk FM-8):** throttle timestamp at show-time; reload wrapped in try/catch; `reloadOnce()` single-owner guard (architect #7).
- **Layer 3 reach (risk FM-6):** stated as conditional on a fingerprint match + a publish-time drift-guard step; confirmed matched to vc68 today.
- **Clarifications:** `isUpdatePending` is same-session only (architect #5); iOS no-op is a product gate not an API gap (architect #6); web-split cleanliness follows the `useVersionGate` pattern (risk FM-10); collision matrix gained the Layer-1↔binary row (risk FM-9).
