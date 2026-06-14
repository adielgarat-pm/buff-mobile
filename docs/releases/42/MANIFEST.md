# Release v1.4.4 (versionCode 42) — Manifest

**Cut date:** 2026-06-11
**Anchor:** build 41 commit `1148f84` (1.4.3, vc41 — built 2026-06-10 off `origin/main @ 07ba6d0`, Hat-4 promotion pending)
**Branch:** `pkg/release-42` (off `origin/main` @ `0034200`)
**Track:** internal / Alpha

## Why this build (vs the existing build 41)
Build 41 (1.4.3) was cut **before** today's three merges. This build = **build 41 content + the three rows below**, including the safe-area-top fix that makes "Mark all as read" (and 16 other screens' top controls) reachable. If 41 has not been promoted yet, 42 supersedes it.

## What's in this release (delta over build 41)

| # | Commit / PR | Type | Feature / Bug | Flow Suite | Targeted test (happy + edge) |
|---|---|---|---|---|---|
| 1 | `64f890b` (#221) | fix | **Top system bar overlapped tappable controls on 17 screens** — RN-core `SafeAreaView` is a no-op on Android while the app runs edge-to-edge; swapped to `react-native-safe-area-context` + `edges={['top']}` (feed, paywall, onboarding ×9, auth ×2, edit/manage-child, philosophy, founding-hundred) | Notification feed → Mark all as read; Onboarding flow | Hat-3 **already verified at merge** (2026-06-11): top bar starts at the 136px inset, "Mark all as read" tap registers + DB `is_read` flips |
| 2 | `fad5ed2` (#220) | fix | **Child Rewards tab stale after parent approval** — HQ refetched on focus but Mint+Gamer Rewards screens fetched only on mount → stale balance + stuck "pending" badge. Both screens now refetch balance + open redemption requests on every focus | Child Rewards → Redeem → parent approve → child Rewards refocus | Happy: approve → refocus shows deducted balance, badge clears. Edge: focus with no open requests → no extra spinner/flash |
| 3 | `aaf1dda` (#219) | feat | **families.platform backfill on app-open + platform in admin Tester Board** — migration 026 RPC `backfill_family_platform` (SECURITY DEFINER, writes only when NULL, idempotent) called once per profile load; `get_admin_tester_board` returns platform; admin-web PlatformBadge | Admin Tester Board (web) + silent app-open call | DB probe: RPC live ✅ (verified 2026-06-11, 203/206 families NULL → will fill as testers open build 42). App-side: open app → `families.platform` set for own family, never overwrites non-NULL |

> Inherited from build 41 (see `docs/releases/41/MANIFEST.md`): #215 denial-banner safe-area, #211 kid vibe-share, plus the build-40/39 content (#209 redemption discovery, #198 pause calendar-midnight, #199/#201 off-routine, #194 dev-toggle removal, notifications UI Phase 4, #216 off-routine i18n).

## Gate 1 — Static (2026-06-11, worktree `release-42` @ `0034200`)
| Check | Result |
|---|---|
| tsc | ✅ 0 errors |
| jest | ✅ 358/358 (33 suites, 6 snapshots) |
| expo-doctor | ✅ 18/18 |
| i18n parity | ✅ 0 missing either locale |
| Values Check (#219) | ✅ see below |

**Values Check — #219 (funnel platform backfill, feat):** no child-facing surface at all — a silent, idempotent telemetry write + an admin-web badge.
- P1 Intrinsic: ✅ N/A-clean — no reward, no child interaction, nothing gamified.
- P2 Coaching: ✅ no copy, no failure states, no comparison; admin badge is parent-cohort segmentation, never shown to families.
- P3 Independence: ✅ no dependency mechanic; the metric serves **retention/funnel** analysis (PRD §10.1's sanctioned success measure), not engagement-maximization.

## Gate 2 — Functional (2026-06-11, Hat-3 on emulator-5554, dev client + Metro @ worktree code)
| Item | Verdict | Evidence |
|---|---|---|
| #220 balance focus-refetch | ✅ | Shop showed 0 → DB set 150 → HQ→Shop refocus showed **150** (no remount); affordable reward re-sorted with REDEEM |
| #220 redemption-status focus-refetch | ✅ | Redeem request → "Waiting for approval" badge → approved in DB (150−126) → HQ→Shop refocus: badge **cleared**, balance **24** |
| #221 safe-area top | ✅ (2nd pass) | Notifications feed top bar starts at the 136px inset (UI dump `[0,136][1080,274]`); "Mark all as read" tap registered; DB unread 1→0 |
| #219 app-side backfill | ✅ live | ParentTest520 family (created 2026-05-20, platform NULL) → `platform='android'` after app open with this code |
| #215 banner (inherited, visual) | ✅ incidental | denial banner rendered above tab bar + system nav throughout the session |

> Test-data note: run on test account ParentTest520 / child Itay — left with balance 24 + one approved "Family movie night" redemption (test cohort, excluded from Tester Board).

## Schema changes in this release?
- [x] **none ship in the AAB.** Migration `026_backfill_family_platform` is **already live** on `gfrongfnyigxsexuofrg` (probed 2026-06-11: RPC present with `(p_profile_id uuid, p_platform text)`; `get_admin_tester_board(p_since)` updated). The build only *calls* it.

## Notable risk / watch-items
- ⚠️ **Carries forward build 41's open items:** #211 copy still DRAFT (Adi/Itay gate); `push-notification-fanout` Edge Function deploys **only when the promoted build ships** — now gated on 42's promotion instead of 41's.
- #220 focus-refetch is the dashboard's proven pattern mirrored; on-device Hat-3 below (Gate 2).
- #219 is dormant-by-design until testers open build 42 — expect `families_platform_null` (203 today) to drain gradually, not instantly.
