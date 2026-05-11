-- ============================================================================
-- 004_founding_count_rpc.sql
-- Public RPC for the live sale counter on FoundingHundredScreen.
-- Generated: 2026-05-11
-- Source SPEC: docs/sessions/founding-100-payment/SPEC.md §Phases / Phase 3
-- ============================================================================
--
-- Why: the FoundingHundredScreen shows "X / 100 spots claimed" live. A direct
-- SELECT COUNT(*) FROM profiles is blocked by RLS for anon/authenticated
-- callers (they can only see their own row + family rows). This SECURITY
-- DEFINER function bypasses RLS to return a count that contains no PII —
-- only a single integer.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_founding_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM profiles
  WHERE is_lifetime_founding = true;
$$;

REVOKE ALL ON FUNCTION public.get_founding_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_founding_count() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_founding_count() IS
  'Returns the count of users with is_lifetime_founding = true. Public — no PII. Used by FoundingHundredScreen for the live spots counter.';
