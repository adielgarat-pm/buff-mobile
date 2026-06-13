-- ============================================================
-- BUFF Mobile — Activities: table grants fix
-- File: migrations/028_activities_grants.sql
-- Session: pkg/activities-and-camp-lists (Hat-3 testing fix)
-- Date: 2026-06-13
-- Bug found in Hat-3: "permission denied for table activities" — tables created
-- via MCP apply_migration don't inherit Supabase's default role grants, so the
-- authenticated/anon roles had no table privileges (RLS still gates rows).
-- Mirrors the grants timetables already has. Also folded into 026 for fresh DBs.
-- Idempotent.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;
