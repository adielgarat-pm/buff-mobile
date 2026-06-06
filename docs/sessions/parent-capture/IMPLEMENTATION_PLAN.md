# Parent Capture — IMPLEMENTATION PLAN, ESTIMATES & TIMING

**Status:** `planning — build NOT approved. Estimates for the now-vs-V-next decision.`
**Companion:** `SPEC.md` (target state), `DECISION.md` (strategy + market).
**Drafted:** 2026-06-05.

> Scope of this doc: phase-by-phase effort + token estimates, the **de-risked-vs-gated split** (what can be built *without* the Gemini/privacy decision), the **14-day tester-window** analysis, and a **timing recommendation**.

---

## 1. What we're estimating

**v1 = parent-capture only** (the disciplined cut): share/paste → Gemini parse → confirm card → parent "This Week" surface + transfer-to-child. NO always-on monitoring, NO teen flow, NO calendar grid, Android only.

**v2 = teen / operator-based capture** (SPEC § "v2"). Larger build (sweep of N groups, scaffold-not-replace UX, operator routing). **Not estimated in detail here** — directionally ~60-100% on top of v1. Built only after v1 is proven.

---

## 2. How to read these numbers (honesty about precision)

- **Tokens** = CC (Claude Code) working tokens to implement a phase — context-reading + writing + iteration + debugging. **Agentic coding estimates have wide error bars: assume ±50%.** A nasty surprise in Phase 0 (Android share-intent, task schema) can shift the total.
- **Calendar time ≠ CC speed.** CC executes a phase in hours; calendar time is gated by **Adi's chunk-by-chunk review cadence** (CLAUDE.md). At 1–2 chunks/day reviewed, the schedule below holds.
- These are **planning estimates, not a quote.** Phase 0 exists precisely to replace guesses with verified numbers before any build commitment.

---

## 3. Phase plan — v1 (parent-capture)

| # | Phase | CC active | Calendar (w/ review) | Tokens | Confidence | Gate |
|---|---|---|---|---|---|---|
| 0 | Foundation & verification | 2–3h | ~0.5 day | 0.2–0.4M | High | none — **do first** |
| 1 | `parse-capture` Edge Fn (Gemini) | 3–5h | ~1 day | 0.5–0.9M | Med | 🔒 **Gemini approval** |
| 2 | Schema + RLS (`parent_items`, `capture_runs`, `grade_level`) | 2–3h | ~0.5 day | 0.2–0.4M | High | 🔒 schema (light — additive, no prod users) |
| 3 | CaptureScreen + in-app entry | 3–4h | ~1 day | 0.3–0.6M | Med-High | — (works behind stub parser) |
| 4 | ConfirmCard (edit/owner/discard/confidence) | 4–6h | ~1–1.5 days | 0.5–0.9M | Med | — |
| 5 | Transfer-to-child (existing task path) | 3–5h | ~1 day | 0.3–0.7M | Med (schema unknown) | — |
| 6 | "This Week" surface (calm pull + recency) | 4–6h | ~1–1.5 days | 0.4–0.8M | Med | — |
| 7 | Android share target (`intentFilters`) | 2–5h | ~0.5–1.5 days | 0.2–0.5M | **Low** (managed-Expo unknown) | — |
| 8 | Privacy/consent + i18n + copy review | 3–4h | ~1 day | 0.3–0.5M | Med | 🔒 **privacy posture decided** |
| 9 | Spec sync + tests + PR | 2–4h | ~0.5–1 day | 0.2–0.4M | High | — |

**v1 totals:**
- **CC active:** ~28–45 hours
- **Calendar (with reviews):** **~8–11 working days**
- **Tokens:** **~3–6M** CC working tokens

**Confidence on the total: medium.** The three biggest swing factors:
1. **Phase 7** — Android share-intent in *managed* Expo. Could be a clean `intentFilters` config, or could need a config plugin / extra build pain. Phase 0 settles this.
2. **Phase 5** — the real existing task/event schema + insert path + day-filtering (`project_task_day_filtering`). Phase 0 settles this.
3. **Iteration multiplier** — debugging can add 1.5–2× on any UI phase.

---

## 4. Gemini *runtime* cost (separate from build)

Not a concern at current scale. Gemini Flash is ~fractions of a cent per capture (text or image). Even at generous testing volumes (hundreds of captures/month across all families), runtime cost is **single-digit dollars/month**. The per-family daily cap (OQ-C10) backstops abuse. **Build cost dominates; runtime cost is noise** until real scale.

---

## 5. The de-risked vs gated split  ← the key to the window

The product cleaves cleanly into a part that needs **no gated decision** and a part that does.

