-- ============================================================================
-- 021_family_platform_field.sql
-- Adds families.platform: the device platform captured at family creation
-- (android | ios | web), for funnel / retention segmentation by platform.
-- Generated: 2026-06-08
-- Source SPEC:     none (funnel instrumentation — founder ask, see
--                  C:\Users\adiel\.claude\plans\hidden-splashing-sunrise.md
--                  "Retention instrumentation → Source dimension")
-- ============================================================================
--
-- Context:
--
-- We want to segment retention/funnel by the platform a family signed up on
-- (Android / iPhone / web). The app already knows this for free via
-- Platform.OS at signup — no attribution SDK needed. This column is the cheap,
-- zero-friction layer of the "where did they come from" funnel.
--
-- Captured from Platform.OS at the two parent-signup insert sites:
--   - src/contexts/AuthContext.tsx        (email/password signUp)
--   - src/screens/auth/AuthCallbackScreen.tsx (Google OAuth createProfile)
--
-- Nullable, no default: existing rows stay NULL, which honestly means
-- "created before this instrumentation (2026-06-08)" rather than mislabelling
-- them. Only families created after deploy carry a real platform value.
-- ============================================================================

alter table public.families
  add column if not exists platform text
  check (platform is null or platform in ('android', 'ios', 'web'));

comment on column public.families.platform is
  'Device platform at family creation (android|ios|web), from Platform.OS. '
  'NULL = created before instrumentation (migration 021, 2026-06-08).';
