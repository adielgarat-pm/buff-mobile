-- 017_tasks_hide_on_weekend.sql
--
-- pkg/school-free-day-parity — bring mobile to parity with the Lovable web app's
-- school-day / free-day task model.
--
-- Lovable's `tasks` carry `hideOnWeekend?: boolean` (src/types/task.ts:61); on a
-- weekend the visible-task filter drops tasks where `hideOnWeekend` is true
-- (src/hooks/useSyncedTaskStore.ts:1086-1089). The mobile `tasks` table had no
-- such column. Add it (default false = task shows every day, unchanged behavior
-- for all existing rows).
--
-- `app_settings.friday_enabled` already exists on mobile (copied from Lovable),
-- so no migration is needed for the Friday-is-a-school-day toggle — only client
-- wiring.
--
-- Backward-compatible: existing app builds (≤ V19) never read this column, so
-- adding it does not affect them.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS hide_on_weekend boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tasks.hide_on_weekend IS
  'School-day-only task: hidden on weekend days. Weekend = Sat always, Fri unless app_settings.friday_enabled. See pkg/school-free-day-parity.';
