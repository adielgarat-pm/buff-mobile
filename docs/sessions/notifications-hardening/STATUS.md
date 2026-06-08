# `pkg/notifications-hardening` — STATUS

| Phase | State | Date | Commit | Tests | Notes / learnings |
|---|---|---|---|---|---|
| Phase 0 — SPEC + scaffold | `draft, awaiting Adi review` | 2026-06-08 | — | n/a | SPEC drafted from live DB audit + code read. Decisions L1-L8 locked in-session; OQ1-5 open. Worktree `pkg/notifications-hardening` off main `c34a68a`. |
| Phase 1 — Edge: child_suggestion + push taxonomy | `deployed + verified` | 2026-06-08 | (branch) | ✅ E2E: test `child_suggestion` row → `DELIVERED` (4 tokens), no longer `unknown_type`. Test rows cleaned up. | Edge Function deployed v12 ACTIVE (verify_jwt=false preserved). L6: `parent_engagement`+`family_joined` now bell-only. L7: `child_suggestion` recipient+copy. |
| Phase 2 — Crons: anchor split + activation_nudge | `deployed + verified` | 2026-06-08 | (branch) | ✅ Read-only + ROLLBACK sim on real testers: graduated threshold protects established kids (Shani/Noa/Ben→none); activation fires only never-started in 2-14d window (Jonathan, judith, Buff Demo); dedup collapses dup child→1; ghosts excluded by window. | Edge v13 (activation_nudge copy + canonical anchor copy). Migration `notifications_hardening_p2_cron_split`: anchor ever-active gate + graduated 3/5 + stop-after-3; new scan_for_activation_nudge; cron 06:10 UTC. |
| Phase 3 — Preferences schema + server checks | not started | — | — | — | |
| Phase 4 — Client: denial-recovery + 2-toggle prompt + Settings | not started | — | — | — | |
| Phase 5 — Age gate + shared-device routing | not started | — | — | — | |
| Phase 6 — i18n + Values + grep gate + doc sync + close | not started | — | — | — | |
