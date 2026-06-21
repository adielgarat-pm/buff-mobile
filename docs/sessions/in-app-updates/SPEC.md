# SPEC — in-app-updates

**Status:** DESIGN (target state). No code until Adi says `approved, proceed`.
**Last updated:** 2026-06-17

---

## 1. Problem statement (grounded)

**Observed (2026-06-17, tester Noa Morag-Sagi, WhatsApp + screenshots):**
- Her Play Store → Settings → Network preferences → **Auto-update apps = "over Wi-Fi only"**.
- On cellular, her BUFF stays on an old build. Opening it shows the Google Play dialog
  *"Something went wrong — Check that Google Play is enabled… try reinstalling."* Exit + re-enter
  works around it (forces Play Services to re-validate the stale entitlement).
- Another tester (Leia) auto-updated fine — she was on open Wi-Fi.

**Root cause (verified, high confidence):**
1. The dialog is **not BUFF code** — it's a Google Play / Play Services message. Confirmed: the
   repo has `expo-updates` installed (`package.json:42`) but **no `updates` config** in `app.json`
   or `eas.json` (OTA not active), and no Play Integrity / license check of our own.
2. The real gap is **discoverability**: BUFF never tells the user a newer build exists. Behaviour
   is governed entirely by per-device Play auto-update settings + the Internal Testing track being
   less aggressive about pushing updates.

**Tester's own request (verbatim, translated):** *"Can't it pop a message — 'a new version exists,
tap here to update' or 'go to the store and update'?"* → This is exactly the Google Play In-App
Updates API.

---

## 2. Target state

When a user opens BUFF and a **higher `versionCode` is available on the Play track**:

- **Flexible flow (default):** a non-blocking prompt — "A new version of BUFF is available." The
  user can update (downloads in background, then a "Restart to finish" snackbar) or dismiss and
  keep using the app. Re-prompts on a later launch if still stale.
- **Immediate flow (opt-in, critical only):** a blocking full-screen Play update screen. Reserved
  for hotfixes flagged critical (e.g. a launch-crash fix). **Default OFF**; turned on per-release
  by a single flag, not by default behaviour.

**Platform scope (BUFF runs Android native + Expo Web PWA + future iOS):**

There is **no single library** that covers Play + Web — and that is correct, not a gap. On native
the action is "install from the store"; on web it is "reload the page." Every cross-platform app
(Slack, Linear, Figma, Notion) runs **both**: a native store-update mechanism **and** a web
"reload to update" banner. They unify the *signal* ("is a newer version available?") and split the
*action* by platform. BUFF follows the same pattern via a **platform-split hook** (`.android` /
`.web` / `.ios` files) behind one logical contract.

| Platform | Mechanism | New dep? | Priority |
|---|---|---|---|
| **Android** (native, Play) | `expo-in-app-updates` — **Flexible flow** | Yes (Adi approval) | **High — now.** Solves Noa + native-binary hotfixes (e.g. 1.6.2 — OTA/web cannot deliver a new binary). |
| **Web** (Expo Web PWA) | "New version available — refresh" toast via a small build-version check → `location.reload()` | **No** (our own code) | Low. Verified: `public/service-worker.js` is network-passthrough **with no caching**, so web rarely goes stale; the only gap is a tab left open for hours. Live web prod today is still Lovable (separate codebase). |
| **iOS** (native, App Store) | no-op for v1 | No | After TestFlight (memory `ios_testflight`). |

The native library degrades to a meaningless App-Store check on iOS pre-launch and is irrelevant on
web — hence the platform-split, which also keeps the web bundle from importing the native module.

**Hard constraints:**
- In-app updates **only work for Play-installed builds** (Play Store / internal-test link). They do
  **not** fire for sideloaded EAS `internal`-distribution APKs. Testers must install via the Play
  internal-test link (memory `play_internal_test`). This is documented, not a code fix.
- `versionCode` is **EAS-managed remote / autoincrement** (memory `eas_build_plan`). The static
  `"versionCode": 1` in `app.json` is irrelevant at runtime — Play compares the installed APK's real
  versionCode against the track. No versioning change needed.

---

## 3. Proposed approach (for review — not self-approved)

### Dependency (NEW — requires Adi approval per WORKFLOW)

