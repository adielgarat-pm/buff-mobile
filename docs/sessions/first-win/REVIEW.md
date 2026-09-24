# First Win — Adversarial Review of SPEC v1 (2026-09-24)

> Adi asked for a critical review of CC's own proposals, from several disciplines, plus a plan to test the work and define success.
> Method: four independent reviewer agents, each given SPEC v1 + code + research docs, told to be harsh: **Clinical** (pediatric ADHD / child development), **Data** (experiment design / statistics), **UX + Growth**, and **Engineering + QA**. CC then re-verified the highest-severity claims in code/DB itself (marked ✔ verified) before accepting them, and added its own self-critique (§2).
> **Result: SPEC v1 is not approvable as written.** §3 lists the three decisions that block it. §4 is the revised plan (v2) proposed for approval. The test plan and success metrics are in `TESTS.md`.

---

## 1. Findings that change the plan

| # | Finding | Lens | Severity | Verified |
|---|---|---|---|---|
| F1 | **The "68% of children opened the app but never completed" premise is a data artifact.** `last_seen_at` is set when the profile is created. Of 49 child profiles since June, **only 13 ever had a login**; 36 have `last_seen_at` within 5 minutes of creation and no login. Most children **never opened the app at all**. This affects `REWARD_LOOP_2026-09.md` §2.2 and `VALUE_VALIDATION` §8 (Adi's call whether to amend). | UX | Critical | ✔ SQL 2026-09-24 |
| F2 | **C3 (first-mission card on the child dashboard) is invisible to most of its target.** It only reaches the ~13 children who logged in, plus shared-device sessions. | UX | High | follows from F1 |
| F3 | **C2 can raise the metric with zero change in child behavior.** It swaps a parent tap tagged `onboarding_first_task` (excluded) for a parent-phone tap tagged `view_as_child` (counted). Nothing records whose thumb it was. | Data | Critical | ✔ logic |
| F4 | **CONFLICT: the code says `view_as_child` "never counts".** `useChildProgress.ts:427-429` states `'child_device'` is "the only value that counts as unprompted" and `'view_as_child'` = "a parent driving the child screens (never counts)". SPEC v1 counted it. | Data + Eng | High | ✔ code |
| F5 | **CONFLICT: C2 would start the paid-feature trial during onboarding.** Migration 058 excludes only `onboarding_first_task`/`seed`, so a `view_as_child` completion in the onboarding sitting starts the 14-day clock. 058's own header says starting at signup is what "the strategy rejects (Q3)". | Data + Eng | High | ✔ `058…sql:10-13,90` |
| F6 | **Push taps go nowhere, on any platform.** `resolveRouteAction` is only called from the in-app feed (`NotificationFeedScreen.tsx:68`). There is no native notification-response listener, and the web service worker opens `/` ignoring the payload (`public/service-worker.js:54-66`). The 36 `activation_nudge` pushes "sent" did nothing when tapped. | Eng | High | ✔ grep |
| F7 | **C4's reach is ~20%.** Since June, 5 web push subscriptions + 7 native tokens across 58 families; 3 of 14 Android families have a token. The cron also runs at 06:10 UTC = 09:10 Israel (child at school) and 02:10 ET / 23:10 PT (night in English-first markets). | UX + Clinical | High | reviewer SQL; not re-run |
| F8 | **We don't know UStep6 is where parents drop off.** Steps 1–5 log `onboarding_step_reached`, but UStep6, its yes/no choice and UStep8 are not logged. UStep6 is also missing from `ONBOARDING_ROUTES`, so a web reload there doesn't resume. C2 changes only the "Yes" branch, which 5 families have ever taken. | UX + Data | High | reviewer, code |
| F9 | **No age split.** A parent-picked "first mission" on the parent's phone repeats Noa's teen ("די, עזבי אותי", "enough, leave me alone"). Handoff-on-demand is a demand, and kids with oppositional or demand-avoidant profiles will refuse it. | Clinical | High | design |
| F10 | **The parent has no script.** What the parent says at the handoff decides compliance. There is also no "they said no" path, so refusals (H4) are invisible. | Clinical | High | design |
| F11 | **The View-as-Child banner shows the parent's name to the child.** `ChildTabs.tsx:110` passes `profile.display_name` (the parent), so the child sees "Viewing as parent — Adi". It exits in one tap into the parent app (settings, paywall). | UX | High | ✔ code |
| F12 | **UStep6 picks the earliest task by time,** usually the 08:00 morning routine. That is wrong for an evening signup. `taskLibrary` has no effort field, so "easiest" isn't computable as the SPEC claimed. | UX + Eng | Med | reviewer, code |
| F13 | **The reward is too far for ADHD delay aversion.** The first win earns 20 of ~126 BUFFs. "106 BUFFs to X" shows distance, not closeness. C5 (first reward within ~1 day) should be default, not optional (BUFF_VALUES: "always close to a win"). | Clinical | High | design |
| F14 | **The first-win timestamp is rewritable.** The completion is an upsert that re-writes `completed_at`/`source` on re-mark. Measure from a logged, once-only `first_task_complete` event instead. | Data | High | reviewer, code |
| F15 | **Legacy `source IS NULL` rows are silently dropped by `NOT IN`,** in SQL and in PostgREST `not.in`. Every query needs `COALESCE(source,'')`. | Eng | High | ✔ SQL semantics |
| F16 | **N is too small for anything but a huge effect.** Stranger baseline (CC recount, NULL-safe) is 2/19 families with a child (~11%, 95% CI ~1–33%); July 2/9, Aug 0/9, Sep 0/1. CC's earlier chat figure 'July 2/13' was a miscount. At n=20 the minimum detectable effect is about +20 pp, and reaching n=20 takes 2–6 months. Before/after is confounded by audience mix, the Aug 6–Sep 23 web-join bug, and 058/freemium v2 shipping 09-23. | Data | High | reviewer math |
| F17 | **The `activation_nudge` function isn't in `supabase/migrations`** (prod-only). Once-per-child dedupe means an early nudge suppresses the 14–21d one. | Eng | Med | reviewer |
| F18 | **The Vibe Check modal comes before the first mission.** It is one tap, but a low vibe trims the list and may hide the chosen task. | UX + Clinical | Med | code |

## 2. CC self-critique: what I got wrong in v1

1. **I reused research numbers without re-verifying them.** The "68% opened" figure was the whole case for C3, and it was wrong (F1). This is the same failure the Snapshot Protocol exists to prevent.
2. **I ranked C2 "highest impact" on intuition.** No data locates the drop at UStep6 (F8). I should have proposed instrumentation first and ranked after.
3. **My Values Check was self-serving.** I answered Pillar 3 Q2 "Partly" and still ticked Pass; BUFF_VALUES says any "no" fails and must go to Adi. Pillar 3 Q1 "neutral-positive" is not an answer. Pillar 1 Q1 dodged (nobody wants a glass of water for its own sake).
4. **I missed two conflicts that were in the code** (F4, F5), and I defined a metric C2 could game (F3).
5. **I assumed the notification pipeline works end to end** (F6), which violates the Reachability rule (WORKFLOW iron rule 11).
6. **Too many levers for the N.** Four or five levers at ~10 signups/month means no single one can be attributed.
7. **I ignored the research doc's own gate:** "an ambiguous demand signal is not fixed by a feature". v2 below keeps product change small and measurable.

## 3. Decisions that block approval (Adi)

- **D1: Does a parent-device (`view_as_child`) completion count as a first win?**
  - The code says it never counts.
  - CC recommends: the primary metric is **`child_device` only**, with `view_as_child` reported as secondary. It counts as progress, not as the child using BUFF independently.
- **D2: May a handoff completion inside onboarding start the trial?**
  - 058 Q3 says no.
  - CC recommends: **no**. Exclude completions that happen within the onboarding sitting, via a `source='onboarding_handoff'` tag on the handoff session's rows. That needs a 1-line change to the 058 function, which is a **DB function change for approval**.
  - Alternative: accept that the trial starts at onboarding for shared-device families.
- **D3: Age split.** CC recommends that the guided handoff is for **ages 6–12 only**. For 13+, this package changes nothing and a 🚩 flag is raised for a teen-first path (the teen picks their reward first, writes or chooses their own first task).

## 4. Revised plan (v2), smallest and most measurable first

| Phase | What | Why | Effort | Schema? |
|---|---|---|---|---|
| **P0 — Measure first** | Add `onboarding_step_reached` for UStep6 / ChildAccessStep / UStep8. Add `presence_answered{together, not_now, said_no}`. Log UStep8 CTA taps, `child_first_open`, and a once-only `first_task_complete{source}` from the child app. Put UStep6 in `ONBOARDING_ROUTES`. Add `scripts/first-win-funnel.sql` (NULL-safe, stranger vs friend, per-family timeline). Adi keeps the friend list **outside the repo**. | Locate the real drop (F8). Immutable metric (F14). Nothing else is judgeable without it. | S | none |
| **P1 — Fix what's broken on the path (S)** | (a) The preview banner shows the **child's** name, and exiting asks "Hand back to parent?". (b) UStep8's shared-device CTA moves above the code card. (c) The first mission is chosen by **time of day** from the child's visible tasks, not the 08:00 task. | These are defects on the path the child will walk (F11, F12). | S | none |
| **P2 — Coached handoff, ages 6–12** | UStep6 "together" shows a short parent script card ("Try: 'Want to pick what you're working toward?' No 'you have to'. If they say no, that's fine."). Then "Hand the phone to {name}", which goes to the child screens with the chosen mission. Add a gentle "They said no" button (logged, never framed as failure). Remove the parent-tap seed write. Tag the sitting per D2. | Keren's path. Fixes F9/F10 and the gaming in F3/F5 via D1/D2. | M | 058 tweak (D2) |
| **P3 — First reward within a day (C5)** | The cheapest seeded reward is priced at about 1 day of tasks. On the child screen, a warm line: "{n} BUFFs to {reward}". | ADHD delay aversion (F13). Economy decision is Adi's. | S | none |
| **Adi — concierge test (no code)** | Personally message the next 10 stranger signups within ~1h: "5 minutes tonight: hand {name} the phone, here's what to say." | Cheapest test of whether a human nudge moves first wins, **before** building any automated nudge. | Adi's time | — |
| **Deferred (🚩 flags, not silent)** | **C4 push** (reach ~20%, taps go nowhere: F6/F7) → separate infra package "push tap routing". **C3 dashboard card** (reach, F2) → revisit once P0 shows children logging in. **Teen path** (D3). **Email reminder** (no sender). | | | |

**Explicitly not addressed:** H9, families with no child device and a parent who won't hand over theirs (beyond the coached handoff). If this package "works", that does not mean the handoff is fixed for them.

## 5. Values Check v2 (honest)

| Q | v2 answer |
|---|---|
| P1-Q1 want it without a virtual reward? | For the handoff: partly. The value is the parent-child moment plus a real reward within a day (P3). A water-glass task alone would not pass, so P1c picks a time-relevant, meaningful task. |
| P1-Q2 toward a reward they chose? | **Partly: onboarding rewards are parent-seeded from the child's motivators.** → Adi. Recommendation: a follow-up where the child picks or edits their first reward (existing child-suggest flow) as the first thing they do. |
| P1-Q3 "I want" vs "I must"? | Yes, with the script (no "you have to") and a no-penalty "They said no". |
| P2-Q1/Q2/Q3 | Pass. No failure counts; refusal is logged neutrally, with no follow-up pressure; no BUDDY consequences. |
| P3-Q1 more capable without the app? | Honest answer: **not yet**. The handoff is a scaffold on the parent's device. The measure of progress is the later `child_device` completion (primary metric). |
| P3-Q2 child's voice? | **Partly** (parent's task list). Mitigation: the child chooses among 2–3 tasks for the mission. → Adi. |
| P3-Q3 needed in 6 months? | No. It is one-time and self-removing. |

**Status: NOT auto-passed.** P1-Q2 and P3-Q2 are "partly" and go to Adi for an explicit call (BUFF_VALUES: any "no" → discuss).
