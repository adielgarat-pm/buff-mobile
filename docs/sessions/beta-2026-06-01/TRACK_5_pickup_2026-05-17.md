# Track 5 — Pickup Brief for 2026-05-17

> Adi ran out of Lovable tokens on 2026-05-16 before getting the cohort CSV.
> This doc is the self-contained plan to finish the discovery tomorrow.

---

## Where we are

- **Cohort definition is settled:** parents who (a) have `marketing_consent = true`, (b) have ≥1 child in their family, (c) are not test accounts. Adi will personally email this list about migrating to mobile and getting free-for-life access.
- **CC has MCP access to buff-mobile only.** Lovable is a closed AI-builder platform — no MCP, no direct SQL editor access for Adi.
- **The MCP-connected mobile DB has a stale snapshot** of Lovable data. Snapshot-based estimate: ~24 qualifying parents, ~16 with recoverable emails. Live Lovable numbers may differ.
- **Yesterday's Lovable prompt was wrong** (assumed Adi could run SQL in Supabase SQL Editor directly — she can't). Today's prompt below has Lovable build a one-shot admin export page that Adi can use to download the CSV.

---

## Step 1 — Paste this prompt into Lovable chat tomorrow

> Tokens-frugal: this asks Lovable to do everything in one shot — build the page, query, download. No back-and-forth.

```
I need a one-time CSV export of our migration cohort. Please do all of the following in this single response so I don't burn extra tokens:

1. Add a TEMPORARY admin-only route at /admin/migration-cohort that:
   - Is protected by our existing admin auth check (only Adi can access it).
   - Runs a single SELECT against our Supabase project (read-only — no INSERT, UPDATE, DELETE, or DDL).
   - Renders a table preview on screen (first 10 rows for visual sanity check).
   - Has a "Download CSV" button that exports the full result set as cohort.csv.

2. The query selects qualifying migration cohort. A parent qualifies if ALL THREE:
   a. profiles.role = 'parent'
   b. profiles.marketing_consent = true
   c. their family has at least one row in profiles where role = 'child'

3. Columns in the CSV (one row per qualifying parent):

   email                          — from auth.users.email if available,
                                    else most recent public.email_logs.email_to
                                    for this profile_id; else empty
   email_source                   — 'auth.users' or 'email_logs' or 'missing'
   parent_display_name            — profiles.display_name
   parent_profile_id              — profiles.id
   family_id                      — profiles.family_id
   signup_date                    — auth.users.created_at if available,
                                    else profiles.created_at (ISO format)
   last_active_date               — MAX of (pwa_events.created_at,
                                    daily_progress.created_at,
                                    child_vibes.created_at) for this family
   children_count                 — COUNT of role='child' in same family
   children_names                 — STRING_AGG of child display_names,
                                    separator ' | ', commas replaced with spaces
   is_lifetime_access_on_lovable  — current profiles.is_lifetime_access value
   is_pro_on_lovable              — current profiles.is_pro value

4. EXCLUDE these test patterns:
   - email or display_name ILIKE '%test%'
   - email or display_name ILIKE '%buffapp.%'
   - display_name LIKE '%אקדא4%'
   - email ILIKE '%@example.com'
   - email ILIKE '%+test@%'

5. CSV must be UTF-8 with a header row, ORDER BY signup_date ASC. Hebrew
   characters in display_name must render correctly. Replace embedded
   commas/newlines in string fields.

6. After deploying the page, also report in chat:
   - The total qualifying cohort size (the row count).
   - email_source breakdown: counts of auth.users / email_logs / missing.
   - Total parents with marketing_consent = true regardless of kids
     (the broader "mailing list" universe — should be close to 49).
   - Anything edge-case-y (duplicate emails, profiles in multiple families,
     parents with NULL family_id, etc.).

7. Tell me clearly how I can REMOVE the temporary route after I download the
   CSV (file path, lines to delete) so it doesn't stay live in production.

Safety: nothing in this task writes to the database. Read-only.
```

---

## Step 2 — Navigate to the new admin page

After Lovable deploys: open `/admin/migration-cohort` in your browser (signed in as admin), eyeball the preview table for sanity (do the Hebrew names look right? does the cohort size feel about right?), click **Download CSV**.

---

## Step 3 — Save the file locally

Save it as:
```
docs/sessions/beta-2026-06-01/TRACK_5_cohort.csv
```

This path is **already in `.gitignore`** — the file will not be committed (it contains PII).

---

## Step 4 — Hand back to CC

Open a new Claude Code session (or continue this one tomorrow) and say:

> "Track 5 — Lovable CSV saved at `docs/sessions/beta-2026-06-01/TRACK_5_cohort.csv`. Lovable reported: [paste Lovable's count breakdown from chat]."

CC will then:
1. Read the CSV locally.
2. Verify counts match Lovable's report.
3. Draft buff-mobile seed SQL: create `pending_lifetime_grants` table, INSERT cohort emails, extend `handle_new_user` trigger so any future signup whose email matches gets `is_lifetime_access = true` automatically.
4. Show the SQL for Adi's approval.
5. After `approved, proceed` — run via MCP on buff-mobile.
6. Append cohort + counts to `INTEGRATION_LEARNINGS.md` for audit.

---

## Step 5 — After CC runs the mobile-side seed, REMOVE the Lovable admin route

Per the instructions Lovable gave you in step 6 of the prompt. The route was temporary — don't leave it live in production.

---

## Tokens-frugal notes for tomorrow

- The prompt above is designed to be a ONE-shot — Lovable should be able to do it in a single response without follow-up clarifications. Don't iterate.
- If Lovable asks clarifying questions instead of building, reply: **"Just build it with your best judgment. Read-only query, temporary route, CSV download. Do not ask more questions before producing the code."**
- If Lovable produces partial output (e.g. only the SQL but not the route), reply: **"Please produce the full route component code AND deploy it. I need the actual page live, not just the SQL."**
- If Lovable refuses to build admin routes or auto-deploy, fall back: **"Then return the cohort data as a CSV-formatted code block in this chat, with one parent per line. I'll copy and save it locally."**

---

## What CC will NOT do without the CSV

- ❌ No more snapshot-based analysis (the buff-mobile snapshot is stale; numbers are wrong).
- ❌ No mobile-side schema/trigger changes (waiting on the real cohort).
- ❌ No assumptions about how many cohort members are actually still active on Lovable.

---

## Reading list for whoever picks this up tomorrow

If it's CC in a fresh session, read in this order:
1. [README](./README.md) — beta launch session index
2. [TRACK_5_findings.md](./TRACK_5_findings.md) — discovery + settled framing
3. This file (pickup brief)
4. [TRACK_5_cohort_lifetime_access.md](./TRACK_5_cohort_lifetime_access.md) — the original plan, mostly superseded by findings
