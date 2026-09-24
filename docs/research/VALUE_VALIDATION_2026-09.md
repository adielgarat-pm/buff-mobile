# BUFF — Value Validation Research (September 2026)

> **Why this exists:** Adi, 2026-09-11: "I'm starting to lose trust in our product. We have no active users… I want us to do deep research that we have a product with value in it before I keep developing it."
> **Status:** APPROVED by Adi 2026-09-11 (development freeze, interview list, guides, Track D). Data baseline + Track D results below. No product decisions taken here. Development freeze proposed until the plan's kill/continue criteria are answered.
> **Source of numbers:** live production DB (`buff-production`), queried 2026-09-11. Families whose name matches `test|e2e|demo|dummy|qa` excluded. Some friends-and-family accounts remain inside "real" — flagged where it matters.

---

## 1. What the data says (baseline)

### 1.1 The funnel since the Play Store launch (families created 2026-06-01 → 2026-09-11)

| Step | Families | % of signups |
|---|---|---|
| Family created (signup) | 53 | 100% |
| Parent created ≥1 child + tasks | 40 | 75% |
| **A child ever logged in** (child profile linked to an auth user) | **10** | **19%** |
| ≥1 task completed | 12 | 23% |
| ≥3 active days | 4 | 8% |
| ≥7 active days | 3 | 6% |
| ≥30 active days | 2 | 4% |

**The cliff is not "used it and left". The cliff is "parent set it up, the child never entered."** 30 of 40 families who finished parent setup never had a child open the app. Of the 12 that had any completion, 8 had one or two days and stopped.

### 1.2 The same pattern in the Lovable era

| Cohort | Signups | Any completion | ≥7 active days |
|---|---|---|---|
| 2026-01 | 69 | 8 | 6 |
| 2026-02 | 102 | 8 | 2 |
| 2026-03 (war) | 5 | 0 | 0 |

Jan–Feb: 171 signups, 16 activated (9%), 8 reached a week. The 7 heavy Lovable users (11–42 active days each, all Hebrew) all stopped between 2026-02-16 and 2026-04-09. The war explains the *stop date*, not the 9% activation before it.

### 1.3 Weekly active families (≥1 completion in the week)

| Period | Active families / week |
|---|---|
| June 2026 | 5–8 |
| July 2026 | 6–9 (peak 9, week of 07-20) |
| August 2026 | 0–4 |
| Sept 2026 (to date) | 2–5 |

Signups continued through August (14 new families) while active families fell to 0–4. The August dip is not only a supply problem.

### 1.4 Who actually stays — and what they do

6 real families since April reached ≥5 active days (a 7th, `7efd`, is the internal media/demo account seeded with data and is excluded). All 6 are `is_lifetime_access` (friends / early-adopter grants); 1 is the founder family. Among the 5 still active in the last two weeks:

| Family | Active days | Completions | Vibe checks | Reward redemptions | BUDDY level | Who taps |
|---|---|---|---|---|---|---|
| f061 | 31 | 483 | 40 | 10 | 3 | child + parent-as-child |
| a29f | 37 | 312 | 44 | 9 | 4 | child |
| db25 | 20 | 71 | 19 | 21 | 3 | child |
| de60 (web) | 16 | 47 | 2 | 0 | 3 | child |
| 37d6 (founder) | 28 | 53 | 49 | 10 | 2 | child |

When a child enters the loop, the product is used deeply: vibe checks, real-reward redemptions, BUDDY levels 3–4, activity spanning 2–3 months. That is real, sustained use — but every single one of these families has a personal connection to Adi. **Zero strangers (US/GB/FR/PK signups, no lifetime flag) have reached 3 active days.**

### 1.5 Other signals

- **Reviews:** 4 genuine 5-star reviews with specifics ("zero friction", "internal motivation", "easy bedtime", "learning without arguments"), plus 1 Hebrew. Thin but not nothing.
- **Smart Insights feedback:** 6 thumbs-up, 1 thumbs-down, from 3 families.
- **Winback emails** already segment the same cliff (`T1_no_child`, `T2_no_access_mode`, `T2_shared_device`, `T3_silent`) — 40 sent, no measured reply loop.
- **Attribution:** every family is `organic` (UTM playbook exists, links not tagged yet). We cannot say which channel brings families that activate.
- **Reachable for interviews (parent email known):** 27 churned-at-handoff families, 12 no-child families, 12 activated families since June.

