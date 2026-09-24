# Freemium v2 + Edit Focus — SPEC

> Approved by Adi 2026-09-23 (design by CC, answers Q1–Q7 recorded below).
> Source research: `docs/research/FREEMIUM_STRATEGY_2026-09.md`, `docs/research/DRAFT_DECISION_freemium_v2.md`.
> Branch: `claude/zen-wright-z824s2` (coordinator opens the PR).

## 1. Target state

### FREE forever (never gated)
Tasks (no cap), unlimited children, BUDDY + skins, BUFFs / shop / redemption,
Vibe Check / SOS / Pause / Anchor, notifications, manual timetable, activities,
bag prep, off-routine, the Insights screen stats,
and the new **Edit focus** flow.

### PAID — "BUFF Coach" (price unchanged: $9.99/mo, $59.99/yr; Founding-100 kept — Q4)
- AI coach / smart insights (`generate-child-insights`)
- AI timetable import (`parse-schedule`) — one free import day per family, then BUFF Coach (Adi 2026-09-24, supersedes Q1)
- AI capture, photo/text → tasks (`parse-capture`)

### Reverse trial
- Every family gets 14 days of BUFF Coach, starting at the child's **first real
  completed task** (`daily_progress.completed = true`).
- The onboarding "first task together" seed row (`source = 'onboarding_first_task'`)
  does **not** start the trial (Q3).
- Families with no trial ever granted — including pre-2026-07-01 families whose
  `trial_started_at` was only backfilled — become eligible (Q5), handled
  conservatively in the migration.
- Mechanism: existing trigger `start_trial_on_activation` (migration 037), body
  changed. Sets `families.trial_started_at` once and
  `premium_until = GREATEST(premium_until, now()) + 14d` on all parents.
- After the trial: **one free AI insight per child per week** (Q2), no other change.

### Paywall placement
- Never in onboarding, never to a child (PaywallChildGate).
- Only when a parent taps an AI action after the trial, plus one soft end-of-trial note.

### Trial moments (dashboard card, one-time each, dismissible) — copy approved
- started / ending (≤ 4 days left) / ended (+ [Keep BUFF Coach] [Close]).
- No loss/shame framing (Pillar 2).

### Edit focus (FREE)
- Entry: Edit Child → "Focus & rewards". Never in the onboarding stack.
- One page: main focus (single), other areas (multi), motivators (multi), prefilled.
- Save merges into `pro_settings.onboarding_data` (original kept once in
  `pro_settings.onboarding_data_initial`).
- Then optional suggestions (new tasks + rewards not already present), all
  **unchecked by default** (Q6). "Add selected" only INSERTs; "Skip" adds nothing.
  Nothing existing is ever edited or deleted.

## 2. Out of scope
- landing-web, guides, BUFF_MESSAGING/FAQ, Play listing (marketing session).
- `ParentInsightsScreen` gating on `isSubscribed` instead of `insightsUnlocked` (follow-up).
- Telemetry table for trial events (needs schema approval).

## 3. Values Check (design time)

| Pillar | Q | Answer |
|---|---|---|
| 1 Intrinsic | Would the child want it without a virtual reward? | Child loop untouched; money never touches the child's screens (child role never sees Paywall or trial card). |
| 1 Intrinsic | Reward chosen by child vs app? | Edit focus re-seeds rewards from the motivators the parent/child indicated; parent opt-in only. |
| 1 Intrinsic | "I want" vs "I must"? | No new pressure on the child; limits removed. |
| 2 Positive | Shaming / failure framing? | Trial-end copy approved with no loss words; test asserts absence of "lost/expired/locked" and Hebrew equivalents. |
| 2 Positive | Empathy vs pressure on failure? | Downgrade blocks only AI actions; nothing the family uses is taken away. |
| 2 Positive | Suffering/loss mechanic? | None. |
| 3 Independence | More capable without the app? | Coach helps parent scaffold/fade; unchanged. |
| 3 Independence | Child has a voice? | Edit focus lets the parent correct a wrong onboarding guess, so tasks fit the real child. |
| 3 Independence | Still necessary in 6 months? | Edit focus is occasional; trial is time-boxed. |

All 9 pass.
