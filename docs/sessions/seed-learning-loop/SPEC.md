# SPEC — pkg/seed-learning-loop

**Status:** DRAFT (planning) — not yet approved for implementation. Authored 2026-05-30.

**Target state:** A learning mechanism that turns BUFF's own usage into two products:
**(1)** a funnel scorecard that tells the team *where users drop off and where to invest*,
and **(2)** a feedback loop that makes the **initial task/reward generation** and the
**suggestions shown to parents** smarter over time. The mechanism collects **aggregate,
de-identified signals only** — no per-child behavioral profile, no free-text content.

---

## The model (confirmed with Adi, 2026-05-30)

BUFF is measured as a **freemium funnel** with a **two-level activation** in the middle.
Each stage has **one key metric** and **one learning lever**.

```
0. Sign-up
1. Setup complete            ← parent finished onboarding
2. Activation A — "Engaged"  ← child completed first task     | lever: TASK seeding
3. Activation B — "Value proven" ← child redeemed first reward | lever: REWARD seeding + pricing
4. Habit                     ← retention week 2 / week 4
5. Monetization              ← free → paid
```

**The most diagnostic single metric is the A→B drop.** A child who completes tasks but
never redeems a reward signals that the **reward side is broken** — usually a *pricing*
problem (first reward priced out of reach), not a "bad reward" problem. This is why the
reward-learning lever includes **price calibration**, not just reward selection.

**Why this shape:** the quality of the *initial* seeded tasks/rewards is primarily an
**Activation lever**. Bad seeds → child never engages → no habit → no payment. So improving
generation is the highest-leverage place to move the whole funnel.

---

## Success metrics

| Stage | Key metric | Source | New collection? |
|---|---|---|---|
| 1. Setup complete | % sign-ups finishing onboarding | `child_preferences.child_onboarding_completed`, `onboarding_step` | No |
| 2. Activation A | % set-up families w/ ≥1 task completed in first N days | `daily_progress` | No |
| 3. Activation B | % activated-A families w/ ≥1 reward redeemed in first N days | `store_rewards.claimed_at` | No |
| — A→B drop | A-rate − B-rate, per age-bucket | derived | No |
| 4. Habit | retention week 2 / week 4 | `profiles.last_seen_at` | No |
| 5. Monetization | free → paid conversion | `is_pro` / `is_lifetime_access` | No |

**Success of the learning loop itself:** after acting on a learning output (e.g. a new seed
catalog for age 9), the **Activation rate for that age-bucket rises** (pre/post or A/B).
This is the only definition of "the loop worked".

---

## Learning architecture — Capture → Aggregate → Act

### Capture (minimal, derived from parent curation + aggregate outcomes)
The funnel above is **already computable from existing tables** — Phase 1 needs **zero new
collection**. The learning *scorecard* needs two additions and one optional stream:

1. **Soft-delete on `tasks` and `store_rewards`** (`deleted_at`, `deleted_by_role`).
   Today deletes are hard — the "parent rejected this seeded item" signal, the single most
   valuable learning signal, is permanently lost every day. This is the cornerstone change.
2. **`template_key` (text) on seeded items** — stable identity so "seeded task T survived in
   70% of age-9 families" can aggregate across families. Free-text `title` cannot.
   Backfill the 978 existing tasks from `is_system_generated` + title↔seed-catalog match
   (best-effort; medium confidence on backfill cleanliness).
3. **(Phase 3) `usage_events`** — a thin event log (pattern: existing `pwa_events`) for
   feature usage the funnel can't derive: language toggle, mode toggle, Vibe Check open,
   BUDDY interaction, View-as-Child. Powers the "which features are dead → stop investing"
   map.

### Aggregate
A daily rollup job (pg_cron, mirroring the BUDDY EOD job) writes `learning_rollups` keyed by
**age-bucket × role × template_key × signal**. Signals: `kept`, `deleted`, `completed`,
`redeemed`, `child_proposed_approved`, `feature_used`. **Never keyed by individual child.**

Age-buckets: **6–8 / 9–11 / 12–14 / 15–18** (exact age + family is re-identifiable; buckets
are not).

### Act — two payoffs
- **Team scorecard (where to invest):** per age-bucket — which seeded tasks/rewards get cut
  fastest, which rewards never redeem, which features are untouched, what parents add
  manually (= catalog gaps). Lives in `admin-web` or a simple query first.
