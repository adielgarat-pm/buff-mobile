# Expo Health + EAS Android — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> Closes F-2026-05-05-01 and the CLAUDE.md "EAS Build / Submit decision pending" line.

**נוצר:** 2026-05-16
**מקור:** [Plan draft](../beta-2026-06-01/PLAN_expo-health-and-eas-android.md) (approved by Adi 2026-05-16, commit `baa1f05`)

---

## Why this exists

Two open items have been waiting on each other:

- **F-2026-05-05-01** ([docs/INTEGRATION_LEARNINGS.md:176-188](../../INTEGRATION_LEARNINGS.md)) — 4 `expo-doctor` failures pre-existing on `main`, flagged as "to address in a dedicated 'expo-health' Improvement Package before EAS Build submission."
- **[CLAUDE.md §Tech Stack:226](../../../CLAUDE.md)** — "EAS Build / Submit decision pending DevEx session."

Bundling both into one package means the doctor fixes get end-to-end verified by a real successful build, not just a clean doctor report.

---

## Capabilities & Bottlenecks

### מה Claude Code (CC) יעשה
- Edit `app.json`, `package.json`, `.gitignore` (per plan)
- Run `npx expo install ...`, `npx expo-doctor`, `npx eas-cli ...`
- Trigger `eas build --platform android --profile production`
- Draft release notes (EN + HE) and pre-upload checklist
- Update canonical docs per `SPEC_SYNC.md`

### מה Adi חייבת לעצמה
- `eas login` (account-bound) if not already authenticated to project `8796128b-5e2d-4c0e-9c41-016e87c62ab7`
- Download the AAB artifact from EAS (link CC produces)
- Play Console UI: create release in Internal Testing track, upload AAB, add testers, roll out (Play Console is account-bound — CC has no API access here in this package since EAS Submit is out of scope)
- Final install + smoke test on Pixel_7 AVD or real device via the internal testing link

### צוואר בקבוק / נקודות עצירה צפויות
- **First `eas build`** for this project — could surface a config issue not caught by `expo-doctor`. Mitigation: Phase 3 stop condition includes log reading.
- **`android/` directory checked into repo** — diverges from typical Expo managed workflow. Plan Chunk 2.3 surfaces the keep-vs-remove decision with the diff.
- **D-2026-05-01-06 "backed up" keystore** — we're generating a fresh one via EAS-managed credentials. If a Play Console listing was set up earlier tied to a different fingerprint, Phase 4 upload will fail with "wrong upload key." Adi confirmed (2026-05-16) listing exists for Android — fingerprint match assumed but will be verified at Phase 4.

### Signing — discovered at Phase 2 (2026-05-16)

EAS already had a keystore registered for this project from a prior session — name `dG1dqozJHO (default)`. CC did **not** generate a new keystore. The build at versionCode 8 is signed with this pre-existing key.

- EAS keystore reference: `dG1dqozJHO (default)` (visible in `eas build` output)
- Fingerprint (SHA-1 / SHA-256): _to be retrieved via `eas credentials` interactive command (deferred — non-blocking for first build)_
- Prior builds on this keystore: 8× `development`-profile APKs (Apr 17 – May 16). This is the first `production` AAB.
- versionCode source: `remote` (per eas.json line 24). Local `app.json` versionCode=1 is **ignored** — EAS auto-increments. Build 8's versionCode is 8.

---

## Values Check

> 9 questions from [BUFF_VALUES.md](../../BUFF_VALUES.md). Infrastructure work — no user-facing surface — but per WORKFLOW the questions get answers, not skips.

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this feature without any virtual reward?**
   N/A — no user-facing change. Build pipeline doesn't shift the reward/motivation model.
2. **Does it bring the child closer to a reward they chose themselves?**
   N/A — same reason.
3. **Is success felt as "I want to" or "I have to"?**
   N/A — no child surface touched.

### Pillar 2 — Positive Coaching
1. **Does any copy shame / compare / display failure?**
   N/A — no copy changes in this package (release notes are Play Store metadata, not in-app).
2. **If the child fails at this feature, is the response empathy or pressure?**
   N/A — no failure mode for the child here.
3. **Is there a "sad / lost / angry" BUDDY or app state?**
   N/A — no BUDDY change.

### Pillar 3 — Independence-Building
1. **Does the feature make the child more capable *without* the app, or more dependent *on* it?**
   **Indirectly aligned** — shipping to Play Store is the first step toward children outgrowing the dev/AVD-only state of BUFF. Real distribution is a prerequisite to the "Scaffold That Fades" arc.
2. **Does the child have a voice in this feature?**
   N/A — pipeline-only work.
3. **Will this feature still be necessary in 6 months?**
   ✅ Yes. The build/distribution pipeline is foundational, not a temporary scaffold. The specific keystore + EAS configuration persists indefinitely.

**Result:** No question fails. ✅ OK to proceed.

---

## Goals

1. `npx expo-doctor` reports **0 failures** on `main`.
2. EAS Cloud holds a production Android keystore for project `8796128b-5e2d-4c0e-9c41-016e87c62ab7`; CC has captured SHA-1 + SHA-256 fingerprints in this SPEC.
3. A signed `production` AAB exists as an EAS Build artifact, downloadable via `eas build:list`.
4. The AAB is uploaded to the Play Console Internal Testing track for `com.buffapp.mobile`.
5. Adi can install BUFF from the internal testing link and reach the dashboard.

## Non-goals (explicit out-of-scope)

- iOS build profile or App Store submission
- EAS Submit automation (Google Play service account JSON) — deferred to a follow-up package
- Any feature work, UI change, or schema migration
- Upgrading Expo SDK 54 → 55 (we align `babel-preset-expo` down to ~54 instead)
- Creating the Play Console listing (Adi confirmed 2026-05-16 it already exists for Android)
- Touching `src/` source code

---

## Behavior Contract

After this package closes:

- A developer running `npx expo-doctor` against `main` sees 0 failures.
- Running `npx eas build --platform android --profile production` (after `eas login`) produces an AAB signed with the EAS-managed keystore and uploads it to EAS artifact storage.
- The Play Console Internal Testing track for `com.buffapp.mobile` shows a release with version code 1 (first build).
- The keystore SHA-1 fingerprint in `eas credentials` matches the upload key fingerprint in Play Console.
- Any tester added to the Play Console Internal Testing track can install BUFF via the internal testing link on Android.

## Schema Changes

None. This package does not touch Supabase.

## Prompts Changes

None.

## API / Route Changes

None — no `src/` code changes.

## UI Changes

None.

---

## Open Questions

> Surface during chunks; resolve with Adi before proceeding past the chunk that hits each.

1. **`android/` directory handling** (Chunk 2.3) — keep checked in (option b, no diff to repo) or remove and let EAS prebuild fresh on each cloud build (option a, recommended). Decided at chunk time with diff visible.
2. **eas-cli version installed locally** — Phase 2.1 verifies; if global is stale, fall back to `npx eas-cli@latest`.
3. **Play Console listing fingerprint** — Adi confirmed listing exists for Android. Whether the listing has a *previous* upload key tied to D-2026-05-01-06's backed-up keystore (which we are NOT using) will be revealed at Phase 4 upload. If mismatch: stop, restore via "Upload existing keystore to EAS" path.

## Out of Scope

- iOS profile / iOS keystore / Apple Developer account
- EAS Submit (service account JSON)
- Upgrading any `expo-*` package's major version
- Modifying RevenueCat configuration
- Any code under `src/`
- Any schema changes under `supabase/migrations`
- Creating new Play Console tracks (closed/open/production) — only Internal Testing this package
