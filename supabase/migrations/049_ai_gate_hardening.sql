-- ============================================================================
-- 049_ai_gate_hardening.sql — close the RPC/RLS side doors around the AI gates
--
-- Approved by Adi 2026-07-29 (parent-surface panel finding + Fable review).
-- Companion to the edge-function change that removed the client-supplied
-- platform bypass (supersedes D-2026-07-04-01). Four independent fixes:
--
--   1. upsert_smart_insight was EXECUTE-granted to authenticated/PUBLIC with no
--      membership check — any logged-in user could write arbitrary insight
--      jsonb into ANY child's row cross-family (content injection shown to
--      another family's parent) and inflate the weekly counter to lock a
--      paying family out of their limit. Only the service-role edge function
--      ever calls it → revoke client access entirely.
--
--   2. get_smart_insight_state leaked smart_insight + parent_context (a
--      parent's free text about their own child — sensitive) for ANY child
--      UUID. The client legitimately needs this RPC → keep the grant, add a
--      caller-family membership check inside.
--
--   3. capture_runs RLS was FOR ALL for family parents — a parent could DELETE
--      their own rows, resetting both the 3-free-runs taste counter and the
--      30/day cap forever (both are count(capture_runs) in parse-capture).
--      Rows are written by the service role; the client needs at most SELECT.
--
--   4. schedule_parse_runs — new run log for parse-schedule's per-family daily
--      rate limit (that function previously had NO auth and NO cap: verify_jwt
--      passes for the public anon key, giving strangers unlimited
--      Sonnet-vision calls). Service-role only; no client policies.
--
-- IMPACT ON EXISTING USERS: none in the app. The app reads child_insights via
-- table SELECT + this RPC and never calls upsert_smart_insight or writes
-- capture_runs directly; all writes flow through service-role edge functions.
--
-- ROLLBACK:
--   GRANT EXECUTE ON FUNCTION public.upsert_smart_insight(uuid,jsonb,text,date) TO authenticated;
--   (get_smart_insight_state: recreate from 048)
--   DROP POLICY capture_runs_family_parent_select ON public.capture_runs;
--   CREATE POLICY capture_runs_family_parent ON public.capture_runs FOR ALL ... (see 047);
--   DROP TABLE public.schedule_parse_runs;
-- ============================================================================

-- ── 1. upsert_smart_insight: service-role only ──────────────────────────────
REVOKE ALL ON FUNCTION public.upsert_smart_insight(uuid, jsonb, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_smart_insight(uuid, jsonb, text, date) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_smart_insight(uuid, jsonb, text, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_smart_insight(uuid, jsonb, text, date) TO service_role;

-- ── 2. get_smart_insight_state: caller must share the child's family ────────
-- Same signature as 048 (trailing total_count column) — CREATE OR REPLACE is
-- fine here, only the body changes. Caller matching covers both profile
-- shapes in the wild: parents whose profile PK is auth.uid() and profiles
-- linked via user_id (own-device children / co-parents).
CREATE OR REPLACE FUNCTION public.get_smart_insight_state(p_child_id uuid)
 RETURNS TABLE(smart_insight jsonb, parent_context text, weekly_count integer,
               week_start date, computed_at timestamp with time zone,
               total_count integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT
    ci.smart_insight,
    ci.parent_context,
    CASE
      WHEN ci.smart_insight_week_start < date_trunc('week', CURRENT_DATE)::date THEN 0
      ELSE ci.smart_insight_weekly_count
    END AS weekly_count,
    ci.smart_insight_week_start,
    ci.computed_at,
    COALESCE(ci.smart_insight_total_count, 0) AS total_count
  FROM public.child_insights ci
  WHERE ci.child_id = p_child_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles child_p
      JOIN public.profiles caller_p
        ON caller_p.family_id = child_p.family_id
      WHERE child_p.id = p_child_id
        AND (caller_p.user_id = auth.uid() OR caller_p.id = auth.uid())
    );
$function$;

REVOKE ALL ON FUNCTION public.get_smart_insight_state(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_smart_insight_state(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_smart_insight_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_smart_insight_state(uuid) TO service_role;

-- ── 3. capture_runs: clients read, only the service role writes ─────────────
DROP POLICY IF EXISTS capture_runs_family_parent ON public.capture_runs;
CREATE POLICY capture_runs_family_parent_select ON public.capture_runs
  FOR SELECT
  USING (
    family_id IN (
      SELECT p.family_id FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'parent'
    )
  );

-- ── 4. schedule_parse_runs: run log for parse-schedule's daily cap ──────────
CREATE TABLE IF NOT EXISTS public.schedule_parse_runs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  mode       text,                    -- 'image' | 'text' | 'excel' (telemetry)
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.schedule_parse_runs IS
  'One row per parse-schedule edge-function run. Powers the per-family daily '
  'rate limit (DAILY_SCHEDULE_PARSE_CAP). Service-role writes only.';

CREATE INDEX IF NOT EXISTS schedule_parse_runs_family_day_idx
  ON public.schedule_parse_runs (family_id, created_at);

-- RLS on, NO client policies: only the service role (which bypasses RLS)
-- touches this table. MCP-created tables do not inherit anon/authenticated
-- grants (reference_mcp_table_grants) — here that is exactly what we want,
-- and we revoke defensively in case default privileges say otherwise.
ALTER TABLE public.schedule_parse_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schedule_parse_runs FROM anon, authenticated;
GRANT ALL ON TABLE public.schedule_parse_runs TO service_role;