### 🔒 Gated (needs a decision before building)
- **Phase 1** (parse-capture) — needs **Gemini approval**.
- **Phase 8** (consent/privacy copy) — needs the **privacy posture decided**.
- **Phase 2** (schema) — *soft* gate; additive tables, mobile DB has no prod users (`feedback_mobile_db_no_prod_users`). Likely a quick yes.

### ✅ Buildable NOW, behind a **stub parser** (no Gemini, no privacy decision)
Phases **0, 2, 3, 4, 5, 6, 7** — the entire pipeline *around* the AI: capture entry, confirm card, transfer plumbing, "This Week" surface, share target. The stub parser just returns fixed mock items so the UI/flow can be built and tested end-to-end.

- **Subset effort:** ~20–32h CC · **~5–7 calendar days** · **~2–4M tokens**
- **Nothing built is wasted regardless of the gate outcome** — these surfaces are needed no matter which AI vendor you pick, or even if AI is delayed. When the gate clears, **Phase 1 is a small slot-in** (~1 day) and the whole thing lights up.
- Bonus: the de-risked half is, by itself, a usable **manual** parent capture feature. (We do **not** *ship* the manual-only version to users — that strips the magic, per DECISION §7 — but it's a real, testable scaffold while the AI gate is pending.)

---

## 6. The 14-day tester window — analysis

**The case for building now:** the window is genuine **idle dev capacity** (you're blocked waiting on testers). CC does the building; tokens are cheap relative to your time. Converting idle time into a de-risked head-start is rational.

**The three honest cautions:**
1. **Your review bandwidth is the real constraint** — not CC's speed. Reviewing 5–7 build chunks competes with **absorbing tester feedback**, and tester feedback is the **higher priority** because it's the signal that decides the whole *now-vs-V-next* question (core retention — the 79% problem).
2. **Don't let the window pressure the gates.** The Gemini + privacy/legal decision must not be rushed to "fit" 14 days. Those are strategic/legal, not engineering.
3. **Nothing ships to the testers mid-window anyway** — they're testing the current build. So there's no "ship by day 14" forcing function; the only question is whether to *build ahead*.

**What the window is genuinely good for:**
- ✅ Building the **de-risked half** behind a stub parser (useful no matter what).
- ✅ Making the **Gemini + privacy decision** in parallel (your call + a legal sanity-check of Gemini terms).
- ✅ Watching the **tester retention signal** — which tells you whether *now-vs-V-next* should even be "now."
- ❌ NOT good for: committing the gated AI/privacy parts before the retention signal and the legal answer are in.

---

## 7. Timing recommendation

> Recommendation (medium confidence). The deciding factor is **your review bandwidth during the window** — it's the one thing I can't size for you.

**Recommended: a time-boxed build of the de-risked half during the window, with the gates decided in parallel — tester feedback stays priority #1.** Sequence:

1. **Phase 0 first** (½ day) — verify the real unknowns (share-intent, task schema, Gemini terms). This replaces the riskiest guesses with facts and costs almost nothing.
2. **Build Phases 2–7 behind a stub parser** (~5–7 days, fits the window) — only if Phase 0 comes back clean and your review bandwidth allows.
3. **In parallel (you, not CC):** decide Gemini + privacy posture; watch tester retention.
4. **After the window**, with (a) the tester signal and (b) the privacy answer: decide whether to light up **Phase 1 (AI) + Phase 8 (consent)** and ship — or hold.

**This gets you the upside of the idle window without committing the risky parts before the answers are in, and without one wasted line if you later defer.**

**The conservative alternative (also valid):** if your bandwidth this window is thin, **defer all building** — use the 14 days purely to absorb tester feedback and make the two gate decisions, then build after with full focus. Lower risk of context-switch drag; slower.

**What I would NOT do:** build the *full* v1 (including live Gemini + consent) before you've (a) seen the tester retention signal and (b) gotten a real read on Gemini's data-use terms for a children's app. That's committing the risky half on a deadline — exactly the Milo pattern.

---

## 8. Before any build starts (checklist)

- [ ] **Gemini decision** — vendor approved? Data-use terms (training/retention/region) sanity-checked for a children's app?
- [ ] **Privacy posture** — consent copy direction; third-party-PII handling on images (redaction?).
- [ ] **now-vs-V-next** — is the tester retention signal pointing to "now"?
- [ ] **Review bandwidth** — can you review ~1–2 chunks/day this window without starving tester feedback?
- [ ] **Phase 0 run** — share-intent feasibility + real task schema verified (CC can do this autonomously, no gate).

If the first three aren't ready, **Phase 0 + the de-risked build can still proceed** — they don't depend on them.
