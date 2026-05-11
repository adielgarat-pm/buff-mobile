-- ============================================================================
-- 005_grant_service_role_usage.sql
-- Restore the missing USAGE grant on schema public for service_role.
-- Generated: 2026-05-11
-- ============================================================================
--
-- Investigation 2026-05-11 (during Phase 2 webhook E2E testing) found that
-- service_role did NOT have USAGE on schema public on this project, while
-- anon and authenticated did. This is non-default — Supabase's normal setup
-- grants service_role USAGE on public. It appears something explicitly
-- revoked it on this project at some point in the past (unknown when/why).
--
-- The missing USAGE caused all service-role RPC calls to fail with:
--   "permission denied for schema public" (code 42501)
-- — even though EXECUTE on the function was correctly granted.
--
-- The rc-webhook edge function authenticates to PostgREST using the
-- service_role key, so this affected EVERY RPC the webhook tried to make.
-- The fix is a one-line GRANT.
--
-- This migration is idempotent (GRANT is a no-op if already granted).
-- ============================================================================

GRANT USAGE ON SCHEMA public TO service_role;

-- Verification query (informational — not part of the migration logic):
--   SELECT has_schema_privilege('service_role', 'public', 'USAGE');
-- Expected: true