- **Smarter generation (the loop closes):** feed the rollup back so the onboarding seeds the
  **top-ranked task/reward set for the child's age** and stops seeding what gets rejected;
  and so parent suggestions surface "kept by similar families" + approved child-proposals as
  **demand signals for new catalog items**. Reward seeding also pulls **calibrated pricing**
  (`credits_needed` tuned so the first reward is reachable within the target window) to lift
  Activation B.

---

## Data-science note — the personalization ceiling

At generation time we reliably know **only age** (`age_mode` + birth date present for all
284; richer inputs `focusArea` 39, `struggles` 16, `motivations` 16, `grade` 15 are captured
for a small, inconsistent minority). Therefore:

- **v1 personalization = age-bucket only.** Age is reliably present and is the strongest
  single signal. (rec — pending Adi confirm.)
- **v2 unlock = enrich + consistently capture onboarding inputs** (focusArea / struggles).
  This raises the ceiling beyond age, but it is a *product* change to onboarding, separate
  from the logging work. Named here, not in v1 scope.

Two data investments with different ROI: **outcome logging** (ranks existing templates,
medium effort) vs **input enrichment** (enables true personalization, higher product effort,
higher ceiling). v1 does only the first.

---

## Phasing

- **Phase 1 — Funnel scorecard (no new collection).** Compute stages 1–5 + A→B drop per
  age-bucket from existing tables. Immediate value on all 195 families. Validates the model
  before any schema change.
- **Phase 2 — Seed scorecard.** Add soft-delete + `template_key` + backfill + daily rollup →
  keep/cut/promote list per age-bucket.
- **Phase 3 — Feature map.** Add `usage_events` → which features are used vs dead.
- **Phase 4 — Act.** Feed rollup into onboarding seeding + parent-suggestion ranking + reward
  price calibration. Measure Activation lift per age-bucket.

---

## Privacy principle (light — this is curation analytics, not child profiling)

The backbone is **parent curation actions** (add / keep / delete / approve-reject of child
proposals — the last already in `child_suggestions.status` + `resolved_by`). The activation
metrics use child-action outcomes (first completion, first redemption) **only as aggregate
funnel rates**, never as a stored per-child behavioral profile.

One binding rule covers it: **aggregate-only, de-identified (age-bucket not exact age + family),
no free-text content** (custom task/reward titles are aggregated by `category`, never stored
as text in the rollup — they may contain a child's name). Check whether existing
`profiles.marketing_consent` is the right gate, or whether product analytics needs none.
**This is Adi's product/privacy call — not self-approved.**

---

## Decisions (confirmed by Adi, 2026-05-30)
- **Funnel with two-level activation** — A = first task completed, B = first reward redeemed.
- **Parent-curation backbone**; child signals enter only as aggregate funnel rates.
- **A→B drop is the headline diagnostic**; reward learning includes price calibration.
- **Soft-delete is the cornerstone** — stop hard-deleting seeded items.
- **Activation windows:** A counts within **3 days** of setup; B within **7 days**.
- **Reachable first reward:** the initial reward set must include ≥1 reward a typical child
  earns within **7 days** — the price-calibration objective for Activation B.
- **v1 = age-bucket personalization only.** Uses birth date already captured.
  **No onboarding changes** (onboarding is stable; touching it is a risk Adi declined).
  Onboarding input enrichment (focusArea/struggles) is explicitly **v2, out of scope.**
- **Consent:** a **dedicated analytics-consent flag** will be added (NOT reusing
  `marketing_consent`). Surfaced in **parent Settings** (not onboarding). Opt-in vs opt-out:
  **PENDING Adi.** Does **not** block Phase 1 (aggregate analysis of existing operational
  data); gates only the *new* collection (`usage_events`, rollups).

## Open questions (need Adi before implementation)
1. **Consent model** — opt-out (on by default, clear disclosure + easy off) vs opt-in
   (cleaner legally, near-zero data volume at ~20 real testers). rec: opt-out. *(Adi's call.)*

## Values Check
Deferred to design-time per stage (WORKFLOW.md). Preliminary read: the mechanism observes
parent curation + aggregate outcomes to *serve children better* (better-fit first tasks);
it builds no per-child profile and surfaces no comparison/failure framing. Full 9-question
check to be completed in the SPEC before Phase 2.

## Out of scope (flagged, untouched)
- Per-child behavioral profiles or any non-aggregate child analytics.
- Storing custom task/reward free-text in the rollup (category only).
- Onboarding input enrichment (v2 — separate product package).
- ML model / ranking sophistication beyond age-bucket keep-rate ordering (start with simple
  ranked keep-rate; revisit only if the funnel justifies it).
