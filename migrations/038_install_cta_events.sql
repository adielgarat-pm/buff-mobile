-- 038_install_cta_events.sql
--
-- Web-to-native install CTA — funnel telemetry (SPEC §4.4, Phase 2).
-- docs/sessions/web-to-native-cta/SPEC.md
--
-- Fire-and-forget events (impression/click/dismiss/open_installed) written by the
-- `track-install-cta` edge function under the service role, read admin-only. This
-- is the ONLY reliable android-mobile-web signup signal (families.platform stores
-- only coarse 'web' and is signup-only).
--
-- New objects only — NO change to existing tables/policies → zero impact on
-- existing users or queries.

CREATE TABLE IF NOT EXISTS public.install_cta_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cta_id      uuid NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('impression','click','dismiss','open_installed')),
  placement   text,
  target      text,
  user_id     uuid,
  family_id   uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_agent  text
);

CREATE INDEX IF NOT EXISTS install_cta_events_cta_idx    ON public.install_cta_events (cta_id);
CREATE INDEX IF NOT EXISTS install_cta_events_family_idx ON public.install_cta_events (family_id);
CREATE INDEX IF NOT EXISTS install_cta_events_time_idx   ON public.install_cta_events (occurred_at);

ALTER TABLE public.install_cta_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read (mirrors admin_referral_funnel / get_admin_tester_board).
DROP POLICY IF EXISTS "Admins read install_cta_events" ON public.install_cta_events;
CREATE POLICY "Admins read install_cta_events"
  ON public.install_cta_events FOR SELECT
  USING (public.is_admin(auth.uid()));

-- MCP-created tables don't inherit default grants — grant explicitly.
GRANT SELECT ON public.install_cta_events TO authenticated;
GRANT INSERT, SELECT ON public.install_cta_events TO service_role;