---

## 2. What the data cannot answer

The question "does BUFF have value?" **cannot be answered from usage data today**, because ~80% of families never reach the point where value could be experienced (a child using it). We have three competing hypotheses and no evidence to separate them:

| # | Hypothesis | What it would mean |
|---|---|---|
| H1 | **The handoff is broken.** Parents want it, but getting the child onto their own login/device is too hard, or the parent never understood that the child must use it. | Activation/onboarding problem. Fixable with product work — but only *after* it's confirmed. |
| H2 | **The pain is real but not urgent.** Parents sign up on hope, then daily life wins; the app never becomes the parent's tool for the morning/homework fight. | Problem/solution fit problem. Product work won't fix it; positioning, ritual design, or the target segment must change. |
| H3 | **Value exists only with founder proximity.** Friends use it because Adi coaches them; strangers don't. | The product is a coaching program, not a self-serve app. Different business. |

A fourth, uncomfortable one: **H4 — the child doesn't want it.** Parent sets it up, child tries once, doesn't return. Data: 8 of 12 activated families stopped after 1–2 days.

**H8 — paywall-before-value (added 2026-09-17, now the leading hypothesis).** The FREE parent hits locked surfaces while still trying to understand what BUFF is, and abandons before the habit loop can start. Source: Noa (family d111), first Track A interview — "hit the paywall fast, no way to explore, it killed the whole thing" — cross-checked against code (a FREE Android parent meets a locked card within a minute: "+ Add Child", 7th task, Insights/coach, timetable, activities) and DB (her family defined 4 rewards, 0 redemptions: the task→BUFFs→reward loop never closed). Cheap check: the cognitive walkthrough (below) now also counts every locked surface a FREE parent sees on day 1, Android vs web (web hides paywalls, `noIapPaywallHidden`). **Spec-sync flag (Adi's doc, not changed here):** D-2026-06-19 assumed "free = the whole habit loop"; Noa's account is that the parent's *exploration* is gated before the loop begins. Flagged for Adi; a proposed amendment will be drafted, not applied.

---

## 3. The research plan (3 weeks, development frozen)

**Principle:** talk to people, not to the dashboard. Every track has an owner, a sample, and a pre-registered "what result would change what we do."

### Track A — Churn interviews (H1 vs H2 vs H4) — Adi, week 1–2
- **Who:** 10–12 of the 27 reachable parents who created a child but the child never logged in (since June). Mix of Android/web, IL/US.
- **How:** personal email from Adi (no template feel), 15-minute call or 5 voice-note questions on WhatsApp. No incentive (Adi, 2026-09-17). Low-friction path is a 60-second survey (`CHURN_SURVEY_2026-09.md`); the call is offered plainly.
- **Ask, in this order:** What was happening at home the week you installed BUFF? What did you expect it would do? What happened after you finished setting up the tasks? Did your child see it? If yes — what did they say? If no — why not? What are you doing about [their pain] now?
- **Signal:** read for saturation (see §4). "I never got around to showing the kid" with no named blocker → H2. "I stalled at [specific step]" → H1/H5/H6. "The kid tried and dropped it" → H4.

### Track B — Retained-family "disappointment test" (H3) — Adi, week 1
- **Who:** the 4 active non-founder lifetime families + the 1 heavy user that stopped in July (e073). **Not part of the decision gate** (Gemini review, 2026-09-14): mechanism study only.
- **Ask:** How would you feel if BUFF disappeared tomorrow? (very / somewhat / not disappointed). What is the one thing you'd miss? Who in the house opens it — you or the child? Would you have started without knowing me? Would you pay $60/year?
- **Signal:** context only. What we learn: who opens it, who taps, what concretely changed at home. Hypothetical willingness-to-pay and "would you have started without me" are dropped as unanswerable.

### Track C — Problem interviews with strangers (H2) — Adi, week 2–3
- **Who:** 8–10 parents of ADHD kids (7–14) who have never heard of BUFF. Source: FB/Reddit ADHD-parent groups, school WhatsApp groups, one clinician if reachable. **No pitch, no demo.**
- **Ask:** Walk me through yesterday morning / homework time. What's the worst moment of the week? What have you tried (apps, charts, therapy, medication changes)? What did each cost you and why did you stop? If a friend said "there's an app for this", what would you assume it does — and would you believe it?
- **Signal:** the existential track. Read for saturation: is a BUFF-scope pain in the top-2, have they paid for anything, do they believe an app can help, and do they already assume the child is the user. Prior spend is recorded for every interviewee, not used as a recruiting filter.

### Track D — Data that CC can produce without Adi's time — CC, week 1
1. **Handoff timeline per churned family:** minutes from `family_created` → `child_created` → `invite_shown` → `invite_sent` → child `last_seen_at`. Where exactly does it stop, and does the parent ever come back (`parent_returned_after_d2` = 5 of 18 web, 4 of 13 Android)?
2. **Child-initiated vs parent-initiated completions** for the retained 5 (`source = child_device` vs `view_as_child`). If retention is mostly parent tapping "for" the child, Pillar 3 is not happening.
3. **Winback reply audit:** did any of the 40 winback emails produce a return session? (Currently unmeasured.)
4. **Anonymised interview list** (scratchpad only, never committed): 27 + 12 + 12 emails with first name, platform, country, days since signup, last step reached.
5. **A one-page interview guide** per track (A/B/C) in Hebrew and English, Values-checked (no shaming language toward parents who stopped).

### Not in this plan
- Any new feature, onboarding redesign, or "quick fix" to the handoff. Building before Tracks A–C answer the question would be exactly the loop we're trying to leave.
- Paid acquisition experiments. More top-of-funnel on a 19% child-entry rate only produces more silent churn.

---

## 4. Decision gate (end of week 3) — revised after the Gemini review

**Rule of evidence:** qualitative interviews are read for **saturation**, not percentages. A pattern counts when the same story is told unprompted by at least three parents in the same track and no interview tells a contradicting story with equal specificity. Counts are recorded in the log but never decide alone.

**Only Track C and Track A feed the gate.** Track B (friends) and the concierge observation are context, never evidence for "continue".

| Outcome | Evidence pattern | Next move |
|---|---|---|
| **Continue — fix the first session / handoff** | C: a BUFF-scope pain is in the top-2 for most strangers *and* they have paid for something before; A: churned parents describe wanting it and stalling at a specific, named step (H1/H5/H6) | One package only, scoped by what the interviews named. Leading indicator (not a gate): child completes a task within 48h of setup, watched over the next 20 stranger families. |
| **Reposition** | C: pain is real but parents don't believe an app helps and have never paid; A: "never showed the kid" with no named blocker | Stop code. Change who we sell to and how. |
| **Pause / pivot** | C: pain not top-2; A: kids tried and rejected it (H4) | Honest stop. |
| **Mixed / no saturation** | Stories split with no dominant one | **Default: no build.** Extend Track C by 5 interviews. The default is never "fix the handoff" — an ambiguous demand signal is not fixed by a feature. |

Whatever the outcome, the answer will be based on 25–30 conversations rather than a dashboard of 5 families, and on rules written before the interviews, not on how the founder feels that week.

## 5. Track D results (CC, 2026-09-11)

### D1 — Where exactly the handoff stops
28 churned-at-handoff families since June (child created, zero completions), minus 3 internal accounts (Adi's web test family, the Apple review account, the seeded media account) = **25 real**.

| Pattern | Families |
|---|---|
| Parent created the child within **1–3 minutes** of signup | 22 of 25 |
| Parent's last activity is **the same day as signup** | 18 of 25 |
| Parent came back 1–29 days later, still no child activity | 7 of 25 |
| Invite / child-access screen ever shown | 8 of 25 |
| Invite actually sent (share sheet) | 2 of 25 |
| Child profile got a login | 2 of 25 (both: login, then nothing) |

**Reading (revised 2026-09-14):** this is not "the child couldn't log in." 20 of 25 families carry exactly the onboarding starter set (4–5 tasks, 2 rewards), 17 of 25 first sessions ended within 3 minutes of finishing the wizard, and only 4 of 25 ever wrote anything again. These are real, Google-authenticated parents who **finished the wizard and stopped**, before the invite step. That is consistent with H2 (pain not urgent), H5 (parent's own executive function) and H6 (the post-wizard screen gives no next step). It is *not* strong evidence for H1 (invite mechanics broken), because most never reached the invite. Track A question 3 is the tiebreaker; the cognitive walkthrough (H6) is the cheap check.

Two families are the most valuable interviews: the one where the child logged in, the invite was sent, and the parent returned on day 1–2 but nothing was completed; and the one where the parent viewed the parent tab 11 times over two days and then stopped.

### D2 — Who taps: child or parent (retained families, since June)
`source` was only added to `daily_progress` mid-summer, so most rows are `null`. On the rows that carry it:

| Family | child_device | parent "view as child" | Read |
|---|---|---|---|
| f061 | 128 | 20 | child-driven |
| de60 (web) | 30 | 0 | child-driven |
| a29f | 7 | 78 | **parent-driven** — the parent marks tasks for the child on 13 of 15 tagged days |
| db25 | 4 | 0 | child-driven (few tagged rows) |
| 37d6 (founder) | 7 | 0 | child-driven |

So of the 4 retained non-founder families, 3 look child-driven and 1 (the T001 testimonial family) looks parent-driven. Track B question 3 asks this directly.

### D3 — Winback audit
40 winback emails sent on 2026-09-03 (6 segments). Result after 8 days: **3 recipients opened the app again, 0 completed a task.** Segment `T2_no_access_mode` (18 emails): 0 returns. The winback loop as designed does not recover anyone; it's measured now, so it can be retired or rewritten after the interviews.

### D4 — Interview list
Delivered to Adi as a CSV outside the repo (PII). 50 rows: 25 churned-at-handoff, 11 no-child, 9 activated-then-stopped, 5 retained. 6 rows flagged HIGH PRIORITY. Three internal accounts excluded.

### D5 — Interview guides
`docs/research/interview-guides/` — Track A (churn), Track B (retained), Track C (strangers), each with outreach text in EN + HE, question order, what to listen for, a coding sheet, and the pre-registered decision rule.

## 6. Gemini adversarial review (2026-09-14) — what changed

Adi ran `GEMINI_REVIEW_PROMPT_2026-09.md`. Reconciliation, point by point. **Accepted** items are already applied in this doc and the guides.

| # | Gemini's point | Verdict | What changed |
|---|---|---|---|
| 1a | `last_seen` unreliable; 1–3-minute child creation smells like curiosity/bots; denominator inflated | **Partly accepted** | Checked the code: `last_seen_at` is bumped on every app foreground (`usePushRegistration`), reliable on native, unverified on web. Checked intent: 20 of 25 churned families carry exactly the onboarding starter set (4–5 tasks, 2 rewards) and a first session of ≤7 minutes; only 3 show effort beyond defaults (custom rewards, 44–1228 min first session). They are Google-authenticated parents, not bots, but they are **low-investment**: they completed the wizard and stopped. Reframed §5 D1 accordingly: "finished the wizard and left" rather than "gave up on the handoff". |
| 1b | 0/47 strangers is enough to say the self-serve loop is dead; don't assume intent over a hard blocker | **Accepted** | Stated as the headline fact. H1 and H2 stay open; the interviews decide. |
| 1c | Friends' data is trash for value validation | **Partly accepted** | Track B removed from the decision gate. Kept as a *mechanism* study (who taps, what changed at home) because it is the only existence proof that a real 8–9-year-old sustains the loop for 3 months. Never counted as evidence for "continue". |
| 1d | 8-day win-back read is fine; "0 completions" means they remembered why they left | **Accepted** | |
| 2 | Missed hypotheses: H5 parent's own executive function; H6 blank-slate dead end after the wizard; H7 privacy/trust friction at the access step | **Accepted** | Added below with cheap checks. H5/H6 fit the data better than H2 alone: 17 of 25 first sessions ended within 3 minutes of finishing the wizard. |
| 3 | Track A gets only guilty/angry parents → offer $20 for "brutal feedback"; Track C from FB/Reddit skews desperate → screen on recent spend; Track B is sycophancy | **Accepted with one change** | Incentive considered and dropped (2026-09-17): no cash (bootstrap rule) and a free year of a product that didn't work reads as a chore. A 60-second survey is the low-friction path instead. Track C: spend is **recorded**, not used as a hard filter — filtering to payers would bias toward "yes they pay". Track B: see 1c. |
| 4 | Leading questions: "what you'd miss", "after you finished setting up", "who opens it", WTP hypothetical, "if you didn't know me" | **Accepted, except the fake paywall** | Rewrites applied in the guides. The Mom-Test "here is the payment link, upgrade today" is rejected for lifetime-access friends: there is no real paywall for them, so it would be a lie. Hypothetical WTP is dropped for Track B entirely; real WTP is tested only with a real price in front of strangers. |
| 5 | 6/10 and 3/5 are pseudo-rigor; qualitative work is about saturation; ≥40%-in-48h is unmeasurable at 14 signups/month; pre-commit a default for mixed results | **Accepted** | Rules rewritten in §4: pattern saturation (the same story told three times unprompted, with no contradicting story), not counts. Mixed result → **no build**, extend Track C by 5 interviews; the default is never "fix the handoff". The 40% metric becomes a leading indicator on the next 20 stranger families, not a gate. |
| 6 | Concierge pilot manufactures H3 and will produce a false positive | **Accepted, reframed** | Not a hypothesis test. Reframed as a 2-family **observation**: Adi watches the parent do the handoff on the call and does not do it for them; logged as observation only; explicitly excluded from the gate. If Adi prefers, it can be dropped without loss to the study. |
| 7 | Email flatters and guilts; cut by a third | **Accepted** | Gemini's cut adopted with two edits (no "haven't gotten your child started" for families that never created a child; keep the "what were you hoping it would do" line). |
| 8 | Strongest case against the freeze: only 2 of 8 who saw the invite screen sent it, a button fix is hours | **Rejected as the deciding argument, accepted as a task** | Freeze holds. But "2 of 8 sent the invite" is a concrete UX check CC can do with zero product decisions: a cognitive walkthrough of the post-wizard screen and the invite step, documented, no code. Added to Track D. |
| 9 | With 5 hours: keep Track C only, drop B and the concierge | **Partly accepted** | Track C is the existential question, agreed. But dropping Track A contradicts Gemini's own 1b: the 25 churned families *are* the strangers. Priority order is now C → A → concierge observation → B. |
| 10 | Study is engineered for a false "continue" | **Accepted as the risk; mitigated** | The four mechanisms Gemini named (friends in the gate, hypothetical pricing, founder hand-holding as evidence, count-based thresholds) are all removed above. Remaining risk: Adi's own hope. Mitigation: the coding sheet is filled *before* any interpretation, and CC summarizes against the rules, not Adi. |

### Added hypotheses and cheap checks (CC, no product changes)
- **H5 — Parent's own executive function.** Setup requires the parent to sustain effort across days. Check: first-session length and writes-after-day-1 (done above: 17 of 25 ended within 3 minutes of finishing the wizard; 4 of 25 ever wrote again). Consistent with H5 and H6; cannot separate them without interviews.
- **H6 — Blank-slate dead end after the wizard.** Parent lands on a dashboard with no obvious "now hand it to your child" step. Check: cognitive walkthrough of the exact screens after `child_created` on Android and web, screenshots into `docs/research/walkthrough/`, no code. **Owner: CC, this week.**
- **H7 — Privacy/trust friction at the access step.** 8 saw the invite/access screen, 2 sent. Check: same walkthrough documents what the access-mode screen asks for and how it reads to a parent who is protective of a minor's data.

## 8. Synthesis (2026-09-23) — it is one funnel, and it breaks at the first win

Three investigations (paywall H8, reward loop, plus the two interviews) converge on a single conclusion, and it corrects an earlier framing in this study that treated "paywall" and "reward loop" as competing problems. They are not competing. They are the **same funnel seen at different depths.**

**The break is upstream of everything: the child never completes a first task, so the value mechanic is never fed.** *(Corrected 2026-09-24: the original said "the child opens the app". `last_seen_at` is stamped at profile creation, so it isn't a real open; see below.)* From 51 real families since 2026-06-01 (reward-loop DB pull):
- **68% of children (30/44) never completed a single task.** ~~opened the app but~~ **Correction 2026-09-24:** 28 of those 30 **never logged into the child app at all**. Only 13/44 children ever logged in. The drop is mostly *before* the child app (handoff), not inside it. Source: `last_seen_at` is set at profile creation (first-win `REVIEW.md` F1).
- **91% (40/44) never earned enough BUFFs to afford their cheapest reward**, so they never even saw a working redeem button.
- Only **4/44 reached 3 active days.**
- Only **1 family of 51 ever redeemed a reward** — and that family's two siblings account for every redemption in the whole base.
- Rewards are priced days-away, not weeks, so "aspirational by design" is ruled out. There is **no code bug** in the reward flow — the RPC works, the button appears when affordable.

So the ~3% redemption rate is a **symptom, not the root**. The reward loop is not broken; it never starts. The paywall (H8) touches ≤10 families; the reward loop touches 36/37; but both sit downstream of the real event that almost never happens: **a child completing their first task and feeling a first win.**

Every hypothesis we raised is a facet of this one break:
- **H8 (paywall):** parent abandons before value → child never onboarded into a daily loop.
- **H4 (child resists):** child opens, doesn't do tasks (Noa's son). *Corrected 2026-09-24:* only 2 of 44 children logged in and never completed, so H4 is real but narrow. The 68% base-wide is mostly children who never got in (H1/H6/H9).
- **H9 (no device / parent not the conduit):** child can't even get in (Keren).
- **Handoff / session bugs:** child can't reach their login on a shared computer.
- **Reward loop 3%:** the downstream proof that the loop is never fed.

**What this means for the decision gate.** The study set out to answer "does BUFF have value?" The mechanic itself is sound — the one family that reached a first win redeemed 8 times and retained. The problem is not the product's core loop; it is that **almost no child reaches the first win**, especially strangers (0 stranger children reached 3 active days). That reframes the gate from "is the product valuable?" to "can we get a child to a first win without the founder in the room?"

**→ Package opened 2026-09-24: `docs/sessions/first-win/` (baseline: strangers with a child, first win ≤48h = 2/19; metric source `scripts/first-win-funnel.sql`).**

**Highest-leverage move, if anything ships (proposed, not decided):** target the first completed task and first win directly — a first-task nudge, a seeded ~1-day "first-win" reward at onboarding so the first loop closes within a day, and teaching the finish line on locked reward cards before affordability. This is upstream of both the paywall and the redeem UX, so it addresses the actual break. Details in `REWARD_LOOP_2026-09.md` options memo. The paywall decision (`DRAFT_DECISION_paywall_H8.md`, Option A) stays secondary.

**Spec-relevant note (Adi's docs, not changed):** the C0b/C0c reward-loop parent-insight nudge in `insightFraming.ts` only fires for active+affordable children (~4 today), so it is effectively dormant — flagged for a possible Spec Sync.

## 9. Caveats on the numbers


- "Real family" = name-based exclusion only. A few friends-and-family and internal accounts are inside the 53; the funnel is if anything slightly *worse* for strangers than shown.
- `daily_progress` before the 2026-06 upsert fix under-counted mobile completions for ~48 days (IN-2026-06 entry), so early-June activation may be understated by a few families. Does not change the shape.
- `last_seen_at` on child profiles was added mid-period; "child ever logged in" uses `user_id IS NOT NULL` (linked login) instead, which is stable.
