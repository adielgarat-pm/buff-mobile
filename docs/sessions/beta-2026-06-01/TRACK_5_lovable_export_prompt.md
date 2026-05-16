# Track 5 — Lovable Export Prompt

> Copy-paste the block below into Lovable's chat (the buffadhd.com project).
> Lovable will produce a SQL query you can run in the Supabase SQL Editor and download as CSV.
> Hand the resulting CSV to CC (save locally as `TRACK_5_cohort.csv` next to this file — it's already in scope of gitignore plan).

---

## The prompt — copy this into Lovable chat

```
I need a one-time CSV export of the BUFF web (Lovable) user base for migration to the mobile app. Beta users from this list will get free-for-life access on mobile.

Please generate ONE PostgreSQL query I can run in the Supabase SQL Editor (the one connected to THIS Lovable project) that returns one row per parent account, with the columns below. After I run it, I'll click "Download CSV" in the SQL Editor.

═══════════════════════════════════════════════════════════════
REQUIRED COLUMNS (must have — fail loudly if any are missing)
═══════════════════════════════════════════════════════════════

  email                      — from auth.users
  parent_display_name        — from profiles where role='parent'
  parent_user_id             — auth.users.id (uuid)
  family_id                  — profiles.family_id
  signup_date                — auth.users.created_at (ISO date)

═══════════════════════════════════════════════════════════════
NICE-TO-HAVE COLUMNS (include if the column exists; if not, omit
that one column and add a comment noting what you skipped)
═══════════════════════════════════════════════════════════════

  last_active_date           — MAX of (pwa_events.created_at,
                               daily_progress.created_at,
                               child_vibes.created_at) per family
  platform                   — 'ios' | 'android' | 'web' | 'unknown'
                               derived from push_subscriptions.user_agent
                               or pwa_events.user_agent (newest entry wins)
  country                    — if you store it anywhere (locale, IP geo)
  language                   — profiles.language or app_settings.language

  children_count             — COUNT of profiles where role='child' and
                               family_id matches the parent
  children_names             — STRING_AGG of child display_names (comma-sep)
  children_ages              — STRING_AGG of child ages or birth_years

  total_tasks_created        — COUNT from tasks per family_id
  total_rewards_created      — COUNT from store_rewards per family_id
  total_credits_earned       — SUM from credit_vault per family
  total_stickers_earned      — COUNT from stickers per family

  has_completed_family_setup — boolean: family has ≥1 parent profile
                               AND ≥1 child profile
  has_created_first_task     — boolean: tasks count > 0 per family
  qualifies_per_prd_5_2      — boolean: has_completed_family_setup
                               AND has_created_first_task

  beta_survey_response       — if you track survey responses anywhere
                               (table name unknown — skip if not present)

  notes                      — any other free-text or admin-marked field
                               you think is relevant (e.g. admin_notes,
                               feedback, tags)

═══════════════════════════════════════════════════════════════
EXCLUSIONS
═══════════════════════════════════════════════════════════════

Exclude test accounts. Patterns to filter out (per BUFF PRD §5.2):
  - email or display_name ILIKE '%test%'
  - email or display_name ILIKE '%buffapp.%'
  - display_name LIKE '%אקדא4%'   (Hebrew test pattern)
  - email LIKE '%@example.com'
  - email LIKE '%+test@%'

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

- One row per parent account (not per child — children aggregated into
  parent's row).
- CSV-safe: no embedded commas/newlines in string fields (use
  REPLACE if needed).
- ORDER BY signup_date ASC.
- Header row included.
- UTF-8 encoding (Hebrew names must render correctly).

═══════════════════════════════════════════════════════════════
ALSO TELL ME
═══════════════════════════════════════════════════════════════

After the query, list:
1. Which NICE-TO-HAVE columns you omitted because the schema doesn't
   support them.
2. Any additional columns you THINK would be useful that I didn't ask
   for (e.g. things you know about the user base that I'm forgetting).
3. The expected row count (run a quick SELECT COUNT — should be ~49
   per my records).
4. Whether there are any orphaned children (role='child' with no parent
   profile in the same family_id) — these need separate handling.

Do NOT modify any data. Read-only SELECT only. No INSERT, UPDATE,
DELETE, or DDL.
```

---

## After Lovable produces the query

1. Run it in the Supabase SQL Editor (the Lovable project, NOT buff-mobile).
2. Download as CSV from the SQL Editor toolbar.
3. Save the file as `docs/sessions/beta-2026-06-01/TRACK_5_cohort.csv` in this repo (CC will add a gitignore entry first so it never gets pushed).
4. Tell CC "CSV is saved" — CC will read it locally and queue Phase 0.

## If Lovable pushes back

Common cases:
- **"I don't know what platform a user is on"** — fine, skip the platform column. Mobile users who haven't used buff-mobile yet will be tagged platform=unknown anyway.
- **"You're asking me to query auth.users which I don't have access to"** — tell Lovable to use the equivalent in their schema (might be `users` table or a view). The Lovable Supabase typically exposes `auth.users` via RLS-bypassed admin queries; if Lovable AI refuses, run the query in the Supabase SQL Editor directly as the project owner (you).
- **"Some columns produce NULLs for most users"** — that's fine, include them as NULL. CC will treat NULL = unknown.
