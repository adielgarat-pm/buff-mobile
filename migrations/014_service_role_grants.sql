-- Migration 014: service_role full access to public schema
--
-- pkg/fcm-push-notifications Phase 3 troubleshooting (2026-05-20).
--
-- Root cause discovered during Edge Function E2E:
--   The buff-mobile Supabase project (gfrongfnyigxsexuofrg) had service_role
--   WITHOUT grants on most tables in `public`. Default Supabase setup gives
--   service_role full access, but this project (originally provisioned via
--   Lovable) was missing the default privilege chain.
--
-- Symptom: Edge Function calls via supabase-js with the service_role key
-- returned `permission denied for table {profiles | notifications | tasks |
-- daily_progress | buddy_relationships | child_vibes | ...}`.
--
-- Fix: blanket GRANT ALL on existing tables/sequences/functions + ALTER
-- DEFAULT PRIVILEGES so future tables created in `public` automatically
-- grant to service_role.
--
-- Migration 005 (grant_service_role_usage.sql) covered `usage` on schema
-- but did NOT cover table-level grants on existing tables. This migration
-- completes that work.
--
-- Applied to live project gfrongfnyigxsexuofrg on 2026-05-20.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;
