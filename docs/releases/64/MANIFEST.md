# Release MANIFEST — 1.7.8 (versionCode 64)

> Cut 2026-07-07 from `origin/main @ b0a3945` (+ version-bump commit `6f320a5` on `pkg/release-64`).
> EAS build: `7bf02b27-f54e-4e17-8ca7-aa0c8edb0b5a` (production app-bundle, autoIncrement → vc64).
> Prior release: 1.7.7 (vc63, `80865e7`) — pending/under Play review at cut time; vc64 supersedes it with everything below on top.

## Content (merged to `main` after vc63's base `80865e7`)

| PR | Type | Change | User-facing? | Gate 2 evidence |
|---|---|---|---|---|
| #316 | feat | Android mobile-web install CTA (web-to-native, Phase 1+2 + dashboard nudge) | yes | Verified pre-merge (see PR #316 / web-to-native-cta session docs) |
| #317 | fix | Per-child insight reset on child switch (rest of #317 is web/server-side, already live) | yes | Jest + code review (PR #317) |
| #319 | fix | **Paused tasks actually disappear for the child** — Mint tasks+shop pause gates + `tasks` realtime (migration 040, applied) + AppState-foreground refetch + one-time-task edit hint fix | yes | Hat-3 emulator LIVE: family pause on Mint child + 2/2 realtime events (SQL UPDATE with child view open); 545+ jest |
| #320 | fix | Timetable editor: save footer safe-area + KAV + bounded multiline equipment (manual/review/paste) | yes | Hat-3 emulator: footer bounds above nav; 4 jest tests vs mocked 48px inset |
| #323 | feat/fix | Stack landing: **TimeField** native clock + web `<input type=time>` (#321) · **copy-day** incl. equipment w/ add-replace confirm (#322) · **header-under-status-bar fix** ("Update Schedule" was untappable on edge-to-edge — reproduced+re-verified live) · **clear-day + save-empty-schedule** (season change school→camp, Adi's 2026-07-07 report) | yes | Full E2E on emulator 2026-07-07 with a REAL camp schedule: clear → enter (time picker) → copy-to-week (REPLACE) → save → **DB-verified write**, then restored. 571/571 jest |

## Not gated to this build
- Migration 040 (`tasks` → realtime publication) — **already applied** to Supabase (2026-07-06).
- Web parity of all the above — deploys via Vercel on the `main` merges (already rolling).

## Hat-4 (Adi, real device, after install)
1. Two-device pause: parent pauses (family + per-task) → child device updates live, no restart.
2. Timetable: long equipment → save reachable (gesture nav); header "Update Schedule" tappable; time tap → Material clock; copy-day; clear-day + save-empty.
3. Known friction (not a blocker, fix chip open): denied-notifications banner overlaps bottom action buttons until ✕-dismissed.

## Rollout
- [ ] Adi uploads AAB to Play Console (production track) — supersedes vc63.
- [ ] After promote + "verified, tag it": move the Queued rows (#316→#323) to **Shipped (64)** in RELEASE_QUEUE.md.
