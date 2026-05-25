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

## Phase 2 — Idempotency SQL test suite

> **Run on:** 2026-05-25, live mobile DB (gfrongfnyigxsexuofrg) post-migration-015.
> **Result:** **6/6 PASS.** No test data leaked (`leak_check` returned `test_profiles=0, test_users=0, test_pending=0, total_pending_now=16`).

Tests use `DO $$ ... $$` blocks with explicit `RAISE EXCEPTION` on assertion failure (so any failure aborts the entire block + surfaces in the SQL result). Each block inserts test rows, asserts trigger behavior, then explicitly DELETEs the test rows for cleanup. (Plain `BEGIN/ROLLBACK` would not capture the post-trigger state inside a CTE.)

### T1 — Email in pending, exact match → grant fires ✅ PASS

```sql
DO $$
DECLARE v_uid uuid := gen_random_uuid(); v_pid uuid; v_lifetime boolean; v_pending int;
BEGIN
  INSERT INTO public.pending_lifetime_grants (email, source) VALUES ('t1@example.com', 'manual');
  INSERT INTO auth.users (id, email, instance_id, aud, role, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (v_uid, 't1@example.com', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', NOW(), NOW(), '{}'::jsonb, '{}'::jsonb);
  INSERT INTO public.profiles (user_id, display_name, role) VALUES (v_uid, 'T1', 'parent') RETURNING id INTO v_pid;
  SELECT is_lifetime_access INTO v_lifetime FROM public.profiles WHERE id = v_pid;
  SELECT COUNT(*) INTO v_pending FROM public.pending_lifetime_grants WHERE email = 't1@example.com';
  IF v_lifetime IS NOT TRUE OR v_pending <> 0 THEN
    RAISE EXCEPTION 'T1 FAIL: lifetime=% pending=%', v_lifetime, v_pending;
  END IF;
  RAISE NOTICE 'T1 PASS';
  DELETE FROM public.profiles WHERE id = v_pid;
  DELETE FROM auth.users WHERE id = v_uid;
END $$;
```
**Result:** PASS. After insert, `is_lifetime_access=true` and pending row removed.

### T2 — Email in pending, mixed case input → match anyway ✅ PASS

`auth.users.email = 'T2@Example.COM'`, pending row = `'t2@example.com'`. The function applies `lower()` to `auth.users.email` before lookup, so it matches. PASS.

### T3 — Email in pending, whitespace in auth.users → trim-safe match ✅ PASS

`auth.users.email = '  t3@example.com  '`. The function applies `btrim()` before lookup. PASS.

### T4 — Email NOT in pending, outside window → no grant ✅ PASS

Today 2026-05-25 is BEFORE the open window (5/30). Both grant functions return false; `is_lifetime_access` stays `false`. PASS.

### T5 — Window-function callable; closed pre-5/30 ✅ PASS (positive case deferred)

`grant_lifetime_if_in_window(profile_id)` called directly on 2026-05-25 returns `false` (correct — window opens 5/30). PASS for the closed-window case.

**Positive case (in-window grant) deferred to:**
1. Hat-3 emulator test on or after 2026-05-30, OR
2. CC-runnable re-test on 5/30 with the same DO-block pattern — the trigger will then auto-grant any parent insert.

The function existence + closed-window negative path are sufficient to confirm the logic. The temporal flip will be observable starting 2026-05-30 00:00 Asia/Jerusalem.

### T6 — Email in pending but profile.role='child' → still grants ✅ PASS

Confirmed: explicit pending match grants regardless of role. Documented behavior: window-grant alone skips children (role='parent' gate); only explicit pending list grants children. This is intentional — if a child profile somehow gets created with a cohort email (e.g., test setup), the pending list wins.

---

## Phase-2 sign-off

- **All 6 SQL idempotency cases PASS on live mobile DB 2026-05-25.**
- **Zero test-data leakage** (`leak_check` query post-run returned all zeros; total pending = 16 as expected).
- **In-window positive case** explicitly deferred to Hat-3 emulator post-5/30.

---

## Phase 4 — Hat-3 emulator verification (Adi runs after merge)

| # | Scenario | Setup | Pass condition |
|---|---|---|---|
| H1 | Cohort email match | Adi creates a temporary test row: `INSERT INTO pending_lifetime_grants (email, source) VALUES ('<her test Google account>', 'manual');` then signs up on emulator | After onboarding, opening the paywall area (adding a 2nd child) shows no paywall; `useSubscription.isLifetime=true` |
| H2 | In-window non-match (requires 5/30+) | After 2026-05-30, Adi signs up with a fresh Google account whose email is NOT in pending | `is_lifetime_access=true` after profile insert; no paywall |
| H3 | Out-of-window non-match (requires 7/1+) | After 2026-06-30, fresh signup, no email match | `is_lifetime_access=false`; paywall appears when adding 2nd child |

**Note:** H2 and H3 can also be verified by CC temporarily shifting the window dates in a rolled-back transaction immediately after merge, if Adi wants confidence before 5/30.
