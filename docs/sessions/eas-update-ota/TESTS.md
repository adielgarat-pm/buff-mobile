# TESTS — pkg/eas-update-ota (OTA / EAS Update)

**Package:** activate `expo-updates` OTA so JS-only changes bypass Play review.
**Commit:** `6ebf73f` · **PR:** #350 · **Branch:** `pkg/eas-update-ota` (from origin/main).

> Key testing fact: OTA is **disabled in dev / Expo Go** (`Updates.isEnabled === false`) and a
> **no-op on web**. It can therefore only be exercised from a **`preview`-profile build** — not
> from the dev-client Metro. This shapes every Hat-3/Hat-4 scenario below.

---

## Hat 1 — Static (CC, no device) — DONE where marked

| # | Check | Command | Status |
|---|-------|---------|--------|
| 1.1 | Typecheck | `npm run typecheck` | ✅ clean |
| 1.2 | Web bundles; `.web.ts` resolved; expo-updates absent from web bundle | `npm run web` → "Bundled … (N modules)" no error | ✅ (1754 modules, clean) |
| 1.3 | Jest suite unaffected | `npm test` | ⏳ run before merge |
| 1.4 | No raw Alert introduced | `npm run check:no-raw-alert` | ⏳ (hook uses no Alert — expect pass) |
| 1.5 | Code review | `/code-review` on diff | ⏳ |
| 1.6 | `app.json` / `eas.json` valid JSON, channels present | `eas config` (or manual) | ⏳ |

---

## Hat 2 — Build gate (Adi triggers; bills EAS quota) — THE technical risk

| # | Check | How | Pass criteria |
|---|-------|-----|---------------|
| 2.1 | **`runtimeVersion: fingerprint` builds clean on SDK 54** | `eas build --profile preview --platform android` | Build succeeds; EAS computes a fingerprint runtime with no error. *This is the one flagged risk — if fingerprint errors, STOP and surface (do not improvise).* |
| 2.2 | Build carries the `updates` config | Inspect build → `Updates.isEnabled === true` at runtime (see 3.1) | true |

---

## Hat 3 — Emulator (CC via adb, on a `preview` build) — the core OTA proof

Prereq: install the Hat-2 `preview` APK on the emulator (NOT a sideloaded dev build).

| # | Scenario | Steps | Pass criteria |
|---|----------|-------|---------------|
| 3.1 | OTA enabled in a real build | Launch app; log `Updates.isEnabled` | `true` (was `false` in dev) |
| 3.2 | App launches clean with OTA active | Cold start | No crash; onboarding/home renders; no `[OTA]` error in logcat |
| 3.3 | **Silent apply on 2nd cold start** | Make a visible JS change (e.g. a label) → `npm run ota:preview -- --message "hat3 test"` → force-stop → **1st** relaunch → force-stop → **2nd** relaunch | Change is **absent** on 1st relaunch (fetch happened in background), **present** on 2nd. No prompt, no mid-session reload. |
| 3.4 | No mid-session interruption | While app open, publish an update | App does **not** reload itself; user session uninterrupted |
| 3.5 | Offline resilience (swallowed failure) | Emulator airplane mode → cold start | App launches normally; `[OTA] update check failed (non-fatal)` in logcat; no user-visible error |
| 3.6 | Rollback | `eas update --branch preview` republishing the prior bundle | Reverts on 2nd cold start (proves republish-from-known-state works) |

---

## Hat 4 — Real device (Adi only — no emulator shortcut)

| # | Scenario | Pass criteria |
|---|----------|---------------|
| 4.1 | OTA reaches a real Play/internal-track install | Publish `ota:preview`; open the internal-track build twice → update lands |
| 4.2 | **Pre-OTA binary does NOT receive OTA** (expected) | The currently-live production binary (built before this config) ignores OTA — confirms caveat #1; it needs the next store binary first |
| 4.3 | Fingerprint gate | After a future native change, an OTA built for the new fingerprint does **not** apply to the old binary | old binary stays put (no incompatible JS) |
| 4.4 | Sentry traceability | Force a JS error post-OTA → Sentry event tagged with the `updateId` | update is identifiable in Sentry |

---

## Values Check — re-verify against IMPLEMENTED behavior (not just SPEC)

Infra feature (app self-update), not a child-motivation mechanic. Silent-apply (v1) means
**no user-facing string at all**, which clears the one copy guardrail the design flagged.

| Pillar | Q | Verdict |
|--------|---|---------|
| 1 Intrinsic Motivation | reward-free? self-chosen? want-not-must? | Pass — invisible to the child; no reward surface; nothing to comply with |
| 2 Positive Coaching | shaming? failure-frame? BUDDY suffering? | Pass — **no visible copy** (silent apply); BUDDY uninvolved |
| 3 Independence | more capable? has a voice? still needed in 6mo? | Pass — infra plumbing; no dependency created; intentional infra exception |

**Verdict: PASS** — silent-apply is strictly gentler than the SPEC's flexible-prompt design.

---

## Exit gates before merge

- [ ] Hat 1.3–1.6 green (jest, no-raw-alert, code-review, config valid)
- [ ] Hat 2.1 green — **fingerprint builds clean** (the flagged risk)
- [ ] Hat 3.3 green — **silent apply on 2nd cold start** (the core behavior)
- [ ] Hat 4.1 + 4.2 (Adi) — reaches a real build; pre-OTA binary correctly ignored
- [ ] STATUS.md row added; INTEGRATION_LEARNINGS entry if anything surprised
