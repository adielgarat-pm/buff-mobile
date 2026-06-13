-- ============================================================
-- BUFF Mobile — Activities & Seasonal Packing
-- File: migrations/026_activities.sql
-- Session: pkg/activities-and-camp-lists (Phase 1)
-- Date: 2026-06-13
-- Out-of-school activities (recurring חוגים / one-off days like a pool day),
-- each carrying an equipment list the child packs. Mirrors the timetables
-- RLS model: children read their own, parents manage all family rows.
-- Idempotent — safe to re-run.
-- ============================================================

-- ── activities table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activities (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id     UUID        NOT NULL REFERENCES public.families(id)  ON DELETE CASCADE,
  child_id      UUID                 REFERENCES public.profiles(id)  ON DELETE CASCADE,  -- NULL = whole family
  title         TEXT        NOT NULL,
  template_id   TEXT,                                                                    -- → packing-template catalog key, or NULL (manual)
  schedule_kind TEXT        NOT NULL CHECK (schedule_kind IN ('recurring', 'oneoff')),
  weekday       TEXT                 CHECK (weekday IN
                  ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')),
  on_date       DATE,                                                                    -- set when schedule_kind = 'oneoff'
  at_time       TEXT,                                                                    -- "HH:MM", optional
  equipment     JSONB       NOT NULL DEFAULT '[]',                                       -- string[]
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- schedule shape integrity: recurring ⇒ weekday only; oneoff ⇒ date only
  CONSTRAINT activities_schedule_shape CHECK (
    (schedule_kind = 'recurring' AND weekday IS NOT NULL AND on_date IS NULL)
    OR
    (schedule_kind = 'oneoff'    AND on_date IS NOT NULL AND weekday IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_activities_family_id ON public.activities(family_id);
CREATE INDEX IF NOT EXISTS idx_activities_child_id  ON public.activities(child_id);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- realtime (guard against double-add on re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
END $$;

-- ── RLS — mirrors timetables (migration 001) ─────────────────────────────────

DROP POLICY IF EXISTS "Children can view their activities"      ON public.activities;
DROP POLICY IF EXISTS "Parents can view all family activities"  ON public.activities;
DROP POLICY IF EXISTS "Parents can manage activities"           ON public.activities;

CREATE POLICY "Children can view their activities"
  ON public.activities
  FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    AND (
      child_id IS NULL
      OR child_id = (
        SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
      )
    )
  );

CREATE POLICY "Parents can view all family activities"
  ON public.activities
  FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Parents can manage activities"
  ON public.activities
  FOR ALL
  USING (
    family_id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );
