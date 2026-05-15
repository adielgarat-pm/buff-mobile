# buddy-v05-backend — Roadmap

Single-phase package — pure backend infrastructure.

## Phase 1 — Schema + EOD function + cron + read hook

**Scope:**
- 3 new tables (buddy_relationships, buddy_gifts_history, buddy_daily_check) + RLS mirroring existing profiles permissive SELECT pattern
- Backfill `buddy_relationships` for all existing children at default state
- `compute_buddy_eod_for_child(child_id, check_date)` SECURITY DEFINER function
- `run_buddy_eod_for_all()` wrapper
- pg_cron job at 23:55 Asia/Jerusalem
- TypeScript types (`src/types/buddy.ts`) with pure helpers (`levelForSuccessfulDays`, `daysUntilNextLevel`)
- React Native read hook (`useBuddyRelationship`)
- Jest unit tests for the threshold helpers

**Stop conditions:**
- Migration applied successfully via Supabase MCP
- All existing children have a buddy_relationships row (88/88 confirmed)
- Cron job visible in `cron.job` table (1 row, name `buddy-eod-run`)
- `npm run typecheck` clean
- `npm test` passing (25/25 including 10 new buddy tests)
- Smoke-tested EOD function on a real child (Itay — 0 tasks today, no day counted, correct)

**Exit deliverables:**
- [x] Code as scoped above
- [x] STATUS.md updated with phase 1 row
- [x] Migration SQL saved as `phase-1-migration.sql` for traceability

## Closeout

- [x] Phase 1 passed
- [ ] PR opened (pending commit)
- [ ] Verify after EOD cron fires tonight 23:55 IDT (Adi can also manually invoke `SELECT public.compute_buddy_eod_for_child('<child_id>', '2026-05-15')` for any child via Supabase SQL editor at any time)
