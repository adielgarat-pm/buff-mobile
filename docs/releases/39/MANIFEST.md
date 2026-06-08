# Release v1.4.1 (versionCode 39) — Manifest

**Cut date:** 2026-06-08
**Anchor:** last *promoted* build `1.4.0 (versionCode 34)` — Alpha closed-testing, 2026-06-08 (`main @ 4139d2e`).
**Branch:** built from `main @ 90956ed` (build-from-main policy; built via the merged `pkg/notifications-client` worktree, identical content).
**Track:** internal → Alpha (Hat-4 promotes)
**versionName:** 1.4.1 (versionCode 38 was cut earlier then **canceled** — superseded by this fuller build; 1.4.1 is free of a Play collision).
**versionCode:** **39** (EAS remote auto-increment).
**EAS build (39):** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/37f1c9ee-c7c3-453d-88cc-f21825a0d1e3

## What's in this release (main since the vc34 cut point `4139d2e`)

| # | PR / Commit | Type | Feature / Bug | Flow Suite | Targeted test |
|---|---|---|---|---|---|
| 1 | #198 / `ba5ca8a` | fix | **Pause Mode ends at local midnight (calendar day)**, not rolling N×24h. War-day bug (רחל + Adi). | F-pause | pause at 14:00 → resume next calendar midnight |
| 2 | #199 / `d449997` | feat | **Off-Routine Day** ("hard-day mode") — per-child third day-state; light age-banded anchor bank, app stays active, still earns. Pause supersedes. | F-offroutine | set off-routine → light bank; pause wins |
| 3 | #201 / `efd5569` | fix | Off-Routine "3 days" ends at local end-of-day (today+2). | F-offroutine | "3 days" → through end of 3rd day |
| 4 | #194 / `35d4c9d` | fix | Remove Dev-Simulate-Subscribed toggle from parent settings. | F-settings | toggle gone |
| 5 | #206 / `cf900c3` | feat | **Notifications UI (Phase 4)** — two-toggle Notification Settings screen ("Alerts to me" / "Reminders for my child") + **denial-recovery banner** (deep-link to system settings; fixes "denied → dark forever") + Settings row. The permission model that makes the live server nudges actually reach testers. | F-notif-settings | Settings → Notifications: toggles persist; denied → banner |
| 6 | #206 / `cf900c3` | feat | **Edge enforcement (Phase 3b)** — `push-notification-fanout` suppresses per family pref (`pref_off`). **NOT yet deployed** (see below). | — (server) | deploy gated on this build's promotion |

## Schema changes in this release?
- No NEW migration in this build. Pre-applied in their own packages: `off_routine_until` (#199), notifications-hardening P2/P3a (#204, server-side).

## ⚠️ Coordinated deploy step (Hat-4 / CC, on promotion)
- **Deploy the `push-notification-fanout` Edge Function (Phase 3b)** ONLY when build 39 is promoted to testers. `notif_child_reminders` defaults false, so deploying before users have the toggle would gate kid pushes with no way to re-enable. Needs Adi's approval (function change).

## Notable risk / watch-items
- **Notifications permission states + denial banner** are real-device-only (emulator/web have no FCM) → Hat-4 verifies. Web preview confirmed the bundle compiles + app boots clean from this branch.
- **Pause + Off-Routine** are calendar-date-sensitive → real-device pass worthwhile.
- versionCode 38 canceled; 39 is the successful, complete build.
