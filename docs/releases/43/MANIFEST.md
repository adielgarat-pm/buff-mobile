# Release v1.5.0 (versionCode 43) — Manifest

**Cut date:** 2026-06-13
**Anchor (live):** `1.4.0 (versionCode 34)` — the last build **promoted to Play** (Alpha closed-testing, 2026-06-08).
**Anchor (last cut):** `1.4.4 (versionCode 42)` — built 2026-06-11 from `origin/main @ 0034200`, **never promoted**.
**Branch:** `pkg/release-43` (clean worktree off `origin/main @ 4984572` — build-from-main policy).
**Track:** internal / Alpha
**versionName:** **1.5.0** — minor bump (Adi's call 2026-06-13). Carries new features (equipment backpack, activities, account deletion) on top of the un-promoted 39/41/42 stack. Distinct from the already-uploaded 1.4.1/1.4.3/1.4.4 names → no Play collision.
**versionCode:** **43** — EAS auto-incremented 42→43 at build time ✅ (remote source).
**EAS build (43):** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/9862e850-02fb-43ff-965b-bb73f10606d5 — building 2026-06-13 from `aa68a8d`, remote keystore `dG1dqozJHO`.

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

## Gate 1 — Static (2026-06-13, worktree `release-43` @ `aa68a8d`)
| Check | Result |
|---|---|
| tsc | ✅ 0 errors |
| jest | ✅ 388/388 (37 suites, 6 snapshots) — serial run; the 2 timeout "fails" on the parallel run were CPU-contention flakes (12 concurrent sessions), green serially |
| expo-doctor | ✅ 18/18 |
| i18n parity | ✅ 0 missing either locale |
| Values Check | ✅ (below) |

> **Gate 1 fix applied this cut:** `main` was red on jest — `i18nCatalogIntegrity` caught hardcoded Hebrew in two NEW bilingual `{en,he}` seed files (`types/activities.ts` #229, `lib/packingTemplates/catalog.ts` #228) that merged today without being allowlisted. Both confirmed bilingual (every Hebrew paired with English, picked via `pickLang`) → added to the guard allowlist (commit `aa68a8d`). No copy/behavior change. **`main` itself still needs this one-line fix** (flagged to Adi).

## Gate 2 — Functional (2026-06-13, emulator-5554, release-43 dev bundle via Metro 8083)
| Scenario | Verdict | Evidence |
|---|---|---|
| Boot — fresh Metro bundle of release-43 → app launches | ✅ | dev client connected to `10.0.2.2:8083`, JS bundle loaded |
| F1 (session routing) | ✅ | `[RootNavigator] role: parent, onboardingComplete: true, hasChildren: true` |
| F4 (parent dashboard) | ✅ | full render: insights, child card (Itay 0/11, 24 Buffs), Today/Yesterday, +Add Child, +Bonus, Send Sticker, View-as-Child, invite code, 5 tabs |
| F8 / #161 (notification feed) | ✅ | unread-only feed renders ("Itay · 1d" + purple unread dot) |
| #221 (safe-area-top) | ✅ | "Mark all as read" reachable at top of feed (header clears status bar) |
| Paywall (premium gating) | ✅ | "Unlock BUFF Premium" modal renders; RC offerings error is expected emulator `BILLING_UNAVAILABLE` (no Play billing on emulator) |
| #226 account deletion · #227 sticker-no-consume · #228 packing · #229 activities · F5 child dashboard | ⚠️ Hat-4 | **harness-blocked, not failed:** this build returns a 0-byte `uiautomator` dump (no node tree → no reliable adb coordinates/text assertions) + dev-only RC LogBox occludes the tab bar. Deep real-touch flows deferred to Adi's device — see HAT4_CHECKLIST.md |

**Gate 2 verdict:** boot + core-render smoke **PASS, zero ❌** → does not hard-stop. Deep new-feature UI flows routed to Hat-4 (real device), where the dev LogBox is absent and touch is reliable. Feature *logic* is covered by jest 388/388.

### Values Check — new feats
- **#226 account deletion / remove child (feat):** parent-facing autonomy/safety control; no child-facing manipulation, no dark pattern. Deletion is user-initiated, reversible-by-recreate, honors Apple 5.1.1(v) + Play data-deletion. ✅
- **#228 equipment backpack (feat):** builds independence (child sees what to pack, packs it themselves); positive framing, no punishment for forgetting; no extrinsic-reward inflation. ✅
- **#229 activities / seasonal lists (feat):** child-authored option supports autonomy (Teen direct, Children propose); lists are organizational, not surveillance; no comparison/competition framing. ✅

## Notable risk / watch-items
- Equipment-backpack task-tap wiring is **deferred** (packing tab exists; tapping a timetable lesson doesn't auto-create a pack task) — known, not a regression.
- `push-notification-fanout` Edge Function: **deploy only after this build is promoted** (kid reminders default off) — Hat-4 step, carried from the 39/41/42 notes.
