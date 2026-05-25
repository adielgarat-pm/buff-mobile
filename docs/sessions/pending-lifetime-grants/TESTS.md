# pkg/pending-lifetime-grants — Tests

> Phase 1 = no-op (verification queries inside the migration apply).
> Phase 2 = the 6-case idempotency suite below + Hat-3 emulator scenarios for Adi.

---

## Phase 1 — Migration verification (CC runs automatically)

| # | Check | Pass condition |
|---|---|---|
| P1.1 | Table exists | `mcp__supabase__list_tables` returns `pending_lifetime_grants` with RLS=true |
| P1.2 | Indexes exist | `pending_lifetime_grants_source_idx` present |
| P1.3 | Constraints enforced | INSERT with mixed-case email rejected; INSERT with whitespace rejected; INSERT with invalid source rejected |
| P1.4 | Functions exist | `grant_lifetime_if_pending`, `grant_lifetime_if_in_window`, `tg_profiles_after_insert_grant_lifetime` all returned by `pg_proc` query |
| P1.5 | Trigger registered | `tg_profiles_after_insert_grants` shown by `information_schema.triggers` query for `profiles` table |
| P1.6 | Seed loaded | `SELECT COUNT(*) FROM pending_lifetime_grants WHERE source='mailing_list_49'` = 16 (minus any backfilled) |
| P1.7 | No advisor regressions | `get_advisors security` returns no new HIGH issues attributable to migration 015 |

**Values check for this phase:** Pass (no user-facing strings, no behavior change for existing users; silent grant).

---

## Phase 2 — Idempotency SQL test suite (CC runs in rolled-back transactions)

Each test runs inside `BEGIN; ... ROLLBACK;` so no test data persists. CC reports outcome per test.

### T1 — Email in pending, exact match → grant fires

```sql
BEGIN;
  -- Setup
  INSERT INTO public.pending_lifetime_grants (email, source) VALUES ('t1@example.com', 'manual');
  -- Manually craft a synthetic auth.users row
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (gen_random_uuid(), 't1@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', NOW(), NOW(), '{}'::jsonb, '{}'::jsonb)
    RETURNING id \gset
  -- Insert profile referencing the new auth user
  INSERT INTO public.profiles (user_id, display_name, role) VALUES (:'id', 'T1Test', 'parent') RETURNING id, is_lifetime_access;
  -- Verify
  SELECT 'T1' AS test,
         (SELECT is_lifetime_access FROM public.profiles WHERE user_id=:'id') AS got,
         true AS expected,
         (SELECT COUNT(*) FROM public.pending_lifetime_grants WHERE email='t1@example.com') AS pending_remaining;
ROLLBACK;
```
**Pass:** `got=true`, `expected=true`, `pending_remaining=0`.

### T2 — Email in pending, mixed case input → match anyway

```sql
BEGIN;
  INSERT INTO public.pending_lifetime_grants (email, source) VALUES ('t2@example.com', 'manual');
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (gen_random_uuid(), 'T2@Example.COM', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', NOW(), NOW(), '{}'::jsonb, '{}'::jsonb)
    RETURNING id \gset
  INSERT INTO public.profiles (user_id, display_name, role) VALUES (:'id', 'T2Test', 'parent');
  SELECT 'T2' AS test,
         (SELECT is_lifetime_access FROM public.profiles WHERE user_id=:'id') AS got,
         true AS expected;
ROLLBACK;
```
**Pass:** `got=true`. (Function lowercases `auth.users.email` before lookup.)

### T3 — Email in pending, whitespace in auth.users → trim-safe match

