-- 036_family_is_entitled_rpc.sql
-- Applied via Supabase MCP during pkg/ai-trial-and-referral session (2026-07-01), Phase A.
--
-- Read-only entitlement check for server-side gating (generate-child-insights).
-- Mirrors the DB half of useSubscription's ladder. Deliberately EXCLUDES the
-- expired grace-period branch (copying it would re-open the token leak).
-- Forward-compatible: Phase B populates premium_until on trial start, so trial
-- families pass this check with no change here.
-- service_role only (the edge fn runs as service_role); not client-callable.
--
-- VERIFIED (2026-07-01): entitled family -> true, free family -> false,
-- nonexistent family -> false.
--
-- ROLLBACK: DROP FUNCTION IF EXISTS public.family_is_entitled(uuid);

CREATE OR REPLACE FUNCTION public.family_is_entitled(p_family_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE family_id = p_family_id
      AND role = 'parent'
      AND (
        is_lifetime_access
        OR is_lifetime_founding
        OR (premium_until IS NOT NULL AND premium_until > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.family_is_entitled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.family_is_entitled(uuid) TO service_role;
