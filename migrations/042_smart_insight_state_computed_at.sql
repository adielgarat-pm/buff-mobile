-- 042: dashboard-ai-insight Phase 0 — expose computed_at in get_smart_insight_state
-- so the client can show "valid as of {date}" on the insight card.
-- Additive output column — existing clients read named fields and are unaffected.
-- DROP required because CREATE OR REPLACE cannot change a function's OUT parameters.
-- Applied to prod via MCP apply_migration on 2026-07-14.

DROP FUNCTION IF EXISTS public.get_smart_insight_state(uuid);

CREATE FUNCTION public.get_smart_insight_state(p_child_id uuid)
 RETURNS TABLE(smart_insight jsonb, parent_context text, weekly_count integer, week_start date, computed_at timestamptz)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT
    ci.smart_insight,
    ci.parent_context,
    CASE
      WHEN ci.smart_insight_week_start < date_trunc('week', CURRENT_DATE)::date THEN 0
      ELSE ci.smart_insight_weekly_count
    END AS weekly_count,
    ci.smart_insight_week_start,
    ci.computed_at
  FROM public.child_insights ci
  WHERE ci.child_id = p_child_id;
$function$;

GRANT EXECUTE ON FUNCTION public.get_smart_insight_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_smart_insight_state(uuid) TO anon;
