# Track 5 — Cohort Lifetime Access

**Status:** `blocked-redesign` (2026-05-16: CC discovery on mobile DB invalidated the original framing — see [TRACK_5_findings.md](./TRACK_5_findings.md). Lovable users have no `auth.users` rows on mobile yet, so there is nothing to UPDATE. Recommended path: spin up `pkg/pending-lifetime-grants` instead.)
**Owner:** Adi (PM) + CC (executor)
**Target:** before 2026-06-01 beta launch
**Mode:** PLAN — no SQL runs until Adi says `approved, proceed`

---

## Goal

Set `profiles.is_lifetime_access = true` for a cohort of beta accounts so they bypass the paywall permanently (free-for-life thank-you per D-2026-05-01-03).

---

## Anchored facts (verified)

- **Column exists.** `profiles.is_lifetime_access` (boolean), read at [src/hooks/useSubscription.ts:87](../../../src/hooks/useSubscription.ts:87), typed at [src/contexts/AuthContext.tsx:26](../../../src/contexts/AuthContext.tsx:26).
- **Semantic.** Priority 1 of the subscription gate per [useSubscription.ts:9](../../../src/hooks/useSubscription.ts:9) — `true` means "always subscribed, never sees paywall." Reversible via UPDATE.
- **Existing precedent.** D-2026-05-01-03 in `BUFF_DECISIONS_LOG.md` established this as the founding-member mechanism (`useSubscription.ts:81` reference).
- **PRD §5.2** specifies qualification criteria (family + child setup + ≥1 task) for beta lifetime grants.
- **Supabase MCP is live and pre-scoped** to one project (assumed mobile project — needs Adi confirmation).

---

## ❌ Blocker — required from Adi before any work proceeds

### 1. The CSV
Drop the cohort emails as a fenced block in chat, or commit them as `TRACK_5_cohort.csv` next to this file (Adi-only; CC will not commit emails without explicit go-ahead — PII).

### 2. Open questions — Adi's answers (2026-05-16)

| # | Question | Answer | Resulting plan decision |
|---|---|---|---|
| Q1 | Confirm Supabase MCP is scoped to the **mobile** project (not Lovable). | ✅ **buff-mobile** | Will execute against the MCP-scoped project; will run a sanity SELECT in Phase 0 confirming we're on the mobile DB before any writes. |
| Q2 | Trust CSV blindly, or cross-check PRD §5.2 criteria? | ✅ **Trust** | No qualification `WHERE` clause. UPDATE applies to every resolved profile in the cohort, regardless of family/task state. |
| Q3 | Parents only, or include children? | ✅ **Both** | Algorithm: cohort email → `auth.users.id` → parent profile → `family_id` → flag ALL profiles in that family (parent + children). Children typically lack their own email, so the email-only match would miss them. **Surface to Adi if this family-fanout interpretation is wrong.** |
| Q4 | Touch `is_lifetime_founding` + `founding_member_number`? | ✅ **No, only `is_lifetime_access`** | Hard-coded: UPDATE statement touches that one column only. |
| Q5 | Promote to its own session folder, or execute from this draft? | ✅ **Execute from this draft** (CC recommended, Adi accepted 2026-05-16) | Audit trail goes to `INTEGRATION_LEARNINGS.md` in the same commit as the UPDATE — cohort + before/after counts + resolved family roster. No SPEC/ROADMAP/TESTS scaffolding. |

---

## Proposed phases

All SQL queued, none executed. CC will show each query before running.

### Phase 0 — Discovery (read-only)

1. `list_tables` on `public` + `auth` to confirm `profiles` ↔ `auth.users` join (`profiles.user_id = auth.users.id`, presumably) and whether `profiles` has its own `email` column.
2. ONE count SELECT: of the N input emails, how many resolve to `auth.users` rows, and how many of those have a `profiles` row.

### Phase 1 — Gap report (read-only)

Per Q3, the unit of flagging is the **family**, not the individual email. Buckets work at family resolution:

