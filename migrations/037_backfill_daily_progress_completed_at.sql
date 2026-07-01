-- 037_backfill_daily_progress_completed_at.sql
--
-- Context (2026-07-01): daily_progress.completed_at was never written by the
-- native completion path (useChildProgress upsert). It was historically set by
-- the legacy Lovable/web path; once the app fully migrated to native (~June
-- 2026) the column went permanently NULL for new completions. The client fix
-- (same package) now stamps completed_at going forward. This migration heals
-- the historical rows so the column is uniformly trustworthy for analytics that
-- key on it (time-to-first-completion, D1/D7 activation latency).
--
-- Note: get_admin_tester_board already COALESCE(completed_at, created_at), so
-- this backfill does NOT change any board number. It is data-quality hygiene.
-- created_at is a faithful proxy: the native path upserts completed=true on the
-- completion tap, so the row's created_at ~= the actual completion time.
--
-- DATA-only migration (no DDL). Idempotent: re-running is a no-op.

update public.daily_progress
set completed_at = created_at
where completed = true
  and completed_at is null;
