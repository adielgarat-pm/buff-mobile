-- 063_lock_admin_insight_functions.sql
--
-- Found 2026-10-10 by the Supabase security advisor run after 062 (Adi: "do
-- what's needed" on Supabase). Three SECURITY DEFINER functions from
-- migrations/031_child_insights.sql were executable by `anon` with no caller
-- check:
--
--   * get_admin_smart_insights() — returned EVERY child's name, family_id, AI
--     insight headline, vote and the parent's free-text `parent_context` to
--     anyone holding the public anon key (no login). Its only legitimate caller
--     is admin-web (SmartInsightFeedback.tsx) with an admin session.
--     → now raises 'not authorized' unless is_admin(), like get_admin_tester_board.
--   * refresh_all_basic_insights() — recomputes every child's insights; meant
--     for the Friday pg_cron job only (runs as the owner, unaffected).
--   * compute_basic_insight(uuid) — per-child stats; only called inside
--     refresh_all_basic_insights (definer context, unaffected).
--     → EXECUTE revoked from PUBLIC, anon, authenticated for both.
--
-- No app (mobile/web) code calls any of the three.

CREATE OR REPLACE FUNCTION public.get_admin_smart_insights()
RETURNS TABLE(child_id uuid, child_name text, family_id uuid, weekly_count integer, week_start date,
              last_headline text, last_generated timestamp with time zone, vote smallint, parent_context text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT
    ci.child_id,
    p.display_name                        AS child_name,
    p.family_id,
    CASE
      WHEN ci.smart_insight_week_start < date_trunc('week', CURRENT_DATE)::date THEN 0
      ELSE ci.smart_insight_weekly_count
    END                                   AS weekly_count,
    ci.smart_insight_week_start           AS week_start,
    ci.smart_insight->>'headline'         AS last_headline,
    ci.computed_at                        AS last_generated,
    sif.explicit_vote                     AS vote,
    ci.parent_context
  FROM public.child_insights ci
  JOIN public.profiles p ON p.id = ci.child_id
  LEFT JOIN LATERAL (
    SELECT f.explicit_vote
    FROM public.smart_insight_feedback f
    WHERE f.child_id = ci.child_id
      AND f.window_end >= date_trunc('week', CURRENT_DATE)::date
    ORDER BY f.created_at DESC
    LIMIT 1
  ) sif ON true
  WHERE ci.smart_insight IS NOT NULL
  ORDER BY ci.computed_at DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_smart_insights() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_smart_insights() TO authenticated;

REVOKE ALL ON FUNCTION public.refresh_all_basic_insights() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_basic_insight(uuid)   FROM PUBLIC, anon, authenticated;
