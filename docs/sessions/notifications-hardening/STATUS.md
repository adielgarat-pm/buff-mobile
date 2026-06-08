# `pkg/notifications-hardening` — STATUS

| Phase | State | Date | Commit | Tests | Notes / learnings |
|---|---|---|---|---|---|
| Phase 0 — SPEC + scaffold | `draft, awaiting Adi review` | 2026-06-08 | — | n/a | SPEC drafted from live DB audit + code read. Decisions L1-L8 locked in-session; OQ1-5 open. Worktree `pkg/notifications-hardening` off main `c34a68a`. |
| Phase 1 — Edge: child_suggestion + push taxonomy | `deployed + verified` | 2026-06-08 | (branch) | ✅ E2E: test `child_suggestion` row → `DELIVERED` (4 tokens), no longer `unknown_type`. Test rows cleaned up. | Edge Function deployed v12 ACTIVE (verify_jwt=false preserved). L6: `parent_engagement`+`family_joined` now bell-only. L7: `child_suggestion` recipient+copy. |
| Phase 2 — Crons: anchor split + activation_nudge | not started | — | — | — | |
| Phase 3 — Preferences schema + server checks | not started | — | — | — | |
| Phase 4 — Client: denial-recovery + 2-toggle prompt + Settings | not started | — | — | — | |
| Phase 5 — Age gate + shared-device routing | not started | — | — | — | |
| Phase 6 — i18n + Values + grep gate + doc sync + close | not started | — | — | — | |
