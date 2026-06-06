# co-parent-join — Improvement Package

**Status:** SPEC drafted (mirrors Lovable), awaiting Adi approval to execute
**Branch:** `pkg/co-parent-join` (worktree off `main` @ `a456fde`)
**Opened:** 2026-06-06
**Origin:** Tamar (user) asked whether her partner can join as a second parent. Adi: "המימוש בלוובל מושלם, אני רוצה פה אותו דבר" → port the Lovable flow to mobile.

## What this package does

Ports Lovable's proven co-parent flow to mobile: a logged-in parent enters another family's existing **6-character code** in **Settings**, and is moved into that family as a **full equal parent** (role preserved) via the **`switch_user_family`** RPC — which also auto-cleans the now-empty old family. Premium becomes **family-wide**.

## Design source of truth

The Lovable web app — `C:\Users\adiel\buff-lovable` (repo `adielgarat-pm/buff`):
- RPC: `supabase/migrations/20260127160241_d9cc400d-*.sql` (`switch_user_family`)
- UI: `src/components/JoinFamilySection.tsx` (in `ParentSettings.tsx:351`)
- i18n: `src/i18n/en.json:596-606` (`joinFamily.*`)

## The three product decisions (Adi, 2026-06-06) — all satisfied by the Lovable model

1. **Join via the existing family code** → `switch_user_family(code)`.
2. **Fully equal parent** → switch preserves `role='parent'`; RLS is family-scoped.
3. **Family-wide subscription** → one-line `useSubscription` fix so parents inherit too.

## Why this is low-risk

- Data model already supports N parents per family (RLS family-scoped; no owner/created_by columns; no `UNIQUE(family_id, role)` ).
- The feature is **already shipped and proven in Lovable** — we are porting, not inventing.
- The switch-model preserves role and the join UI is parent-only → **no privilege-escalation surface**.

## Files

| File | Role |
|---|---|
| `SPEC.md` | Target state + Lovable reference + Values Check |
| `ROADMAP.md` | 2 phases with stop conditions |
| `TESTS.md` | Pass/fail per phase + Lovable parity check |
| `SPEC_SYNC.md` | Canonical docs to update per phase |
| `STATUS.md` | Phase tracker (CC updates on each phase exit) |
