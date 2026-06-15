-- ============================================================
-- BUFF Mobile — one-time cleanup of orphaned off-routine tasks
-- File: migrations/030_cleanup_orphaned_off_routine_tasks.sql
-- Session: fix/off-routine-orphan-cleanup
-- Date: 2026-06-15
--
-- Why: when a child exits off-routine / pause mode, the off-routine task rows
-- (tasks.is_off_routine = true) created for that window are NOT cleaned up.
-- They linger as live task definitions and leak into the day/history views as
-- phantom uncompleted tasks (parent "Noa" reported this on a past-day view).
--
-- Scope: DATA-ONLY one-time cleanup. This migration does NOT add the permanent
-- fix (cleanup-on-exit + an is_off_routine filter in taskScheduling) — that is a
-- separate package. Until it ships, new orphans can re-accumulate.
--
-- Safety (verified live on project gfrongfnyigxsexuofrg, 2026-06-15):
--   * 19 rows match the predicate below, across 3 children; every matched
--     child has off_routine_until NULL or in the past (no active window).
--   * 0 daily_progress rows reference any of these task ids, so although
--     daily_progress.task_id is ON DELETE CASCADE, the hard delete removes no
--     completion history.
--   * Children currently inside an active off-routine window (off_routine_until
--     in the future) are explicitly excluded — their tasks are left intact.
-- ============================================================

BEGIN;

DELETE FROM public.tasks t
USING public.profiles p
WHERE t.assigned_to = p.id
  AND t.is_off_routine = true
  AND (p.off_routine_until IS NULL OR p.off_routine_until < now());

COMMIT;
