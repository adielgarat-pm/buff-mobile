# BUFF — Value Validation Research (September 2026)

> **Why this exists:** Adi, 2026-09-11: "I'm starting to lose trust in our product. We have no active users… I want us to do deep research that we have a product with value in it before I keep developing it."
> **Status:** DRAFT research plan + data baseline. No product decisions taken here. Development freeze proposed until the plan's kill/continue criteria are answered.
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

7 families since April reached ≥5 active days. All 7 are `is_lifetime_access` (friends / early-adopter grants); 1 is the founder family. Among the 5 still active in the last two weeks:

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

---

## 3. The research plan (3 weeks, development frozen)

**Principle:** talk to people, not to the dashboard. Every track has an owner, a sample, and a pre-registered "what result would change what we do."

### Track A — Churn interviews (H1 vs H2 vs H4) — Adi, week 1–2
- **Who:** 10–12 of the 27 reachable parents who created a child but the child never logged in (since June). Mix of Android/web, IL/US.
- **How:** personal email from Adi (no template feel), 15-minute call or 5 voice-note questions on WhatsApp. Offer nothing except "help me understand."
- **Ask, in this order:** What was happening at home the week you installed BUFF? What did you expect it would do? What happened after you finished setting up the tasks? Did your child see it? If yes — what did they say? If no — why not? What are you doing about [their pain] now?
- **Kill/continue signal:** if ≥6 of 10 say some version of "I never got around to showing the kid" → H2 dominates (pain not urgent). If ≥6 say "I tried, the child couldn't/wouldn't log in / lost interest in a day" → H1/H4 (handoff or child value).

### Track B — Retained-family "disappointment test" (H3) — Adi, week 1
- **Who:** the 5 active lifetime families + the 2 that stopped in July (e073, 7efd).
- **Ask:** How would you feel if BUFF disappeared tomorrow? (very / somewhat / not disappointed). What is the one thing you'd miss? Who in the house opens it — you or the child? Would you have started without knowing me? Would you pay $60/year?
- **Signal:** "very disappointed" from ≥3 non-founder families AND "the child opens it" → genuine child-side value exists. If the honest answer is "I use it because of you" → H3.

### Track C — Problem interviews with strangers (H2) — Adi, week 2–3
- **Who:** 8–10 parents of ADHD kids (7–14) who have never heard of BUFF. Source: FB/Reddit ADHD-parent groups, school WhatsApp groups, one clinician if reachable. **No pitch, no demo.**
- **Ask:** Walk me through yesterday morning / homework time. What's the worst moment of the week? What have you tried (apps, charts, therapy, medication changes)? What did each cost you and why did you stop? If a friend said "there's an app for this", what would you assume it does — and would you believe it?
- **Signal:** if the pain BUFF targets (morning/homework/bag independence) is top-2 for ≥6 of 10 and they've *paid* for something before → the problem is worth solving and H1 becomes the likely culprit. If the pain is real but they've never paid and don't believe an app helps → repositioning needed before any more code.

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

## 4. Decision gate (end of week 3)

Adi decides, with the evidence in one table:

| Outcome | Evidence pattern | Next move |
|---|---|---|
| **Continue — fix the handoff** | Parents wanted it (A), strangers have the pain and pay (C), retained kids open it themselves (B, D2) | One package only: child-entry, measured by "% of families whose child completes a task within 48h of setup." Target ≥40%. |
| **Reposition** | Pain is real (C) but parents don't believe an app helps and never showed the kid (A) | Stop code. Change who we sell to (e.g. clinicians/coaches, or a parent-only tool) and how. |
| **Pause / pivot** | Pain not top-2 (C), retained use is founder-driven (B), kids don't return (A, H4) | Honest stop. The current product is not it; the learnings are the asset. |

Whatever the outcome, the answer will be based on 25–30 conversations rather than a dashboard of 5 families — and on a pre-registered criterion, not on how the founder feels that week.

---

## 5. Caveats on the numbers

- "Real family" = name-based exclusion only. A few friends-and-family and internal accounts are inside the 53; the funnel is if anything slightly *worse* for strangers than shown.
- `daily_progress` before the 2026-06 upsert fix under-counted mobile completions for ~48 days (IN-2026-06 entry), so early-June activation may be understated by a few families. Does not change the shape.
- `last_seen_at` on child profiles was added mid-period; "child ever logged in" uses `user_id IS NOT NULL` (linked login) instead, which is stable.
