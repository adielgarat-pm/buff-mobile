-- Migration 012: FCM push foundation
--
-- pkg/fcm-push-notifications Phase 1.
--
-- DB layer foundation for cross-platform FCM push (Android now, Expo Web
-- Phase 2, iOS later). No client code changes here; no Edge Function
-- dispatch yet — that lands in Phase 3.
--
-- Per locked decisions in INTEGRATION_LEARNINGS.md IN-2026-05-19-01/02/03:
--   * FCM HTTP v1 = single cross-platform backend (token_type tag routes
--     to the correct FCM payload format in the Edge Function)
--   * Activity-based suppression (last_seen_at < 5 min skips push) requires
--     last_seen_at on profiles, updated by client on every app foreground
--   * "No new column writes on public.notifications" → idempotency lives in
--     a separate notification_pushes table (PK = notification_id)
--
-- This migration is idempotent (CREATE/ALTER IF NOT EXISTS, ON CONFLICT
-- DO NOTHING, DROP COLUMN IF EXISTS). Re-running is a no-op.
--
-- Pre-migration verification (Supabase MCP, 2026-05-19):
--   * 0 non-null profiles.fcm_token rows (across 275 profiles) → drop is safe
--   * pg_cron 1.6.4 installed (Phase 7 dependency confirmed)
--   * Trigger function handle_parent_sos_sent() active (Vibe Check Phase 4a)
--
-- Applied to live project gfrongfnyigxsexuofrg on 2026-05-19.

-- =================================================================
-- 1. profiles.last_seen_at
--    Source of truth for activity-based suppression + E5/E6 engagement
--    scheduler. Updated by client on every app foreground.
-- =================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.profiles.last_seen_at IS
  'Updated by client on every app foreground. Source of truth for activity-based push suppression (Edge Function skips FCM call if last_seen_at < 5 min) and engagement scheduler (>5 days triggers E5/E6 reminders). See docs/sessions/fcm-push-notifications/SPEC.md.';

-- =================================================================
-- 2. device_tokens — multi-device, multi-platform push token store
--    Replaces the single profiles.fcm_token column.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  token_type      TEXT NOT NULL CHECK (token_type IN ('fcm-android', 'fcm-ios', 'fcm-web')),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_profile_type
  ON public.device_tokens (profile_id, token_type);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS: owner-only via profiles.user_id = auth.uid().
-- Edge Function uses service role and bypasses these.
-- Kid registration flow (Phase 6) uses a SECURITY DEFINER helper function
-- if direct RLS auth.uid() check turns out to be insufficient for ChildJoin
-- sessions — Phase 6 plan reviews this.

DROP POLICY IF EXISTS "device_tokens_owner_select" ON public.device_tokens;
DROP POLICY IF EXISTS "device_tokens_owner_insert" ON public.device_tokens;
DROP POLICY IF EXISTS "device_tokens_owner_update" ON public.device_tokens;
DROP POLICY IF EXISTS "device_tokens_owner_delete" ON public.device_tokens;

CREATE POLICY "device_tokens_owner_select" ON public.device_tokens
  FOR SELECT
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "device_tokens_owner_insert" ON public.device_tokens
  FOR INSERT
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "device_tokens_owner_update" ON public.device_tokens
  FOR UPDATE
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "device_tokens_owner_delete" ON public.device_tokens
  FOR DELETE
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

COMMENT ON TABLE public.device_tokens IS
  'FCM/APNs/Web push tokens for cross-platform push delivery. One row per device per profile (token UNIQUE). Owner-only RLS via profiles.user_id = auth.uid(). Edge Function reads via service role for fan-out. Replaces legacy profiles.fcm_token column (dropped in this migration).';

-- =================================================================
-- 3. notification_pushes — idempotency guard + audit log
--    PK = notification_id ensures webhook retries are no-op.
--    suppressed_reason = NULL means a push was actually sent.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.notification_pushes (
  notification_id         UUID PRIMARY KEY REFERENCES public.notifications(id) ON DELETE CASCADE,
  pushed_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_token_count   INT NOT NULL DEFAULT 0,
  suppressed_reason       TEXT
);

ALTER TABLE public.notification_pushes ENABLE ROW LEVEL SECURITY;

-- No public policies — Edge Function uses service role to read/write this.

COMMENT ON TABLE public.notification_pushes IS
  'Idempotency guard + audit log for push-notification-fanout Edge Function. PK = notification_id; Edge Function inserts on dispatch attempt; webhook re-fire produces PK conflict (no-op). suppressed_reason values: NULL (pushed), recent_activity, no_tokens, permission_denied, fcm_error.';

-- =================================================================
-- 4. notifications — idempotent repo capture (no-op on prod)
--    The live DB has this table but no repo migration captured it.
--    Capturing now so a fresh `supabase db reset` reproduces production.
--    On prod, this is a no-op (CREATE TABLE IF NOT EXISTS).
--    Existing RLS policies in prod are NOT captured here — a known gap;
--    future cleanup migration can extract them via pg_policies.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id),
  parent_id       UUID NOT NULL REFERENCES public.profiles(id),
  type            TEXT NOT NULL DEFAULT 'reward_redeemed',
  child_id        UUID REFERENCES public.profiles(id),
  child_name      TEXT NOT NULL DEFAULT '',
  entity_id       UUID,
  entity_name     TEXT NOT NULL DEFAULT '',
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS already enabled in prod (verified via Supabase MCP). CREATE TABLE
-- IF NOT EXISTS is a no-op there. For fresh DB resets, RLS will be off
-- after this migration runs — future cleanup migration captures policies.

-- =================================================================
-- 5. Backfill profiles.fcm_token → device_tokens (defensive)
--    Verified 0 non-null rows before migration; this is expected to be
--    a no-op. Defensive against any future code path that might have
--    populated it between SPEC drafting and migration apply.
-- =================================================================

INSERT INTO public.device_tokens (profile_id, token, token_type)
SELECT id, fcm_token, 'fcm-android'
FROM public.profiles
WHERE fcm_token IS NOT NULL
ON CONFLICT (token) DO NOTHING;

-- =================================================================
-- 6. Drop profiles.fcm_token
--    Replaced by the device_tokens table (multi-device support, type tag).
-- =================================================================

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS fcm_token;
