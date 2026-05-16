# Track 5 — Discovery Findings (2026-05-16)

> Read this BEFORE acting on Track 5. The cohort problem is much bigger than "run an UPDATE."

---

## Terminology note (2026-05-16, Adi-corrected)

CC originally called the 187 problematic parent profiles "orphans." That word is already in use in this codebase — [CLAUDE.md](../../../CLAUDE.md) FLAG **IN-2026-05-14-03** uses "orphan profile" to mean *a child profile that exists before being claimed via ChildJoin*. Different concept entirely.

This doc uses **"dangling parent profile"** for the 187: a parent profile row whose `user_id` foreign-key value does not match any row in `auth.users`. The pointer dangles. They're not orphans in the CLAUDE.md sense.

---

## TL;DR

**buff-mobile and Lovable are NOT the same Supabase project.** They have different `auth.users` tables. The mobile DB has the *profile* data copied over (or seeded), but the `auth.users` were never migrated. Result: 187 of 188 parent profile rows on mobile are **dangling** — they reference `user_id`s that don't exist in mobile's `auth.users`.

Lovable's cohort cannot be flagged on mobile until those users sign up to the mobile app (creating their `auth.users` row).

---

## Raw evidence (read-only queries against mobile DB)

**Project URL** (mobile MCP): `https://gfrongfnyigxsexuofrg.supabase.co`
**Schema check:** has all the Lovable tables (`pwa_events`, `lesson_progress`, `store_rewards`, etc.) AND the BUDDY V0.5 tables (`buddy_relationships`, `buddy_daily_check`). Initially read as "single shared project," but the `auth.users` count proves otherwise.

### Row counts

| Table | Rows |
|---|---|
| `public.profiles` (total) | 276 |
| `public.profiles` where role='parent' | 188 |
| `public.profiles` where role='child' | 88 |
| `auth.users` | **5** |
| Parents with `user_id` matching an `auth.users` row | **1** |
| Parents with `user_id` that does NOT exist in `auth.users` (**dangling**) | **187** |
| Parents with NULL `user_id` | 0 |

### The 5 actual mobile auth.users

All internal/dev accounts:
1. `adi.elgarat@gmail.com` (created 2026-04-10) — Adi
2. `etaywest@gmail.com` (created 2026-04-17) — never signed in
3. `itay@buff.app` (created 2026-04-18)
4. `vijomc@buff.app` (created 2026-04-19) — never signed in
5. `emmy@buff.app` (created 2026-04-29)

The only parent profile with a valid `user_id` is almost certainly Adi.

### Lovable's claim of 182 parents

Stands — but that's 182 in **Lovable's** Supabase project, which CC's MCP does not have access to. Lovable's `auth.users` is a separate table on a separate project.

---

## What this means for Track 5

The original plan ("resolve emails → UPDATE `is_lifetime_access = true`") **cannot work as-is**. The 182 Lovable parents have no `auth.users` rows on mobile, so there's nothing to UPDATE for them.

### What CAN we do today

| Option | Action | Cohort actually flagged |
|---|---|---|
| **A. Flag Adi only** | UPDATE the 1 matched parent | 1 person (Adi) — useless |
| **B. Pending-grants mechanism** | Build a `pending_lifetime_grants(email PK)` table + extend `handle_new_user` trigger to set `is_lifetime_access = true` when a new signup's email is in the table | 0 flagged today; auto-flagged as Lovable users migrate to mobile and sign up |
| **C. Flag dangling profiles directly** | UPDATE the 187 dangling parent profiles by `family_id` even though they're disconnected from auth | 187 profiles flagged; meaningless until their `auth.users` rows are created, AND a serious risk if those rows get repointed to the wrong people later |
| **D. Migrate Lovable `auth.users` to mobile** | Complex. Google OAuth users can probably be re-linked (no password hashes to move), but it requires Lovable Supabase access + a migration script + careful UUID handling. Out of scope for a one-shot Track. | Whoever migrates — but this is its own Improvement Package, not a sub-step of Track 5 |
| **E. Do nothing now; flag manually post-signup** | Track 5 closes as "no-op pending mobile signups"; when Lovable users sign up on mobile, Adi manually flags them | Manual ongoing toil |

### CC recommendation

**Option B (Pending-grants table) is the correct shape**, but it's now an Improvement Package, not a Track 5 sub-step. Concretely:

1. **Close Track 5 today** as `blocked-redesign` — the original "UPDATE existing accounts" framing was based on a wrong assumption.
2. **Open a new package** `pkg/pending-lifetime-grants` that:
   - Creates `pending_lifetime_grants(email TEXT PRIMARY KEY, source TEXT, granted_at TIMESTAMPTZ DEFAULT NOW())`
   - Bulk-INSERTs the Lovable cohort emails (from Lovable's CSV) into that table
   - Extends the `handle_new_user` trigger so new signups whose email matches get `is_lifetime_access = true` + the row removed from `pending_lifetime_grants`
   - Idempotent, auditable, and works regardless of whether someone signs up today or in 6 months
3. **Flag Adi's profile** as a tiny no-package fix (1-row UPDATE, takes 10 seconds) so subscription gates don't bother her in dev.

---

## Open questions for Adi

1. **Why are 187 dangling parent profiles on mobile?** Were they copied from Lovable during an aborted migration? Are they expected to be re-linked at first signup? **This is a data integrity question independent of Track 5** and should probably get its own FLAG in INTEGRATION_LEARNINGS.md.
2. **Does the existing `handle_new_user` trigger exist on mobile?** If yes, extending it is cheap. If no, the pending-grants package builds it from scratch.
3. **Confirm CC's understanding:** Lovable users will eventually need to sign up fresh on mobile via Google OAuth — there is no automatic migration. Right?
4. **Adi's profile** — flag now as a one-off, or include in the pending-grants package?

---

## What CC did NOT do

- ❌ No UPDATE statements ran. Everything above is read-only SELECT.
- ❌ Did not write `TRACK_5_cohort.csv` — running the SQL on mobile produced 1 row, which is not the cohort. Lovable's actual 182 still need to be exported from Lovable's own SQL Editor.
- ❌ Did not touch dangling profiles. Surfacing the question instead.

---

## Cascading requirements (for other Tracks)

### REQ-1 — Migration email must explain "sign up fresh on mobile" (confirmed by Adi 2026-05-16)

**Source:** Adi confirmed there is no automatic Lovable → mobile auth migration. Lovable users will need to sign up fresh on mobile via Google OAuth (their lifetime-access flag will be set automatically on first signup IF the pending-grants mechanism — Option B above — is in place).

**Implication for the migration comms Track (TBD):** The email/in-app message to Lovable users must include:

1. **The "why":** "We've moved to a native Android app. Your web version will be sunset on [date]."
2. **The "how":** "Sign up on the mobile app with the **same Google account** you used on the web — your lifetime access will activate automatically."
3. **Why same Google account matters:** the email match is what triggers the auto-flag. If they sign up with a different Google account, they'll hit the paywall and need manual intervention.
4. **What carries over / what doesn't:** their lifetime-access entitlement carries (via auto-flag). Their family/children/tasks/rewards data does NOT carry automatically (separate migration question — see open question #1 above re: dangling profiles).
5. **Fallback path:** "If you signed up with a different email, reply to this message and we'll fix it."

**Owner:** TBD — likely the Track that handles migration comms (not yet defined in README index).

**Open sub-question:** Do we plan to also migrate family/children/tasks/rewards data, or do Lovable users start fresh on mobile? If start-fresh, the email needs to manage that expectation. If migrate-data, this is its own Improvement Package.
