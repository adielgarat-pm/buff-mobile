-- ============================================================================
-- 006_pause_mode.sql
-- Adds the pause_until column to app_settings for Pause Mode.
-- Generated: 2026-05-12
-- Source SPEC: docs/sessions/pause-mode/SPEC.md §Scope / Schema
-- Source decision: D-2026-05-02-14 ("Pause Mode חוזר ל-MVP")
-- ============================================================================
--
-- Context:
--
-- app_settings.pause_mode_active (boolean, default false) — ALREADY EXISTS
-- from a prior migration. Untouched here.
--
-- This migration adds:
--   pause_until — nullable timestamptz. NULL means "indefinite pause" (only
--                 ends when parent explicitly resumes). A future timestamp
--                 means "auto-resume after this time."
--
-- The hook (useAppSettings) computes isPauseActive as:
--   pause_mode_active = true
--   AND (pause_until IS NULL OR pause_until > now())
--
-- Rollback:
--   ALTER TABLE app_settings DROP COLUMN IF EXISTS pause_until;
-- ============================================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS pause_until timestamptz NULL;

COMMENT ON COLUMN public.app_settings.pause_until IS
  'When NULL and pause_mode_active=true, pause is indefinite (until parent resumes). When a future timestamp, pause auto-ends at that time. Read together with pause_mode_active in useAppSettings hook. See docs/sessions/pause-mode/SPEC.md.';

-- Reaffirm the comment on the existing column so both fields tell the story.
COMMENT ON COLUMN public.app_settings.pause_mode_active IS
  'True when the family has paused BUFF. Read together with pause_until to determine if the pause is still active (pause_until IS NULL OR pause_until > now()). See docs/sessions/pause-mode/SPEC.md.';
