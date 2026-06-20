# DESIGN — BUFF Insights, our way (cases → responses)

> **Status:** PROPOSED design — for Adi's review before any code.
> **Created:** 2026-06-19. **Author:** CC.
> Lovable's `ParentIgnitionInsights` is the **inspiration**, not the template. This doc recommends how to build insights for *our current* model and defines the **case → response matrix** (when to surface what).
> Related: `SPEC.md` (port scope), monetization-model SPEC (insights = paid), [[D-2026-06-14-01]] (success = count).

---

## 1. Principles (from our model + the research + the Pillars)

| Principle | Source | Consequence for insights |
|---|---|---|
| **Success = COUNT, not %** | D-2026-06-14-01 (`tasks_completed ≥ LEAST(3, assigned)`) | An **active day** = met the count bar. Never frame around 70%-of-all (unreachable at 9–20 tasks/day). |
| **Habit is fragile; value takes WEEKS** | deep-research 2026-06-19 (79% war non-return; weeks-to-value) | Insights must **reduce pressure**, celebrate effort + small wins, normalize off-days. Never imply failure. |
| **No dark patterns** | Pillar 2 + audit | **No fabricated data** (kill Lovable's `Math.random()` WoW). Honest empty states. No guilt/scarcity. |
| **Anti-overload** | Pillar 1 | At most ONE targeted "what to try" tip at a time. One screen, scannable. |
| **Effort > outcome; warm, parent-as-coach** | Pillars 1+2; existing copy (Barkley / Smart-but-Scattered roots) | Messages name the *child's effort*, give the parent a *gentle move*, never a verdict. |
| **Independence** | Pillar 3 | Suggestions are optional, dismissible; nothing forced on the kid. |
| **Always close to a win** | PRD §reward loop | The #1 churn driver isn't low completion — it's **the reward loop not closing** (earning without redeeming → BUFFs feel abstract → disengage). Insights must watch felt-value, not just completion (→ Layer C0). |

**Tone rules (non-negotiable):** never "your child failed / is behind / dropped." Always forward ("a fresh start", "consistency is forming", "here's one small move"). The reader is a stressed parent of an ADHD kid — lower their guilt, don't add to it.

**Terminology (Adi 2026-06-19):** use BUFF's own vocabulary — **drop Lovable's "ignition / ignited day / charging"** metaphor. A good day = **"יום פעיל" (active day)** — celebrates *showing up / getting going* (the EF battle is initiation), not the outcome; warm + non-judgmental. An off-day = **"יום מנוחה" (rest day)** — a kind reframe, never a deficit. *(Swap to "יום טוב" / "יום מנצח" if preferred — one-word change.)*

---

## 2. Signals we actually have (no schema change)

- **Per-day solidity** (last 7 + prior 7 days) from `daily_progress`: `solidDay = completed ≥ LEAST(3, assigned)`. → solid-days count, weekly map, **real** week-over-week.
- **Per-phase avg completion** + low-performing tasks — `useParentInsights.phaseInsights` (already computed). → strongest/weakest phase.
- **Per-task category** (`tasks.category` / `strategy_id`) — replaces fragile title keyword-matching. → targeted tips, language-agnostic.
- **Streak** (`useChildStreak`), **today's vibe / low-power**, **lapse** (unread `anchor_recovery`) — already feed `recommendationEngine`.
- **Reward-loop health** — rewards table + redemptions ledger (`useRewardRedemptions`) + balance: `# rewards defined`, `# redemptions in last 14d`, `current balance` vs `cheapest reward cost`. → the **engagement / felt-value** signal (the most important one — see Layer C0).

---

## 3. THE MATRIX — cases → responses (priority ladder, first match wins per layer)

The screen renders **three independent layers** at once. Layer A can override into a calm state; B + D always render; C renders at most one tip.

### Layer A — Wellbeing gate (overrides metrics; reuse `recommendationEngine`)
| # | Case (condition) | Response | Tone / CTA |
|---|---|---|---|
| A1 | **Paused** | Calm "you're on a break" state; suppress metrics/pressure | none |
| A2 | **Low vibe today** (vibe ≤2 / low-power) | Warm gesture surfaced ABOVE metrics | "Send a warm sticker" |
| A3 | **Lapsed** (5+ days quiet) | Comeback: one anchor (meds if none) or reconnect | "Set a medication reminder" / "Send a sticker" |

> A already exists in `recommendationEngine` (low-vibe → comeback → celebrate). Keep it as the dashboard card; the Insights screen respects A2/A3 by leading with the gesture, not the numbers.

### Layer B — Weekly framing (the weekly card + reinforcement message)
"Active day" = the child met the count bar (`≥ LEAST(3, assigned)`). Each row carries a **CTA** (Adi: prefer a CTA) wired to an existing lever.
| # | Case (active-days this week) | Headline | Reinforcement message (forward, names effort) | CTA |
|---|---|---|---|---|
| B1 | **Strong** (≥5 active) | "🎉 {name} had a strong week" | "{n} active days! Consistent effort deserves recognition." | **Send a bonus ⚡** |
| B2 | **Building** (3–4 active) | "💪 {name} is finding a rhythm" | "{n} active days. {bestPhase} is the anchor — say 'I see how hard you're trying.'" | **Send a sticker** |
| B3 | **Growing** (1–2 active, or rate 20–50%) | "🌱 {name} is learning their rhythm" | "Every active day counts. Notice one effort out loud today — not the result." | **Send a sticker** |
| B4 | **Quiet week** (0 active) | "☀️ A fresh week ahead" | "This week was quiet — that's okay. Pick ONE small anchor for tomorrow; momentum beats perfection." | **Set tomorrow's anchor** |
| B5 | **<3 days of data** | "Patterns coming soon" | Honest empty state. **No numbers, no fake trend.** | none |

> **Kills the dead-zone:** every performance level (incl. 50–70% and 0) has a warm, specific response. No paying parent ever sees a blank card.
> **Week-over-week badge:** show ↑/↓ only with REAL prior-week data; if absent → hide it (never invent).

### Layer C0 — Reward-loop health (HIGHEST coaching priority — the root motivation driver)
**Why first:** BUFFs only motivate if they convert to a real win. A child who earns but never redeems stops feeling the value and **disengages** — this is a leading churn signal (PRD "always close to a win"; ties to the war-non-return finding). If the loop is broken, fix it *before* any completion tip — so C0 **wins the single tip slot over C1–C5.**
| # | Case (condition) | Response (warm, forward) | CTA |
|---|---|---|---|
| C0a | **No rewards defined** (`rewards == 0`) | "BUFFs need a finish line. Pick one small reward *with* {name} to work toward — the goal is what makes the points mean something." | Define a reward |
| C0b | **Earning but not redeeming** (active last 14d AND `0 redemptions/14d` AND `balance ≥ cheapest reward`) | "{name} is earning but hasn't cashed in. Earning without spending makes BUFFs feel abstract — help them redeem a **small** reward this week. The win is what makes the habit stick." | Open rewards / redeem |
| C0c | **Hoarding** (`balance ≥ 2–3× cheapest` AND `no redemption 14d+`) | "{name} has plenty saved. A reward that sits unspent loses its pull — a small redemption soon keeps BUFFs meaningful." | Open rewards / redeem |
| C0d | **Healthy loop** (redeemed within ~14d) | none — loop is closing; fall through to C1–C5 | — |

> Detection note: "small reward" framing is deliberate — periodic small wins (every 1–2 days per PRD) beat saving for one big far-off prize. If only an expensive reward exists, C0 can also nudge "add a smaller, sooner reward."

### Layer C — Targeted "what to try" (≤1 tip; trigger by category, not keyword)
Pick the **single highest-priority** low signal. Severity order: meds > homework > the weakest phase > hygiene.
| # | Case | Tip (reuse existing research-based copy) |
|---|---|---|
| C1 | Med-category tasks low (<60%) | `medication-low`: "Link meds to a fixed anchor — right after brushing teeth." |
| C2 | Homework/study category low (<50%) | `homework-low`: "15-minute rule — commit to just 15 min. Starting is the hardest part." |
| C3 | A phase clearly weakest (<50% avg) | the matching `{phase}-low` environmental/self-reg tip |
| C4 | Hygiene category low (<50%) | `hygiene-low`: "Same time, same order; let them choose the soap (control)." |
| C5 | **No clear low** (doing okay) | **Skip the tip** — don't manufacture a problem. Highlights (D) carry it. |

### Layer D — Highlights (always render, always positive)
| # | Always | Source |
|---|---|---|
| D1 | **Strongest phase** + its rate ("Trophy") | `phaseInsights` max |
| D2 | **Most-active window** | `phaseInsights` completions |
| D3 | **Weekly map** (7 dots, active 🔥 / rest 💤) | daily active-state |

---

## 4. How it composes the screen
Top → bottom: **[A gesture if A2/A3]** → **B weekly card** (rate + 70%-context + real WoW + active/rest counts) → **D highlights** → **C0/C one tip (if any)** → **D weekly map** → reinforcement message + CTA (B). Mirrors Lovable's layout, but our vocabulary, every value real, every message on our tone rules.

## 5. Reconcile with existing code
- **`recommendationEngine`** (low-vibe/comeback/celebrate) = Layer A, unchanged. The Insights screen reads the same signals; it does NOT duplicate the dashboard card.
- **`useParentInsights`** stays the source for phase data + the 8 tip templates (Layer C/D). Change: trigger tips by `category`/`strategy_id`, not title substring.
- **New:** `useWeeklyStats` (solid-days, 14-day window for real WoW) → Layer B/D.
- **Day-success threshold** comes from ONE shared definition aligned with the buddy EOD (`LEAST(3, assigned)`), imported, not re-hardcoded.

## 6. Recommended build (chunks)
1. `useWeeklyStats(childId)` — pure-ish hook over `daily_progress` (last 7 + prior 7), exposes `solidDays`, `dailyMap[]`, `weekOverWeek|null`.
2. `selectInsightFraming(state)` — pure function returning the Layer-B case (B1–B5) + the single tip, **checking Layer C0 (reward loop) FIRST, then C1–C5**. Takes reward-loop signals (rewards count, redemptions/14d, balance, cheapest reward). Testable like `recommendationEngine`.
3. `ParentInsightsScreen` (RN) — renders A-gesture / B / C / D. Premium-gated; subscriber entry from the dashboard insight card.
4. i18n: new `insights.weekly.*` keys (en/he); reuse existing `insights.<tip>.*`.
5. Hat-3 verify with a real family (a week of data) across B1–B5.

## 7. Decisions (Adi 2026-06-19) + remaining
- ✅ **Vocabulary:** OUR terms; drop "ignition/charging". Good day = **"יום פעיל"**, off-day = **"יום מנוחה"**.
- ✅ **Phrasing:** "solid day" rejected → **"יום פעיל" (active day)**.
- ✅ **CTA:** reinforcement messages **include a CTA** (Layer B + C0/C).
- Remaining: final i18n strings (en/he) for the new terms + messages; tune reward-loop + active-day thresholds on real data.
