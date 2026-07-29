-- ============================================================================
-- 048_ai_taste_gate.sql — "first insight free per child"
--
-- Red team 2026-07-28, finding F1: the AI coach only ever generates for an
-- already-entitled family (useAutoCoachInsight + generate-child-insights both
-- gate on entitlement unless platform='web'). 33 of the 35 entitled families got
-- entitlement as a GRANT and only 2 pay — so the most differentiated thing in the
-- product is shown almost exclusively to people who will never pay, and is
-- invisible to the ~195 families who are the entire conversion pool. Nobody pays
-- for a capability they have never felt.
--
-- The fix needs a durable "has this child ever had an insight?" counter.
-- smart_insight_weekly_count cannot answer it: it resets every week by design.
--
-- IMPACT ON EXISTING USERS: additive, NOT NULL with a default, on a 3-row table.
-- No client reads or writes this column until the paired app change ships, and
-- old builds in the field are unaffected (they never select it). The backfill
-- below sets the counter to 1 for children who ALREADY have a generated insight,
-- so nobody is handed a "free first insight" they have in fact already used.
-- ============================================================================

ALTER TABLE public.child_insights
  ADD COLUMN IF NOT EXISTS smart_insight_total_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.child_insights.smart_insight_total_count IS
  'Lifetime count of smart insights generated for this child. Never resets '
  '(unlike smart_insight_weekly_count). Powers the free-taste gate: the first '
  'FREE_INSIGHTS_PER_CHILD are generated regardless of entitlement.';

-- Children who already have an insight have already had their taste.
UPDATE public.child_insights
   SET smart_insight_total_count = 1
 WHERE smart_insight IS NOT NULL
   AND smart_insight_total_count = 0;

-- ── upsert_smart_insight — also advance the lifetime counter ────────────────
-- Unchanged except for the new column: weekly count still resets on a new week,
-- the lifetime count only ever grows.
CREATE OR REPLACE FUNCTION public.upsert_smart_insight(
  p_child_id uuid, p_smart_insight jsonb, p_parent_context text, p_window_end date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_week_start    date    := date_trunc('week', CURRENT_DATE)::date;
  v_current_count integer := 0;
BEGIN
  INSERT INTO public.child_insights
    (child_id, weekly, tier, smart_insight, parent_context, window_end, computed_at,
     smart_insight_weekly_count, smart_insight_week_start, smart_insight_total_count)
  VALUES
    (p_child_id, '{}'::jsonb, 'smart', p_smart_insight, p_parent_context, p_window_end, NOW(),
     1, v_week_start, 1)
  ON CONFLICT (child_id) DO UPDATE SET
    tier                        = 'smart',
    smart_insight               = EXCLUDED.smart_insight,
    parent_context              = EXCLUDED.parent_context,
    window_end                  = EXCLUDED.window_end,
    computed_at                 = EXCLUDED.computed_at,
    smart_insight_weekly_count  = CASE
      WHEN child_insights.smart_insight_week_start < v_week_start THEN 1
      ELSE child_insights.smart_insight_weekly_count + 1
    END,
    smart_insight_week_start    = v_week_start,
    smart_insight_total_count   = COALESCE(child_insights.smart_insight_total_count, 0) + 1
  RETURNING smart_insight_weekly_count INTO v_current_count;

  RETURN v_current_count;
END;
$function$;

-- ── get_smart_insight_state — expose the lifetime counter to the client ─────
-- The client needs it to decide whether a free taste is still available before
-- it spends a call. Appended as a new TRAILING column: supabase-js reads the row
-- by name, so builds already in the field keep working unchanged.
--
-- DROP + CREATE, not CREATE OR REPLACE: Postgres refuses to replace a function
-- whose RETURNS TABLE signature changed. The migration is one transaction, so
-- there is no window where the RPC is missing.
DROP FUNCTION IF EXISTS public.get_smart_insight_state(uuid);

CREATE FUNCTION public.get_smart_insight_state(p_child_id uuid)
 RETURNS TABLE(smart_insight jsonb, parent_context text, weekly_count integer,
               week_start date, computed_at timestamp with time zone,
               total_count integer)
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
    ci.computed_at,
    COALESCE(ci.smart_insight_total_count, 0) AS total_count
  FROM public.child_insights ci
  WHERE ci.child_id = p_child_id;
$function$;

-- Re-grant: DROP took the old privileges with it.
GRANT EXECUTE ON FUNCTION public.get_smart_insight_state(uuid) TO authenticated;
