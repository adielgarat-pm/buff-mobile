-- 038_DRAFT_referral_activation_grant.sql
-- ⚠️ DRAFT — NOT APPLIED to the live DB. Review + apply by Adi after reconciling
--    with the in-flight pkg/referral-share-and-tracking branch (which touches the
--    same referral surfaces). Phase C of pkg/ai-trial-and-referral.
--
-- GOAL (Adi's locked model):
--   * +7 premium days to the REFERRER when the invited friend's child ACTIVATES
--     (not at code redemption). Referred family gets only the standard 14-day trial
--     (via the Phase B activation trigger) — no referral bonus.
--   * Cap: 7 granted days per REFERRER per calendar month (Asia/Jerusalem). No
--     lifetime cap, no rollover.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠️ BLOCKER TO RESOLVE BEFORE APPLYING — multi-referral schema.
-- The CURRENT schema (032) supports only ONE successful referral per referrer:
-- get_or_create_referral_code returns one 'pending' row per referrer, and
-- redeem_referral flips THAT row to 'completed'. A 2nd friend redeeming the same
-- code finds no pending row → 'invalid_or_used_code'. That contradicts "+7 per
-- friend". Fix (coordinate with referral-share branch): make the referrer code
-- REUSABLE — e.g. a permanent code per family (families.referral_code or a
-- referral_codes table), and one referrals row per REDEMPTION (not per code).
-- The functions below assume that reusable-code model (one referrals row per
-- referred family, referrer identified by referrer_family_id).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ledger columns on referrals (source of truth for the monthly cap — do NOT
--    derive from row counts; grants can be partial when near the cap).
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS days_granted  int         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS granted_at    timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS granted_month date        DEFAULT NULL;

-- 2. redeem_referral — LINK only (no immediate grant). Sets referred_family_id so
--    the activation path can later pay the referrer. Referred family's own trial
--    comes from the Phase B activation trigger, so nothing is granted here.
--    (Self-referral + one-redemption-per-referred-family guards kept.)
CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text)
  RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_referrer_family uuid;
  v_caller_family   uuid;
BEGIN
  SELECT family_id INTO v_caller_family
  FROM profiles WHERE user_id = auth.uid() AND role = 'parent' LIMIT 1;
  IF v_caller_family IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_parent_profile');
  END IF;

  -- Resolve referrer by (reusable) code. NOTE: depends on the reusable-code model
  -- above — adjust this lookup to wherever the permanent code lives.
  SELECT referrer_family_id INTO v_referrer_family
  FROM referrals WHERE code = upper(trim(p_code)) LIMIT 1;
  IF v_referrer_family IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;
  IF v_referrer_family = v_caller_family THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_family_id = v_caller_family) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_redeemed');
  END IF;

  INSERT INTO referrals (referrer_family_id, referred_family_id, code, status, created_at)
  VALUES (v_referrer_family, v_caller_family, upper(trim(p_code)), 'linked', now());

  RETURN jsonb_build_object('success', true);
END; $$;

-- 3. Referrer grant on referred-family activation. Called from the activation
--    trigger (see §4). Monthly cap 7 days (Asia/Jerusalem), advisory-locked,
--    idempotent (granted_at guard).
CREATE OR REPLACE FUNCTION public.grant_referrer_on_activation(p_referred_family uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_ref       public.referrals%ROWTYPE;
  v_month     date := (now() AT TIME ZONE 'Asia/Jerusalem')::date;
  v_granted   int;
  v_add       int;
BEGIN
  SELECT * INTO v_ref FROM public.referrals
  WHERE referred_family_id = p_referred_family AND granted_at IS NULL
  LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  -- Serialize per referrer so simultaneous activations can't breach the cap.
  PERFORM pg_advisory_xact_lock(hashtext(v_ref.referrer_family_id::text));

  SELECT COALESCE(SUM(days_granted), 0) INTO v_granted
  FROM public.referrals
  WHERE referrer_family_id = v_ref.referrer_family_id
    AND granted_month = date_trunc('month', v_month)::date;

  v_add := LEAST(7, GREATEST(0, 7 - v_granted));

  UPDATE public.referrals
  SET status = 'completed', completed_at = now(),
      days_granted = v_add, granted_at = now(),
      granted_month = date_trunc('month', v_month)::date
  WHERE id = v_ref.id;

  IF v_add > 0 THEN
    UPDATE public.profiles
    SET premium_until = GREATEST(COALESCE(premium_until, now()), now()) + (v_add || ' days')::interval
    WHERE family_id = v_ref.referrer_family_id AND role = 'parent';
  END IF;
END; $$;

-- 4. Extend the Phase B activation trigger function to ALSO pay the referrer when
--    THIS family (the referred one) activates. Add one line before RETURN NEW in
--    start_trial_on_activation(), inside the same fail-safe body:
--        PERFORM public.grant_referrer_on_activation(NEW.family_id);
--    (Kept here as a note so the trigger rewrite is reviewed as one unit.)
