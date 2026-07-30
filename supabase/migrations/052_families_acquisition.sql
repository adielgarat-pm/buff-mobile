-- 052_families_acquisition.sql
-- Acquisition attribution (pkg/acquisition-attribution). Additive, nullable.
-- Stores WHERE a family arrived from, captured once at family_created.
-- No impact on existing rows (all NULL). No RLS change: written in the same
-- authenticated INSERT that already creates the family (050 INSERT policy is
-- created_by = auth.uid() AND trial_started_at IS NULL — unaffected by new cols).
-- Authenticated INSERT privilege on the new columns verified (table-level grant).

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS acquisition_source  text,
  ADD COLUMN IF NOT EXISTS acquisition         jsonb,
  ADD COLUMN IF NOT EXISTS acquisition_country text;

COMMENT ON COLUMN public.families.acquisition_source IS
  'Normalized channel a family arrived from, set once at family_created: organic|winback|guide|fb|referral|reels|play_ads|unknown. NULL for pre-052 rows.';
COMMENT ON COLUMN public.families.acquisition IS
  'Raw acquisition context (utm_*, referrer, platform) captured at family_created. Marketing tags + device only, never child PII.';
COMMENT ON COLUMN public.families.acquisition_country IS
  'ISO-3166 alpha-2 region from device locale at signup (not IP). Complements the mutable profiles.last_country.';
