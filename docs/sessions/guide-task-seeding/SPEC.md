# SPEC — Guide → Task Seeding (content-to-activation bridge)

**Slug:** `guide-task-seeding`
**Status:** 🟡 PROPOSAL (2026-07-10) — for Adi's reaction. **Not approved to build.** No code until `approved, proceed`.
**Target user:** a parent who **does not have BUFF yet**, reading a public guide (e.g. `/guides/back-to-school/`, `/guides/summer/`).

---

## Problem

The guides do the top-of-funnel job — a parent searches "ADHD morning routine," lands on our page, reads good advice. Then the CTA is a generic "Get BUFF free," and the parent has to go **invent the routine themselves** inside the app. That "read → still have to set it up" gap is the same activation leak [[project_web_activation_zero]] that `#345` closes from the *onboarding* side. This closes it from the **content** side.

## Thesis

Let the parent tap the exact tasks the guide recommends; those tasks are **pre-seeded into onboarding**, so their first-mission-together (`#345`) is a task **they self-selected from something they were reading**. Reading → doing, at the moment of intent. Example: on the back-to-school guide the parent taps "wake up independently" → signs up → that task is already waiting → they do it together → activated.

---

## Behavior Contract

### The pick-set contract (guide page)
- Each guide's recommended tasks carry a **stable task key** (`wake-independent`, `pack-bag-night-before`, `lay-out-clothes`, …).
- Each shows a **"➕ Add to my child's plan"** control.
- Tapping toggles the key into a client-side **pick set** (localStorage, guide origin), capped at the lean limit (~5). Anchor-type tasks pre-checked (see Q3).
- The CTA appends the set: `https://www.buffadhd.com/download?plan=back-to-school&tasks=wake-independent,pack-bag`.
- **Never put child data in the URL** — only generic task keys (Values / Pillar 2).

### Phase 1 — Web PWA seeding (**NOT blocked on #301**)
1. Parent taps CTA → lands on the web app (same origin as the guide).
2. `plan` / `tasks` params captured → stored (session/localStorage) → survive the signup screen.
3. Onboarding **Step C (task generation)**: seeded keys resolve to real tasks and are **pre-added to the plan** — merged with the generator, deduped, capped.
4. **Step D (`#345` first-mission-together)** offers one of the **seeded** tasks first.
5. Activation: seed `daily_progress` row (as `#345`) + `onboarding_events.acquisition = {source:'guide', plan, tasks}`.

### Phase 2 — Native install seeding (**rides #301**)
- Same params, carried through the Google Play **Install Referrer** channel from `smart-join-link` / `#301` → read on first launch → same Step C seed.
- Install Referrer missing/edge → fall back to generic onboarding. **Never a broken state.**

---

## Guardrails (Values-critical)
- **Lean cap:** picks accumulate into the same ~5-task cap; excess shows a visible "your plan is full" note — **no silent drop**. Prevents the Lovable-era overload ([[project_onboarding_task_generation]]).
- **Curated only:** only guide-authored keys are addable — no free text (quality + child safety).
- **Merge, don't duplicate:** seeded tasks dedupe against the generator's output.
- **Anchor priority:** anchor-type tasks (independent wake, meds) surface first — the ones that actually survive ([[project_buff_anchor_theory]]).
- **No dead-end:** unknown/invalid key → skipped silently, onboarding proceeds.
- **Kid-facing copy:** seeded titles use the plain-invite child voice, no "why"/category ([[feedback_kid_task_copy_simple]]).

## Measurement (reuses `#345`, no new infra)
- `onboarding_events.acquisition` already exists → tag `{source:'guide', plan, tasks, utm}`.
- Compare guide-seeded vs organic on the `signup → child_created → first_task_complete` funnel. Clean A/B: do self-chosen seeded tasks activate better?

## Dependencies
- **`#345` (merged ✅)** — the onboarding task list + Step D seed this rides on.
- **`#301` / `smart-join-link`** — required **only for Phase 2** (native). Phase 1 (web) ships independently.
- **No schema change** — additive; task keys map to existing generator tasks.

---

## Values Check (must fully pass before build — draft answers)
- **Pillar 1 — intrinsic motivation, not compliance:** tasks are parent-chosen anchors framed as invites; the first is a *together* win → intrinsic. Risk: becoming a chore-dump — mitigated by cap + curation. ✅ (verify in copy)
- **Pillar 2 — child safety / data:** curated keys only; **no PII/child identifiers in params**; no new data collected. ✅ (hard rule: params carry task keys, never names)
- **Pillar 3 — autonomy / outgrow:** the flagship seeded task *is* "wake independently" — an autonomy anchor. ✅

## Open questions for Adi
1. **Per-task buttons vs one "add this whole plan"?** I lean **per-task** (your original vision) with the cap as guardrail. Confirm.
2. **Which guides first?** Back-to-school + summer are already built — start there?
3. **Pre-check anchors by default** (wake-independent, meds), or all unchecked so the parent opts in deliberately?

## Scope cut-line (MVP)
- **In:** Phase 1 web seeding · per-task add on the 2 existing guides · cap + merge · acquisition tagging.
- **Out (fast-follow):** Phase 2 native (waits on `#301`) · analytics dashboard · dynamic/CMS task keys · per-task deep-open for *existing* users.

## Honest caveat
This only pays off once guide traffic flows — the guides are new and not yet ranking. Treat it as **building the conversion machine while SEO ramps**, ready for when the guides rank and the FB push drives readers — not an immediate-traffic play.
