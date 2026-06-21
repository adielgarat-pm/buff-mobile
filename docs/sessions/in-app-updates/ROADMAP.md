# ROADMAP — in-app-updates

Phases run in Plan Mode, chunk-by-chunk, with a diff and approval gate between each.

---

## Phase 0 — Library & SDK compatibility verification (no code committed)

**Goal:** Confirm a clean library before touching the project.
- Verify `expo-in-app-updates` current version + Expo SDK / RN compatibility against the installed
  Expo version in `package.json`.
- Confirm config-plugin behaviour (no manual native edits needed for managed workflow).
- Confirm it fires on the **Internal Testing track**, not just production.
- If the primary library is not clean → evaluate `sp-react-native-in-app-updates`; if neither is
  clean → **STOP and surface to Adi** (do not hand-roll native code).

**Stop condition:** A named, version-pinned, compatible library + a one-paragraph findings note.
**Exit:** report to Adi → approval to proceed to Phase 1.

---

## Phase 1 — Dependency + config plugin + native-safe hook

**Goal:** Wire the feature, Flexible flow only.
- Install the approved dependency.
- Add the config plugin to `app.json` plugins array.
- Add `useInAppUpdate` hook (Android-gated, **lazy/native-safe import** — memory
  `native_import_sentry_blindspot`), called once after app is interactive.
- Immediate (blocking) flow implemented but behind a flag, default OFF.

**Stop condition:** `npx tsc` clean, code-review clean, prebuild succeeds locally.
**Exit deliverables (same commit):** `STATUS.md` row + `SPEC_SYNC.md` doc updates +
`INTEGRATION_LEARNINGS.md` if anything surprised.

---

## Phase 2 — Build + real-device Reachability test (Hat-4, Adi)

**Goal:** Prove the end-to-end first-touch path on a real device via Play.
- Adi triggers/approves an EAS build → upload build **N+1** to the internal track while a device
  still has build **N** installed (via the Play internal-test link).
- Open BUFF on that device → confirm the **"update available" prompt appears**, update completes,
  app relaunches on N+1.
- Per WORKFLOW Iron Rule 11 (Reachability): the test starts from the user's entry point (cold open
  on a stale build), **no dev shortcuts**. Emulator-without-Play cannot satisfy this.

**Stop condition:** Prompt observed + update applied on a real device.
**Exit:** `STATUS.md` closeout row; release-notes/tester copy finalized.

---

## Phase 3 — Web "refresh to update" toast (Step 2; when Expo Web is the live target)

**Goal:** Cover the web platform with the same logical signal, web-appropriate action.
- Add `useVersionGate.web.ts`: embed build id, poll a tiny `version.json` / Supabase value on
  focus/interval, show a gentle "newer version ready — refresh" toast → `location.reload()`.
- No new dependency. Verifiable in `npm run web` + Claude_Preview tools (memory `ui_verification`).
- **Deferred until** buff-mobile's Expo Web is the live unified target (Phase 2); today live web is
  Lovable (separate codebase) and the SW does not cache, so staleness risk is low. Logged as a 🚩
  FLAG until picked up (Iron Rule 12).

**Stop condition:** deploying a new web build surfaces the refresh toast; reload lands on new build.

---

## Phase 4 (optional, later) — Critical-hotfix Immediate flow + tester comms

- Document the per-release toggle for the Immediate (blocking) flow for genuine hotfixes.
- Add a line to the tester onboarding (install via Play link so updates work).
- Deferred if not needed now → flag in `INTEGRATION_LEARNINGS.md` rather than a code comment
  (WORKFLOW Iron Rule 12).
