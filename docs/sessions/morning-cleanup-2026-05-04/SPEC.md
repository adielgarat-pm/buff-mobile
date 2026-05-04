# morning-cleanup-2026-05-04 — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.

---

## Capabilities & Bottlenecks

### מה Claude.ai (אני) יכולה
- Authored all content verbatim (FLAG entries, WORKFLOW section)

### מה Claude Code (CC) יעשה
- Precise insertion of verbatim content into 2 target files
- Scaffold session folder
- Run grep verification gates before each commit
- Fill STATUS.md at closeout

### מה Adi חייבת לעשות בעצמה
- Review each phase diff before approving next phase
- Merge PR on GitHub after push
- Confirm "merged" for local cleanup

### צוואר בקבוק / נקודות עצירה צפויות
- FLAG IDs confirmed before insertion (F-07/F-08 — no collision with existing F-01 through F-05)
- CC must not paraphrase — all content given verbatim

---

## Values Check

### Pillar 1 — Intrinsic Motivation
N/A — docs-only, no child-facing feature.

### Pillar 2 — Positive Coaching
N/A — docs-only, no child-facing feature.

### Pillar 3 — Independence-Building
Indirect pass — documenting FLAGs and formalizing EOD protocol reduces session-to-session context loss, enabling more self-directed work with less manual recap each morning.

**Values Check Pass:** [x] כן

---

## Goals
- Add F-2026-05-03-07 (Buddy design collections) to `docs/INTEGRATION_LEARNINGS.md`
- Add F-2026-05-03-08 (Pastel UI Stitch session) to `docs/INTEGRATION_LEARNINGS.md`
- Add `## EOD Protocol` section to `docs/WORKFLOW.md`
- Zero changes to src/, app/, or any code file

## Non-goals
- No code changes
- No DB or schema changes
- No new npm dependencies
- No changes to existing FLAGs (F-01 through F-05 stay as-is)

## Behavior Contract

After this package closes:
- The two strategic decisions from EOD 2026-05-03 are formally tracked as open FLAGs
- Claude.ai and CC have a documented EOD protocol that enforces PR-based EOD commits (no more direct pushes to main)

## Out of Scope
- Resolving any of the open FLAGs (F-01 through F-08)
- Modifying existing WORKFLOW.md sections
- Updating BUFF_DECISIONS_LOG.md (Adi's doc)
