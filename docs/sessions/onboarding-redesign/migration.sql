-- onboarding-redesign · Phase 0 · funnel instrumentation
-- Applied to production 2026-07-04 via Supabase apply_migration
--   (migration name: onboarding_events_instrumentation).
-- Additive only — backward-compatible with old app builds in the field:
--   * new table is invisible to old clients;
--   * daily_progress.source is nullable, so old clients' completion writes
--     (which omit it) remain valid (NULL = normal completion).
-- Rollback (both non-destructive):
--   DROP TABLE public.onboarding_events;
--   ALTER TABLE public.daily_progress DROP COLUMN source;

CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  family_id    uuid REFERENCES public.families(id) ON DELETE CASCADE,
  child_id     uuid,
  event_type   text NOT NULL,
  method       text,
  source       text,
  variant      text,
  acquisition  jsonb,
  platform     text,
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

-- Family-scoped: a member may write/read only their own family's events.
CREATE POLICY "family insert own onboarding_events"
  ON public.onboarding_events FOR INSERT TO authenticated
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "family read own onboarding_events"
  ON public.onboarding_events FOR SELECT TO authenticated
  USING (family_id = get_my_family_id());

CREATE POLICY "admins read onboarding_events"
  ON public.onboarding_events FOR SELECT TO authenticated
  USING (is_admin());

-- MCP-created tables do NOT inherit anon/authenticated grants — grant explicitly.
GRANT SELECT, INSERT ON public.onboarding_events TO authenticated;

CREATE INDEX IF NOT EXISTS idx_onboarding_events_family_time
  ON public.onboarding_events (family_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type
  ON public.onboarding_events (event_type);

-- Seed-vs-real activation tag on the existing table (nullable, no default =>
-- metadata-only change, no table rewrite, existing rows = NULL).
ALTER TABLE public.daily_progress ADD COLUMN IF NOT EXISTS source text;
COMMENT ON COLUMN public.daily_progress.source IS
  'null = normal completion; onboarding_first_task = seed row written during onboarding Step D (excluded from real-activation metric)';
