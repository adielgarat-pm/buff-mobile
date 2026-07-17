-- 042_lifecycle_email_idempotency.sql
--
-- pkg/lifecycle-emails Phase 1 (SPEC: docs/sessions/lifecycle-emails/SPEC.md)
--
-- Guarantees a family never receives the same lifecycle trigger email twice:
-- unique partial index on (profile_id, template_key) for lifecycle keys only
-- ('lc_%'), so the historic campaign rows (stuck / inactive / recovery_correction,
-- which legitimately repeat per recipient) are untouched.
--
-- Existing-user impact: none — no lifecycle ('lc_%') rows exist yet, so the
-- index is created empty and cannot fail on duplicates.

CREATE UNIQUE INDEX IF NOT EXISTS email_logs_lifecycle_once
  ON public.email_logs (profile_id, template_key)
  WHERE template_key LIKE 'lc\_%';

-- The unsubscribe edge function records consent removal here as well
-- (template_key = 'unsubscribe', status = 'unsubscribed'); that key is not
-- under the lc_ prefix so repeated unsubscribe clicks stay idempotent-safe.
