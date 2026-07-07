# fix-pause-visibility-child — STATUS

| # | Chunk | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|---|
| 1 | Mint pause gates (ChildTasksScreen + ChildRewardsScreen) + Jest | ✅ DONE | 2026-07-06 | (this PR) | 5/5 new tests pass; tsc clean | Mirrors GamerTasksScreen:264 pattern; shop keeps header/balance visible |
| 2 | `tasks` realtime → live child refetch + AppState foreground fallback | ✅ DONE | 2026-07-06 | (this PR) | Verified LIVE on emulator (see TESTS.md §Realtime) | Migration 040 applied to Supabase (publication add). **Discovery: publication only contained activities+notifications — the daily_progress/lesson_progress/credit_vault subscriptions from pkg/pause-mode never fired** (see INTEGRATION_LEARNINGS IN-2026-07-06) |
| 3 | One-time-task edit edge (hide day chips + hint) + lib default [0..5]→[0..6] | ✅ DONE | 2026-07-06 | (this PR) | taskScheduling suite updated + 2 new tests; i18n key added (en+he) | Dated tasks no longer show a lying "paused" hint; scheduleDays not written for them |
| 4 | Hat 3 (emulator) + web smoke + exit deliverables | ✅ DONE | 2026-07-06 | (this PR) | See TESTS.md | Full suite 545/545 (1 pre-existing env-failure suite on main: ThemeContext/websocket) |

**Hat 4 (Adi, real devices — pending):** two-device test: parent phone pauses (family + per-task), child phone (own-device, Liya-style) updates within seconds without restart. Single-device realtime was verified on emulator; the cross-device path is the same server event but should be confirmed once on real hardware.

**Out-of-scope flags raised:** `category.other` i18n key missing on main (spawned as separate chip task); dead realtime subscriptions for 3 tables (deliberate decision needed — volume/perf); scheduling-modules unification refactor.
