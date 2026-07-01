-- Admin referral funnel RPC
-- Applied via Supabase MCP during pkg/referral-share-and-tracking session (2026-07-01)
--
-- One row per referral code with referrer family, click count, and redemption
-- status. SECURITY DEFINER so it can join families/clicks; the is_admin() guard
-- in the WHERE clause returns zero rows to non-admins.

CREATE OR REPLACE FUNCTION public.admin_referral_funnel()
RETURNS TABLE (
  code            text,
  status          text,
  created_at      timestamptz,
  completed_at    timestamptz,
  referrer_family text,
  referred_family text,
  clicks          bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.code,
    r.status,
    r.created_at,
    r.completed_at,
    rf.name  AS referrer_family,
    df.name  AS referred_family,
    COALESCE(c.clicks, 0) AS clicks
  FROM referrals r
  LEFT JOIN families rf ON rf.id = r.referrer_family_id
  LEFT JOIN families df ON df.id = r.referred_family_id
  LEFT JOIN (
    SELECT code, count(*) AS clicks
    FROM referral_clicks
    GROUP BY code
  ) c ON c.code = r.code
  WHERE is_admin()
  ORDER BY r.created_at DESC;
$$;

-- Defense-in-depth: this function returns family names, so restrict EXECUTE to
-- authenticated only (the is_admin() guard already gates rows either way).
REVOKE EXECUTE ON FUNCTION public.admin_referral_funnel() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_referral_funnel() TO authenticated;
