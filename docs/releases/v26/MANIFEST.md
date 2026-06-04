# Release v1.2.0 (versionCode 26) — Manifest

**Cut date:** 2026-06-03
**Anchor:** `v25` (versionName 1.1.1, commit `224e4dd`)
**Branch:** `pkg/release-v26` (cut from `origin/main` @ `7f8a8d8`)
**Track:** internal
**versionName:** PROPOSED `1.2.0` (contains a feat → minor bump; awaiting Adi)

## What's in this release

| # | PR / Commit | Type | Feature / Bug | Flow Suite | Targeted test (happy + edge) |
|---|---|---|---|---|---|
| 1 | #146 `9d985ec` | fix  | FCM push delivery fix | CC2 (Hat 4) | CC2 — push lands in system tray (real device only) |
| 2 | #147 `835a9fe` | fix  | Remove subscription gate from child rewards shop | F8 / F19 | F8.E3 (child sees no paywall in shop) + F19.H3 |
| 3 | #148 `29ac095` | fix  | Child inherits parent's premium entitlement | F19 | F19.H2 (cohort bypass) + F19.H3 (child) + new: child-of-premium sees Buddy/Skins unlocked |
| 4 | #149 `07df7c4` | **feat** | Parent→child affirmation stickers (send + receive) | *(no existing suite — coverage gap, see below)* | new: parent sends sticker → child sees IncomingStickerModal |
| 5 | #151 `3981289` | fix  | View-as-child from Settings used parent id → empty screens | F-childsettings / view-as-child | re-test: Settings → preview child shows child's data |
| 6 | #151 `0d30a25` | fix (security) | Infinite BUFF task-credit exploit — only credit/debit on real completion transition | F4 / F8 | re-test: toggling a task done↔undone does NOT inflate balance |

## Coverage gap (flag)
- **#149 parent-stickers has no Flow Suite scenario** in MASTER_TEST_PLAYBOOK. Gate 2 will test it ad-hoc (parent picks sticker → child receives), but a permanent F-suite should be added. Logged for follow-up.

## Schema changes in this release?
- [ ] migrations added — **none in #146–#149** (stickers table `public.stickers` was already provisioned with RLS per stickerCatalog.ts header; confirm no new migration rode in)
- [x] none new

## Values Check (Gate 1) — feat rows only
**#149 parent-stickers** (affirmation stickers ❤️⭐🔥🏆💪👏🎉🚀, copy "your parent is proud of you" / "send {name} a little encouragement"):
- Pillar 1 (Intrinsic Motivation): Q1 ✅ emotional affirmation, not a transactional reward · Q2 ✅ neutral-positive · Q3 ✅ no obligation created
- Pillar 2 (Positive Coaching): Q1 ✅ no shame/compare/failure · Q2 ✅ not failure-triggered · Q3 ✅ no suffering mechanic
- Pillar 3 (Independence): Q1 🟡 neutral (connection feature) · Q2 🟡 neutral (child receives, doesn't initiate) · Q3 ✅ harmless ongoing
- **Result: PASS** (no "no" answers; Pillar-3 neutral is acceptable)

## Notable risk / watch-items
- **PR#151 merged into main after the initial cut → release branch reset to `7f8a8d8` to include it** (merge-first). Now in V26.
- **main is actively moving (12 parallel sessions).** V26 is pinned at `7f8a8d8`; anything merged after this rides V27.
- #146 FCM fix is only verifiable on a real device (Hat 4) — 0 device tokens ever registered historically (see project_fcm_hat4_pending).
- Build cut while 12 parallel CC sessions are active → jest was flaky under load; confirmed green via `--runInBand` (300/300).

## Gate results
| Gate | Check | Result |
|---|---|---|
| 0 | Manifest | ✅ this file |
| 1 | tsc | ✅ 0 errors |
| 1 | jest | ✅ 300/300 (runInBand; parallel flaky under load) |
| 1 | expo-doctor | ✅ 18/18 |
| 1 | i18n parity | ✅ 0 missing either locale |
| 1 | Values Check | ✅ #149 pass |
| 2 | Functional (buff-testing) | ⚠️ NOT completed — 19-session emulator contention; deferred to Hat-4 on real AAB |
| 3 | Build (eas production) | ✅ finished — versionCode **27**, AAB `b9LPSvHK2LtZGtHtUdyV5f.aab` |

## ⏸️ PAUSED — resume instructions

**State:** Gate 0 + Gate 1 GREEN. Paused before Gate 2 because the single shared
emulator + Metro (port 8081) are owned by other parallel sessions; running Hat-3
now would either disrupt another session or test the wrong code. Adi chose to
wait for a quiet window.

**Cut point:** `pkg/release-v26` @ commit `9ae3944` (versionName 1.2.0, off main `7f8a8d8`).

**To resume (when emulator is free — Metro 8081 not held by another worktree):**
1. From this worktree, `git fetch origin main`; if main moved, decide re-cut vs ship as-is (V26 pinned at 7f8a8d8).
2. Run **Gate 2** via buff-testing — scoped list:
   - Smoke: F1.H1, F3.H1, F4.H1, F5.H1, F8.H1, F10.H1, F13.H1
   - #147: F8.E3 (no LOCKED ZONE for child) + F19.H3
   - #148: F19.H2 + F19.H3 + child-of-premium sees Buddy/Skins unlocked
   - #149: parent sends sticker → child sees IncomingStickerModal
   - #151: view-as-child from Settings shows child data; credit exploit (toggle done↔undone) no balance inflation
3. If green → **Gate 3** `eas build --platform android --profile production` (versionCode auto→26).
4. **Gate 4-5:** release notes + STATUS row + Hat-4 checklist (incl. #146 FCM real-device) + propose tag `v26`.

**#146 FCM is Hat-4 only** regardless — goes on the Hat-4 checklist, not Gate 2.
