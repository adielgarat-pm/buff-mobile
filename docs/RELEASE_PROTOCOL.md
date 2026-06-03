# BUFF Release Protocol — Release-Train Model

> **Why this exists:** Every submission to Google Play pays a review/approval cost (review latency + the closed-testing requirements for a children's app). Paying that cost per individual fix is wasteful and slow. This protocol batches fixes into deliberate releases while keeping an escape hatch for the rare fix that genuinely cannot wait.
>
> This is the human-readable policy. The `buff-release` skill automates the *mechanics* of cutting a release (the 6-step / 5-gate pipeline). This doc owns the *decision* of **when** to cut and **which lane** a fix takes.

**Status:** Active
**Owner:** Adi (policy) · CC (execution)
**Created:** 2026-06-03 (D pending — propose to DECISIONS_LOG)
**Companions:** `docs/RELEASE_QUEUE.md` (the living accumulation surface) · `.claude/skills/buff-release/SKILL.md` (the executor)

---

## The two lanes

Every merged fix is classified into exactly one lane the moment it lands on `main`.

### Lane 1 — Train (default)

The batch lane. Fixes accumulate in `docs/RELEASE_QUEUE.md` and ride out together on a scheduled release.

- **Default for everything.** A fix is Train unless it explicitly meets a Hotfix trigger below.
- One review cost is amortized across the whole batch.
- Cut when a **departure trigger** fires (see below).

### Lane 2 — Hotfix (exception)

The bypass lane. Cut a version immediately from `main`, do not wait for the train.

A fix qualifies as Hotfix **only if it meets at least one** of these, verbatim:

- **App-breaking:** crash on launch, or a crash/freeze on a core daily flow (task complete, vibe check, rewards) that a real user hits.
- **Data-loss or data-corruption** affecting a real user's family/profile/progress.
- **Payment / entitlement broken:** a paying family loses access, or a child sees a paywall they shouldn't (Pillar 2 / IN-2026-05-14-02 class).
- **Security / PII leak:** any path that exposes a child's data or sends PII off-device.
- **Store-compliance takedown risk:** something Google flagged or that violates the Designed-for-Families / children's-app policy and risks suspension.

If a fix does **not** meet one of the above → it is Train, even if it feels urgent. "Feels urgent" is not a Hotfix trigger. When in doubt, it's Train — surface the borderline call to Adi rather than self-approving a Hotfix.

> **Why the bar is strict:** if anything can jump the queue, everything will, and the train collapses back into per-fix releases — which is the cost this protocol exists to avoid.

---

## When does the train depart?

Cut a Train release when **either** trigger fires (whichever comes first):

| Trigger | Threshold (starting default — tune with data) |
|---|---|
| **Time** | ~2 weeks since the last release |
| **Volume** | ~5+ user-facing fixes accumulated in the queue, OR ≥1 notable feature ready |

These thresholds are a starting point, not law. Adi adjusts them once we see real review-latency and fix-flow numbers. The point is a *predictable rhythm* the team can plan around, not a rigid SLA.

**Do not cut a near-empty train** to hit the calendar. If only 1–2 trivial fixes accumulated, let it ride to the next window. An empty-ish release still pays full review cost for little value.

---

## Lifecycle of a fix

```
PR merged to main
      │
      ├─ meets a Hotfix trigger? ──yes──► Hotfix lane: cut now, run buff-release immediately
      │                                   (queue row marked "shipped: vN (hotfix)")
      │
      └─ no ──► Train lane: add a row to docs/RELEASE_QUEUE.md  ("Queued")
                      │
                      │  (accumulates with sibling fixes)
                      │
              departure trigger fires
                      │
                      ▼
           run buff-release skill:
             Step 2 reads the queue → builds MANIFEST  (queue rows → manifest rows)
             Gates 1+2 run · build · notes · tag
                      │
                      ▼
           drained queue rows marked "shipped: vN", moved to the Shipped log
```

The queue is the **input** to the release; the MANIFEST (auto-generated from git diff by the skill) is the **verified output**. They should agree — if a queue row has no matching git change, or a git change has no queue row, that's a gap to flag (a fix shipped without being tracked, or a tracked fix never landed).

---

## Roles

- **CC** classifies each merged fix into a lane at merge time and adds/updates the queue row. CC executes the cut via the `buff-release` skill when a trigger fires. CC proposes the departure ("train is full / 2 weeks elapsed — cut V_N?") rather than cutting silently.
- **Adi** owns: approving a Hotfix classification (the bypass is a product/risk call), approving the cut, approving user-facing release-notes copy, the Hat-4 steps (Play Console upload, real-device verify), and tuning the thresholds.

---

## Interaction with existing rules

- **Branch / main discipline** (CLAUDE.md) unchanged: releases are cut on a `pkg/*` branch, never pushed to `main` directly; tag is proposed, not pushed.
- **Gates are not skippable** even for a Hotfix. A Hotfix still runs Gate 1 (static) + a *scoped* Gate 2 (the broken flow + critical-path smoke). Speed comes from skipping the *wait*, not the *checks*.
- **Verify-before-delete** unchanged for any branch cleanup after a cut.

---

## Maintenance

- Revisit thresholds after the first 3 releases under this protocol — record actuals (review latency, fixes/train) and adjust the table.
- If/when BUFF leaves internal testing for a public track, add staged-rollout considerations (the skill's Gate 7 note).
- Keep this doc and the `buff-release` skill in sync: the skill's Step 2 must reference the queue as its manifest seed.

**Last updated:** 2026-06-03
