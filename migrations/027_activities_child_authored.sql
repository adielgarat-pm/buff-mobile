-- ============================================================
-- BUFF Mobile — Activities: child-authored (Feature C)
-- File: migrations/027_activities_child_authored.sql
-- Session: pkg/activities-and-camp-lists (Phase 4.5)
-- Date: 2026-06-13
-- A child can add their OWN activity: Teen adds directly (status='active'),
-- Children Mode proposes (status='proposed') for parent approval. Mode is
-- enforced at the app layer; RLS only scopes child writes to their own rows.
-- Idempotent.
-- ============================================================

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS created_by_child BOOLEAN NOT NULL DEFAULT false;

-- Allow the new 'proposed' status alongside active/archived.
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_status_check;
ALTER TABLE public.activities
  ADD CONSTRAINT activities_status_check CHECK (status IN ('active', 'archived', 'proposed'));

-- ── Child write policies (own rows only) ─────────────────────────────────────

DROP POLICY IF EXISTS "Children can add their own activities"    ON public.activities;
DROP POLICY IF EXISTS "Children can update their own activities" ON public.activities;

CREATE POLICY "Children can add their own activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (
    family_id = public.get_my_family_id()
    AND created_by_child = true
    AND child_id = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );

CREATE POLICY "Children can update their own activities"
  ON public.activities
  FOR UPDATE
  USING (
    family_id = public.get_my_family_id()
    AND created_by_child = true
    AND child_id = (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
    )
  );
