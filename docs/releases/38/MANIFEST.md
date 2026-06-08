# Release v1.4.1 (versionCode 38) — Manifest

**Cut date:** 2026-06-08
**Anchor:** last *promoted* build `1.4.0 (versionCode 34)` — Alpha closed-testing, 2026-06-08 (cut from `main @ 4139d2e`). No `v34` git tag; change set sourced from `git log 4139d2e..main`.
**Branch:** release/2026-06-08-v35 (cut from `main @ 6468037` — build-from-main policy)
**Track:** internal → Alpha (Hat-4 promotes)
**versionName:** 1.4.1 — patch+ (one new feature: Off-Routine Day; rest are fixes). Avoids a Play collision with the already-uploaded 1.4.0.
**versionCode:** **38** (EAS remote auto-increment — do NOT set by hand. Planned as 35, but the EAS remote counter was already at 37 — codes 35/36/37 were consumed by other/parallel builds since 34 — so this build landed on 38).
**EAS build (38):** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/a1798c89-6f8a-481a-a2b9-93d5ca614ae6

## What's in this release (main since the vc34 cut point `4139d2e`)

| # | PR / Commit | Type | Feature / Bug | Flow Suite | Targeted test (happy + edge) |
|---|---|---|---|---|---|
| 1 | #198 / `ba5ca8a` | fix | **Pause Mode ends at local midnight (calendar day)** instead of a rolling N×24h from tap time. "Just today" → end of today; "3 days"/"1 week" → N full calendar days. The exact bug רחל + Adi hit live on war-day 2026-06-08 | F-pause (Parent Settings → Pause) | pause at 10:49 → resume next calendar midnight, not +24h; child empty-state "back on <date>" reads a clean date |
| 2 | #199 / `d449997` | feat | **Off-Routine Day** ("hard-day mode") — per-child third day-state; swaps the weekday plan for a light age-banded anchor bank, app stays active, still earns BUFFs. Pause supersedes off-routine (separate `profiles.off_routine_until`) | F-offroutine (EditChild → Off-Routine card) | set off-routine today → child sees light anchor bank; pause while off-routine → pause wins |
| 3 | #201 / `efd5569` | fix | Off-Routine "3 days" ends at local end-of-day (today+2), consistent with the Pause calendar-day fix | F-offroutine | "3 days" → bank active through end of 3rd calendar day |
| 4 | #194 / `35d4c9d` | fix | Remove the Dev-Simulate-Subscribed toggle from parent settings (dev-only control was visible in prod) | F-settings (Parent Settings) | toggle no longer present in parent settings |

## Server-side, already live (NOT carried by this build)
- **#204 `pkg/notifications-hardening` Phases 1–3a** — Edge Function (push fanout taxonomy + `child_suggestion`), cron split, activation-window 14–21d, preference columns. **Deployed + verified on the server via MCP**; takes effect without an app build. Client phases (3b–6: Settings toggle UI + denial-recovery) are **deferred to a future session**, not in `main` → this build carries no half-built notification UI.

## Schema changes in this release?
- [x] migrations already applied to mobile project `gfrongfnyigxsexuofrg` (verified 2026-06-08 in their own packages):
  - `off_routine_until` column (#199 Off-Routine Day)
  - notifications-hardening P2/P3a migrations (#204 — server-side, not gated on this build)
- No NEW migration introduced by the version bump itself.

## Notable risk / watch-items
- **Pause + Off-Routine interaction** — verify Pause supersedes Off-Routine on the same child (separate columns; expected no conflict, confirm in Gate 2).
- **versionName collision guard** — 1.4.0 already uploaded to Play; 1.4.1 avoids it. versionCode 38 is unique regardless.
- **Hat-4 device check** on the real AAB (Pause + Off-Routine are time/date-sensitive — worth a real-device pass) is deferred to Adi.
