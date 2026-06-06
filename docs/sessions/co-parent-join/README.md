# co-parent-join — Improvement Package

**Status:** SPEC drafted, awaiting Adi approval to execute
**Branch:** `pkg/co-parent-join` (worktree off `main` @ `a456fde`)
**Opened:** 2026-06-06
**Origin:** Tamar (user) asked whether her partner can join as a second parent — "האם הוא יכול להתחבר עם גוגל OAuth כהורה וגם עם קוד המשפחה?" Adi prioritized for urgent implementation.

## What this package does

Lets a **second parent** (a spouse/partner) join an **existing family** with their **own Google account**, as a **full, equal co-parent**, by entering the family's existing 6-character code. Also makes premium entitlement **family-wide** so the second parent inherits the family's plan.

## The three product decisions (Adi, 2026-06-06)

1. **Join mechanism** → reuse the **existing family code** (matches Tamar's mental model; fastest).
2. **Permissions** → **fully equal parent** (RLS already supports it; no new permission layer).
3. **Subscription** → **family-wide** — if any parent is premium, both parents (and children) are premium.

## Files

| File | Role |
|---|---|
| `SPEC.md` | Target state + Values Check + behavior contract |
| `ROADMAP.md` | 3 phases with stop conditions |
| `TESTS.md` | Pass/fail criteria per phase |
| `SPEC_SYNC.md` | Which canonical docs update per phase |
| `STATUS.md` | Phase tracker (CC updates on each phase exit) |

## Key finding (de-risks the package)

The data model **already supports multiple parents per family**: all RLS is scoped by `family_id`, there are no `owner_parent`/`created_by` authorization columns, and no `UNIQUE(family_id, role='parent')` constraint. The work is almost entirely client-side + one SECURITY DEFINER RPC. See `SPEC.md` § Behavior Contract.
