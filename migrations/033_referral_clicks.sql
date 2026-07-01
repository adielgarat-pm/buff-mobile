-- Referral click tracking
-- Applied via Supabase MCP during pkg/referral-share-and-tracking session (2026-07-01)
--
-- Records every hit on buffadhd.com/join?ref=CODE so the admin funnel can show
-- clicks (not only redemptions). Inserts happen via the track-referral-click
-- edge function using the service role key (bypasses RLS), so there is
-- intentionally NO public INSERT policy.

CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        text        NOT NULL,
  clicked_at  timestamptz NOT NULL DEFAULT now(),
  user_agent  text
);

CREATE INDEX IF NOT EXISTS referral_clicks_code_idx        ON public.referral_clicks (code);
CREATE INDEX IF NOT EXISTS referral_clicks_clicked_at_idx  ON public.referral_clicks (clicked_at DESC);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Admin dashboard reads (via authenticated role + RLS, matching every other table)
DROP POLICY IF EXISTS "Admins can read referral_clicks" ON public.referral_clicks;
CREATE POLICY "Admins can read referral_clicks"
  ON public.referral_clicks FOR SELECT
  USING (is_admin());

-- MCP-created tables don't inherit grants — grant explicitly (RLS still gates rows)
GRANT SELECT ON public.referral_clicks TO authenticated;

-- The referrals table had only a "parent reads own family rows" policy, so the
-- admin funnel couldn't read it. Add an admin SELECT policy (grant already exists).
DROP POLICY IF EXISTS "Admins can read referrals" ON public.referrals;
CREATE POLICY "Admins can read referrals"
  ON public.referrals FOR SELECT
  USING (is_admin());
