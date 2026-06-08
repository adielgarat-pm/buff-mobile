# Release v1.4.0 (versionCode 34) — Manifest

**Cut date:** 2026-06-08
**Anchor:** last *released* `1.3.1 (versionCode 31)` (built from `c34a68a` content; internal track, 2026-06-06). No `v31` git tag — change set sourced from `git log c34a68a..main`.
**Branch:** release/2026-06-08 (cut from `main` @ `4139d2e` — build-from-main policy)
**Build commit:** `c9eb5fa` (versionName bump 1.3.0→1.4.0 on top of main `4139d2e`)
**Track:** internal
**versionName:** 1.4.0 — minor bump (carries features: iOS Phase-1, admin Tester Board, funnel platform field). main app.json was still `1.3.0` (the 1.3.1 bump lived only on `pkg/release-v31`, never merged back). 1.4.0 also avoids a Play collision with already-uploaded 1.3.0 / 1.3.1.
**versionCode:** **34** (EAS remote auto-increment). Note: **two codes burned before success** — attempt 1 errored (transient Gradle "unknown error", ~80s, code 32); code 33 consumed (likely a parallel session build — see watch-items); the successful build is **34**.
**EAS build (34):** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/a266ea2f-fa5a-4dc0-bd09-59204185ef44 — ✔ Build finished
**AAB artifact (34):** https://expo.dev/artifacts/eas/m48Y8qGvb1xCHnaNssqu47.aab

## What's in this release (main since vc31 anchor `c34a68a`)

| # | PR / Commit | Type | Feature / Bug | Flow Suite | Targeted test |
|---|---|---|---|---|---|
| 1 | #192 / `85f6ca6` | feat | Capture `families.platform` (android/ios/web) at parent signup — funnel/retention segmentation by platform | F-auth (signup) | signup writes platform; existing rows NULL |
| 2 | #190 / `6163e6b`+`8a79baf` | feat | iOS Phase-1: hide paywall + skip RevenueCat init on iOS; enable iOS builds in EAS production profile | F-paywall (iOS) | paywall hidden on iOS build |
| 3 | #186/#184 / `e6bb935` | feat | Admin Tester Board — funnel-as-people, family deep-dive, onboarding diff (admin-web, internal tool) | Admin (internal) | board renders; excludes test accounts |
| 4 | #188 / `f991c11` | feat | Admin: parent email as mailto link (table + modal) | Admin (internal) | mailto link present |
| 5 | #185 / `356791a` | fix | credit-vault: atomic balance adjustment — kill read-modify-write race | Rewards / BUFFs balance | concurrent completion → no lost update |
| 6 | #189 / `530bc39` | fix | Parents can edit own-device kids; show real buddy in menu (migration 022) | F-editchild (own-device) | parent edits own-device child name/avatar |
| 7 | #182 / `a311b72` | fix | Child HQ screens now day-filter like the Quests tab | F-task-day-filtering | HQ vs Today's-Plan parity |
| 8 | #181 / `3408076`+`25890aa` | fix | Atomic create_child_profile guard + friendly duplicate dialog; Cancel exits to parent app | F1 (child entry) | duplicate-name guard + Cancel path |
| 9 | #187 / `864f771` | fix | Admin funnel per-stage label "at this stage" (was "stuck here") | Admin (internal) | label copy |
| 10 | #191 / `e2e8590` | fix | Show child's real name (not "Preview") in View-as-Child on mint dashboard | F-view-as-child | real name renders |
| 11 | #183 / `46938db` | chore | buff-emulator skill — shared emulator/Metro lease lock (devex, no app code) | — | n/a |

## Schema changes in this release?
- [x] migrations added — **confirmed applied to mobile project `gfrongfnyigxsexuofrg`** (verified via SQL 2026-06-08):
  - `021_family_platform_field.sql` (#192) — `families.platform` column present
  - `022_parents_update_owndevice_children.sql` (#189) — owndevice parent-edit policy
  - `create_child_profile` + `switch_user_family` RPCs present

## Gate results
| Check | Result |
|---|---|
| tsc --noEmit | ✅ 0 errors |
| expo-doctor | ✅ 18/18 |
| i18n parity | ✅ no missing keys (he/en) |
| jest | ⚠️ 347/348 — 1 failure: `parentCapture/stubParser.test.ts › image input -> single item` (Expected 1, Received 5) |
| Values Check | ✅ feats (funnel = invisible backend instrumentation; iOS hide-paywall = Pillar-2 aligned; admin = internal tool) |

**jest exception rationale (NOT a hard-stop):** the failure is **pre-existing and not a regression of this train** — `parentCapture` is byte-identical to the vc31 base `c34a68a` (`git log c34a68a..HEAD -- src/lib/parentCapture/` is empty), so **vc31 shipped with this same red test**. It is a unit test for the experimental parent-capture *stub* parser, with no bearing on shipped functionality. Flagged for a separate fix (`task_a445df1f`). Proceeding does not increase risk vs. the last shipped build.

## Functional gate (Gate 2)
Deferred to **Hat-4 on the real AAB** (lean cut — all 11 items were tested in their own PRs at merge; several Hat-3 verified). See `HAT4_CHECKLIST.md`.

## Notable risk / watch-items
- **versionCode jump 31→34** with a failed attempt + a consumed code 33. Possible parallel build from the stale `release/train-2026-06-08` worktree (flagged to Adi). Confirm no competing upload.
- **Transient Gradle "unknown error"** on attempt 1 (resolved on retry). Code is JS-only from a known-good base; no action needed unless it recurs.