| Bucket | Definition | Action |
|---|---|---|
| **A — Ready** | Email → `auth.users` → parent `profiles` row → `family_id` → ≥1 profile in family with `is_lifetime_access ≠ true` | Flag all family profiles in Phase 2 |
| **B — Already flagged** | All profiles in the family already have `is_lifetime_access = true` | No-op |
| **C — No account** | Email not in `auth.users` | **Gap surfaced** — needs Phase 3 policy |
| **D — Orphan profile** | `auth.users` exists, no `profiles` row | Data-integrity question — surface to Adi (related to open FLAG IN-2026-05-14-03 ChildJoin duplicates) |
| **E — Parent profile but no `family_id`** | Profile exists but is unattached to a family | Flag parent only; surface to Adi as data-quality flag |

Report saved to this folder as `TRACK_5_gap_report.md`, with one row per cohort email + the resolved family roster (parent name + child count) so Adi can sanity-check before Phase 2 commits.

### Phase 2 — Update (Bucket A only, family-fanout)

```sql
BEGIN;
UPDATE profiles
SET is_lifetime_access = true
WHERE family_id IN (<resolved family_id list from Phase 1>)
  AND is_lifetime_access IS DISTINCT FROM true;
-- Verify row count matches the parent + child total reported in the gap report
COMMIT;
```

Bucket E (parent without family) falls back to `WHERE id IN (<parent profile ids>)` — handled as a separate small UPDATE.

Idempotent. Re-running is safe. CC shows exact SQL with the resolved `family_id` list (+ family roster preview) before COMMIT.

### Phase 3 — Bucket C policy (the gap Adi pre-flagged)

Three options — Adi picks:

- **(i) Defer.** Do nothing. They'll sign up later, hit the paywall, get flagged manually then.
- **(ii) Pending-grants table** (`pending_lifetime_grants(email PK, granted_at)`) + extend the `handle_new_user` trigger to flag `is_lifetime_access = true` on profile creation if `auth.users.email` is in the table. **Requires schema change → graduates to its own Improvement Package per CLAUDE.md.**
- **(iii) Manual catch-up.** Adi pings each Bucket C email; CC flags them after signup.

**CC recommendation:** (ii) if cohort > 10 unmatched, (iii) otherwise. Can't decide without seeing the CSV.

### Phase 4 — Verification

- SELECT `COUNT(*) WHERE is_lifetime_access = true` before/after — sanity check.
- For each cohort email: confirm flag state.
- Append cohort + grant date to `docs/INTEGRATION_LEARNINGS.md` (audit trail).
- Update this Track doc status to `done` and the umbrella README table.

---

## Out of scope

- Touching `is_lifetime_founding` or `founding_member_number` (Q4).
- Modifying RLS, triggers, or any other schema (unless Phase 3 option (ii) is approved — and that promotes to its own package).
- Granting access to any account not in the CSV.
- Modifying useSubscription.ts logic or AuthContext types.

---

## Risks

| Risk | Mitigation |
|---|---|
| Flagging wrong accounts (typo in CSV) | Phase 1 gap report shows Adi the resolved list before Phase 2 runs |
| Running against Lovable DB instead of mobile DB | Q1 forces explicit confirmation |
| Cohort member signs up after flagging — flag silently dropped | Phase 3 option (ii) closes this; otherwise documented in INTEGRATION_LEARNINGS |
| PII (emails) committed to repo | CC will NOT commit the CSV; Adi keeps it locally or in a gitignored file |

---

## When this Track unblocks

Q1–Q5 all answered ✅ (2026-05-16). Only remaining input:
1. **Cohort CSV** — to be produced by Lovable per [TRACK_5_lovable_export_prompt.md](./TRACK_5_lovable_export_prompt.md), saved locally at `TRACK_5_cohort.csv` (gitignored — see `.gitignore` entry).

When CSV lands, CC will:
- Update Status to `ready`
- Push an updated draft with Phase 0 SQL queued for review
- Wait for `approved, proceed` before running anything
