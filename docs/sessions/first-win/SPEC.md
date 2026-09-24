# First Win — SPEC

> Target state for this package. Authoritative during the package; canonical docs are synced at the end per `SPEC_SYNC.md`.
> **Status:** DRAFT, awaiting Adi's `approved, proceed`. No code has been written.
> **Source finding:** `docs/research/VALUE_VALIDATION_2026-09.md` §8. The funnel breaks at the first win, not at the paywall. Also `REWARD_LOOP_2026-09.md` and `INTERVIEW_LOG_2026-09.md` (d111 Noa, 37f4 Keren).

---

## 1. Goal and metric

**Goal:** raise the share of new families whose child completes a first **real** task within 48 hours of the parent's signup.

**Metric: `first_win_48h`.** The share of real families (created ≥48h ago) with at least one `daily_progress` row where `completed = true`, `revoked_at IS NULL`, and `source NOT IN ('onboarding_first_task','seed')`, and where `completed_at <= families.created_at + 48h`.
- This is the same "real completion" rule the trial trigger already uses (`058_trial_on_first_real_completion.sql`), so there is one definition in the codebase, not two.
- **Split by `source`** in every report: `child_device` / `null` (legacy) vs `view_as_child`. A win tapped on the parent's device counts toward the goal, but it is reported separately, so we can see whether independence (Pillar 3) is actually happening.
- **Real-family filter:** same cohort CTE as `REWARD_LOOP_2026-09.md` §7.

### Baseline (read-only SQL, prod `gfrongfnyigxsexuofrg`, 2026-09-24)

| Cohort (signup month) | Real families | First real win ≤48h | Any row ≤48h incl. onboarding seed |
|---|---|---|---|
| 2026-06 | 17 | 2 | 2 |
| 2026-07 | 17 | 3 | 5 |
| 2026-08 | 14 | **0** | 1 |
| 2026-09 (to 09-22) | 3 | **0** | 0 |
| **Total** | **51** | **5 (9.8%)** | 8 |

- Families with a child profile: 38. So `first_win_48h` = 5/38 = 13% of those.
- First real win ever (any time): 8/51.
- `view_as_child` wins ≤48h: **0**. All 5 wins were `child_device`/legacy.
- Onboarding "together" first task (`UStep6`, seed row): 5 families. Only 2 of them went on to a real win ≤48h.
- `onboarding_events` since 2026-07-14: invite_shown 14 fams → invite_sent 8. access_mode_selected: shared_device 3, own_phone 2, home_device 2. access_step_abandoned 1.

> ⚠️ **CONFLICT: the brief's "~32%" is a different metric.** 32% = 14/44 **children** with ≥1 completion **ever**, counting the onboarding seed row (`REWARD_LOOP_2026-09.md` §2.2). The family-level, 48h, real-only baseline is **~10%**, and **0/17 since August**. Adi to confirm which one is the package metric. This SPEC proposes `first_win_48h` as defined above.

> ⚠️ **Small N.** About 3–14 signups/month. "Before vs after" will be descriptive (cohort counts plus per-family timelines), not a statistically valid lift. The research doc already calls this a leading indicator on the next 20 stranger families (§4), not a gate.

---

## 2. What exists today (inspected, 2026-09-24)

| Area | Current behavior | Anchor |
|---|---|---|
| Onboarding "together" step | `UStep6_FirstTask`: presence gate, then the **parent** taps "we did it" on a card. Writes `source='onboarding_first_task'`, which is excluded from the real metric and earns **0 BUFFs**. The child never touches the app. | `UStep6_FirstTask.tsx:77-107` |
| Handoff | `ChildAccessStep` has 3 paths. Only `shared_device` lands in View-as-Child (UStep8 CTA → `previewChildId`). `home_device` only copies the code. `own_phone` opens the share sheet. | `ChildAccessStep.tsx`, `UStep8_Complete.tsx:477-489` |
| Web join link | `buffadhd.com/join/CODE` was verified BROKEN on 2026-08-05 (redirects to parent signup). | `child-access-paths/STATUS.md` Chunk 4 |
| Child first screen | No welcome. The daily Vibe Check is the first gate, then the task list. Completion shows confetti, "+N ⚡" and a BUDDY celebration. **No progress toward a reward on the dashboard.** | `ChildDashboardScreen.tsx:99`, `GamerDashboardScreen.tsx:257` |
| Starter economy | 20 BUFFs/task. The cheapest seeded reward is ~126 BUFFs (≈6 tasks, 2+ days). No "easy first task" concept; UStep6 takes the earliest task by time. | `onboardingConfig.ts`, `onboardingData.ts calcRewardCredits` |
| Parent nudge | `scan_for_activation_nudge` (pg_cron 06:10 UTC daily) fires only **14–21 days** after signup, only for children with **zero** `daily_progress` rows (so the onboarding seed row suppresses it). 36 sent since 06-15. Copy: "{name} hasn't started yet". **Tapping does nothing** (no router case). | DB function; `notificationRouter.ts:41-72` |
| Day-1 reminder | Deferred in child-access-paths (Chunk 4). `day1_push_*` events are typed but never fired. | `child-access-paths/STATUS.md` |
| Email | Only `email-unsubscribe` shipped. No sender, no cron. | `supabase/functions/` |
| Telemetry | `child_first_open` and `first_task_complete{source:'child_authored'}` are typed but never logged. | `onboardingFunnel.ts` |

