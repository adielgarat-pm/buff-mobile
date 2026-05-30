# Session C — `pkg/child-suggest`

> Open a fresh CC session and paste the block below. Covers IN-2026-05-29-01.
> No dependency on other sessions.

```
Package: pkg/child-suggest. Start in Plan Mode.

Goal: make the child able to suggest a TASK and a REWARD to their parent for approval.
Read docs/INTEGRATION_LEARNINGS.md IN-2026-05-29-01 first. Today both CTAs are dead stubs:
- "Suggest a task to your parent" — GamerTasksScreen.tsx:334-343, onPress is an empty TODO.
- "Suggest a reward to your parent" — GamerRewardsScreen.tsx:294, empty TODO.
Adi confirmed by tapping both: nothing happens. Gamer-mode only; Mint/young-child mode has
no equivalent.

Scope: design + build the suggest→approve flow. Child submits a suggestion → it lands in a
"pending approval" state → parent sees it on a parent surface and approves/declines →
approved items become real tasks/rewards. Cover BOTH tasks and rewards. Extend the entry
point to Mint child mode too, not just Gamer.

Schema: needs a pending-suggestions store (mobile DB, no prod users — CC owns schema per
CLAUDE.md memory). Propose the table/RLS in Plan Mode before applying.

Child-facing copy = simple + inviting; never embed a "why"/rationale in the child's string
(parent-facing, deferred) — see CLAUDE.md memory feedback-kid-task-copy-simple.

VALUES CHECK IS MANDATORY before finalizing — Pillar 3 (child voice) is the upside; Pillar 2
risk is the decline path: a parent "No" must never shame the child. Get Adi's sign-off on the
decline copy. Branch + PR, no direct main.
```
