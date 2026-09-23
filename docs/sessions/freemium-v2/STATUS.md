# Freemium v2 — Status

> Updated by Claude Code at the end of each chunk.

| Chunk | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 1 — SPEC / SPEC_SYNC / Values Check | _passed_ | 2026-09-23 | (this commit) | docs only | — |
| 2 — Remove task cap + 2nd-child wall | _passed_ | 2026-09-23 | (this commit) | tsc clean; ParentTasks (pickers/dirtyGuard/noCap), useSubscription, freemiumV2 guards green | — |
| 3 — Paywall "BUFF Coach" copy (AI only) + renames + capture CTA | _passed_ | 2026-09-23 | (this commit) | tsc clean; PaywallChildGate (+3 v2 tests), parent screens, guards green; i18n-key-check clean | — |
| 4 — Migration 058: trial at first real completion + reset of backfilled clocks | _passed_ | 2026-09-23 | (this commit) | Local PG16 logic test `trial_migration_test.sql` ALL PASSED (reset guards, seed rows, first completion, once-ever, referral stacking, fail-safe, client guard, rollback); mutation-checked. **Applied to prod** via MCP 2026-09-23: 192 clocks reset, 29 lifetime kept, 3 real trials kept, trigger enabled | IN (trial trigger existed) |
