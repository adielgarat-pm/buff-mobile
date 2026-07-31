-- 054_activities_multi_weekday.sql
-- Multi-weekday recurring activities (pkg/activities-multi-day).
-- A recurring activity (e.g. a חוג) can now meet on SEVERAL weekdays in one row,
-- instead of forcing one identical row per day. `weekdays` replaces the single
-- `weekday` as the source of truth; `weekday` is kept as a legacy mirror for one
-- release (see note) and dropped in a future activities migration.
--
-- Additive + backfilled — no row is lost. Existing single-day recurring
-- activities keep rendering because their `weekday` is backfilled into `weekdays`.
--
-- Compat model (lean, approved 2026-07-31):
--   * Read:  new app reads `weekdays`, falls back to [weekday] when weekdays IS NULL
--            (covers rows an old/pre-OTA build inserts, which set only `weekday`).
--   * Write: new app dual-writes `weekday = weekdays[0]` for one release, so a
--            pre-OTA client that still reads only `weekday` shows at least the
--            first day of a new multi-day row rather than a blank.
--   * Accepted, bounded risk: a pre-OTA build that EDITS a backfilled multi-day
--            row writes only `weekday`, leaving `weekdays` stale; the new app
--            trusts `weekdays` and ignores that edit. Near-zero population given
--            forced-update/OTA + pre-scale. Not reconciled by design.
--
-- Column type: jsonb, matching the existing `equipment jsonb` precedent. We never
-- query weekdays server-side (the client fetches the family's activities and
-- filters in JS via activeOnDate), so no index / GIN is needed and RLS is
-- unaffected (family_id-scoped, additive column inherits table grants).
--
-- CHECK is intentionally WEAK: it forbids an empty array but does NOT require
-- weekdays to be present, because during the compat window old builds insert
-- recurring rows with weekdays = NULL. A strict "recurring ⇒ weekdays present"
-- CHECK is deferred to the cleanup that drops `weekday`.

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS weekdays jsonb;

COMMENT ON COLUMN public.activities.weekdays IS
  'Recurring schedule: non-empty JSON array of weekday tokens (sunday..saturday), Sun→Sat order, deduped. NULL for one-off rows and for pre-054 rows an old build inserts (read falls back to [weekday]). Supersedes the legacy single `weekday`.';

-- Backfill existing recurring rows: single weekday → one-element array.
UPDATE public.activities
   SET weekdays = to_jsonb(array[weekday])
 WHERE schedule_kind = 'recurring'
   AND weekday IS NOT NULL
   AND weekdays IS NULL;

-- Weak integrity guard: allow NULL (compat + one-off), forbid an empty array.
ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_weekdays_nonempty;
ALTER TABLE public.activities
  ADD CONSTRAINT activities_weekdays_nonempty
  CHECK (
    weekdays IS NULL
    OR (jsonb_typeof(weekdays) = 'array' AND jsonb_array_length(weekdays) > 0)
  );
