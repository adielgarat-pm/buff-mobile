# Track 4c — Cohort Export Guide

**Status:** `ready — Adi action`
**Purpose:** Quick procedural so the cohort CSV pull doesn't bottleneck Track 5 (`funny-maxwell`)
**Time estimate:** ~10 min total
**Drafted:** 2026-05-16 by CC

---

## Why this exists

Track 5 (`funny-maxwell` worktree) is blocked on the cohort CSV. PII (emails) shouldn't be committed to the repo. This doc walks you through the export, the local-only save, and what to hand to `funny-maxwell`.

---

## Step 1 — Pull the export from Lovable admin

1. Sign into [lovable.dev](https://lovable.dev) (or wherever the buff.lovable.app admin lives) with the account that owns the BUFF Lovable project.
2. Navigate to the **Supabase tab** (Lovable wraps its own Supabase instance — different from the mobile project).
3. Open **Table Editor** → select the table that holds sign-ups. Based on PRD §9.4 / IN-2026-05-14-02 RESOLVED, this is likely **`auth.users`** or a `profiles`-equivalent table.
4. Click **Export → CSV**. You want at minimum: `email`, `created_at`, `display_name` (if present).
5. Save the file as **`cohort-raw.csv`** to `C:\Users\adiel\Desktop\` (or anywhere local — just **not inside the repo**).

> **If the export option isn't available** from Lovable's wrapped UI: open the Lovable Supabase dashboard directly (separate URL — Adi has the login). Run this SQL in the SQL Editor:
>
> ```sql
> SELECT email, created_at, raw_user_meta_data->>'display_name' as name
> FROM auth.users
> ORDER BY created_at;
> ```
>
> Then download as CSV from the result panel.

---

## Step 2 — Quick triage (5 min)

Open the CSV in Excel / Google Sheets / Numbers. Eyeball the list for:

| Pattern | What to do |
|---|---|
| Email matches `test*`, `*@buffapp.*`, `אקדא4*` (per PRD §9.2 cleanup criteria) | **Delete row** — these are test accounts |
| Email is yours (`adi.elgarat@gmail.com`, `adi@buffadhd.com`) | **Delete row** — you don't need to send yourself the migration email |
| Email is Itay's or Emi's | **Delete row** — they're already in |
| Looks real | **Keep** |
| Duplicate emails | Keep the earliest `created_at` |

Expected result: ~45-49 rows after cleaning. Save as **`cohort-final.csv`**.

---

## Step 3 — Hand off to `funny-maxwell`

The Track 5 session is blocked on three things — once you have `cohort-final.csv`:

1. **Open the `funny-maxwell` CC window.**
2. Tell it (paste this verbatim, adjusting where needed):

```
Cohort CSV ready. File at C:\Users\adiel\Desktop\cohort-final.csv (gitignored
location — do NOT commit it).

Answers to your 5 open questions:
  Q1: Supabase MCP is scoped to the mobile project (confirmed)
  Q2: trust the CSV — I've already triaged
  Q3: parent profiles only, not children
  Q4: only is_lifetime_access — leave is_lifetime_founding and
      founding_member_number alone
  Q5: execute from this draft — it's reversible UPDATE, not schema change

Commit + push your current draft first (it's still uncommitted on
claude/funny-maxwell-dca4a5), then proceed with Phase 0 — Discovery.
```

3. Wait for `funny-maxwell` to come back with the Phase 1 gap report (Bucket A / B / C / D table) before approving any UPDATE.

---

## Step 4 — Keep the CSV out of the repo

**Never commit `cohort-raw.csv` or `cohort-final.csv` to git.** They contain PII.

If you accidentally save into the worktree:

```powershell
# Verify nothing got staged:
git status

# If you see cohort-*.csv listed — move it out:
Move-Item "cohort-*.csv" "C:\Users\adiel\Desktop\"

# Then add to .gitignore (one-line entry) — CC can do this in a separate
# tiny commit if you want belt-and-suspenders protection.
```

---

## Open question for Adi

| Q | Why it matters |
|---|---|
| Does the Lovable export include `created_at` reliably? | If yes, Phase 1 gap report can sort founding-members by recency. If no, all 49 get the same treatment. Minor — doesn't block. |

---

## What this guide is NOT

- ❌ Not a substitute for `funny-maxwell`'s gap-report phase — that's where mismatched / unmatched accounts get surfaced
- ❌ Not the lifetime-flag-flip itself — that's Track 5's job once it has the CSV
- ❌ Not the migration-email send — that's Track 4b (separate doc, separate moment)

After this, the dependency chain is unblocked:

```
Adi exports CSV  →  funny-maxwell flags accounts  →  hardcore-jones ships AAB  →  Adi sends migration email
```
