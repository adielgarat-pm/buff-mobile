-- ============================================================================
-- 026_family_platform_backfill.sql
-- Backfill families.platform (from migration 021) for the pre-instrumentation
-- cohort, on app-open instead of only at signup.
-- Generated: 2026-06-10
-- Applied to mobile Supabase (gfrongfnyigxsexuofrg) via MCP migration
-- `reconcile_platform_to_families`.
-- ============================================================================
--
-- Context:
--
-- families.platform (021) is captured once, at signup (Platform.OS at the two
-- parent-signup insert sites). That tags only NEW families — every family
-- created before 2026-06-08 stays NULL forever, so the admin Tester Board's
-- platform column would be empty for the entire existing tester cohort.
--
-- This RPC lets an authenticated session backfill its own family's platform
-- ONCE, the next time the app opens. Called from src/lib/pushTokens.ts
-- (backfillFamilyPlatform) in the usePushRegistration mount effect.
--
-- Idempotent + safe: writes ONLY when families.platform IS NULL, so it never
-- overwrites the real signup-source value, and is a no-op once set. The value
-- is guarded against the families.platform CHECK (android|ios|web).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.backfill_family_platform(
  p_profile_id uuid,
  p_platform text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_platform IS NULL OR p_platform NOT IN ('android', 'ios', 'web') THEN
    RETURN;
  END IF;

  UPDATE public.families f
     SET platform = p_platform
   WHERE f.id = (SELECT pr.family_id FROM public.profiles pr WHERE pr.id = p_profile_id)
     AND f.platform IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.backfill_family_platform(uuid, text) TO authenticated;
