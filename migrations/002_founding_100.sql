-- ============================================================================
-- 002_founding_100.sql
-- Schema additions for the Founding 100 lifetime-tier offer.
-- Generated: 2026-05-11
-- Source SPEC: docs/sessions/founding-100-payment/SPEC.md §Scope
-- ============================================================================
--
-- Adds two columns to public.profiles to support the Founding 100 program:
--
--   is_lifetime_founding   — boolean, true for Founding Member purchasers.
--                            Distinct from is_lifetime_access (which is the
--                            general "skip the paywall" flag): this one is
--                            specifically about being one of the first 100
--                            who paid for the founding deal.
--
--   founding_member_number — integer 1..100, unique per founding purchaser.
--                            Assigned atomically by the rc-webhook edge
--                            function on successful purchase (with FOR UPDATE
--                            lock to prevent race conditions at the
--                            #50→$149 tier boundary and the hard #100 cap).
--
-- Index strategy:
--   - Partial index on is_lifetime_founding = true makes the "spots left"
--     counter query (`SELECT COUNT(*) FROM profiles WHERE
--     is_lifetime_founding = true`) constant-time regardless of overall
--     profiles table size.
--   - UNIQUE constraint on founding_member_number enforces the 1..100 cap
--     at the schema level — even if the webhook had a bug, the DB will
--     refuse a duplicate number.
--
-- Rollback path:
--   DROP INDEX IF EXISTS idx_profiles_founding;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS founding_member_number;
--   ALTER TABLE profiles DROP COLUMN IF EXISTS is_lifetime_founding;
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_lifetime_founding boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founding_member_number integer NULL;

-- Constraint: founding_member_number must be unique (nulls allowed for
-- non-founding users). PostgreSQL's UNIQUE constraint allows multiple NULLs
-- by default, which is the behavior we want.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_founding_member_number_unique
  UNIQUE (founding_member_number);

-- Constraint: founding_member_number must be within 1..100 if not null.
-- The webhook assigns sequentially; this is a defensive guard.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_founding_member_number_range
  CHECK (founding_member_number IS NULL OR (founding_member_number >= 1 AND founding_member_number <= 100));

-- Partial index for the live sale counter — only indexes rows where the
-- flag is true, keeping the index tiny (max 100 entries forever).
CREATE INDEX IF NOT EXISTS idx_profiles_founding
  ON public.profiles (is_lifetime_founding)
  WHERE is_lifetime_founding = true;

-- Comment for future maintainers reading the schema in Supabase Studio.
COMMENT ON COLUMN public.profiles.is_lifetime_founding IS
  'True for users who purchased the Founding 100 lifetime offer. See docs/sessions/founding-100-payment/SPEC.md.';
COMMENT ON COLUMN public.profiles.founding_member_number IS
  'Sequential 1..100 number assigned by the rc-webhook edge function on successful Founding 100 purchase. UNIQUE. NULL for non-founding users.';
