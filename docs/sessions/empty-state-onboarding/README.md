# pkg/empty-state-onboarding

**Status:** Code complete on `pkg/empty-state-onboarding` — pending Adi Hat-4 device verification + PR merge.
**Opened:** 2026-05-28
**Branch:** `pkg/empty-state-onboarding`

## Problem
When an existing child has **0 tasks**, the parent's Tasks tab shows only a neutral
"No tasks for this child." line — a dead end. There was no way to give that child
starter tasks short of creating a brand-new child via onboarding.

## Solution
Add a primary CTA to the ParentTasksScreen empty state ("Set up tasks for {name}")
that launches the existing challenge-selection flow for **that existing child**.
A new `existingChildId` param threads through onboarding; UStep5 attaches tasks +
rewards to the existing profile instead of creating a duplicate one, then returns
the parent to the Tasks tab.

## Files
| File | Role |
|---|---|
| `SPEC.md` | Target state + Capability Check + Values Check + decisions |
| `ROADMAP.md` | Single phase, stop conditions |
| `TESTS.md` | Pass/fail criteria + Supabase verification queries + Hat-4 items |
| `SPEC_SYNC.md` | Canonical docs touched |
| `STATUS.md` | Phase status, commit, tests, learnings link |

## Related
- `docs/INTEGRATION_LEARNINGS.md` F-2026-05-18-01 (child-side empty Dashboard — adjacent, not resolved here)
- CLAUDE.md FLAG / IN-2026-05-14-03 (ChildJoin duplicate-profile bug — the `existingChildId` guard avoids creating a second profile)
