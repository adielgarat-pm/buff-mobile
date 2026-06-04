# RLS Findings — child-login-stable-identity

> Read-only investigation from production, 2026-06-04, via Supabase MCP. Feeds Phase 0.

## How identity resolves in RLS

- `get_my_family_id()` = `SELECT family_id FROM profiles WHERE user_id = auth.uid() LIMIT 1` (STABLE, SECURITY DEFINER).
- Child-scoped policies resolve the child's own profile via `(SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)` and match it against `assigned_to` / `child_id`.
- **Implication:** a child must have their **own auth row** (own-auth model) to see their own child-scoped data. A `user_id = NULL` child cannot use these policies as themselves — confirms own-auth and explains why the 60 orphans depend on a working login.

## Liah relink — VERIFIED HEALTHY ✅

- Exactly **one** profile maps to her auth uid `b1b98417` (no duplicates).
- `get_my_family_id()` → her family `a29f83d9`; child subquery → profile `74638016` (her 14 tasks).
- Relink did **not** break access or leak data. It actively fixed her RLS resolution.

## Integrity facts (refine the fix accordingly)

- `profiles.user_id` **is unique-enforced** (2 unique indexes) and **0** auth users map to >1 profile.
- So the integrity gap is **NOT** duplicate profile-links — it is **duplicate `auth.users` creation at signup**. The Phase 1 idempotency/constraint work should target *not creating a second account*, since the profile-link uniqueness already exists.
- Latent (not currently triggered) hazard: the `LIMIT 1` subqueries are unordered; if an auth user ever mapped to >1 profile, RLS would resolve arbitrarily. Uniqueness currently prevents this — keep it.

## ⚠️ Separate security findings — OUT OF SCOPE here, surface to Adi

These are real RLS holes unrelated to the login bug. **Higher severity than the dup-login.** Do NOT fold into this package and do NOT fix unilaterally — they warrant their own security review/package:

1. `profiles` SELECT `USING (true)` — any authenticated user can read **all profiles across all families** (display_name, birth_date, onboarding_data jsonb). Cross-family exposure.
2. `families` UPDATE `USING (true) WITH CHECK (true)` — any authenticated user can **modify any family** (short_code, name, language). Horizontal privilege escalation.
3. `families` SELECT open to anon by short_code + to all authenticated (the anon-by-short_code may be intentional for join-by-code; the blanket authenticated read is broader than needed).
4. `buddy_relationships` SELECT `USING (true)` — all buddy data readable by any authenticated user.

Recommend a separate `rls-tighten` package. Flagged here only so it isn't lost.
