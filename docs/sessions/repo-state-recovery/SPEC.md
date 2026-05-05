# repo-state-recovery — SPEC

> מצב היעד לחבילה הזו.

---

## Capabilities & Bottlenecks

### מה Claude.ai יכולה
- Authored all session content

### מה Claude Code (CC) יעשה
- Execute file operations (git add, rm, .gitignore edit) per Adi's pre-approvals
- Recover files as-is — no content changes to BUFF_VALUES.md or DEPLOYMENT.md
- Run verifications before and after each chunk

### מה Adi חייבת לעשות בעצמה
- Review each chunk diff before approving next
- Merge PR on GitHub
- Confirm "verified, clean up" after merge

### צוואר בקבוק / נקודות עצירה צפויות
- BUFF_VALUES.md and DEPLOYMENT.md must be committed exactly as on disk (no edits)
- Garbage file deletions leave no git footprint (never tracked)
- .gitignore patterns must not accidentally suppress tracked files

---

## Values Check

### Pillar 1 — Intrinsic Motivation
N/A — no child-facing feature.

### Pillar 2 — Positive Coaching
N/A — no child-facing feature.

### Pillar 3 — Independence-Building
Indirect pass — committing BUFF_VALUES.md ensures any fresh clone has the canonical values doc, enabling Adi (and CC in a new session) to operate the full workflow independently without relying on disk-only state.

**Values Check Pass:** [x] כן

---

## Goals
- Commit `docs/BUFF_VALUES.md` to version control (was disk-only since 2026-05-02)
- Commit `docs/sessions/admin-dashboard-port/DEPLOYMENT.md` to version control
- Delete 4 garbage files: `main` (0 bytes), `docs.zip`, `EOD_2026-05-03.md`, `WORKFLOW_FOUNDATION_INSTRUCTIONS.md`
- Add `.gitignore` patterns: `supabase/.temp/`, `docs/UPDATES_2026-05-02.md`, `docs/EOD_CLOSING_2026-05-02.md`, Hebrew directory, `/*.zip`
- Result: stable, clean `git status` — no noise from dynamic CLI state or local working files

## Non-goals
- No changes to file contents (BUFF_VALUES.md and DEPLOYMENT.md committed as-is)
- No src/, app/, components/, admin-web/, supabase/migrations/, supabase/functions/ changes
- No CLAUDE.md, WORKFLOW.md, INTEGRATION_LEARNINGS.md, or BUFF_DECISIONS_LOG.md edits
- No history rewrites, no rebases, no force operations

## Out of Scope
- Cleaning remaining untracked files not in the explicit list (`docs/UPDATES_2026-05-02.md`, `docs/EOD_CLOSING_2026-05-02.md` — kept on disk, added to .gitignore only)
- Renaming or reorganizing any existing tracked files
