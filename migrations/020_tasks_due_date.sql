-- 020_tasks_due_date.sql
-- ONE-TIME task support for parent-capture transfer (pkg/parent-capture Phase 5).
--
-- Additive + nullable: due_date NULL = existing recurring behavior (schedule_days).
-- due_date set = the task is ONE-TIME — visible ONLY on that calendar date and
-- ignored by the recurring schedule_days / hide_on_weekend logic.
--
-- Backward-compatible: every existing row has due_date NULL, so it renders EXACTLY
-- as today. No backfill, no NOT NULL, no default → zero impact on existing rows.
--
-- Guard: transfer sets schedule_days = '{}' on one-time tasks so they are inert on
-- every `ANY(schedule_days)` surface (incl. the live BUDDY EOD cron) — they never
-- match a weekday, so they can't pollute completion-rate. See src/lib/taskScheduling.ts.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_date date;

COMMENT ON COLUMN public.tasks.due_date IS
  'One-time task: when set, visible ONLY on this calendar date; recurring '
  'schedule_days/hide_on_weekend are ignored. NULL = recurring. '
  'pkg/parent-capture Phase 5 + src/lib/taskScheduling.ts.';
