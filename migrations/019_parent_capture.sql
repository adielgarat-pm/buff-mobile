-- ============================================================================
-- 019_parent_capture.sql  —  Parent Capture additive schema
--
-- ⚠️  NOT YET APPLIED. This file is committed as the prepared, reviewed migration.
--     It is intentionally NOT run against any Supabase project until the feature
--     is approved (Gemini paid key + privacy posture). Until then, the app stores
--     captured items locally (AsyncStorage) — see src/hooks/useParentCapture.ts.
--
-- All changes are ADDITIVE and parent-only. Production code never references these
-- objects, so applying this has ZERO behavior impact on the live app. See
-- docs/sessions/parent-capture/SPEC.md § "Schema Changes".
-- ============================================================================

-- Parent-owned captured items (the "This Week" store).
CREATE TABLE IF NOT EXISTS public.parent_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES public.profiles(id),
  title           text NOT NULL,
  type            text NOT NULL CHECK (type IN ('task','event','schedule','reference')),
  owner           text NOT NULL DEFAULT 'parent' CHECK (owner IN ('parent','child')),
  child_id        uuid REFERENCES public.profiles(id),
  child_name      text,                      -- denormalized for display ("handed to {name}")
  child_task_id   uuid,                      -- the created tasks row id, when transferred
  due_date        date,
  due_time        time,
  recurrence      text,
  location        text,
  bring           jsonb NOT NULL DEFAULT '[]'::jsonb,
  event_type      text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','done','transferred')),
  reminder_opt_in boolean NOT NULL DEFAULT false,  -- notifications are OPT-IN
  source          text NOT NULL DEFAULT 'capture',
  confidence      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_items_family_idx ON public.parent_items(family_id);

-- Audit of capture runs. Deliberately NO raw_text / raw_image column (privacy).
CREATE TABLE IF NOT EXISTS public.capture_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES public.profiles(id),
  input_kind  text NOT NULL CHECK (input_kind IN ('text','image')),
  item_count  int  NOT NULL DEFAULT 0,
  model       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Roster grade for capture auto-assign (only added if absent). Optional — age is
-- already derivable from profiles.birth_date.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade_level text;

-- ── RLS: family-scoped, parent-only. Children NEVER read these tables. ──
ALTER TABLE public.parent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_runs ENABLE ROW LEVEL SECURITY;

-- Policies mirror the parent-only pattern used by notifications / parent surfaces.
-- (Parent of the family can select/insert/update/delete their family's rows.)
DROP POLICY IF EXISTS parent_items_family_parent ON public.parent_items;
CREATE POLICY parent_items_family_parent ON public.parent_items
  FOR ALL
  USING (
    family_id IN (
      SELECT p.family_id FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT p.family_id FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'parent'
    )
  );

DROP POLICY IF EXISTS capture_runs_family_parent ON public.capture_runs;
CREATE POLICY capture_runs_family_parent ON public.capture_runs
  FOR ALL
  USING (
    family_id IN (
      SELECT p.family_id FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT p.family_id FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'parent'
    )
  );

-- GRANTs — MCP/apply_migration tables do NOT inherit role grants; RLS alone is
-- not enough (otherwise: "permission denied"). RLS still governs row access.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capture_runs TO authenticated;
