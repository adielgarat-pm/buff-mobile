# Beta Launch — 2026-06-01

> Umbrella session for the public beta launch on **2026-06-01**.
> Each Track is a discrete workstream with its own plan doc in this folder.
> Tracks ship independently; this folder is the index + handoff surface.

---

## How this folder works

- **Drafts live here on whatever branch is active** (currently `claude/funny-maxwell-dca4a5`).
- CC drafts → commits → pushes as work progresses.
- When a Track is blocked on Adi (e.g. needs a CSV, a strategic call, a Supabase Dashboard action), the Track doc states the blocker in its **Status** section. Adi pulls and reads.
- When a Track is ready to execute, it gets promoted to its own session folder (`docs/sessions/{track-slug}/`) per WORKFLOW.md, or — for small reversible operations — executed directly from this draft with Adi's `approved, proceed`.

**This is a planning surface, not an execution surface.** No SQL, no schema changes, no code edits happen from inside `beta-2026-06-01/` files. They specify *what* and *why*; execution moves to a proper package when approved.

---

## Track index

| # | Track | Doc | Status | Blocker |
|---|---|---|---|---|
| 1 | TBD | — | not yet defined | awaiting Adi |
| 2 | TBD | — | not yet defined | awaiting Adi |
| 3 | TBD | — | not yet defined | awaiting Adi |
| 4 | TBD | — | not yet defined | awaiting Adi |
| 5 | Cohort Lifetime Access | [TRACK_5_cohort_lifetime_access.md](./TRACK_5_cohort_lifetime_access.md) + [TRACK_5_lovable_export_prompt.md](./TRACK_5_lovable_export_prompt.md) | draft — blocked | cohort CSV only (Q1–Q5 all answered) |

> Tracks 1–4 are placeholders. CC will not invent them. Adi defines scope per Track; CC drafts the plan per Track.

---

## Conventions

- **One file per Track**, named `TRACK_{N}_{slug}.md`.
- Each Track doc has: **Goal · Status · Open Questions · Proposed Phases · Out of Scope · Risks**.
- **Status line** at top of each Track doc is the at-a-glance: `draft | blocked | ready | in-progress | done`.
- When a Track lands in `done` and merges to `main`, this README's table is updated in the same commit.

---

## Why a single umbrella session, not 5 separate sessions

A beta launch is one shippable event (the 2026-06-01 date) with multiple workstreams that share fate. Bundling them under one umbrella keeps the cross-Track sequencing visible and the launch checklist in one place. Each Track still gets its own commits, its own diffs, its own approval gate — the umbrella is just an index.

If a Track grows large enough to need its own ROADMAP/TESTS/SPEC_SYNC files, it graduates to its own `docs/sessions/{slug}/` folder and stays linked from here.
