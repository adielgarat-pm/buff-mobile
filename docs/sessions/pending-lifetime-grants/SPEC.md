# pkg/pending-lifetime-grants — SPEC

> Target state for this package. Authoritative until canonical docs are synced.

---

## Capabilities & Bottlenecks

### Claude.ai (design)
- Designed scope, decisions, Values Check; not involved in execution turn-by-turn.

### Claude Code (CC) — does
- Writes `migrations/015_pending_lifetime_grants.sql` (repo source of truth)
- Applies same migration to live mobile DB via `mcp__supabase__apply_migration` (per feedback_mobile_db_no_prod_users)
- Generates seed from `email_logs` cohort query
- Runs 6 idempotency SQL tests in rolled-back transactions
- Writes all session docs, INTEGRATION_LEARNINGS entry, decision draft
- Opens PR

### Adi — does herself
1. Approves the plan (`approved, proceed`)
2. Reviews and merges the PR
3. Runs Verify-Before-Delete protocol after merge
4. Copies decision draft into `BUFF_DECISIONS_LOG.md` (CC never writes there)
5. Verifies on Android emulator (Hat 3) — see TESTS.md Phase 4

### Bottlenecks
- None. Mobile DB has no prod users → safe direct apply.
- Time-sensitive: the open-grant window activates 2026-05-30; merge before then to catch beta-day-0 signups.

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without virtual reward?** — N/A. Parent-facing entitlement; child has no visible touchpoint.
2. **Does it move the child toward a self-chosen real-world reward?** — Indirectly yes: keeps Lovable families on BUFF without paywall friction, so the parent-chosen task→reward loop continues.
3. **Does success feel like "I want to" or "I have to"?** — N/A.

### Pillar 2 — Positive Coaching
1. **Could wording shame, compare, or frame as failure?** — No user-facing strings. Grant is silent.
2. **If user "fails" (no email match), is response empathy or pressure?** — Empathy: window grant catches everyone in beta. Post-window, standard paywall — no "you weren't on the list" messaging.
3. **Is there a loss / suffering / anger mechanism?** — No. Pending-grants only adds entitlements; never removes them.

### Pillar 3 — Independence-Building
1. **Does it make the child more capable WITHOUT the app, or more dependent ON it?** — N/A (parent mechanism).
2. **Does the child have a voice?** — N/A.
3. **In 6 months, still necessary?** — No, by design. Once cohort + window consumed, table dormant. One-shot migration assist; "scaffold that fades."

✅ **Values Check passes.** No pillar conflicts.

---

## Goals

1. Every Lovable migrant whose email is in the cohort gets `is_lifetime_access=true` automatically on first mobile signup — **no manual flagging required.**
2. Every parent who signs up in the beta window 2026-05-30 → 2026-06-30 also gets lifetime access — catches WhatsApp newcomers without an email match and the 8 cohort members with no recoverable email.
3. Mechanism is **idempotent**, **case-insensitive**, **trim-safe**, and survives re-runs of the migration without corruption.
4. Zero impact on existing flows: client code (`AuthContext.tsx`, `useSubscription.ts`, paywall) unchanged.

## Non-goals