**Primary candidate:** [`expo-in-app-updates`](https://github.com/SohelIslamImran/expo-in-app-updates)
- Config-plugin ready (fits managed workflow — no manual native edits).
- Android: wraps Google Play Core in-app updates (Flexible + Immediate).
- iOS: App-Store version check (we no-op this for v1).

**Alternative:** [`sp-react-native-in-app-updates`](https://www.npmjs.com/package/sp-react-native-in-app-updates)
- More widely used but needs a hand-written Expo config plugin + a `react-native-device-info`
  shim. More surface area. Fallback only if the primary has a blocker.

> CC will verify the exact current version, Expo SDK 54 compatibility, and config-plugin behaviour
> against the installed Expo version **before** Phase 1, and report findings. If neither library is
> clean on our SDK, CC stops and surfaces — does not improvise native code.

### Integration points (anticipated — confirmed in Plan Mode against real code)

- **One logical hook, platform-split files** — `useVersionGate.android.ts` (Play API),
  `useVersionGate.web.ts` (build-version check → reload toast), `useVersionGate.ios.ts` (no-op for
  v1). Metro resolves the right one per platform, so the web bundle **never imports the native
  module** and the native build never imports web-only code.
- Called once after the app is interactive. **Lazy/native-safe import** per memory
  `native_import_sentry_blindspot` — never a top-level native import that could crash launch before
  `Sentry.init`.
- `app.json` plugins array gets the new config plugin entry (Android).
- A new dev-client build (prebuild + EAS) — the **Android** path cannot be verified in Expo Go or
  web; the **web** path is verifiable in `npm run web`.

### Web mechanism (Step 2 detail)

The existing SW (`public/service-worker.js`) is network-passthrough with **no precache**, so a full
Workbox caching strategy is unnecessary. The lightweight, industry-standard SPA pattern fits:
embed the build id at bundle time, fetch a tiny `version.json` (or a Supabase value) on window-focus
/ interval, and if it differs, show a gentle "A newer version of BUFF is ready — refresh" toast that
calls `location.reload()`. Optionally also wire `registration.onupdatefound` for PWA installs. No new
dependency.

### Out of scope (flag, don't pull)

- ❌ OTA / `expo-updates` activation (JS-bundle hot updates) — separate, bigger decision.
- ❌ Any change to the EAS versionCode strategy.
- ❌ iOS in-app update UX.
- ❌ Custom-styled update UI — v1 uses Google's native Play update sheet.

---

## 4. Capabilities & Bottlenecks (Capability Check)

| # | What | This package |
|---|---|---|
| 1 | What CC can do | Add the dependency + config plugin, write the hook, run prebuild, typecheck, code-review, draft release-notes/tester copy. |
| 2 | What CC will do | Phase-by-phase in Plan Mode with diffs; verify library/SDK compat first. |
| 3 | What Adi must do herself | (a) Approve the new dependency. (b) Trigger / approve the **EAS build** (quota bills to her account — memory `eas_build_plan`). (c) **Real-device Hat-4 test**: install old build via Play internal link, publish a higher build, confirm the prompt appears. *This is the only true test — emulators without Play Store + a real track cannot verify it.* |
| 4 | Where the bottleneck is | Verification needs **two Play builds on the track** (N and N+1) and a real device. No emulator shortcut. Budget one build cycle for the test itself. |

---

## 5. Values Check (mandatory — 9 questions)

This is an **infrastructure** feature (app self-update), not a child-motivation mechanic. It still
passes the gate, with one copy guardrail.

### Pillar 1 — Intrinsic Motivation
1. *Would the child want this without a virtual reward?* — N/A to the child; it's a maintenance
   prompt. Neutral. **Pass.**
2. *Does it move the child toward a self-chosen reward?* — Neutral; doesn't touch rewards. **Pass.**
3. *Does success feel like "I want" or "I must"?* — Flexible flow is dismissible → no compulsion.
   Immediate flow is reserved for genuine hotfixes, not routine nags. **Pass.**

### Pillar 2 — Positive Coaching
1. *Is the wording ever shaming / comparative / failure-framed?* — No. Copy is "A new version is
   available," never "you're out of date / you did something wrong." **Pass (copy guardrail below).**
2. *If the child "fails" here, empathy or pressure?* — There's no child failure state. Dismiss is
   first-class. **Pass.**
3. *Any BUDDY suffering / loss / anger mechanic?* — None. BUDDY is uninvolved. **Pass.**

### Pillar 3 — Independence-Building
1. *Does it make the child more capable without the app?* — Neutral (infra). Doesn't create
   dependency. **Pass.**
2. *Does the child have a voice?* — Flexible flow = user controls when to update. **Pass.**
3. *In 6 months, still necessary?* — Yes, as long as we ship via stores; it's plumbing, not a
   scaffold meant to fade. **Pass (intentional exception — infra, not a child scaffold).**

**Copy guardrail (Pillar 2):** the visible string on a child-owned device must be plain and gentle.
Use Google's default neutral copy or, if customizable, "A newer version of BUFF is ready 🙂".
Never frame staleness as the user's fault. Final copy → Adi per `feedback_kid_microcopy_pillar1`.

**Verdict: PASS** — proceed to ROADMAP on Adi's approval.

---

## 6. Open questions for Adi

1. **Approve the new dependency** (`expo-in-app-updates`)? (Y/N)
2. **Flexible-only for v1**, with the Immediate (blocking) flow wired but flag-OFF — agreed?
3. Custom update copy, or accept Google's default Play update sheet for v1? (Default = less work,
   fully neutral.)
