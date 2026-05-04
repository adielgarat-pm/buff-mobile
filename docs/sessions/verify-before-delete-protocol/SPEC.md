# verify-before-delete-protocol — SPEC

> מצב היעד לחבילה הזו.

---

## Capabilities & Bottlenecks

### מה Claude.ai יכולה
- Authored all content verbatim: lesson entry, CLAUDE.md section, WORKFLOW.md section

### מה Claude Code (CC) יעשה
- Precise insertion of verbatim content into 3 target files
- Scaffold session folder
- Run grep verification gates before each commit
- Fill STATUS.md at closeout
- **Apply Verify-Before-Delete Protocol to its own cleanup** (this package eats its own dogfood)

### מה Adi חייבת לעשות בעצמה
- Review each phase diff
- Merge PR on GitHub
- Issue explicit "verified, clean up" instruction after CC reports verification results

### צוואר בקבוק / נקודות עצירה צפויות
- CC must not paraphrase — all content given verbatim
- New protocol applies to this package's own cleanup

---

## Values Check

### Pillar 1 — Intrinsic Motivation
N/A — docs-only, no child-facing feature.

### Pillar 2 — Positive Coaching
N/A — docs-only, no child-facing feature.

### Pillar 3 — Independence-Building
Indirect pass — preventing accidental branch deletion protects Adi from data loss, enabling her to operate the workflow independently with confidence. A broken workflow creates learned helplessness; a safe workflow builds autonomy.

**Values Check Pass:** [x] כן

---

## Goals
- Add `### Lesson 2026-05-04` to `docs/INTEGRATION_LEARNINGS.md` under existing `## Lessons` section
- Add `## Verify-Before-Delete Protocol` to `CLAUDE.md` (after Snapshot Protocol, before Environment)
- Add `## Cleanup Procedure` to `docs/WORKFLOW.md` (after EOD Protocol, before טיפול בהפתעות)
- Zero changes to src/, app/, or any code file

## Non-goals
- No code changes
- No DB or schema changes
- No changes to existing CLAUDE.md sections
- No changes to any existing WORKFLOW.md sections

## Behavior Contract

After this package closes:
- Any CC reading CLAUDE.md will encounter the Verify-Before-Delete Protocol before any branch cleanup
- The EOD cleanup section in WORKFLOW.md makes the verification steps operational and explicit
- The 2026-05-04 incident is canonically documented as a reference

## Out of Scope
- Enforcing the protocol in automation
- Modifying existing WORKFLOW.md or CLAUDE.md sections
- Updating BUFF_DECISIONS_LOG.md (Adi's doc)
