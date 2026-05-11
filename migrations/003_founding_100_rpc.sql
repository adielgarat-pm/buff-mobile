-- ============================================================================
-- 003_founding_100_rpc.sql
-- Postgres functions for atomic Founding 100 membership grant + revoke.
-- Generated: 2026-05-11
-- Source SPEC: docs/sessions/founding-100-payment/SPEC.md §Phases / Phase 2
-- ============================================================================
--
-- Two RPC functions called from supabase/functions/rc-webhook/:
--
--   grant_founding_membership(p_user_id uuid) RETURNS integer
--     - Idempotent: if user already has founding membership, returns their
--       existing founding_member_number unchanged.
--     - Race-safe: uses pg_advisory_xact_lock to serialize concurrent
--       assignments (matters at the #50 tier-switch and #100 cap boundaries).
--     - Returns the assigned founding_member_number on success.
--     - Returns NULL if the 100-cap is full.
--     - Raises an exception if the user_id has no profiles row.
--
--   revoke_founding_membership(p_user_id uuid) RETURNS boolean
--     - Idempotent: returns false if user wasn't a founding member.
--     - Clears all three flags (is_lifetime_access, is_lifetime_founding,
--       founding_member_number) on refund/cancellation.
--     - Note: the revoked number is NOT reassigned — the cap is "max ever
--       granted", not "current active count". This prevents accidentally
--       handing out the same number twice across a refund cycle.
--
-- Permissions:
--   Both functions are SECURITY DEFINER (run with the function owner's
--   privileges, bypassing RLS) and explicitly granted to service_role only.
--   The webhook calls them via service_role key. No other code path can
--   invoke them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GRANT
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.grant_founding_membership(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number integer;
  v_existing integer;
BEGIN
  -- Idempotency check (before lock — cheap and handles the common retry case)
  SELECT founding_member_number INTO v_existing
  FROM profiles
  WHERE user_id = p_user_id AND is_lifetime_founding = true;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Serialize concurrent assignments via transaction-scoped advisory lock.
  -- The hash key (982347928) is arbitrary but stable — any value works as long
  -- as it's used consistently across all callers of this function.
  PERFORM pg_advisory_xact_lock(982347928);

  -- Re-check idempotency after acquiring lock (in case another transaction
  -- granted to this user while we were waiting on the lock).
  SELECT founding_member_number INTO v_existing
  FROM profiles
  WHERE user_id = p_user_id AND is_lifetime_founding = true;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Compute next number (current max + 1)
  SELECT COALESCE(MAX(founding_member_number), 0) + 1
    INTO v_next_number
  FROM profiles
  WHERE is_lifetime_founding = true;

  -- Hard cap at 100
  IF v_next_number > 100 THEN
    RETURN NULL;
  END IF;

  -- Apply the grant
  UPDATE profiles
  SET is_lifetime_access = true,
      is_lifetime_founding = true,
      founding_member_number = v_next_number
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found in profiles', p_user_id
      USING ERRCODE = 'P0002';  -- no_data_found
  END IF;

  RETURN v_next_number;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_founding_membership(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_founding_membership(uuid) TO service_role;

COMMENT ON FUNCTION public.grant_founding_membership(uuid) IS
  'Atomically grants Founding 100 membership to a user. Returns the assigned founding_member_number (1..100), or NULL if cap reached. Idempotent. Called from rc-webhook edge function.';


-- ----------------------------------------------------------------------------
-- REVOKE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.revoke_founding_membership(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET is_lifetime_access = false,
      is_lifetime_founding = false,
      founding_member_number = NULL
  WHERE user_id = p_user_id AND is_lifetime_founding = true;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_founding_membership(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_founding_membership(uuid) TO service_role;

COMMENT ON FUNCTION public.revoke_founding_membership(uuid) IS
  'Revokes Founding 100 membership on refund/cancellation. Clears is_lifetime_access, is_lifetime_founding, founding_member_number. Returns true if a row was updated. The revoked number is NOT reassigned — cap is "max ever granted".';


-- ----------------------------------------------------------------------------
-- Rollback (for reference; not executed)
-- ----------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.grant_founding_membership(uuid);
-- DROP FUNCTION IF EXISTS public.revoke_founding_membership(uuid);
