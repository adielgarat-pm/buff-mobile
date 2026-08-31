# Stuck-Registrations Analysis — 2026-08-31

> Data investigation behind `SPEC.md`. Source: Supabase `buff-production` (`gfrongfnyigxsexuofrg`) + code cross-check.
> All numbers below are anchored to a query or a file:line.

## Data caveats (read first)

1. **All-time tables are polluted by test/seed data.** 249 parent profiles / 250 families exist, but only
   **60 parent profiles are linked to a live `auth.users` row** (query: `parent_profiles_with_live_auth`).
   ~76% of historical parent profiles point to deleted/test users. → All "all-time" totals (e.g. "138 empty
   families") are unreliable. Analysis relies on the **auth-linked cohort, last 60 days**.

2. **`profiles.onboarding_step` and `profiles.is_activated` are dead columns.** They read `0` / `false` for
   every parent who signed up since ~early June — including families with 3 active children. Repo-wide grep
   (`grep -rn "onboarding_step\|is_activated" src`) returns **zero writes** anywhere in the codebase. They were
   written by an older build and abandoned in the unified-onboarding rewrite. Any KPI/dashboard reading them is
   wrong.

## The funnel (auth-linked parents, last 60 days)

| Stage | Count | Retention | Source |
|---|---|---|---|
| Signed up (auth) | 27 | — | `auth.users` where email not like `%@buff.app` |
| Created profile + family | 25 | 93% | `profiles` role=parent |
| **Added a child** | **20** | **80%** | `profiles` role=child in family |
| Child has tasks | 20 | 100% (auto) | `tasks.assigned_to` |
| Child actually used it | 9 | 45% | `daily_progress.child_id` |

Auth itself is not a bottleneck: every signup confirms email and signs in (weekly `auth.users` breakdown).
Note: child accounts authenticate as `child+…@buff.app` (21 of 22 have a child profile) — they must be
excluded from parent-funnel counts or they inflate the "no profile" bucket.

## Stuck points, ranked

### 🔴 1. "Family created, no child added" — ~20%, the dominant leak (structural)
- `family_created` fires automatically at signup: `src/contexts/AuthContext.tsx:631` (and `AuthCallbackScreen.tsx:125`).
- `child_created` fires only at **Step 5** of the wizard: `src/screens/onboarding/unified/UStep5_Preview.tsx:274`,
  via RPC `create_child_profile`.
- Steps 1–4 data (name, age, gender, birthday, goal, challenges, motivator) live **only in nav params** —
  never persisted until Step 5 assembles `pro_settings` and calls the RPC (`UStep5_Preview.tsx:~205–274`).
- No mid-wizard abandonment logging: `onboarding_abandoned_at_step` is declared in `onboardingFunnel.ts` but
  **never fired** (grep confirms).
- Evidence: the two newest signups (Aug 29 & 30) each have exactly one event — `family_created` — and nothing
  after. One (Aug 5) reached parent tabs (`parent_tab_viewed`, `capture_entry_seen`) but still added no child.
- **Constraint discovered:** the RPC's AFTER-INSERT triggers seed buddy_relationships + default tasks/rewards +
  credit_vault, and UStep5 then inserts challenge-based tasks. So "just move the RPC to Step 1" would
  double-seed / seed on incomplete data. → the SPEC uses a **draft** approach instead.

### 🟠 2. "Authenticated, no profile at all" — ~7–10%
- e.g. `1ea01415` (email signup, gmail): auth row exists, zero profile, `last_sign_in - created_at = 0s`.
  Either a post-auth bootstrap failure or an instant bounce. 2 of 27 in the recent cohort; 7 of 68 all-time.
- Out of scope for this package (separate bootstrap-guard package).

### 🟡 3. Orphan children (`family_id IS NULL`) — 3 rows
- Matches the known ChildJoin duplicate/orphan bug (IN-2026-05-14-03). Owned by existing
  `childjoin-claim-orphans` package.

### (engagement, beyond registration) "Child created but never used" — 55%
- 20 families added a child; only 9 produced any `daily_progress`. Not onboarding — separate engagement work.

## Zero-schema-change confirmation (enables the fix without Supabase approval)
- `onboarding_events` INSERT policy: `with_check = (family_id = get_my_family_id())`; `event_type` is free text.
- `profiles` UPDATE policy `Users can update their own profile`: `user_id = auth.uid()` → parent may write
  `profiles.onboarding_data` (existing jsonb column). No new table/column/constraint needed.
