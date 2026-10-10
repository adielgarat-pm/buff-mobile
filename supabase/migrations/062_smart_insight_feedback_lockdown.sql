-- 062_smart_insight_feedback_lockdown.sql
--
-- Approved by Adi 2026-10-10 (architect/UX/PM review of the c717 follow-ups).
--
-- smart_insight_feedback (table + policies were created outside this repo):
--   * Parents' own-vote reads 403'd on every dashboard load: `authenticated` had
--     INSERT/UPDATE but no SELECT grant (src/hooks/useSmartInsights.ts). The
--     vote saved but never showed as selected after a reload.
--   * The only SELECT policy was `service_read_all USING (true) TO public` —
--     dormant only because of the missing grant. Granting SELECT to fix the 403
--     would have exposed every family's feedback to every user.
--   * Writes go through record_insight_vote (below) and the edge function's
--     service-role client, so the direct INSERT/UPDATE grants + policies are
--     unused attack surface.
--
-- record_insight_vote (both overloads): SECURITY DEFINER, executable by anon,
-- no caller check, no pinned search_path — anyone with the anon key could
-- write/overwrite a vote for any child id (the 5-arg overload even took an
-- arbitrary family_id). The app only ever called the 4-arg overload (git
-- history), so the 5-arg one is dropped and the 4-arg one now requires the
-- caller to be a parent in the child's family.
--
-- Backward compatible: old builds call the same 4-arg RPC; their reads stop 403ing.

-- ── smart_insight_feedback ────────────────────────────────────────────────
DROP POLICY IF EXISTS service_read_all       ON public.smart_insight_feedback;
DROP POLICY IF EXISTS family_feedback_insert ON public.smart_insight_feedback;
DROP POLICY IF EXISTS family_feedback_update ON public.smart_insight_feedback;

-- Policy first, grant second (same transaction): there is never a moment where
-- SELECT is granted without a scoping policy.
CREATE POLICY parents_read_family_feedback ON public.smart_insight_feedback
  FOR SELECT TO authenticated
  USING (family_id = public.get_my_family_id() AND public.is_family_parent());

REVOKE ALL ON public.smart_insight_feedback FROM anon, authenticated;
GRANT SELECT ON public.smart_insight_feedback TO authenticated;

-- ── record_insight_vote ───────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.record_insight_vote(uuid, uuid, text, date, smallint);

CREATE OR REPLACE FUNCTION public.record_insight_vote(
  p_child_id uuid, p_hash text, p_window_end date, p_vote smallint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_family_id uuid;
BEGIN
  SELECT c.family_id INTO v_family_id
    FROM public.profiles c
   WHERE c.id = p_child_id AND c.role = 'child';
  IF v_family_id IS NULL THEN RETURN; END IF;

  -- Caller must be a parent in the child's family. Silent no-op otherwise,
  -- matching the old "unknown child" behaviour (the client ignores the result).
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.user_id = auth.uid() AND p.role = 'parent' AND p.family_id = v_family_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.smart_insight_feedback
    (child_id, family_id, insight_hash, window_end, explicit_vote)
  VALUES
    (p_child_id, v_family_id, p_hash, p_window_end, p_vote)
  ON CONFLICT (child_id, window_end) DO UPDATE SET
    explicit_vote = EXCLUDED.explicit_vote,
    insight_hash  = EXCLUDED.insight_hash;
END;
$$;

REVOKE ALL ON FUNCTION public.record_insight_vote(uuid, text, date, smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_insight_vote(uuid, text, date, smallint) TO authenticated;
