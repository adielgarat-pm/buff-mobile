# Session D — `pkg/money-conversion-reward`

> Open a fresh CC session and paste the block below. Covers IN-2026-05-29-03.
> No dependency on other sessions. Touches onboardingData.ts (REWARD_PICKS / MOTIVATORS) —
> if pkg/onboarding-starter-tasks (PR #120) merges first, rebase (no overlap expected: #120
> changed STARTER_TASKS_BY_CHALLENGE, not REWARD_PICKS).

```
Package: pkg/money-conversion-reward. Start in Plan Mode.

Goal: let a money-motivated child of ANY age earn a "convert BUFFs → money" reward, with a
parent-controlled, deliberately-high exchange rate so it stays cheap for the parent.
Read docs/INTEGRATION_LEARNINGS.md IN-2026-05-29-03 first. Today the reward
"Convert BUFFs to money" (pr_4, onboardingData.ts:317) exists ONLY under motivator
'privileges' AND age 15-18; there is no money/earning motivator; the cost uses the generic
calcRewardCredits (no money-specific rate).

Scope (confirm which parts with Adi in Plan Mode — could be a/b/c or a subset):
a. Make the money-conversion reward reachable for money-motivated kids at any age.
b. Add a money/earning motivator (or a way to signal it) to MOTIVATORS in onboardingData.ts.
c. Add a configurable, deliberately-high BUFFs→money exchange rate (parent-set ₪ per N BUFFs)
   so the parent controls real-money exposure — distinct from the generic credit cost.

VALUES CHECK IS MANDATORY — real money is the most extrinsic reward in the app (Pillar 1):
it must be parent-configured and framed as the child's own chosen goal, never a default.
Branch + PR, no direct main.
```
