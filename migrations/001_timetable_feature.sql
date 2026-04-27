-- ============================================================
-- BUFF Mobile — School Schedule Feature Migration
-- File: migrations/001_timetable_feature.sql
-- Date: 2026-04-18
-- Safe to run against a DB that may already have some objects.
-- All statements are idempotent.
-- ============================================================


-- ── SECTION 1: Helper function ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;


-- ── SECTION 2: New columns on existing tables ────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_quest_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.school_quest_enabled
  IS 'Whether the School Quest module is enabled for this child';

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS lesson_reminders_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS friday_enabled BOOLEAN NOT NULL DEFAULT false;


-- ── SECTION 3: timetables table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.timetables (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id    UUID        NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  data         JSONB       NOT NULL DEFAULT '{}',
  assigned_to  UUID                 REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS timetables_family_child_unique
  ON public.timetables (
    family_id,
    COALESCE(assigned_to, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS idx_timetables_assigned_to
  ON public.timetables(assigned_to);

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_timetables_updated_at ON public.timetables;
CREATE TRIGGER update_timetables_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.timetables;

DROP POLICY IF EXISTS "Users can view family timetable"        ON public.timetables;
DROP POLICY IF EXISTS "Users can manage family timetable"      ON public.timetables;
DROP POLICY IF EXISTS "Children can view their timetable"      ON public.timetables;
DROP POLICY IF EXISTS "Parents can view all family timetables" ON public.timetables;
DROP POLICY IF EXISTS "Parents can manage timetables"          ON public.timetables;

CREATE POLICY "Children can view their timetable"
  ON public.timetables
  FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    AND (
      assigned_to IS NULL
      OR assigned_to = (
        SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
      )
    )
  );

CREATE POLICY "Parents can view all family timetables"
  ON public.timetables
  FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Parents can manage timetables"
  ON public.timetables
  FOR ALL
  USING (
    family_id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );


-- ── SECTION 4: lesson_progress — per-child hardening ─────────────────────────

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_child_id
  ON public.lesson_progress(child_id);

DELETE FROM public.lesson_progress a
USING public.lesson_progress b
WHERE a.id > b.id
  AND a.family_id  = b.family_id
  AND a.date       = b.date
  AND a.lesson_key = b.lesson_key
  AND COALESCE(a.child_id::text, '') = COALESCE(b.child_id::text, '');

CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_family_date_lesson_child_idx
  ON public.lesson_progress (
    family_id,
    date,
    lesson_key,
    COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

DROP POLICY IF EXISTS "Users can view lesson progress"             ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can manage lesson progress"           ON public.lesson_progress;
DROP POLICY IF EXISTS "Children can view their lesson progress"    ON public.lesson_progress;
DROP POLICY IF EXISTS "Parents can view all family lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can manage their lesson progress"     ON public.lesson_progress;

CREATE POLICY "Children can view their lesson progress"
  ON public.lesson_progress
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

CREATE POLICY "Parents can view all family lesson progress"
  ON public.lesson_progress
  FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Users can manage their lesson progress"
  ON public.lesson_progress
  FOR ALL
  USING (family_id = public.get_my_family_id());


-- ── SECTION 5: lesson_reflections table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lesson_reflections (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id         UUID        NOT NULL REFERENCES public.families(id)  ON DELETE CASCADE,
  child_id          UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  date              TEXT        NOT NULL,
  lesson_key        TEXT        NOT NULL,
  subject           TEXT,
  reflection        TEXT,
  difficulty_rating INTEGER     CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_id, child_id, date, lesson_key)
);

ALTER TABLE public.lesson_reflections ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_lesson_reflections_updated_at ON public.lesson_reflections;
CREATE TRIGGER update_lesson_reflections_updated_at
  BEFORE UPDATE ON public.lesson_reflections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Children can view their reflections"    ON public.lesson_reflections;
DROP POLICY IF EXISTS "Children can create their reflections"  ON public.lesson_reflections;
DROP POLICY IF EXISTS "Children can update their reflections"  ON public.lesson_reflections;
DROP POLICY IF EXISTS "Parents can view all family reflections" ON public.lesson_reflections;

CREATE POLICY "Children can view their reflections"
  ON public.lesson_reflections
  FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    AND child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Children can create their reflections"
  ON public.lesson_reflections
  FOR INSERT
  WITH CHECK (
    family_id = public.get_my_family_id()
    AND child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Children can update their reflections"
  ON public.lesson_reflections
  FOR UPDATE
  USING (
    family_id = public.get_my_family_id()
    AND child_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Parents can view all family reflections"
  ON public.lesson_reflections
  FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'parent'
    )
  );


-- ── SECTION 6: Secure RPC — parent updates child settings ────────────────────

DROP FUNCTION IF EXISTS public.update_child_profile_settings(uuid, integer, boolean);

CREATE OR REPLACE FUNCTION public.update_child_profile_settings(
  p_child_id             uuid,
  p_daily_goal           integer DEFAULT NULL,
  p_school_quest_enabled boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_family_id    uuid;
  v_my_role         text;
  v_child_family_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT family_id, role
    INTO v_my_family_id, v_my_role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_my_family_id IS NULL THEN
    RAISE EXCEPTION 'No family found for current user';
  END IF;

  IF v_my_role IS DISTINCT FROM 'parent' THEN
    RAISE EXCEPTION 'Only parents can update child settings';
  END IF;

  SELECT family_id
    INTO v_child_family_id
  FROM public.profiles
  WHERE id = p_child_id
  LIMIT 1;

  IF v_child_family_id IS NULL OR v_child_family_id <> v_my_family_id THEN
    RAISE EXCEPTION 'Child does not belong to your family';
  END IF;

  IF p_daily_goal IS NOT NULL AND (p_daily_goal < 10 OR p_daily_goal > 1000) THEN
    RAISE EXCEPTION 'daily_goal must be between 10 and 1000';
  END IF;

  UPDATE public.profiles
  SET
    daily_goal           = COALESCE(p_daily_goal,           daily_goal),
    school_quest_enabled = COALESCE(p_school_quest_enabled, school_quest_enabled)
  WHERE id = p_child_id;
END;
$$;

REVOKE ALL    ON FUNCTION public.update_child_profile_settings(uuid, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_child_profile_settings(uuid, integer, boolean) TO authenticated;
