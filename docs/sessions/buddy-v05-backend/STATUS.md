# buddy-v05-backend — Status

## Phases

| Phase | State | Date | Migration | Tests |
|---|---|---|---|---|
| 1 — Schema + EOD function + cron + read hook | _passed_ | 2026-05-15 | applied via Supabase MCP (`buddy_v05_backend_phase1` + `buddy_v05_eod_function_and_cron`); SQL also saved as [phase-1-migration.sql](phase-1-migration.sql) | typecheck ✅ / jest 25/25 ✅ (10 new for `levelForSuccessfulDays` + `daysUntilNextLevel`); EOD smoke-tested against Itay (`KWYEL5`) — 0 tasks today, no day counted (correct) |

## What shipped

**Schema (3 new tables + RLS):**
- `buddy_relationships` (one row per child, 88 rows backfilled at default state)
- `buddy_gifts_history` (append-only log, empty)
- `buddy_daily_check` (one row per child per day, 1 row from smoke test)

RLS mirrors the existing `profiles` pattern: SELECT open to authenticated users; no INSERT/UPDATE/DELETE policies (server-only writes via the EOD function with SECURITY DEFINER).

**EOD pipeline:**
- `compute_buddy_eod_for_child(child_id, check_date DEFAULT today_in_jerusalem)` — per-child function. Uses `Asia/Jerusalem` for "today." Skips when family is in pause mode. Computes tasks_assigned (filtered by `tasks.schedule_days` containing today's DOW), tasks_completed (from `daily_progress` where `completed=true AND revoked_at IS NULL`), upserts `buddy_daily_check`, then increments `successful_days_count` if it was a successful day (≥70%) and not already counted. Bumps friendship_level to 2 (at 3 days) or 3 (at 10 days), records the gift in `buddy_gifts_history`.
- `run_buddy_eod_for_all()` — wrapper that loops all children.
- pg_cron job `buddy-eod-run` scheduled `55 20 * * *` (UTC = 23:55 IDT in summer / 22:55 IST in winter — both pre-midnight in Israel).

**Code:**
- [src/types/buddy.ts](../../../src/types/buddy.ts) — `BuddyRelationship`, `BuddyGift`, `BuddyDailyCheck`, `levelForSuccessfulDays()`, `daysUntilNextLevel()`, `FRIENDSHIP_LEVEL_THRESHOLDS`. The pure helpers mirror SQL EOD logic and are unit-tested.
- [src/hooks/useBuddyRelationship.ts](../../../src/hooks/useBuddyRelationship.ts) — read-only hook, polls once on mount, exposes `refetch`.
- [src/types/__tests__/buddy.test.ts](../../../src/types/__tests__/buddy.test.ts) — 10 tests covering threshold edges + "next level" math.

## Architectural decisions (recorded — CC made these per 2026-05-15 architect directive)

See SPEC.md "Architectural Decisions" table. Quick recap:
1. EOD via **pg_cron** (extension already installed, verified)
2. Time zone: **Asia/Jerusalem**
3. Backfill: **start everyone at `successful_days_count=0`**
4. Coexist `pet_state.evolution_days_count` (any-completion, AsyncStorage) and `buddy_relationships.successful_days_count` (≥70%, Supabase)
5. **No** booster grant/use flow in this package
6. Schema supports L1-L5; trigger handles L2 + L3 only this phase
7. RLS mirrors existing `profiles` permissive SELECT pattern
8. Hook is poll-once + refetch (no realtime)
9. TS types hand-written under `src/types/buddy.ts` (avoids wiring full generated Database type)

## Closeout

- [x] Phase 1 passed
- [x] Migration applied + smoke tested
- [x] Read hook + types + unit tests in place
- [x] STATUS, SPEC updated; SPEC_SYNC + ROADMAP + TESTS in this folder
- [ ] PR opened — pending commit
- [ ] Verified end-to-end after a real successful day (88 children → trigger fires tomorrow at 23:55 IDT; first real data lands then). Adi can also manually invoke `SELECT public.compute_buddy_eod_for_child('<child_id>', '2026-05-15')` via Supabase SQL editor for any child if she wants to see it work today.

## Follow-up packages this unblocks

- `pkg/teen-ui-with-buddy-bundle` — extends GamerMyStatsScreen lite to full 5B (LEVEL pill + BOOSTERS carousel + hero); ships Stitch 03 Buddy Toggle Modal, 05A Me & Buddy, 01-with-buddy variant.
- Future booster-mechanics package — wires up `buddy_gifts_history.is_used` + actual booster effects (×2 Buffs day-application, Skip Token, etc.).
- Future toast-on-level-up package — listens for `has_pending_gift = true`.
- Levels 4-5 trigger logic (when L4/L5 boosters are designed).
