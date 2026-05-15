# buddy-v05-backend — Tests

## Phase 1

### Automated (CC ran)
- [x] `npm run typecheck` clean
- [x] `npm test` 25/25 (15 prior + 10 new in `src/types/__tests__/buddy.test.ts`)

### Backend smoke (CC ran via Supabase MCP)
- [x] `SELECT COUNT(*) FROM buddy_relationships` = 88 (matches child count in profiles)
- [x] `SELECT COUNT(*) FROM cron.job WHERE jobname='buddy-eod-run'` = 1
- [x] `SELECT public.compute_buddy_eod_for_child(<itay_id>)` runs without error and inserts a `buddy_daily_check` row with the right field values (0/0/0.00/false today since Itay has 0 scheduled tasks)

### Manual verification (Adi — when she wants)
- [ ] `SELECT * FROM cron.job_run_details WHERE jobname='buddy-eod-run' ORDER BY start_time DESC LIMIT 5` after first cron run — confirms the scheduled job actually fired
- [ ] After a real successful day for any child, query `buddy_relationships` for that child — `successful_days_count` should have incremented and `last_successful_day_date` should equal the date

### Methodological
- [x] STATUS.md row added for phase 1
- [x] Migration SQL saved to `phase-1-migration.sql`
- [x] No unexpected drift from BUDDY_SYSTEM.md spec (small simplifications documented in SPEC.md "Differences from BUDDY_SYSTEM.md spec")

## Closeout
- [x] All automated tests pass
- [x] Smoke test passed
- [ ] Tag (skipped — repo doesn't use semver tags currently)
- [ ] PR opened