---

## 3. Proposed changes, ranked by expected impact / effort

| # | Lever | Impact | Effort | Schema / deps | Needs Adi |
|---|---|---|---|---|---|
| **C1** | **Measurement:** `scripts/first-win-funnel.sql` (cohort × source × platform, per-family timeline). Log `child_first_open` and `first_task_complete{source:'child_authored'|'view_as_child'}` from the child app. | Enables everything | S | none (`event_type` is free text) | metric definition |
| **C2** | **Real handoff in the same sitting.** UStep6 "Yes, we're together" no longer lets the parent tap on the child's behalf. It becomes "Hand the phone to {name}". It records `access_mode='shared_device'`, skips ChildAccessStep, and goes to UStep8, whose CTA already drops into View-as-Child (verified path). The child does the first mission in the **real** child UI: real BUFFs, BUDDY reaction, and a completion that counts. The parent-tap seed write is removed. "Not right now" goes to ChildAccessStep exactly as today. | **Highest.** It is the moment the parent is already present and motivated. | M | none | yes: removing the seed row; copy |
| **C3** | **Winnable first mission + visible payoff.** While a child has 0 real completions, the child dashboard (mint + gamer) pins one "First mission" card on the easiest starter task, plus a single line of progress toward their cheapest reward ("{n} BUFFs to {reward}"). The card disappears after the first win. | High (68% open but never complete) | M | none | copy; which task counts as "easiest" (below) |
| **C4** | **Parent come-back nudge at ~24h.** Extend `scan_for_activation_nudge` with an early window: families 20–44h old with a child and **no real completion** (seed rows ignored). One push per child, respects `notif_activation_nudges` + pause mode. Also fix the existing 14–21d window to ignore seed rows. Add a router case: tap → parent dashboard → View-as-Child for that child (one tap to the handoff). New, softer copy. | Medium. Push reach = parents with a token (Android, plus web push if subscribed). | M | **DB function change** (no table change) | **yes: function change + copy** |
| C5 | *(Option, not in default scope)* **First-win reward pricing:** seed the cheapest reward at ~1 day (≈60 BUFFs) instead of ~3. | Medium | S | none | **yes, economy decision** |
| — | *Out of scope:* email nudge (no sender exists: new infra + provider), web join-link fix (#301/#345, and the parallel E2E audit owns join flows), Vibe-Check gate changes (Pillar 2 feature, not touched). | | | | |

**"Easiest" first task (C3), proposed rule:** the lowest-effort starter task from `taskLibrary` for the child's age group (a one-tap, sub-2-minute task such as "Drink a glass of water" or "Put your shoes by the door"). If none is tagged, fall back to the earliest-by-time task, as UStep6 does today. No new task is created; we only choose among the child's own tasks, so the parent stays in control of the list.

---

## 4. Behavior contract

- **Presence gate stays.** C2 only happens after the parent says the child is here. We never write a completion for an absent child.
- **No fake wins.** The metric counts only rows the child app writes. The parent-tap seed path is removed (C2) and not replaced.
- **No purchase/pricing surface for the child.** C3 shows only BUFF counts and the child's own reward title. No paywall, price or trial copy ever reaches the child. Existing `hide-paywall-from-child` guards stay untouched.
- **Nudge cap:** at most one early nudge per child, ever. Off when pause mode is on or `notif_activation_nudges=false`. No nudge once any real completion exists.
- **Platform parity:** C2/C3 are shared RN code (Android + web). C4's push goes through the existing fanout (Expo push + VAPID web push). The router case is shared. No native-only imports.
- **No new dependencies. No table/RLS changes.** C4 changes one SQL function (needs explicit approval).

---

## 5. Copy: every new string needs Adi's approval before shipping (DRAFT)

| Key | EN | HE |
|---|---|---|
| `onboarding.stepD.handoffTitle` | Hand the phone to {{name}} | הגיע הזמן להעביר את הטלפון ל{{name}} |
| `onboarding.stepD.handoffSub` | One small mission, just for {{name}}. You're right here with them. | משימה קטנה אחת, רק בשביל {{name}}. אתם כאן ביחד. |
| `onboarding.stepD.handoffCta` | {{name}} is ready 👉 | {{name}} מוכן/ה 👉 |
| `child.firstMission.title` | Your first mission | המשימה הראשונה שלך |
| `child.firstMission.sub` | One tap when you're done ⚡ | לחיצה אחת כשסיימת ⚡ |
| `child.firstMission.toReward` | {{n}} BUFFs to {{reward}} | עוד {{n}} BUFFs ל{{reward}} |
| push `activation_nudge_early` title | {{name}}'s first mission is waiting | המשימה הראשונה של {{name}} מחכה |
| push `activation_nudge_early` body | Tap to hand over the phone for 2 minutes 🌱 | לחיצה אחת, והטלפון עובר ל{{name}} לשתי דקות 🌱 |

- HE child strings will get `_m`/`_f` variants where gendered, same convention as `onboarding.access.*`.
- Also proposed: replace the existing 14–21d copy "{name} hasn't started yet" / "{name} עוד לא התחיל/ה", which names an absence. Suggested wording: the same as the early nudge. **Adi's call.**

---

## 6. Capabilities & bottlenecks

- **CC can:** read code/DB (read-only SQL), write code + jest, build a web export and drive it with Playwright (Supabase mocked via `context.route`), and open PRs.
- **CC cannot:** run an Android emulator here, send real pushes, or apply DB changes without approval.
- **Adi must:** approve the metric, copy and C4 function change; run the device checklist (TESTS.md) on Android; merge PRs.
- **Bottleneck:** a parallel E2E audit session is touching signup/login/child-join. C2 touches `UStep6`/`UStep8` only; before each PR, rebase on main and check for overlapping edits.
- **Research-freeze note:** `VALUE_VALIDATION_2026-09.md` §3/§4 froze development until the gate (~2026-10-02) and says "the default is never 'fix the handoff'" for mixed results. This package is commissioned by Adi after the §8 synthesis. Flagged so the decision is explicit, not silent.

---

## 7. Values Check (design time)

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this without a virtual reward?** Yes. The first mission is one of their own real tasks, and the payoff line points to a reward they/their parent chose, not app currency for its own sake.
2. **Does it move the child toward a reward they chose?** Yes. C3 names the child's own cheapest reward and shows the distance. C5 (optional) makes the first one reachable in about a day.
3. **Does success feel like "I want" or "I must"?** "I want": the copy is invitational ("one tap when you're done"), with no deadline and no streak.

### Pillar 2 — Positive Coaching
1. **Does the wording ever shame, compare or show failure?** No. There are no counts of missed tasks and no comparison. The nudge copy is rewritten away from "hasn't started yet". ✅ pending copy approval.
2. **If the child doesn't do it, is the response empathy or pressure?** Empathy/neutral. "Not right now" is a first-class path; the card just stays until done; the parent gets at most one nudge.
3. **Any BUDDY suffering/loss/anger?** No. BUDDY only celebrates on completion; nothing happens on non-completion.

### Pillar 3 — Independence-Building
1. **More capable without the app?** Neutral-positive. C2 moves the tap from the parent to the child (today the parent taps for them), and the source split lets us see whether the child is driving.
2. **Does the child have a voice?** Partly. The child chooses when to do the mission. The task comes from the parent's list, which is unchanged from today. The child can still propose tasks/rewards via existing flows.
3. **Still needed in 6 months?** No. The first-mission card self-removes after the first win, and the nudge is one-shot. It is scaffolding that fades by construction.

**Values Check Pass:** [x] Yes, at design time, conditional on Adi approving the copy in §5. It is re-verified against the implemented behavior at each phase exit.

---

## 8. Measurement plan

- **Before:** the table in §1 (frozen as the baseline, run date 2026-09-24).
- **After:** `scripts/first-win-funnel.sql`, run weekly on cohorts that signed up after each chunk's merge date. It reports `first_win_48h` split by source and platform; hours to first win; the handoff choice at UStep6 (together vs not now); the early nudge sent → opened → first win ≤24h after send.
- **Leading read:** the next 20 real stranger families after C2+C3 ship (per research §4).

## 9. Open decisions for Adi

1. Metric: accept `first_win_48h` (family-level, real-only, ~10% baseline) instead of the brief's 32%?
2. C2: remove the parent-tap `onboarding_first_task` seed write and replace it with the real handoff?
3. C4: approve the `scan_for_activation_nudge` function change (early window + seed-row fix)?
4. C5: include first-win reward pricing (~1 day)? Default: **not included**.
5. Copy §5, including replacing the existing 14–21d nudge copy.
