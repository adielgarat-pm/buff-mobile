# Release v1.5.0 (versionCode 43) — Manifest

**Cut date:** 2026-06-13
**Anchor (live):** `1.4.0 (versionCode 34)` — the last build **promoted to Play** (Alpha closed-testing, 2026-06-08).
**Anchor (last cut):** `1.4.4 (versionCode 42)` — built 2026-06-11 from `origin/main @ 0034200`, **never promoted**.
**Branch:** `pkg/release-43` (clean worktree off `origin/main @ 4984572` — build-from-main policy).
**Track:** internal / Alpha
**versionName:** **1.5.0** — minor bump (Adi's call 2026-06-13). Carries new features (equipment backpack, activities, account deletion) on top of the un-promoted 39/41/42 stack. Distinct from the already-uploaded 1.4.1/1.4.3/1.4.4 names → no Play collision.
**versionCode:** **43** (EAS `appVersionSource: remote` + `autoIncrement: true` — confirm in build log).

## What this build is

Nothing past **1.4.0 (34)** was ever promoted. Builds 39 (1.4.1), 41 (1.4.3), 42 (1.4.4) were each cut and superseded but never shipped to testers. So a single build from `main` HEAD naturally carries **everything since the live Alpha** — the entire un-promoted 39/41/42 content **plus** five PRs merged after the 42 cut. This one AAB supersedes the whole un-promoted stack.

## A. New since the last cut (42) — needs fresh Gate 2

| # | PR / Commit | Type | Feature / Bug | Flow Suite | Targeted test |
|---|---|---|---|---|---|
| 1 | #225 / `7567e3f` | fix | i18n sweep — align Hebrew/English: copy via `t()`, locale via i18n | F18 (i18n / locale) | EN + HE render parity on swept screens |
| 2 | #226 / `81abb5c` `a8a2bf8` `c04d442` | feat | iOS readiness bundle. **Android-visible:** in-app **account deletion** (Settings → Danger Zone → `delete_my_account`, migration `delete_account_rpc`); **parent removes a child** + offer family-delete on last child (`soft_delete_child`). **iOS-only (renders null on Android):** Sign in with Apple, alpha-free icon, RC-skip | Parent Settings → Danger Zone → Delete account; Manage Children → remove child | delete-self vs sole-parent-delete-family; remove one child of N vs last child |
| 3 | #227 / `147a9d6` | fix | View-as-Child no longer **consumes** an own-device kid's sticker (preview should not mutate) | Parent View-as-Child → child sticker | enter preview → sticker count unchanged in DB |
| 4 | #228 / `c3784d6` | feat | **Equipment per lesson → child packing screen** (parent sets equipment on timetable; child gets a packing tab) | Timetable / ChildBagPrep | parent adds equipment → child packing list shows it |
| 5 | #229 / `31d009d` `f04b001` | feat | **Activities + seasonal packing lists**, child-authored (Teen direct / Children propose); migrations `026/027/028_activities` (+ table grants) | Activities / camp-lists | add activity (parent + child-propose); seasonal template renders |

## B. Inherited from the un-promoted 39/41/42 stack (Gate-verified at their cuts)

Carried verbatim from `docs/releases/{39,41,42}/MANIFEST.md` — all ancestors of this build commit:
- #198 Pause Mode ends at local midnight · #199/#201 Off-Routine Day · #194 remove dev-simulate-subscribed toggle
- Notifications UI Phase 4 + Edge enforcement · #209 redemption discovery + "let's talk" reset · #211 kid vibe-share
- #215 denial-banner safe-area · #216 off-routine i18n · #219 families.platform backfill · #220 rewards focus-refetch · #221 safe-area-top (17 screens)

## Schema changes in this release?
- [x] migrations — **all confirmed applied to mobile project `gfrongfnyigxsexuofrg`** (`list_migrations`, 2026-06-13):
  - New since 42: `delete_account_rpc` (2026-06-12), `soft_delete_child` (2026-06-12), `026_activities` / `027_activities_child_authored` / `028_activities_grants` (2026-06-13)
  - Inherited: all 39/41/42 migrations already live (off-routine, notifications hardening, redemption-talk, vibe-shared, platform reconcile, etc.)
- No build-blocking unapplied migration (every feature's schema is live).

## Gate 1 — Static (2026-06-13, worktree `release-43` @ `4984572`)
| Check | Result |
|---|---|
| tsc | ✅ 0 errors |
| jest | _running serially — see below_ |
| expo-doctor | ✅ 18/18 |
| i18n parity | ✅ 0 missing either locale |
| Values Check | ✅ (below) |

### Values Check — new feats
- **#226 account deletion / remove child (feat):** parent-facing autonomy/safety control; no child-facing manipulation, no dark pattern. Deletion is user-initiated, reversible-by-recreate, honors Apple 5.1.1(v) + Play data-deletion. ✅
- **#228 equipment backpack (feat):** builds independence (child sees what to pack, packs it themselves); positive framing, no punishment for forgetting; no extrinsic-reward inflation. ✅
- **#229 activities / seasonal lists (feat):** child-authored option supports autonomy (Teen direct, Children propose); lists are organizational, not surveillance; no comparison/competition framing. ✅

## Notable risk / watch-items
- Equipment-backpack task-tap wiring is **deferred** (packing tab exists; tapping a timetable lesson doesn't auto-create a pack task) — known, not a regression.
- `push-notification-fanout` Edge Function: **deploy only after this build is promoted** (kid reminders default off) — Hat-4 step, carried from the 39/41/42 notes.
