# Red Team — Smart Organizer & AI Insights

**Date:** 2026-07-28 · **Author:** CC (red-team pass, Adi's ask)
**Scope:** `parent-capture` / "מארגן חכם" (Smart Organizer) + `dashboard-ai-insight` / AI coach insight.
**Question set:** (1) what are the success metrics, (2) how do we measure them, (3) does the current
implementation advance them, (4) how do we drive usage among existing users, (5) how does this convert
non-payers into paying customers.

All numbers below are queried from **prod** (`gfrongfnyigxsexuofrg`) on 2026-07-28. Code claims are
anchored to `file:line`.

---

## 0. Bottom line up front

**Neither feature is failing. Neither feature has been *tested* — there is no traffic to test it with.**

- 234 families · **24 active in 30 days** · **4 active in 7 days**
- 67 children · 12 active in 30d · 8 with ≥2 active days in 30d · **2 with ≥2 active days in 7d**
- 35 "entitled" families = 32 lifetime grants + 1 founding + **2 actually paying**

Against that denominator: Smart Organizer has **7 runs from 2 families ever**, and AI Insights has
generated **3 insights for 3 children ever**. Any rate computed on those numbers is noise.

So the honest framing is: **the binding constraint is activation, not these two features.** That said,
the red team found five structural defects that would suppress both features *even if traffic arrived
tomorrow* — and one of them (F1) means the conversion thesis is currently running backwards. Those are
worth fixing now, because they are cheap and they are the difference between "we shipped it" and "we
can learn from it."

**The single highest-leverage finding:** the AI features are gated **away from** the only population
that can convert, and given **free** to the population that already can't pay.

---

## 1. Evidence

### Smart Organizer (`capture_runs`, `parent_items`, `onboarding_events`)

| Signal | Value | Source |
|---|---|---|
| Total runs (all-time, all outcomes) | **7** | `capture_runs` |
| Distinct families | **2** | `capture_runs` |
| Date range | 2026-06-20 → 2026-07-28 | `capture_runs` |
| Items returned by AI | 59 | `sum(item_count)` |
| Runs with `outcome != 'ok'` | **0** | (no error rows exist at all) |
| **Runs with `confirmed_at`** | **0 of 7** | `capture_runs` |
| `kept_count` / `discarded_count` / `edited_count` | **NULL on every row** | `capture_runs` |
| Items transferred to a child | 15 | `parent_items.status='transferred'` |
| **Transferred items a child completed** | **0 of 15** | join `daily_progress` |
| `capture_opened` events | 2, from **1 family** | `onboarding_events` |

Item due dates from the one real run (created 7/24): **7/26 → 8/6**.

### AI Insights (`child_insights`, `smart_insight_feedback`)

| Signal | Value | Source |
|---|---|---|
| Insights ever generated | **3** (3 children) | `child_insights` |
| Last generated | **2026-07-20** (8 days ago) | `computed_at` |
| `cta_type` populated | 2 of 3 (`send-bonus`, `start-conversation`) | `smart_insight->>'cta_type'` |
| Feedback rows | 4 (2 families) | `smart_insight_feedback` |
| Votes | 4 👍 / 0 👎 | `explicit_vote` |
| **`cta_clicked`** | **0** | `smart_insight_feedback` |
| **`tasks_added` / `rewards_added` / `wow_delta` / `category_delta` / `computed_at`** | **NULL on 100% of rows** | `smart_insight_feedback` |

---

## 2. Red-team findings

### 🔴 F1 — The AI features are inverted against the conversion funnel

`src/hooks/useAutoCoachInsight.ts:55`

```ts
if (!hasRealEntitlement && Platform.OS !== 'web') return; // free on web; else don't spend tokens
```

On Android, the AI coach **only ever generates for an already-entitled family**. And of the 35 entitled
families, **33 got entitlement as a grant** (32 lifetime + 1 founding). Only 2 pay.

The consequence: the AI coach — the most differentiated, most "worth paying for" thing in the product —
is shown almost exclusively to people who will never pay, and is **structurally invisible to the ~195
non-entitled families who are the entire conversion pool**.

What a free Android parent sees instead is the *rule-based* `topInsight` teaser
(`ParentDashboardScreen.tsx:604-631`) or a static premium lock card (`:640-646`). Both are honest, but
neither is the AI. **No free user on Android has ever seen the actual AI product.** We are asking people
to pay for a thing they have not experienced.

The cost guard is reasonable in isolation ("don't spend tokens on non-payers"). As a *conversion*
strategy it is exactly backwards.

### 🔴 F2 — The insight gate requires the behavior the product is failing to produce

`src/hooks/useAutoCoachInsight.ts:57`

```ts
if (activeDays < 2) return;  // need real data
```

**Only 2 children in the entire product have ≥2 active days in the last 7.** Even with entitlement, no
cost cap, and a working Gemini key, the feature is structurally unable to fire for ~97% of children.

The feature is gated on the outcome it is supposed to cause. A parent whose child stopped using BUFF is
precisely the parent who needs a coach insight — and is precisely the parent who cannot get one.

This is not an argument to delete the gate (an insight built on 1 day of data would be garbage). It is
an argument that **we need a second insight product for the low-data case** — see §5.

### 🔴 F3 — Zero confirms: we cannot tell a dead funnel from dead instrumentation

`capture_runs` has 7 successful runs and **0 `confirmed_at`**, with `kept_count` NULL on every row —
including rows created after #394 shipped the confirm logger on 7/27.

The two 7/28 runs are explained (60–90s parse, parent abandoned — documented in
`docs/sessions/parent-capture/STATUS.md:6-19`). But **`logCaptureConfirm` has never once fired in
production**, so we cannot distinguish:

- "parents run it and then abandon at review" (a product problem), from
- "the confirm path never writes" (a telemetry bug).

**Every Smart Organizer metric in `scripts/capture-usage.sql` reads from these columns.** Until one
end-to-end confirm is observed on a real device, the entire metric set reports zeros that mean nothing.
This is the first thing to fix — it is a 10-minute verification, and everything else depends on it.

### 🔴 F4 — The insight *outcome* schema exists and is 100% dead

`smart_insight_feedback` was built with exactly the right columns to answer "did this insight change
what the parent did": `tasks_added`, `tasks_removed`, `rewards_added`, `wow_delta`, `category_delta`,
`cta_clicked`, `computed_at`.

**All of them are NULL on 100% of rows.** Only `explicit_vote` is ever written.

So the only thing we can currently say about AI Insights is "4 people gave a thumbs up." A thumbs-up is
a politeness signal, not a value signal. The measurement design was right; the writes were never wired.

### 🟠 F5 — 60–90s parse latency is a product metric, not just a bug

`STATUS.md:19` lists latency as a known follow-up. Red-team position: **this is a headline metric, not a
follow-up.** The feature's entire promise is "this is faster than doing it yourself." For a 3-line
WhatsApp message from a teacher, a 60–90 second blocking spinner is *slower than typing the task
manually*. The #398 timeout fix made the failure honest; it did not make the feature fast.

Any parent who tries it once at 90s and doesn't get an obvious payoff will not try it twice — which is
precisely what the 0/7 confirm rate looks like.

### 🟠 F6 — The value payoff is invisible for up to 13 days

All 15 transferred items are dated 7/26 → 8/6. `isTaskVisibleToday` shows a dated task **only on its
day** (by design, from `capture-fixes-2`).

So the parent's experience is: paste a camp schedule → wait 90s → review 15 cards → confirm → **and
nothing visibly happens.** The child's screen is unchanged. The parent gets no receipt, no "here's the
week I just built for you," no proof the work landed. The payoff for a task dated 8/6 arrives 13 days
after the effort.

This is a textbook broken value loop: effort now, reward much later, no acknowledgement in between. It
fully explains a 0% repeat rate without needing any other cause.

### 🟠 F7 — Reach-through is 0% and it is the only number that matters

15 items transferred, **0 completed by a child**. The chain (AI extracts → assigns right child → dates
correctly → child sees it → child does it) has **never once completed end to end in production.**

Partly F6 (most items aren't visible yet), partly that this family's children are inactive. But we
should stop reporting "15 items extracted" as a success. Items extracted is a vanity number. The
feature has not yet demonstrated it works.

### 🟡 F8 — Both features are instrumented for activity, not for value

The current north star, Repeat Capture Rate (7d), measures whether the *parent* came back. It does not
measure whether the *child's week got easier* — which is the actual product claim and the actual reason
someone would pay. At n=2 families it is also unmeasurable. See §3 for the replacement.

### 🟢 F9 — Discoverability is NOT the problem (don't fix this)

The Smart Organizer entry is a card at the **very top** of the parent dashboard, above the insights card
(`ParentDashboardScreen.tsx:598-599`), with an emoji, a beta pill, and a chevron. It is as prominent as
it could reasonably be.

Flagging this explicitly because "nobody uses it → make the button bigger" is the tempting wrong move.
The button is fine. The problem is upstream (traffic) and downstream (latency, payoff, F1).

---

## 3. Success metrics

### Design principle

Both features should be measured on **the parent's job**, not on feature activity. Each gets one North
Star that can only move if the whole chain worked, plus a short diagnostic ladder that tells you *which
link* broke, plus a guardrail.

### 3.1 Smart Organizer

**Job:** take the mental load of turning a school/camp message into the child's plan off the parent.

| Tier | Metric | Definition | Source | Target |
|---|---|---|---|---|
| **North Star** | **Organized-to-Done Rate** | of items transferred to a child, % completed by the child **on or before** their due date | `parent_items.child_task_id` ⋈ `daily_progress.completed` | **≥40%** (parity with normal task completion) |
| Ladder 1 | **Confirm Rate** | `confirmed_at IS NOT NULL` / `outcome='ok'` | `capture_runs` | ≥70% |
| Ladder 2 | **Trust Rate** | `kept_count` / `item_count` | `capture_runs` | ≥80% |
| Ladder 3 | **Edit Rate** | `edited_count` / `kept_count` (AI assigned wrong child/date) | `capture_runs` | ≤15% |
| Ladder 4 | **Repeat Capture Rate (14d)** | of families with ≥1 run, % with a 2nd run within 14d | `capture_runs` | ≥30% |
| **Guardrail** | **p50 / p90 parse latency** | `gemini_ms` logged by `parse-capture` v11 | Edge fn logs | **p50 ≤20s, p90 ≤45s** |
| **Guardrail** | **Zero-yield + Error Rate** | `outcome IN ('empty', 'error_*')` / all runs | `capture_runs` | ≤10% |

Why Organized-to-Done and not Repeat Capture: repeat capture can be gamed by a parent who is curious.
Organized-to-Done only moves if the extraction was accurate, the assignment was right, the date was
right, the child saw it, and the child acted. It is the only metric that proves the product claim. It is
also the metric that is **currently 0**.

**Measurement note:** widen it to *within 1 day of due date* to avoid punishing a kid who does the bag
prep the night before. `parent_items.due_date` + `daily_progress.completed_at` supports this today.

### 3.2 AI Insights

**Job:** give the parent one specific thing to do this week that they wouldn't have thought of.

| Tier | Metric | Definition | Source | Target |
|---|---|---|---|---|
| **North Star** | **Insight-Attributed Action Rate (72h)** | % of delivered insights followed within 72h by the *specific* action the insight recommended (task added / reward added / bonus sent / conversation CTA tapped) | `smart_insight_feedback.tasks_added / rewards_added / wow_delta / cta_clicked` — **columns exist, currently unwritten (F4)** | ≥25% |
| Ladder 1 | **Delivery Rate** | children with a current-week insight / children eligible (entitled + activeDays≥2) | `child_insights` ⋈ `profiles` | ≥90% |
| Ladder 2 | **Eligibility Rate** | children eligible / children with any activity in 14d | `daily_progress` | **currently ~17% (2 of 12)** — this is the F2 number |
| Ladder 3 | **View Rate** | insights shown on the dashboard / insights generated | needs a `insight_viewed` event (**not instrumented**) | ≥80% |
| Ladder 4 | **Vote Rate & Sentiment** | 👍 / (👍+👎) | `explicit_vote` | ≥70% 👍, ≥15% vote rate |
| **Outcome** | **Post-Insight Activity Lift** | child's active-days in the 7d **after** an insight vs the 7d before | `daily_progress` + `computed_at` | **+1 day** |
| **Guardrail** | **Token cost per acted-on insight** | Gemini spend / insights with an attributed action | Edge fn logs | track, no target yet |

**Post-Insight Activity Lift** is the one that would justify the price. If an insight reliably buys one
extra active day per week, that is a concrete, sellable claim. It is computable from data we already
have, retroactively, the moment n is big enough.

---

## 4. Does the current implementation advance these metrics?

| Metric | Can we measure it today? | Does the implementation advance it? |
|---|---|---|
| Organized-to-Done | ✅ yes, computable now (= **0%**) | ❌ F6 hides the payoff for days; no receipt to the parent |
| Confirm Rate | ⚠️ **unproven — F3** | ❌ F5 latency drives abandonment before confirm |
| Trust / Edit Rate | ⚠️ **unproven — F3** (all NULL) | 🟡 capture-fixes-2 (childHint, bulk assign) should help; unmeasured |
| Repeat Capture (14d) | ✅ yes (= 0%) | ❌ nothing brings the parent back — no reminder, no re-entry hook |
| Parse latency | ✅ `gemini_ms` logged since v11 | ❌ no work done on latency itself |
| Insight-Attributed Action | ❌ **schema exists, writes missing — F4** | ❌ cannot be measured at all |
| Delivery Rate | ✅ yes | 🟡 works when it fires; last fire was 8 days ago |
| Eligibility Rate | ✅ yes (= ~17%) | ❌ **F2 — the gate excludes 97% of children** |
| View Rate | ❌ **no `insight_viewed` event** | ❌ not instrumented |
| Post-Insight Lift | ✅ computable retroactively | 🟡 neutral — needs n |
| **Free-user exposure to AI** | ✅ yes (= **0 on Android**) | ❌ **F1 — inverted gate** |

**Summary verdict:** of 11 metrics, **4 cannot be measured at all** (F3, F4), and of the 7 that can,
**5 are actively suppressed by the current implementation.** The features are built; the learning loop
is not.

---

## 5. Driving usage among existing users

Ordered by leverage ÷ effort. Note the honest constraint: with 4 WAU families, *nothing here produces a
statistically meaningful number this month.* These are correctness fixes so that when traffic arrives,
we learn from it.

### Tier 1 — Make the loop measurable (do first, ~1 package)

1. **Prove the confirm write (F3).** One end-to-end run on a real device: paste → confirm → assert
   `confirmed_at`, `kept_count`, `edited_count` are non-NULL. If it doesn't write, fix it. **Everything
   else is blocked on this.**
2. **Wire the insight outcome columns (F4).** The columns already exist. Write `tasks_added`,
   `rewards_added`, `wow_delta`, `cta_clicked` on the actions the parent takes in the 72h after an
   insight. This is the North Star; today it is unmeasurable.
3. **Add `insight_viewed`** to `onboarding_events` (source `ai_insight`), so Delivery ≠ View.

### Tier 2 — Close the value loop (the real fix for repeat usage)

4. **Give Smart Organizer an immediate receipt (F6).** After confirm, show the parent what they just
   built: *"7 tasks for Emmy across next week — first one Sunday morning."* Then send the child a
   *now-visible* summary card ("your week is set up") rather than nothing until each date arrives.
   Without this the parent has no evidence the feature did anything.
5. **Attack latency (F5).** Target p50 ≤20s. Options (each is a quality tradeoff and needs Adi's call):
   cap Gemini `thinkingBudget`, use a faster model for short text inputs, or stream partial items so
   cards appear as they parse. **Streaming is the best of the three** — it converts a 90s dead wait into
   a 5s first-card, which is a different product.
6. **Make the parse survivable (STATUS follow-up #2).** A response arriving after the parent leaves the
   screen is currently lost. Lift the parse state out of `CaptureScreen` so the result is waiting when
   they come back — and notify them.

### Tier 3 — Create the occasion

7. **Trigger, don't wait.** Both features are pull-only: the parent must remember to go use them. The
   feature that needs a schedule pasted should *ask* at the moment schedules exist — a start-of-week or
   start-of-term prompt ("got a message from school this week? paste it here"). This is the single
   biggest usage lever and it costs a push/notification hook we already have (FCM code complete).
8. **Low-data insight variant (F2).** For the 97% of children below the `activeDays≥2` bar, generate a
   *different* insight type — a re-engagement / setup-quality insight ("no one has opened BUFF in 9
   days — here's the one task most families restart with") rather than nothing. This addresses the
   activation crisis and the insight gate with one build. It needs a separate prompt and a clear label,
   and it should be honest that it is not a performance insight.

---

## 6. Converting non-payers into paying customers

### The current model is broken (F1)

Today: **grant → they never pay.** 33 of 35 entitled families were granted lifetime access. The AI
features are visible to them and invisible to everyone else. We have optimized for the wrong side of the
funnel — the AI is a retention perk for people who already have it free, not an acquisition wedge.

Also note the memory record: for Smart Organizer, `error_premium = 0` — **the paywall has never once
blocked anyone.** The paywall is not the constraint. Nobody has gotten far enough to hit it.

### The thesis

The AI is the only thing in BUFF that a parent cannot get from a chore-chart app. It should be the
**tip of the funnel, not the reward at the end of it.** Nobody pays for a capability they've never felt.

### Recommended: taste-then-gate

**Smart Organizer — 3 free runs, then gate.**
Every family gets 3 full runs regardless of platform or entitlement. The 4th shows the paywall *at the
moment of highest intent* — the parent is standing there holding a camp schedule they don't want to type
out. That is the strongest paywall placement available in this product, and it costs ~3 Gemini calls per
family to buy it.

Instrument as: `capture_free_runs_used` → `paywall_shown_at_capture` → `conversion`. The 402 path and
run-counting already exist server-side (`parse-capture` v10 counts billable runs) — this is a threshold
change, not new architecture.

**AI Insights — first insight free, per child.**
Generate the *first* insight for every child who crosses `activeDays≥2`, entitled or not, Android
included. Show it in full. The *second* one is gated: *"Emmy's next insight is ready — unlock to see
it."* A parent who read one genuinely useful insight about their own kid and is told the next one exists
is a qualified lead. A parent looking at a generic 📊 lock card is not.

Cost is bounded and small: one Gemini call per child, once, and only for children who are actually
active — which today is 8 children. **The entire experiment costs under a dollar.**

**Why "first one free" over the current lock card:** the lock card asks the parent to imagine the value.
The free insight *demonstrates* it, using their own child's name and their own week. That is the whole
difference between the two approaches, and it is why F1 is the highest-leverage finding in this doc.

### Conversion metrics to add

| Metric | Definition | Target |
|---|---|---|
| **Taste Rate** | non-entitled families who experienced ≥1 real AI output | ≥60% of active free families |
| **Taste→Paywall** | of those, % who hit the gate (i.e. came back for more) | ≥30% |
| **Paywall→Pay** | of those, % who convert | ≥10% |
| **Paywall placement win-rate** | conversion at capture-gate vs insight-gate vs dashboard lock card | compare — kill the loser |

That last one matters: we currently have three paywall entry points and **zero data on which converts.**

### What NOT to do

- ❌ Don't grant more lifetime access. Every grant removes a family from the conversion pool permanently,
  and we already have 32.
- ❌ Don't raise the AI's prominence before F5 (latency) and F6 (receipt) are fixed — driving more
  traffic into a 90-second wait with no visible payoff converts curiosity into a negative impression,
  and you only get one first run per family.

---

## 7. Recommended sequence

| # | Package | Why it's in this position | Size |
|---|---|---|---|
| 1 | **`pkg/ai-metrics-truth`** — prove the confirm write (F3), wire insight outcome columns (F4), add `insight_viewed` | Everything downstream is unmeasurable without it. Cheap. | S |
| 2 | **`pkg/ai-taste-gate`** — 3 free capture runs + first insight free per child, on Android too (F1) | Highest-leverage finding; costs <$1 to run; inverts the funnel the right way | M |
| 3 | **`pkg/capture-receipt`** — post-confirm summary for the parent + a now-visible "your week is set" card for the child (F6) | Closes the value loop; without it repeat rate stays 0 regardless of traffic | M |
| 4 | **`pkg/capture-latency`** — streaming partial results / model+thinkingBudget tuning (F5) | Needs Adi's quality-tradeoff call before scoping | M–L |
| 5 | **`pkg/insight-low-data`** — re-engagement insight for children below `activeDays≥2` (F2) | Serves the activation crisis and the insight gate together | M |

**Open decisions for Adi (I am not resolving these):**

1. **Free-tier cost exposure.** Taste-then-gate spends Gemini tokens on non-payers by design. Ceiling
   is small (3 runs + 1 insight per family), but it is a real spend on people who may never pay. Approve?
2. **Latency vs quality.** Cutting `thinkingBudget` or switching models degrades extraction quality.
   Which side do we err on? (My read: latency — a fast 85%-accurate parse that a parent can correct beats
   a slow 95% one they abandon. But this is a product call.)
3. **Do we stop granting lifetime access?** 32 grants against 2 payers is the actual conversion problem
   underneath both features.
4. **Sequencing vs activation.** Everything here is downstream of 24-active-families-of-234. If the
   activation work (`docs/research/ACTIVATION_DIAGNOSTIC_2026-07-14.md`) is the priority, packages 1 and
   2 are still worth doing now (they are small and they make the eventual traffic legible), but 3–5
   should probably wait for a denominator worth measuring.

---

## 8. Conflicts / caveats

- **`STATUS.md:37` reports "15/15 transferred items, 0 completed → reach-through 0%"** as of 2026-07-27.
  This doc re-queried on 2026-07-28 and confirms the same 0/15. Not a new finding — a persisting one.
- **`STATUS.md:31` states 5 pre-047 rows were backfilled to ok/empty.** Current table shows 7 rows, all
  `outcome='ok'`, 0 `empty`. The two additional rows are the 7/28 runs. Consistent.
- **`last_platform` is populated for only 4 of 234 families**, so the Android-vs-web split of the
  non-entitled pool cannot be measured today. The F1 argument does not depend on it (the gate is
  `Platform.OS !== 'web'` at runtime, not a stored column), but sizing the affected population does.
  Worth fixing if we act on F1 — the `profiles.last_platform` ALTER is already noted as a pending
  follow-up in the web-to-native CTA work.
- **All rates in §1 are computed on n≤7 runs and n≤3 insights.** They are reported as *facts about what
  has happened*, not as *estimates of what will happen*. No rate in this doc should be extrapolated.
