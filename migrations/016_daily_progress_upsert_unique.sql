-- 016_daily_progress_upsert_unique.sql
--
-- BUG-2026-05-27-01 fix.
--
-- `useChildProgress.completeTask` (src/hooks/useChildProgress.ts:310-330)
-- calls supabase-js `.upsert(..., { onConflict: 'family_id,child_id,date,task_id' })`,
-- but `daily_progress` had no unique constraint matching that column tuple.
-- Postgres responded with 42P10 ("no unique or exclusion constraint matching the
-- ON CONFLICT specification"), supabase-js returned an error to the client,
-- and the React optimistic UI displayed the ✓ while the DB stayed empty.
--
-- The last successful write to `daily_progress` in prod was 2026-04-09. Every
-- task-completion tap from a kid using the mobile app since then has failed
-- silently (likely contributor to the "April war non-return" observed in
-- INTEGRATION_LEARNINGS.md / project_buff_war_non_return).
--
-- Pre-flight (2026-05-27):
--   SELECT COUNT(*) FILTER (WHERE n > 1) AS duplicate_groups
--   FROM (SELECT family_id, child_id, date, task_id, COUNT(*) AS n
--         FROM daily_progress
--         GROUP BY family_id, child_id, date, task_id) g;
--   → 0 duplicate groups across 1,372 prod rows, so the unique index
--     creates cleanly with no data migration.

CREATE UNIQUE INDEX IF NOT EXISTS daily_progress_family_child_date_task_unique
  ON public.daily_progress (family_id, child_id, date, task_id);

COMMENT ON INDEX public.daily_progress_family_child_date_task_unique IS
  'Required by useChildProgress.completeTask upsert onConflict. See BUG-2026-05-27-01 / pkg/daily-progress-upsert-fix.';
