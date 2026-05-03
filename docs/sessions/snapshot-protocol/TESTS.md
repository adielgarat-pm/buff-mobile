# snapshot-protocol — Tests

> קריטריוני pass/fail לכל פאזה. **קונקרטי וניתן לאימות.**

## איך מריצים בדיקות

All tests for this package are grep-based (CC runs them before each commit). No emulator tests — docs-only package.

---

## פאזה 1

### בדיקות אוטומטיות (CC מריץ)
- [ ] `grep -c "Snapshot Protocol" CLAUDE.md` → 1
- [ ] `grep -c "^### Rule [1-5]" CLAUDE.md` → 5
- [ ] `grep -c "No synthesis without anchor" CLAUDE.md` → 1

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=1, state=passed
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md נוכחים באותו commit
- [ ] Values Check עדיין עובר אחרי implementation
- [ ] Zero files changed under src/, app/, components/

---

## פאזה 2

### בדיקות אוטומטיות (CC מריץ)
- [ ] `grep -c "Snapshot Prompt Template" docs/WORKFLOW.md` → 1
- [ ] `grep -c "Verification Gate" docs/WORKFLOW.md` → 1
- [ ] `grep -c "Pushback rule" docs/WORKFLOW.md` → 1

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=2, state=passed
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md נוכחים באותו commit
- [ ] Zero files changed under src/, app/, components/

---

## פאזה 3

### בדיקות אוטומטיות (CC מריץ)
- [ ] `grep -c "2026-05-03" docs/INTEGRATION_LEARNINGS.md` → ≥1
- [ ] `grep -c "snapshot-protocol" docs/INTEGRATION_LEARNINGS.md` → ≥1
- [ ] `grep -c "## Lessons" docs/INTEGRATION_LEARNINGS.md` → 1

### בדיקות מתודולוגיות (תמיד)
- [ ] STATUS.md row נוסף עם phase=3, state=passed
- [ ] Zero files changed under src/, app/, components/

---

## Closeout
- [ ] כל בדיקות הפאזות עוברות
- [ ] STATUS.md closeout checklist הושלם
- [ ] Git tag נוצר
- [ ] `git diff main..pkg/snapshot-protocol --stat` — 0 lines in any src/ file
- [ ] אין drift בין canonical docs לבין המערכת החיה
