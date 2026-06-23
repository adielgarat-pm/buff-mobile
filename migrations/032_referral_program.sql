-- Referral program: bilateral 14-day premium grant
-- Applied via Supabase MCP during pkg/referral-program session (2026-06-23)

-- 1. Time-boxed premium column (referrals, trials)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_until timestamptz DEFAULT NULL;

-- 2. pgcrypto for random code generation
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 3. Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_family_id  uuid        NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  referred_family_id  uuid        REFERENCES public.families(id) ON DELETE SET NULL,
  code                text        NOT NULL UNIQUE,
  status              text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);

-- One pending code per referrer family
CREATE UNIQUE INDEX IF NOT EXISTS referrals_referrer_pending_idx
  ON public.referrals (referrer_family_id)
  WHERE status = 'pending';

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals: parent reads own family rows"
  ON public.referrals FOR SELECT
  USING (
    referrer_family_id IN (
      SELECT family_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

GRANT SELECT ON public.referrals TO authenticated;
GRANT INSERT, UPDATE ON public.referrals TO authenticated;

-- 4. get_or_create_referral_code RPC
-- search_path includes extensions so gen_random_bytes is found
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_family_id  uuid;
  v_code       text;
  v_exists     referrals%ROWTYPE;
  v_attempt    int := 0;
BEGIN
  SELECT family_id INTO v_family_id
  FROM profiles
  WHERE user_id = auth.uid() AND role = 'parent'
  LIMIT 1;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_parent_profile');
  END IF;

  -- Return existing pending code if any
  SELECT * INTO v_exists
  FROM referrals
  WHERE referrer_family_id = v_family_id AND status = 'pending'
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'code', v_exists.code);
  END IF;

  -- Generate a unique 6-char code (no 0/O/1/I/L confusion chars)
  LOOP
    v_code := upper(substring(
      translate(encode(gen_random_bytes(6), 'base64'), '+/=0OoIi1Ll', 'ABCDEFGHIJ'),
      1, 6
    ));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM referrals WHERE code = v_code);
    v_attempt := v_attempt + 1;
    IF v_attempt > 10 THEN
      RAISE EXCEPTION 'could not generate unique code';
    END IF;
  END LOOP;

  INSERT INTO referrals (referrer_family_id, code)
  VALUES (v_family_id, v_code);

  RETURN jsonb_build_object('success', true, 'code', v_code);
END;
$$;

-- 5. redeem_referral RPC — bilateral top-up to max 14 days
CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_referral        referrals%ROWTYPE;
  v_caller_family   uuid;
BEGIN
  -- 1. Identify caller's family
  SELECT family_id INTO v_caller_family
  FROM profiles
  WHERE user_id = auth.uid() AND role = 'parent'
  LIMIT 1;

  IF v_caller_family IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_parent_profile');
  END IF;

  -- 2. Find the referral code (must be pending)
  SELECT * INTO v_referral
  FROM referrals
  WHERE code = upper(trim(p_code)) AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_or_used_code');
  END IF;

  -- 3. Self-referral guard
  IF v_referral.referrer_family_id = v_caller_family THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;

  -- 4. One-redemption-per-family guard
  IF EXISTS (
    SELECT 1 FROM referrals
    WHERE referred_family_id = v_caller_family AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_redeemed');
  END IF;

  -- 5. Mark referral as completed
  UPDATE referrals
  SET status             = 'completed',
      referred_family_id = v_caller_family,
      completed_at       = now()
  WHERE id = v_referral.id;

  -- 6. Top-up premium_until for ALL parents in BOTH families (cap: max 14 days ahead)
  UPDATE profiles
  SET premium_until = LEAST(
        GREATEST(COALESCE(premium_until, now()), now()) + interval '14 days',
        now() + interval '14 days'
      )
  WHERE role = 'parent'
    AND family_id IN (v_referral.referrer_family_id, v_caller_family);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. Daily cron: null out expired premium_until to keep profiles clean
SELECT cron.schedule(
  'cleanup-expired-premium-until',
  '0 3 * * *',
  $$
    UPDATE public.profiles
    SET premium_until = NULL
    WHERE premium_until IS NOT NULL AND premium_until < now();
  $$
);
