-- 024: Off-Routine Day (per-child mode).
--
-- A third day-state alongside Pause: Routine / Off-routine / Pause. When a
-- child's off-routine day is active, their full weekday plan is swapped for a
-- light, age-appropriate default set, while the app stays active (unlike Pause).
--
-- Two columns, both backward-safe (defaults), no RLS changes:
--   tasks.is_off_routine     — flags the off-routine task rows (shown only when the
--                              child's off-routine mode is active; the existing
--                              "Parents can manage tasks" / "Children can view their
--                              tasks" policies already cover insert/select).
--   profiles.off_routine_until — per-child mode flag (null = off; future ts = active
--                              until then). Parent writes it via the existing
--                              parent-update-child RLS (migration 022 / #189).
--
-- Applied live via apply_migration `add_off_routine_day` on 2026-06-08.

ALTER TABLE public.tasks    ADD COLUMN IF NOT EXISTS is_off_routine   boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS off_routine_until timestamptz;
