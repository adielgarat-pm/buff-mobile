# Release v1.6.0 (versionCode TBD) — Manifest

> ⛔ **BUILD BLOCKED (2026-06-15) — EAS Free-plan Android build quota exhausted this month** (resets **Wed Jul 01 2026**). Gate 0/1/2 all GREEN; the failure is account/billing only, not code. EAS incremented the remote versionCode **44 → 45 before** the quota check, so **45 is burned** (44 was already consumed by the 1.5.0 build). The next *successful* build will get **46+**. Awaiting Adi's decision: upgrade EAS plan (build now) vs wait until Jul 1. Folder/tag will be renamed to the real versionCode once the build succeeds.

**Cut date:** 2026-06-14 (build attempted 2026-06-15)
**Anchor (last promoted build):** 1.4.0 (versionCode 34), Alpha 2026-06-08
**Branch:** pkg/release-1.6.0 (cut from `origin/main @ dc5b76a`)
**Track:** internal / Alpha
**versionName:** 1.6.0 (minor bump — feature-heavy train) · **versionCode:** pending next successful EAS build (44 & 45 burned)

> **Version-history note (unreconciled — flagged to Adi, not resolved here):** `docs/RELEASE_QUEUE.md`
> (last updated 2026-06-11) tops out at vc42/1.4.4. A separate `pkg/release-43` branch carries a
> **v43 / 1.5.0** tag (2026-06-13, adds #233 task-day-toggles) that the queue never recorded, and that
> branch is now 29 commits behind `main`. Builds 39/41/42/43 were cut but their promotion/tag status is
> ambiguous in the docs. **This cut sidesteps the ambiguity by building from `origin/main` HEAD**, which is
> a superset of all of the above. Reconciling the 39→43 history is a separate docs task for Adi.

## What's in this release

Everything merged to `main` after the **1.4.0 (vc34)** cut point. Source: `RELEASE_QUEUE.md` Queued rows.

| # | PR / Commit | Type | Feature / Bug | Flow Suite | Prior verification |
|---|---|---|---|---|---|
| 1 | #198 `ba5ca8a` | fix | Pause Mode ends at local midnight (calendar day), not +N×24h | Parent Settings → Pause | Hat-3 logic; Hat-4 pending |
| 2 | #199 `d449997` | feat | Off-Routine Day ("hard-day mode") — per-child 3rd day-state, light anchor bank | EditChild → Off-Routine card | Hat-3 robustness; Hat-4 pending |
| 3 | #201 `efd5569` | fix | Off-Routine "3 days" ends at local end-of-day (today+2) | EditChild → Off-Routine "3 days" | with #199 |
| 4 | #194 `35d4c9d` | fix | Remove Dev-Simulate-Subscribed toggle from parent settings (prod leak) | Parent Settings | code-only |
| 5 | `pkg/notifications-client` | feat | Notifications UI (Phase 4) + Edge enforcement — 2-toggle Settings, denial-recovery banner | Parent Settings → Notifications; NotificationGate banner | Hat-3 |
| 6 | `80782b4` | fix | Denial-permission banner safe-area (was colliding with Android nav bar) | NotificationGate denial banner | reported live on 1.4.1 |
| 7 | #209 `cf6b353` | feat | Reward-redemption request discovery + "let's talk" two-sided reset | Child Rewards → Redeem; Parent Rewards → Approve / Let's talk; Notification→child select | **on-device Hat-3 PENDING** |
| 8 | #211 `f6fbc14` | feat | Kid shares a good mood with a parent (positive Vibe ≥3 → opt-in push + bell row) | Child Vibe Check → share step; Parent notification feed | **on-device Hat-3 PENDING** |
| 9 | #221 `pkg/safe-area-top` | fix | Top system bar overlapped tappable controls on 17 screens (SafeAreaView no-op) | Notification feed → Mark all read; Onboarding flow | Hat-3 emulator-verified |
| 10 | #216 `96dee51` | fix | Off-Routine banner/card follow interface language (was device-lang) + i18n guard | View-as-Child → Off-Routine banner; EditChild → Off-Routine card | **on-device Hat-3 PENDING** |
| 11 | #220 `fad5ed2` | fix | Child Rewards tab refetches balance + pending badge on focus (stale after approval) | Child Rewards → Redeem → parent approve → refocus | Hat-3 verified live |
| 12 | #219 `aaf1dda` | feat | families.platform backfill on app-open + admin PlatformBadge | Admin Tester Board (web); silent app-open | Hat-3 verified live |
| 13 | `pkg/ios-testflight` | feat | iOS readiness: in-app account deletion (Android-visible) + Sign in with Apple (iOS-only, null on Android) | Parent Settings → Danger Zone → Delete account | account-deletion device-verified; web preview |
| 14 | `pkg/fix-streak-counter` | fix | Day-streak stuck at 0 (Alon) — wire onTaskCompleted; unblock Buddy evolution | Child HQ / Quests → complete task → streak badge | **on-device Hat-3 PENDING** |
| 15 | `pkg/streak-per-child` | fix | Streak now per-child not per-device (RPC `child_task_streak`, migration 029) | Child HQ / Quests → complete task → streak badge (per child) | **on-device Hat-3 PENDING** |
| 16 | #236 `27a4495` | fix | Onboarding "I'll do it later" schedules a real 24h reminder (was silent no-op) | Onboarding → UStep7 → "I'll do it later" | emulator-verified (dumpsys RTC_WAKEUP) |
| 17 | #239 `0541c35` | feat | Medication-reminder anchor (Anchor Recovery Phase 3) — smart-default meds sheet → standalone tasks | Parent Dashboard → Anchor Recovery → Add medication reminder | Hat-3 emulator 9/9, live DB |

## Schema changes in this release?
- [x] Migrations already applied to `gfrongfnyigxsexuofrg` (per queue rows): `021` (account deletion), `025` (redemption "discussed" + vibe_shared), `026` (platform backfill RPC), `029` (per-child streak RPC). **No new migration introduced by this cut.**
- ⚠️ **Edge Function `push-notification-fanout` must be deployed only when this build is promoted** (kid reminders default off) — carried forward from the notifications rows. Hat-4 / deploy step for Adi.

## Notable risk / watch-items
- Push notifications stay silent until the Edge Function is deployed post-promotion (bell rows work in-app regardless).
- Five rows still carry **on-device Hat-3 PENDING** (#209, #211, #216, fix-streak-counter, streak-per-child) → primary Gate-2 targets.
- Hat-4 device-only items: native date picker, OAuth, FCM tray delivery, Sentry capture (see HAT4_CHECKLIST).

## Static gate (Gate 1) — 2026-06-14
| Check | Result |
|---|---|
| tsc --noEmit | ✅ 0 errors |
| jest | ✅ 392/392 (fixed stale i18n allowlist: added ParentDashboardScreen.tsx — #239 meds-detection keywords) |
| expo-doctor | ✅ 18/18 |
| i18n parity | ✅ 0 missing either locale |
| Values Check | ✅ inherited from per-package design (all 17 merged through their own Values gates); no new pillar risk. Privacy-sensitive #211 re-checked on device: share is opt-in, "totally your choice", private by default (Pillar 1 ✅). |

## Functional gate (Gate 2) — Hat-3 emulator, 2026-06-15 — **PASS** (no ❌, no beta-blocker)

Scope = critical-path smoke + the 5 "on-device Hat-3 pending" items. Run on emulator-5554, test family ReminderTest / child Maya. uiautomator dump was unreliable this session (returned stale hierarchy) → driven by screenshot + native-coordinate taps; screenshots are the evidence.

| Item | Verdict | Evidence |
|---|---|---|
| Boot / auth / parent dashboard off `main` HEAD | ✅ | App loads, authenticates, renders parent dashboard + Gamer child dashboard; navigation works. The 17-change batch integrates without startup/auth breakage. |
| F5.H1 task completion → atomic BUFF credit | ✅ | "Eat breakfast" completed → Buffs 0→20, ring 0/2→1/2, Focus Fuel 0/3→1/3 |
| **fix-streak-counter** (Alon's bug) | ✅ | 🔥1 streak badge appeared next to "Maya ⚡" after first completion (was absent at 0) |
| **streak-per-child** | ✅ | Streak derived for Maya on her completion |
| **#211 kid shares good mood** | ✅ | Positive vibe (🙂 ≥3) → "Want to share this feeling? … totally your choice" → Share completes cleanly → parent notification bell shows "1" (INFO row landed) |
| F8.E1 unaffordable reward | ✅ (light) | Maya 20 Buffs; rewards 294/588 → not actionable, no crash |
| **#209 redemption discovery** | ⏭️ Hat-4 | Couldn't exercise child→parent redeem (Maya 20 Buffs < cheapest 294). Deduction engine shipped+verified in build 34; #209 logic tsc+jest+DB-verified; notification→approve reachability is real-device anyway. |
| **#216 off-routine i18n** | ⏭️ Hat-4 | Couldn't reach EditChild→Off-Routine via pixel-nav (uiautomator down). Protected by `i18nNoHardcodedCopy` jest guard (✅ Gate 1) + node-verified in-package; runtime View-as-Child language → Hat-4. |

**Gate verdict:** smoke green, no manifest-targeted ❌, no beta-blocker. 3 of 5 pending items fully verified on-device (#211 + both streak fixes); 2 deferred to Hat-4 with jest-guard / shipped-engine coverage. **Cleared to build.**
