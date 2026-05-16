# Plan Draft — `pkg/expo-health-and-eas-android`

> **Status:** Draft. Not yet approved by Adi. Drafted 2026-05-16 by Claude Code.
> First signed Android AAB to Play Console Internal Testing.
> Resolves F-2026-05-05-01 and closes the CLAUDE.md "EAS Build / Submit decision pending" line.

---

## Context

**Why now.** Two open items have been waiting on each other:
- **F-2026-05-05-01** (`docs/INTEGRATION_LEARNINGS.md:176-188`) — 4 `expo-doctor` failures discovered during admin-dashboard-port Phase 2. Marked open with note *"to address in a dedicated 'expo-health' Improvement Package before EAS Build submission."*
- **CLAUDE.md `§Tech Stack:226`** — *"Distribution: Internal testing on Google Play Console (currently). EAS Build / Submit decision pending DevEx session."*

Submitting an AAB without the doctor fixes risks an EAS Build that fails inside the cloud after 10+ minutes of build time. Both are bundled into one package so the doctor fixes get end-to-end verified by an actual successful build, not just a clean doctor report.

**Outcome.** A signed `production` AAB sitting in EAS Build's artifact store and uploaded to Play Console's Internal Testing track. Adi clicks "Promote to Internal Testing" + adds testers (only she can — Play Console UI is account-bound).

**What this package does NOT do** (out of scope per Adi 2026-05-16):
- iOS build profile or App Store submission
- EAS Submit automation (Google Play service account JSON) — deferred to a follow-up package after first manual upload validates the AAB
- Any feature work, UI change, or schema migration
- Upgrading Expo SDK 54 → 55 (too risky; we align babel-preset-expo to 54 instead)

---

## Default assumptions (flag if wrong)

Three decisions were surfaced to Adi as questions; the form returned no selections, so this draft proceeds on the **(Recommended)** option for each. State of play if you want to redirect:

| Decision | Default chosen | Alternative |
|---|---|---|
| Production signing | **EAS-managed credentials** — EAS Cloud generates upload keystore, stores it, signs in cloud. Greenfield-clean. | Upload your D-2026-05-01-06 keystore backup to EAS / Local signing via gradle.properties. |
| First Internal Testing upload | **Manual upload via Play Console UI** for the first release; EAS Submit later. | Set up Google Play service account JSON + EAS Submit on day one. |
| `babel-preset-expo` major mismatch | **`npx expo install --check`** to fix babel-preset-expo (downgrade to ~54) AND the 8 patch mismatches in one pass. | Just downgrade babel-preset-expo / Upgrade entire Expo SDK to 55. |

**One open question I can't answer alone** — covered in Phase 0:
- Does the **Play Console listing for `com.buffapp.mobile`** already exist (created when you backed up the keystore per D-2026-05-01-06), or do we need to create it as part of this package? Listing must exist before Phase 4 upload.

---

## Current state — anchored facts