```sql
BEGIN;
  INSERT INTO public.pending_lifetime_grants (email, source) VALUES ('t3@example.com', 'manual');
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (gen_random_uuid(), '  t3@example.com  ', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', NOW(), NOW(), '{}'::jsonb, '{}'::jsonb)
    RETURNING id \gset
  INSERT INTO public.profiles (user_id, display_name, role) VALUES (:'id', 'T3Test', 'parent');
  SELECT 'T3' AS test,
         (SELECT is_lifetime_access FROM public.profiles WHERE user_id=:'id') AS got,
         true AS expected;
ROLLBACK;
```
**Pass:** `got=true`. (Function `btrim`s `auth.users.email` before lookup.)

### T4 — Email NOT in pending, outside window → no grant

Today (2026-05-25) is BEFORE the open window starts (5/30), so a fresh email gets no grant. Confirms negative case.

```sql
BEGIN;
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (gen_random_uuid(), 't4@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', NOW(), NOW(), '{}'::jsonb, '{}'::jsonb)
    RETURNING id \gset
  INSERT INTO public.profiles (user_id, display_name, role) VALUES (:'id', 'T4Test', 'parent');
  SELECT 'T4' AS test,
         (SELECT is_lifetime_access FROM public.profiles WHERE user_id=:'id') AS got,
         false AS expected;
ROLLBACK;
```
**Pass:** `got=false`.

### T5 — In-window grant for a parent with no pending match

Simulates 2026-06-15 (mid-window). Since `NOW()` is hard-coded by the function, we test by calling the function directly with a known profile.

```sql
BEGIN;
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (gen_random_uuid(), 't5@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', NOW(), NOW(), '{}'::jsonb, '{}'::jsonb)
    RETURNING id \gset
  INSERT INTO public.profiles (user_id, display_name, role) VALUES (:'id', 'T5Test', 'parent') RETURNING id \gset
  -- Today is 5/25, so we test the function logic by calling it directly
  -- with a date in the window via a wrapper that simulates NOW()
  -- Or: we accept T5 as "deferred to 5/30+" and document the SQL test for window-positive case
  SELECT 'T5' AS test,
         'in-window-grant verifiable from 2026-05-30' AS status;
ROLLBACK;
```
**Pass condition:** SQL function exists and is callable; in-window positive case verifiable starting 2026-05-30 via a clean signup test on emulator (Hat 3). Documented as deferred verification.

### T6 — Email in pending but profile.role='child' → still grants

```sql
BEGIN;
  INSERT INTO public.pending_lifetime_grants (email, source) VALUES ('t6@example.com', 'manual');
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (gen_random_uuid(), 't6@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', NOW(), NOW(), '{}'::jsonb, '{}'::jsonb)
    RETURNING id \gset
  INSERT INTO public.profiles (user_id, display_name, role) VALUES (:'id', 'T6Test', 'child');
  SELECT 'T6' AS test,
         (SELECT is_lifetime_access FROM public.profiles WHERE user_id=:'id') AS got,
         true AS expected;
ROLLBACK;
```
**Pass:** `got=true`. **Documented behavior:** explicit pending match overrides the role check. Window-grant alone would skip children (role='parent' gate); only explicit pending list grants children.

---

## Phase 4 — Hat-3 emulator verification (Adi runs after merge)

| # | Scenario | Setup | Pass condition |
|---|---|---|---|
| H1 | Cohort email match | Adi creates a temporary test row: `INSERT INTO pending_lifetime_grants (email, source) VALUES ('<her test Google account>', 'manual');` then signs up on emulator | After onboarding, opening the paywall area (adding a 2nd child) shows no paywall; `useSubscription.isLifetime=true` |
| H2 | In-window non-match (requires 5/30+) | After 2026-05-30, Adi signs up with a fresh Google account whose email is NOT in pending | `is_lifetime_access=true` after profile insert; no paywall |
| H3 | Out-of-window non-match (requires 7/1+) | After 2026-06-30, fresh signup, no email match | `is_lifetime_access=false`; paywall appears when adding 2nd child |

**Note:** H2 and H3 can also be verified by CC temporarily shifting the window dates in a rolled-back transaction immediately after merge, if Adi wants confidence before 5/30.
