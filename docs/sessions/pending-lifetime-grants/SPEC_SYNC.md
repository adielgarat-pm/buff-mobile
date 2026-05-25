# pkg/pending-lifetime-grants — SPEC SYNC

> Which canonical docs must be updated at each phase exit.

## Per-phase sync targets

| Phase | Canonical docs to update | Why |
|---|---|---|
| 0 | — | Scaffold only, no canonical impact |
| 1 | — | DB mechanism with no PRD-level feature surface |
| 2 | — | Test suite is package-local |
| 3 | `docs/INTEGRATION_LEARNINGS.md` (new entry IN-2026-05-25-01); `docs/sessions/beta-2026-06-01/TRACK_5_findings.md` (closing note) | Long-term memory + reference the now-shipped Option B |

## Canonical docs intentionally NOT updated

| Doc | Why not |
|---|---|
| `BUFF_PRD.md` | This is a one-time migration assist, not a permanent product feature. PRD doesn't describe the cohort migration mechanics. |
| `BUFF_BUDDY_SYSTEM.md` | No BUDDY impact. |
| `BUFF_GAP_ANALYSIS.md` | Not a gap closure — this is a launch-prep mechanism. |
| `BUFF_FEATURE_PRIORITIZATION.md` | Not a user-facing feature. F-075 (Lovable sunset white-glove) was already revised on 2026-05-14; this package implements the auto-grant piece of that workstream but doesn't change F-075's priority/scope. |
| `BUFF_VALUES.md` | Adi-only doc; values unchanged. |
| `BUFF_DECISIONS_LOG.md` | Adi-only — CC writes draft in STATUS.md, Adi copies. |
| `CLAUDE.md` | Project rules unchanged. |
| `docs/WORKFLOW.md` | Workflow unchanged. |
| `docs/ARCHITECTURE.md` | (If created) — this is a single trigger + table, not architectural shift. Could optionally add a 1-line note re: DB triggers when ARCHITECTURE.md exists. |

## Rationale

This package is intentionally surgical: one table, one trigger, two functions, ZERO client changes, ZERO PRD-level feature commitment. The only long-term docs that need to retain memory of it are INTEGRATION_LEARNINGS (so future-CC knows the trigger exists on `profiles`) and TRACK_5_findings (so the cohort discovery thread has a closure note).