**Already in place** (don't recreate):
- `eas.json` exists at repo root with three profiles. `production` already has `android.buildType: "app-bundle"`. `submit.production` is empty `{}`. CLI requirement: `>= 18.6.0`. `appVersionSource: "remote"`.
- `app.json` `expo.extra.eas.projectId = "8796128b-5e2d-4c0e-9c41-016e87c62ab7"` (`app.json:42`) — EAS project already linked.
- `android/` directory is checked into the repo. `android/app/build.gradle:113` carries the literal warning *"Caution! In production, you need to generate your own keystore file."* The release config currently signs with `debug.keystore`. **This means we cannot ship a real production AAB locally without intervention** — EAS-managed credentials is the path that bypasses this entirely (EAS prebuilds fresh in cloud; the local `android/` is ignored on cloud builds when CNG is in effect).
- Keystore decision history: `D-2026-05-01-06` (`docs/BUFF_DECISIONS_LOG.md:415-417`) — *"Keystore גובה. סיסמאות שמורות. אפשר לבחור build path בכל רגע."* No keystore in repo (correct).

**Failure inventory** (verbatim from `docs/INTEGRATION_LEARNINGS.md:181-187`):
1. `app.json` schema: `android.supportsRTL` is an unknown field (`app.json:23`)
2. Missing peer dependency: `expo-font` (required by `@expo/vector-icons` ^15.0.3)
3. Duplicate `expo-font` (55.0.6 vs 14.0.11) + duplicate `expo-constants` ×3 (harmless)
4. `babel-preset-expo` major mismatch (expected ~54, found ^55.0.15 at `package.json:23`) + 8 patch-version mismatches

---

## Chunked phases

Per CLAUDE.md: *"Plan ships chunk by chunk. After each chunk: show diff, wait for approval, then continue."* Each chunk is a hard stop for review.

### Phase 0 — Session folder + SPEC (docs-only)

**Branch:** `pkg/expo-health-and-eas-android` (off `main`)

**Chunk 0.1** — Create `docs/sessions/expo-health-and-eas-android/` by copying `docs/sessions/_template/`. Fill in:
- `README.md` — title, status, links to spec/roadmap/tests
- `SPEC.md` — Capability Check (what CC does / what Adi does / where the bottleneck is — Play Console UI is account-bound to Adi), Values Check (9 questions; infrastructure work — answer truthfully against the three pillars), Goals, Non-goals (iOS, EAS Submit, SDK 55), Behavior Contract (doctor passes; AAB builds; signing fingerprint stable; AAB uploads to Internal Testing)
- `ROADMAP.md` — the 4 phases below with stop conditions
- `TESTS.md` — pass/fail criteria per phase
- `SPEC_SYNC.md` — which canonical docs update at which phase (see Exit Deliverables below)
- `STATUS.md` — empty table; CC appends rows per phase exit

**Stop condition for Phase 0:** Adi reviews session folder commit; confirms SPEC reads correctly + Play Console listing question resolved.

**Open question to surface inside SPEC.md:** Does the `com.buffapp.mobile` Play Console listing exist already (from earlier keystore work D-2026-05-01-06)? If not, Adi must create the bare listing before Phase 4.

### Phase 1 — expo-doctor: 4 → 0 failures

**Chunk 1.1 — Remove unknown field.** Edit `app.json:23` — delete `"supportsRTL": true`. (RTL is supported by RN by default for Hebrew text; this app.json key is non-standard and Expo schema rejects it.)

**Chunk 1.2 — Add `expo-font` as direct dep.** `npx expo install expo-font` — this satisfies the `@expo/vector-icons` peer dependency AND resolves the version-skew duplicate (54.x family). Single source of truth.

**Chunk 1.3 — Align all Expo package versions.** `npx expo install --check` and accept all proposed fixes. This is the single command that resolves:
- `babel-preset-expo` ^55.0.15 → ~54.x (major mismatch fix)
- 8 patch-version mismatches across `expo-*` packages

The command edits `package.json`; CC runs `npm install` after.

**Chunk 1.4 — Verify.** Run `npx expo-doctor`. Acceptance: **0 failures**. If any remain, stop and surface — don't paper over.

**Stop condition for Phase 1:** clean `expo-doctor` output + Metro still starts (`npm start` doesn't error in the terminal).

**Critical files modified in Phase 1:**
- `app.json` — remove one field
- `package.json` — dep alignment (auto-edited by `expo install`)
- `package-lock.json` (auto)

### Phase 2 — EAS-managed credentials for Android production

**Adi-only steps** (per CLAUDE.md delegation rules — these are account-bound):
- Confirm `eas login` is authenticated to the account that owns project `8796128b-5e2d-4c0e-9c41-016e87c62ab7`.
- If not, run `eas login` once; rest of the package CC can drive.

**CC-driven** (after Adi confirms login):

**Chunk 2.1 — eas-cli version check.** `npx eas-cli --version`. eas.json requires `>= 18.6.0`. If installed globally and below — `npm i -g eas-cli@latest`. (If unsure of global vs npx, default to `npx eas-cli@latest <command>`.)

**Chunk 2.2 — Configure Android credentials (interactive).** `npx eas credentials` → Android → production → "Set up a new keystore" → let EAS generate. EAS stores it in cloud. CC reports the SHA-1/SHA-256 fingerprint output (we'll need it for Play Console listing if it doesn't exist yet).

**Chunk 2.3 — Decide on `android/` directory.** Currently checked into repo. With EAS-managed credentials + cloud builds, `android/` should ideally be regenerated by CNG (Continuous Native Generation) on each build, not checked in. Two options at this point:
- **(a)** Add `android/` to `.gitignore` + `git rm -r --cached android/`. EAS prebuilds fresh each time. Cleaner. **Recommended.**
- **(b)** Leave checked in and live with it. EAS Build still works; the in-repo `android/` is just unused on cloud builds.

CC will surface this at chunk time with the diff and let Adi pick — risk is low either way but (a) avoids future confusion.

**Stop condition for Phase 2:** `eas credentials` shows a keystore exists for production Android. SHA-1 fingerprint captured + saved to SPEC.md.

### Phase 3 — First production AAB build (cloud)

**Chunk 3.1 — Pre-flight.** Read `eas.json`, confirm production profile still has `buildType: "app-bundle"` and `autoIncrement: true`. Confirm `app.json` versionCode is 1 (first build).

**Chunk 3.2 — Trigger build.** `npx eas build --platform android --profile production --non-interactive`. CC monitors. Typical Android cloud build: 10-20 min.

**Chunk 3.3 — Verify artifact.** When EAS reports success:
- CC pulls the AAB download URL from `eas build:list --platform android --limit 1 --json`
- Adi downloads the AAB locally
- CC reports the build's signing fingerprint, version code, build ID

**Stop condition for Phase 3:** AAB downloaded, fingerprint matches Phase 2.2 capture.

**If the build fails:** Stop. Read EAS build logs (`eas build:view <id>`). Most likely failure modes: a doctor regression slipped through (re-check Phase 1), a native module mis-configured, or a credentials hiccup. No silent retries — diagnose first.

### Phase 4 — Manual upload to Play Console Internal Testing

**100% Adi-driven** (Play Console UI is account-bound). CC's role: produce the checklist + release notes draft.

**Chunk 4.1 — CC produces:**
- Release notes (EN + HE) — short, factual: "First internal build of BUFF mobile. Feature set: [enumerate from BUFF_FEATURE_AUDIT.md headlines]."
- Pre-upload checklist for Adi: app listing fields needed for first release (short description, full description, screenshots × 2-8, feature graphic, privacy policy URL, content rating questionnaire, target audience age range 6-18, data safety form).

**Chunk 4.2 — Adi uploads:**
- Play Console → Internal Testing track → Create new release → Upload AAB.
- Adi triggers Play Console's keystore-fingerprint verification — should match the one CC captured in Phase 2.2.
- Adi adds her own email as the first tester.
- Adi rolls out.

**Chunk 4.3 — Adi verifies:** Install from internal testing link on Pixel_7 AVD or a real device. App launches. Google OAuth still works.

**Stop condition for Phase 4 (= package close):** App installed from Play Internal Testing track. Adi can open and sign in.

---

## Exit Deliverables — `SPEC_SYNC.md` matrix

| Phase | Canonical doc to update | What changes |
|---|---|---|
| 0 (session open) | `STATUS.md` (session) | Add row: Phase 0 — `in_progress` |
| 1 (doctor clean) | `INTEGRATION_LEARNINGS.md` | Move F-2026-05-05-01 to "Resolved" section. Reference the commit. |
| 2 (credentials set) | Session `SPEC.md` | Append signing fingerprint SHA-1 + SHA-256 to Capability Check section. |
| 3 (AAB built) | `BUFF_DECISIONS_LOG.md` | New entry: `D-2026-05-16-XX` — "First production AAB built via EAS-managed credentials." Records signing approach, build ID. |
| 4 (uploaded) | `CLAUDE.md` `§Tech Stack:226` | Change *"EAS Build / Submit decision pending DevEx session"* → *"EAS Build for Android via EAS-managed credentials; first AAB shipped to Internal Testing 2026-05-16. EAS Submit deferred."* |
| 4 (uploaded) | `STATUS.md` (session) | Phase 4 row: `completed` + commit hash + tests pass + link to F-2026-05-05-01 closure. |
| 4 (closeout) | `INTEGRATION_LEARNINGS.md` | New entry IN-2026-05-16-XX if anything surprised us during Phase 2/3 (likely: `android/` directory handling, first-time `eas credentials` UX). |

`BUFF_GAP_ANALYSIS.md`: no row matches build/distribution today. Recommend a tiny new row added when D-2026-05-16-XX lands. Will propose, not add unilaterally (CLAUDE.md rule).

---

## Values Check — surfaced upfront

Infrastructure work doesn't directly touch a child-facing surface, but per WORKFLOW the 9 questions still get answers, not skips:

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1-3 | N/A — no user-facing change. Build pipeline doesn't shift the reward/motivation model. |
| Positive Coaching | 1-3 | N/A — no user-facing copy or BUDDY behavior change. |
| Independence-Building | 1-3 | **Indirectly aligned** — shipping to Play Store is the first step toward children outgrowing the dev/AVD-only state of BUFF. Q3 ("In 6 months, will this still be needed?") = Yes; this pipeline is foundational, not a temporary scaffold. |

No question fails. No values gate to argue.

---

## Verification (end-to-end)

After Phase 4:
1. `npx expo-doctor` → 0 failures
2. `eas build:list --platform android --limit 1 --json` → status `finished`, channel `production`
3. Play Console → BUFF → Internal Testing → release shows AAB version 1
4. Install BUFF on Pixel_7 AVD via Play Store internal testing link → app launches → Google OAuth login succeeds → reaches dashboard

---

## Critical files touched (whole package)

- `app.json` — remove `android.supportsRTL` (Chunk 1.1)
- `package.json` — `expo install expo-font` + `expo install --check` corrections (Chunks 1.2, 1.3)
- `.gitignore` — add `android/` entry (Chunk 2.3, if option a chosen)
- `docs/sessions/expo-health-and-eas-android/*` — new session folder, 6 files (Phase 0)
- `docs/INTEGRATION_LEARNINGS.md` — F-2026-05-05-01 → resolved (Chunk 1.4 exit)
- `docs/BUFF_DECISIONS_LOG.md` — new D entry (Phase 3 exit)
- `CLAUDE.md` `§Tech Stack:226` — single-line update (Phase 4 exit)

**No code in `src/` is touched.** No schema migrations. No new npm deps beyond `expo-font` (already required as peer, just promoting to direct).

---

## Risks

- **Cloud build failure mode unknown.** First EAS Build for this project — could surface a config issue we can't predict from the doctor pass alone. Mitigation: Phase 3 stop condition includes log reading + diagnose before retry.
- **`android/` directory conflict.** If checked-in `android/` has drifted from what CNG would generate, removing it might surface latent build issues. Mitigation: Chunk 2.3 keeps option (b) available.
- **D-2026-05-01-06 keystore "backed up" elsewhere.** We're generating a fresh one via EAS — the old backup becomes irrelevant. If Adi already has a Play Console listing tied to a different keystore fingerprint, Phase 4 upload will fail with "wrong upload key" error. Mitigation: Phase 0 SPEC explicitly asks Adi to confirm Play Console listing state before we commit to EAS-managed.
- **eas-cli version drift.** Local global vs npx version. Mitigation: always `npx eas-cli@latest` in chunk commands.

---

## What CC will NOT do without explicit Adi approval (per CLAUDE.md)

- Push to `main` (each chunk lands on `pkg/expo-health-and-eas-android` branch only)
- Install any npm dep outside the `expo install expo-font` / `expo install --check` flow proposed in Phase 1
- Modify Supabase schema (this package doesn't touch DB)
- Touch `src/` source code
- Create the Play Console listing or upload AAB (Adi-only by design)
- Delete the local keystore even after EAS takes over (Verify-Before-Delete: we'll inventory but not delete)
