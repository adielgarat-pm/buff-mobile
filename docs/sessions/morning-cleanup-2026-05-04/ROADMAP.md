# morning-cleanup-2026-05-04 — Roadmap

> פאזות עם תנאי עצירה מפורשים.

## פאזה 1 — Add F-07 + F-08 to docs/INTEGRATION_LEARNINGS.md

**Scope:** Append F-2026-05-03-07 (Buddy collections) and F-2026-05-03-08 (Pastel UI) under `## FLAGs פתוחים`, after F-05 and before `## רשומות שנפתרו`.

**תנאי עצירה:**
- `grep -c "F-2026-05-03-07" docs/INTEGRATION_LEARNINGS.md` = 1
- `grep -c "F-2026-05-03-08" docs/INTEGRATION_LEARNINGS.md` = 1

**Exit Deliverables:**
- [ ] INTEGRATION_LEARNINGS.md updated per SPEC_SYNC.md
- [ ] STATUS.md row 1 filled

---

## פאזה 2 — Add EOD Protocol section to docs/WORKFLOW.md

**Scope:** Append `## EOD Protocol — סגירת יום` after `## Snapshots — Adi / Claude.ai / CC handoff` and before `## טיפול בהפתעות`.

**תנאי עצירה:**
- `grep -c "EOD Protocol" docs/WORKFLOW.md` = 1
- `grep -c "Rule 7" docs/WORKFLOW.md` ≥ 1

**Exit Deliverables:**
- [ ] WORKFLOW.md updated per SPEC_SYNC.md
- [ ] STATUS.md row 2 filled

---

## פאזה 3 — Close STATUS.md

**Scope:** Fill all STATUS.md rows with dates + commit hashes. Run final git log + diff --stat verification.

**תנאי עצירה:**
- `git log --oneline main..pkg/morning-cleanup-2026-05-04` = 4 commits
- `git diff main..pkg/morning-cleanup-2026-05-04 --stat` = 0 src/ lines

**Exit Deliverables:**
- [ ] STATUS.md closeout checklist partially checked (pending merge/tag)

---

## Closeout
- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] PR ל-main, fast-forward merge, branch נמחק
