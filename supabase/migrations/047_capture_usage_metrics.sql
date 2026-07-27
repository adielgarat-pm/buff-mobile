-- 047_capture_usage_metrics.sql
--
-- Usability instrumentation for the parent-capture ("Smart Organizer") beta.
--
-- What was blind before this migration:
--   * how much of the AI's output the parent actually KEPT (parent_items stores
--     only the kept items — discards left no trace, so "is the AI any good?"
--     was unanswerable);
--   * failed runs — premium_required / rate_limited / Gemini errors return
--     BEFORE the capture_runs insert, so they existed only in Sentry;
--   * which run produced which item (no link between capture_runs and
--     parent_items), so per-run yield could not be followed to an outcome.
--
-- All changes are ADDITIVE and nullable. Old builds in the field keep writing
-- the same columns they always did (new ones stay NULL) — zero behavior impact
-- on existing users. Privacy posture unchanged: counts only, never raw input.
--
-- Rollback (non-destructive):
--   ALTER TABLE public.capture_runs
--     DROP COLUMN outcome, DROP COLUMN kept_count, DROP COLUMN discarded_count,
--     DROP COLUMN edited_count, DROP COLUMN confirmed_at;
--   ALTER TABLE public.parent_items DROP COLUMN capture_run_id;

-- ── capture_runs: outcome + what the parent did with the result ──────────────
ALTER TABLE public.capture_runs
  ADD COLUMN IF NOT EXISTS outcome         text,
  ADD COLUMN IF NOT EXISTS kept_count      int,
  ADD COLUMN IF NOT EXISTS discarded_count int,
  ADD COLUMN IF NOT EXISTS edited_count    int,
  ADD COLUMN IF NOT EXISTS confirmed_at    timestamptz;

COMMENT ON COLUMN public.capture_runs.outcome IS
  'ok = items returned; empty = ran, zero items; error_* = run failed (premium/rate limit/Gemini/internal). NULL = pre-047 row.';
COMMENT ON COLUMN public.capture_runs.kept_count IS
  'Items the parent confirmed. NULL = the parent never reached confirm (abandoned the review).';
COMMENT ON COLUMN public.capture_runs.edited_count IS
  'Confirmed items whose owner/child assignment the parent changed from what the AI proposed.';

-- Only these outcomes are billable Gemini calls; error rows must NOT eat the
-- per-family daily cap (the Edge Function filters on this).
ALTER TABLE public.capture_runs DROP CONSTRAINT IF EXISTS capture_runs_outcome_check;
ALTER TABLE public.capture_runs ADD CONSTRAINT capture_runs_outcome_check
  CHECK (outcome IS NULL OR outcome IN (
    'ok', 'empty',
    'error_premium', 'error_rate_limited', 'error_gemini', 'error_internal'
  ));

-- Backfill the 5 pre-047 rows. Historically a row was inserted ONLY after a
-- successful Gemini call, so every existing row is a success by construction.
UPDATE public.capture_runs
   SET outcome = CASE WHEN item_count > 0 THEN 'ok' ELSE 'empty' END
 WHERE outcome IS NULL;

-- ── parent_items: which run produced this item ───────────────────────────────
ALTER TABLE public.parent_items
  ADD COLUMN IF NOT EXISTS capture_run_id uuid
    REFERENCES public.capture_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS capture_runs_family_time_idx
  ON public.capture_runs (family_id, created_at);
CREATE INDEX IF NOT EXISTS parent_items_capture_run_idx
  ON public.parent_items (capture_run_id);
