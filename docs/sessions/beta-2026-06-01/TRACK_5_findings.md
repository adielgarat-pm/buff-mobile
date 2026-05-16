# Track 5 — Discovery Findings (2026-05-16)

> Read this BEFORE acting on Track 5. There are TWO Supabase projects in play. CC's MCP is wired to one of them. Plan the work accordingly.

---

## SETTLED FRAMING — 2026-05-16 (final, do not flip again)

After two flip-flops earlier, the settled facts are:

- **CC's Supabase MCP is connected to buff-mobile**, project URL `gfrongfnyigxsexuofrg`. Adi's original Q1 answer was correct.
- **Lovable cannot have an MCP** — closed AI-builder platform, no extensibility. Any live-Lovable query must run inside Lovable's own SQL Editor (Adi clicks Run, downloads CSV, hands back).
- **The data on buff-mobile is a STALE SNAPSHOT** of Lovable's profile/family/email data, frozen at the time the copy was made. The BUDDY V0.5 tables (`buddy_relationships`, `buddy_daily_check`) are live on buff-mobile (created by recent mobile migrations 2026-05-15), but the Lovable-origin tables are not synced from live Lovable.
- **All cohort numbers CC produced in this doc (24 / 16 / 188) are from the stale snapshot.** They are *approximations* of the live Lovable cohort, not exact matches.

**Implications:**
- For the actual cohort, run [TRACK_5_lovable_cohort_discovery.md](./TRACK_5_lovable_cohort_discovery.md) inside Lovable to get live data.
- The "187 dangling parent profile" framing on buff-mobile is now explainable: those 187 are profile rows copied from Lovable whose original `user_id` values don't match anything in buff-mobile's `auth.users` (which only has 5 real mobile-signup accounts). They're not orphans or bugs — they're snapshot artifacts.
- REQ-1 still stands: Lovable users will sign up fresh on mobile via Google OAuth; the pending-grants mechanism auto-flags them on signup.

The "TL;DR" and "Raw evidence" sections below preserve the original wording for traceability; treat them as describing the stale snapshot on buff-mobile, useful as a sanity check against live Lovable.

---

## TL;DR (original wording — describes stale snapshot on buff-mobile)

buff-mobile and Lovable are separate Supabase projects. buff-mobile holds a stale copy of Lovable's profile/family/email data plus its own (mostly empty) `auth.users` (5 real signups). 187 of 188 parent profile rows on mobile have `user_id`s that don't match anything in mobile's `auth.users` — snapshot artifacts, not live users.

Lovable's actual cohort cannot be flagged on mobile until those users sign up to the mobile app via Google OAuth, creating fresh mobile `auth.users` rows.

---

## Raw evidence (read-only queries against buff-mobile MCP — STALE SNAPSHOT)

**Project URL** (buff-mobile MCP): `https://gfrongfnyigxsexuofrg.supabase.co`
**Schema check:** has Lovable-style tables (`pwa_events`, `lesson_progress`, `store_rewards`, etc.) — these are snapshot-copied from Lovable, not live. Also has BUDDY V0.5 tables (`buddy_relationships`, `buddy_daily_check`) — these ARE live on mobile.

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

---

## Cohort definition (2026-05-16, Adi-stated)

Adi's criteria for the migration cohort:
1. From her **mailing list of 49** people (the ones she'll actually email about the migration)
2. WHO HAS completed family setup (= has at least one child in their family)
3. WHO HAS approved marketing email (`marketing_consent = true`)

Anyone outside that intersection — families with no children, or with children but no consent — is **out of scope for now**.

### Mobile DB baseline (CC discovery 2026-05-16)

Adi's stated: 189 families / 191 parents / 87 children.
CC measured: **190 families / 188 parents / 88 children**. Off by 1–3, close enough (probably timing variance).

### Qualifying-cohort funnel

| Step | Count | Notes |
|---|---|---|
| All parents in mobile DB | 188 | |
| Parents with `marketing_consent = true` | **48** | Close to Adi's "49" — likely the same list, tracked via this column |
| Families with ≥1 child (= "completed family setup") | 68 | |
| Parents whose family has kids AND parent has consent (**qualifying cohort**) | **24** | This is the actionable cohort. |
| Of those 24, with at least one email recoverable from `email_logs.email_to` | **16** | |
| Of those 24, with NO email anywhere CC could find on mobile | **8** | |

### Email recovery situation

The mobile DB has no `email` column on `profiles`. Emails live in two places:
1. `auth.users.email` — useless for the cohort (the 187 dangling profiles have no `auth.users` rows)
2. `public.email_logs.email_to` — historical log of every email Buff sent. Covers 16 of the 24 cohort members.

The 8 cohort members with no recoverable email were either never emailed through Buff's own system, or emailed via an external tool (MailerLite or similar) that doesn't write to `email_logs`.

---

## The one decision left to Adi

**Is the "mailing list of 49" the same as `marketing_consent = true` in the mobile DB (which is 48)?**

- **If YES:** CC has enough data. Cohort = 24 qualifying parents. CC can extract the 16 recoverable emails into a gitignored local file. The remaining 8 need either: (a) Adi to provide their emails from the external mailing tool, or (b) accept they fall out of the cohort.
- **If NO** (the 49 is a separate external list, e.g. MailerLite): Adi exports the 49 from her mailing tool and gives CC the CSV. CC then intersects: which of those 49 are in the qualifying 70-parents-with-kids subset on mobile.

Either path, the next step is the same: build `pkg/pending-lifetime-grants` (Option B above) and seed the resolved cohort emails into it.
