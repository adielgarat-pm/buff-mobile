# TESTS — pkg/in-app-updates (Phase 1: Android flexible flow)

**Package:** in-app-update prompt when a newer *binary* is on the Play track (Noa gap).
**Commit:** `45c2948` + lazy-require fix · **Branch:** `pkg/in-app-updates` (from origin/main).
Complements OTA (`pkg/eas-update-ota`): expo-updates ships JS; this nudges the binary OTA can't deliver.
**Dep:** `expo-in-app-updates@^0.12.0` (Adi-approved) — Expo module, **autolinking (no config plugin)**.

> **The core bottleneck (SPEC §4):** in-app-updates can ONLY be verified with **two real Play
> builds (N and N+1) on the same real device** — device has an OLD build installed via the Play
> internal-test link, then a HIGHER build is published to that track. It does **not** fire on the
> emulator, in Expo Go, or for sideloaded EAS `internal` APKs. Budget one build cycle for the test.

---

## Phase 0 — Compatibility (CC) — DONE

- [x] Version pinned: `expo-in-app-updates@^0.12.0`. peerDep `expo:*`; zero direct deps.
- [x] **Autolinking, NOT a config plugin** — no `app.json` plugins entry, no manual native edits
      (README + package inspection). Corrects the design-time assumption.
- [ ] SDK 54 / RN 0.81 compat — **not documented by the package**; proven only by the EAS build (Hat 2.1).
- [x] Values check passes (infra; flexible = dismissible).

## Hat 1 — Static (CC, no device) — DONE

- [x] `npm run typecheck` — 0 errors.
- [x] **Native import is LAZY** — `require('expo-in-app-updates')` inside the effect, not a
      top-level import. Grep confirms no top-level native import at app root. `requireNativeModule`
      throws when unlinked; deferring past `Sentry.init` + inside try/catch prevents the invisible
      launch crash (memory `native_import_sentry_blindspot` / IN-2026-06-17).
- [x] `npm test` — 666/666 (73 suites).
- [x] `npm run check:no-raw-alert` — clean (no Alert; Play shows its own UI).
- [x] Web bundles clean — 1751 modules, `.web.ts` resolved, expo-in-app-updates absent from web
      bundle, no console errors.
- [x] IMMEDIATE flow OFF by default — `startUpdate(false)` forces FLEXIBLE (verified in code).
- [x] `/code-review` (high) — 0 correctness findings (the lazy-import gap was caught by this TESTS
      doc, then fixed).

## Hat 2 — Build gate (Adi triggers; bills EAS quota) — THE technical risk

- [ ] **2.1 expo-in-app-updates autolinks + builds clean on SDK 54 / RN 0.81** —
      `eas build --profile preview --platform android`. *This build IS the SDK-54 compat proof. If
      it fails, STOP and surface — do not improvise native code (SPEC §3).*
- [ ] 2.2 This binary is ALSO the **OTA floor** — one build activates BOTH in-app-updates and OTA.

## Hat 3 — Emulator — LIMITED (no real update test possible)

- [ ] 3.1 App launches clean with the module linked; `checkForUpdate` (no Play track) throws →
      swallowed; at most `[version-gate] … (non-fatal)`, no user-visible error.
- [ ] 3.2 No-op safety — app behaves exactly as before; the flow never fires (no Play on emulator).

## Hat 4 — Real device (Adi only — THE decisive test)

Prereq: two builds on the **same Play internal-test track**, versionCode N < N+1.

- [ ] 4.1 Device on build N (installed via Play internal link) → publish N+1 → cold-open BUFF →
      Play's **flexible** update sheet appears (non-blocking).
- [ ] 4.2 Dismiss is first-class — tap away → app works normally; re-prompts a later launch while stale.
- [ ] 4.3 Update + restart — tap update → background download → Play "restart to install" → on N+1.
- [ ] 4.4 No "Something went wrong" Play dialog on the updated build.
- [ ] 4.5 IMMEDIATE stays OFF — even a high-priority Play release is dismissible, never full-screen-blocking.
- [ ] Values check verified against implemented behaviour (neutral/gentle copy on a child device).

## Negative / edge

- [ ] Sideloaded (non-Play) build: no-op, no crash, no error toast.
- [ ] No newer version on track: no prompt, silent.
- [ ] Airplane mode at launch: no crash, no error surfaced.

---

## Known scope boundary (not a bug — v1 decision)

**IMMEDIATE-only updates get no prompt.** We force `startUpdate(false)` (flexible). If Play offers
an update as immediate-only (`flexibleAllowed=false`), the code does nothing → the most-stale users
get no in-app nudge. Intended consequence of "IMMEDIATE off for v1." To cover them later, switch to
`checkAndStartUpdate()` (Play-priority driven) behind a per-release flag.

## Exit gates before merge

- [x] Phase 0 + Hat 1 (all green; lazy-import fix applied)
- [ ] Hat 2.1 — **builds clean on SDK 54** (the flagged risk)
- [ ] Hat 4.1–4.3 (Adi, real device, two Play builds)
- [ ] STATUS row + INTEGRATION_LEARNINGS entry if anything surprised
- [ ] Phase 2 (web reload toast) scoped as a follow-up
