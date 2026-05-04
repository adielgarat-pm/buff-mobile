# verify-before-delete-protocol — Roadmap

## Phase 1 — Lesson → docs/INTEGRATION_LEARNINGS.md

**Scope:** Insert `### Lesson 2026-05-04 — Branch deleted before merge (data near-loss)` after the closing `---` of Lesson 2026-05-03, before `## איך למלא ערך חדש`.

**תנאי עצירה:**
- `grep -c "Lesson 2026-05-04" docs/INTEGRATION_LEARNINGS.md` = 1
- `grep -c "Verify-Before-Delete" docs/INTEGRATION_LEARNINGS.md` ≥ 1

**Exit Deliverables:**
- [ ] INTEGRATION_LEARNINGS.md updated per SPEC_SYNC.md
- [ ] STATUS.md row 1 filled

---

## Phase 2 — Verify-Before-Delete Protocol → CLAUDE.md

**Scope:** Insert `## Verify-Before-Delete Protocol` (Rules 1–5 + Applies to / Does NOT apply to / Reference) after `## Read-only Snapshot Protocol` and before `## Environment`.

**תנאי עצירה:**
- `grep -c "Verify-Before-Delete Protocol" CLAUDE.md` = 1
- `grep -c "^### Rule [1-5]" CLAUDE.md` = 10 (5 Snapshot + 5 new)

**Exit Deliverables:**
- [ ] CLAUDE.md updated per SPEC_SYNC.md
- [ ] STATUS.md row 2 filled

---

## Phase 3 — Cleanup Procedure → docs/WORKFLOW.md

**Scope:** Insert `## Cleanup Procedure — אחרי merge ל-main` after `## EOD Protocol — סגירת יום` and before `## טיפול בהפתעות`.

**תנאי עצירה:**
- `grep -c "Cleanup Procedure" docs/WORKFLOW.md` = 1
- `grep -c "verified, clean up" docs/WORKFLOW.md` ≥ 1

**Exit Deliverables:**
- [ ] WORKFLOW.md updated per SPEC_SYNC.md
- [ ] STATUS.md row 3 filled

---

## Phase 4 — Close STATUS

**Scope:** Fill STATUS.md rows, run final log + diff.

**תנאי עצירה:**
- `git log --oneline main..pkg/verify-before-delete-protocol` = 5 commits
- `git diff main..pkg/verify-before-delete-protocol --stat` = 0 src/ lines

**Exit Deliverables:**
- [ ] STATUS.md closeout note added

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] PR ל-main, fast-forward merge, branch נמחק (per new Verify-Before-Delete Protocol)
