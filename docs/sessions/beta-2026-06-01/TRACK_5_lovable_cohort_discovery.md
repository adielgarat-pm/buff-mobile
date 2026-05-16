# Track 5 — Lovable Cohort Discovery Prompt (2026-05-16)

> Copy-paste the fenced block below into Lovable's chat (the buffadhd.com project).
> Lovable will produce a CSV of the qualifying migration cohort, run on **live** Lovable data.
> Save the resulting CSV locally at `docs/sessions/beta-2026-06-01/TRACK_5_cohort.csv` (gitignored).
> Tell CC "CSV saved" — CC will then write the mobile-side seed SQL.

---

## Why a fresh Lovable-AI prompt

CC's Supabase MCP is connected to **buff-mobile** — that project holds a stale snapshot of Lovable's data (188 parent profiles, marketing_consent flags, email_logs), but those are frozen at copy time. The numbers CC produced earlier (24 qualifying / 16 with emails) are based on that snapshot, not on live Lovable. To get the real current cohort, the query must run inside Lovable.

Lovable is a closed AI platform and cannot host an MCP server, so the only way to query its live DB is to ask Lovable's AI to do it.

---

## The prompt — copy this into Lovable chat

```
I need a small, focused CSV export of the migration cohort for our move to the mobile app. This is the list of parents I'll personally email about coming back and getting free-for-life access.

Please generate ONE PostgreSQL query I can run in the Supabase SQL Editor connected to THIS Lovable project, that returns the qualifying cohort defined below. After I run it, I'll click "Download CSV" in the SQL Editor.

═══════════════════════════════════════════════════════════════
COHORT DEFINITION (intersection of three filters)
═══════════════════════════════════════════════════════════════

A parent qualifies if ALL THREE are true:
  1. role = 'parent'
  2. marketing_consent = true                     ← they approved email
  3. their family has at least one role='child'   ← they completed family setup

═══════════════════════════════════════════════════════════════
COLUMNS REQUIRED (one row per qualifying parent)
═══════════════════════════════════════════════════════════════

  email                        — from auth.users.email if available,
                                 otherwise from the most recent
                                 public.email_logs.email_to for this
                                 profile_id (whichever exists)
  email_source                 — 'auth.users' or 'email_logs' or 'missing'
  parent_display_name          — profiles.display_name
  parent_profile_id            — profiles.id (uuid)
  family_id                    — profiles.family_id
  signup_date                  — auth.users.created_at if available,
                                 otherwise profiles.created_at
  last_active_date             — MAX of (pwa_events.created_at,
                                 daily_progress.created_at,
                                 child_vibes.created_at) for this family
  children_count               — COUNT of profiles where role='child'
                                 and family_id matches the parent
  children_names               — STRING_AGG of child display_names
                                 (' | ' separator, comma-replaced)
  is_lifetime_access_on_lovable — current value of profiles.is_lifetime_access
                                 (so we know who already has it set here)
  is_pro_on_lovable             — current value of profiles.is_pro

═══════════════════════════════════════════════════════════════
EXCLUSIONS (do not include test accounts)
═══════════════════════════════════════════════════════════════

  - email or display_name ILIKE '%test%'
  - email or display_name ILIKE '%buffapp.%'
  - display_name LIKE '%אקדא4%'
  - email ILIKE '%@example.com'
  - email ILIKE '%+test@%'

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

  - One row per qualifying parent (the cohort).
  - Header row included.
  - UTF-8 (Hebrew display_names must render correctly).
  - CSV-safe: replace embedded commas/newlines in string fields.
  - ORDER BY signup_date ASC.

═══════════════════════════════════════════════════════════════
ALSO REPORT IN CHAT (in addition to the query)
═══════════════════════════════════════════════════════════════

  1. Total qualifying cohort size.
  2. Breakdown of email_source: how many from auth.users, how many
     from email_logs, how many missing entirely.
  3. Count of parents with marketing_consent = true regardless of
     whether they have kids (the broader "mailing list" universe).
     This should be close to ~49 — sanity check against my records.
  4. Anything you noticed that's worth flagging (e.g. duplicate
     emails, profiles with multiple families, edge cases).

═══════════════════════════════════════════════════════════════
SAFETY
═══════════════════════════════════════════════════════════════

  - Read-only SELECT. No INSERT/UPDATE/DELETE/DDL.
  - Do not modify any data.
  - Do not deploy anything.
```

---

## After Lovable produces the query

1. Run it in the Supabase SQL Editor (the Lovable project).
2. Click **Download CSV** in the SQL Editor toolbar.
3. Save the file as `docs/sessions/beta-2026-06-01/TRACK_5_cohort.csv` in this repo — it's gitignored, will not be committed.
4. Paste Lovable's chat reply (the counts and any flags) into chat with CC so CC has the full picture.
5. Tell CC "CSV saved" — CC reads the file locally and writes the buff-mobile-side seed SQL.

## What CC will do next (no MCP-on-Lovable required)

Once the CSV lands locally:
1. CC reads the cohort emails from the CSV.
2. CC drafts SQL for **buff-mobile** (via MCP):
   - `CREATE TABLE pending_lifetime_grants (email TEXT PRIMARY KEY, source TEXT, granted_at TIMESTAMPTZ DEFAULT NOW())`
   - `INSERT INTO pending_lifetime_grants (email, source) VALUES (...)` — one row per cohort email
   - Extend `handle_new_user` trigger so new signups whose email is in the table get `is_lifetime_access = true` automatically and the row removed from pending.
3. CC shows the migration SQL to Adi for approval before running.
4. After approval, CC runs via MCP (buff-mobile).
5. CC appends the cohort + counts to `INTEGRATION_LEARNINGS.md` as audit trail.

No live Lovable writes ever happen as part of Track 5. Lovable is read-only for this.