- Lovable family / task / reward data migration (separate concern per TRACK_5_findings open question #1)
- Email comms to the cohort (separate Track in `docs/sessions/beta-2026-06-01/`)
- Revoking lifetime access (out of scope — pending table only grants)
- Admin UI for managing pending grants (Adi uses Supabase SQL directly when needed)
- Notifying users that they received a grant (silent by design)

---

## Behavior Contract

**After this package ships, end-to-end behavior is:**

### Scenario A — Cohort migrant with seeded email
1. Tali (cohort member, email `talikosher@gmail.com` in seed) installs the mobile APK.
2. She taps "Sign up with Google" and authenticates with the same Google account she used on Lovable.
3. `auth.users` row created.
4. After onboarding she lands on a screen that creates her parent profile (existing flow, untouched).
5. AFTER INSERT trigger fires on `public.profiles`.
6. `grant_lifetime_if_pending(NEW.id)` joins to `auth.users.email`, finds `talikosher@gmail.com` in `pending_lifetime_grants`, **DELETEs the pending row, UPDATEs profile.is_lifetime_access=true**.
7. `useSubscription.ts:87` reads the updated `is_lifetime_access`. She never sees a paywall, no 2nd-child gate.

### Scenario B — WhatsApp newcomer in the beta window
1. Yuval (joined WhatsApp 2026-05-30, no email on Adi's mailing list) installs APK 2026-06-05.
2. Signs up with Google → profile created.
3. Trigger fires. `grant_lifetime_if_pending` returns false (no match).
4. `grant_lifetime_if_in_window` fires: NOW() is between 5/30 and 6/30, profile.role='parent', not yet lifetime → **UPDATE is_lifetime_access=true**.
5. Same paywall-bypass behavior.

### Scenario C — Random Google signup outside the window
1. Someone discovers BUFF via Play Store on 2026-07-15. Signs up.
2. Trigger fires. Both functions return false (no email match + outside window).
3. Profile remains `is_lifetime_access=false`. Standard subscription flow applies (free 1 child, paywall for 2nd).

### Scenario D — Cohort member with different Google account
1. Inbal (email in seed: `kleinbal@gmail.com`) installs APK but signs up with a different Google account `inbal.k@gmail.com`.
2. Trigger fires. `grant_lifetime_if_pending` returns false (email mismatch).
3. **BUT** if she signs up before 6/30, `grant_lifetime_if_in_window` catches her → granted.
4. After 6/30, she falls to manual grant (Adi adds her email to pending; trigger only fires on INSERT, so requires a follow-up flow OR Adi runs `SELECT grant_lifetime_if_pending(profile_id)` manually).

### Scenario E — Backfill on migration apply
1. (Unlikely) An existing parent profile (e.g., `adi.elgarat@gmail.com`) has `auth.users.email` matching a seeded pending email.
2. Migration's backfill step UPDATEs `is_lifetime_access=true` and DELETEs the pending row.
3. Idempotent: re-running the migration finds nothing to backfill.

---

## Schema Changes

### New table
```
public.pending_lifetime_grants
  email       TEXT PRIMARY KEY
              CHECK (email = lower(email))           -- enforced lowercase
              CHECK (email = btrim(email))            -- enforced no whitespace
  source      TEXT NOT NULL
              CHECK (source IN ('mailing_list_49', 'whatsapp_new_join', 'manual'))
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  notes       TEXT NULLABLE

  INDEX pending_lifetime_grants_source_idx (source)
  RLS:        ENABLED, no policies → deny all to anon/authenticated;
              service_role bypasses RLS (so the trigger functions, running SECURITY DEFINER, can read/write)
```

### New functions (SECURITY DEFINER, `search_path = public, pg_catalog`)
- `public.grant_lifetime_if_pending(p_profile_id UUID) RETURNS BOOLEAN`
- `public.grant_lifetime_if_in_window(p_profile_id UUID) RETURNS BOOLEAN`
- `public.tg_profiles_after_insert_grant_lifetime() RETURNS TRIGGER`

### New trigger
- `tg_profiles_after_insert_grants AFTER INSERT ON public.profiles FOR EACH ROW`

### Existing columns referenced (unchanged)
- `public.profiles.is_lifetime_access` (boolean, NOT NULL, default false)
- `public.profiles.user_id` (uuid, nullable)
- `public.profiles.role` (text)
- `auth.users.email` (text — joined via `user_id`)
- `public.email_logs.email_to` (text — seed source)

### No schema changes to
- `public.profiles` columns
- `auth.users`
- `public.families`
- Any RLS policy beyond the new table

---

## Prompts Changes

None. No prompts involved.

---

## API / Route Changes

None. No new RPCs, no new client-callable functions. All logic fires via the AFTER INSERT trigger.

---

## UI Changes

None. Silent grant. No banner, no toast, no notification.

---

## Open Questions

All resolved before this SPEC was written (see Decisions in plan file). Recorded here for traceability:

| Q | Resolution |
|---|---|
| Open beta window 5/30–6/30 — auto-grant to all signups, or whitelist only? | **YES, open window.** (D1, 2026-05-25) |
| Backfill existing matched profiles in the migration? | **YES.** (D2, 2026-05-25) |
| Trigger location? | **AFTER INSERT on `public.profiles`** (D3, 2026-05-25) |
| Migration number? | **015** (next free in repo after 014) |
| 8 cohort members without recoverable email? | Covered by D1 if they sign up in window; otherwise Adi inserts manually post-window |

---

## Out of Scope (explicit)

- ❌ Modifying `auth.users` triggers (none exist; we don't add one)
- ❌ Modifying `handle_new_user` (doesn't exist; we don't create it under that name — we create `tg_profiles_after_insert_grants` on profiles)
- ❌ Client-side changes to `AuthContext.tsx`, `useSubscription.ts`, paywall, onboarding
- ❌ Email comms to cohort (separate Track in beta-2026-06-01)
- ❌ Lovable user-data migration (families/tasks/rewards)
- ❌ Revocation mechanism (lifetime is permanent — Adi can manually `UPDATE` if ever needed)
- ❌ Admin/manual-grant UI
- ❌ ChildJoin / orphan claim logic (separate package, already merged)
- ❌ Sentry / EAS / push (paused, separate package)
- ❌ Cleaning up the open-window function after 2026-06-30 (it self-disables; no migration to revert)
