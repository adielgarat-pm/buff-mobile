# snapshot-protocol — Roadmap

> פאזות עם תנאי עצירה מפורשים. כל גבול פאזה הוא שער שניתן לבדוק.

## פאזה 1 — Read-only Snapshot Protocol → CLAUDE.md

**Scope:** Append `## Read-only Snapshot Protocol` section (Rules 1–5 + Applies/Does Not Apply) to `CLAUDE.md`, after `## Operating Rules` and before `## Environment`.

**תנאי עצירה (concrete, measurable):**
- `grep -c "Snapshot Protocol" CLAUDE.md` = 1
- `grep -c "^### Rule [1-5]" CLAUDE.md` = 5

**Exit Deliverables:**
- [ ] CLAUDE.md updated per SPEC_SYNC.md Phase 1 row
- [ ] STATUS.md row for Phase 1 filled (state, date, commit)
- [ ] INTEGRATION_LEARNINGS.md if surprises

---

## פאזה 2 — Snapshot Template + Verification Gate → docs/WORKFLOW.md

**Scope:** Append `## Snapshots — Adi / Claude.ai / CC handoff` section to `docs/WORKFLOW.md`, after `## עבודה ב-Plan Mode עם CC` and before `## טיפול בהפתעות`.

**תנאי עצירה:**
- `grep -c "Snapshot Prompt Template" docs/WORKFLOW.md` = 1
- `grep -c "Verification Gate" docs/WORKFLOW.md` = 1

**Exit Deliverables:**
- [ ] WORKFLOW.md updated per SPEC_SYNC.md Phase 2 row
- [ ] STATUS.md row for Phase 2 filled
- [ ] INTEGRATION_LEARNINGS.md if surprises

---

## פאזה 3 — Incident record → docs/INTEGRATION_LEARNINGS.md

**Scope:** Append `## Lessons` parent section + `### Lesson 2026-05-03` entry to `docs/INTEGRATION_LEARNINGS.md`, after `## רשומות שנפתרו` and before `## איך למלא ערך חדש`. This entry IS the learnings artifact for this phase.

**תנאי עצירה:**
- `grep -c "2026-05-03" docs/INTEGRATION_LEARNINGS.md` ≥ 1
- `grep -c "snapshot-protocol" docs/INTEGRATION_LEARNINGS.md` ≥ 1

**Exit Deliverables:**
- [ ] INTEGRATION_LEARNINGS.md updated per SPEC_SYNC.md Phase 3 row
- [ ] STATUS.md row for Phase 3 filled

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] כל canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (מוצע: `pkg/snapshot-protocol/v1`)
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge, branch נמחק
