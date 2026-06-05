# Decision entries — DRAFT for Adi (copy into BUFF_DECISIONS_LOG.md if you agree)

> Claude.ai does not edit DECISIONS_LOG. These are proposed entries only; you decide wording and IDs.

## D-2026-06-04-XX — Child identity model is own-auth
The app uses an **own-auth** model for children: each child has their own `auth.users` row that
login signs into (confirmed in production 2026-06-04 — a child login advanced `last_sign_in_at`
on the existing auth user rather than creating a new one). Children are NOT accessed purely via a
shared parent session. Child profiles therefore carry their own `profiles.user_id`.

## D-2026-06-04-XX — Child login must resolve by stable selector, not generated credentials
The child-login bug (new user created instead of connecting to the existing one) is rooted in
**non-retrievable synthetic credentials**: on a device without a cached session, the flow cannot
reconstruct the child's account and falls back to signup. Decision: child login must resolve to
the existing account via a **stable selector** (family `short_code` + a child-level identifier)
with credentials that are deterministically derivable or server-resolvable, so any device signs
INTO the existing account. Idempotency is enforced at the DB layer to close the signup race.
Tracked in session `child-login-stable-identity`.

## Note for GAP_ANALYSIS (your file)
Auth / child-login status likely needs an update: child login currently creates duplicate
accounts on new devices; fix scoped in session `child-login-stable-identity`.
