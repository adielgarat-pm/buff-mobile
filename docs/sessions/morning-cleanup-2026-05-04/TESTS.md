# morning-cleanup-2026-05-04 — Tests

> All tests are grep-based. No emulator tests — docs-only package.

## פאזה 1

### בדיקות אוטומטיות (CC מריץ)
- [ ] `grep -c "F-2026-05-03-07" docs/INTEGRATION_LEARNINGS.md` → 1
- [ ] `grep -c "F-2026-05-03-08" docs/INTEGRATION_LEARNINGS.md` → 1
- [ ] `grep -c "F-2026-05-03-07" docs/INTEGRATION_LEARNINGS.md` → confirms no collision with existing F-01..F-05

### בדיקות מתודולוגיות
- [ ] STATUS.md row 1 filled with commit hash
- [ ] Canonical docs updated per SPEC_SYNC.md in same commit
- [ ] Values Check passed
- [ ] Zero files under src/, app/, components/

---

## פאזה 2

### בדיקות אוטומטיות (CC מריץ)
- [ ] `grep -c "EOD Protocol" docs/WORKFLOW.md` → 1
- [ ] `grep -c "Rule 7" docs/WORKFLOW.md` → ≥1
- [ ] `grep -c "direct commit" docs/WORKFLOW.md` → ≥1

### בדיקות מתודולוגיות
- [ ] STATUS.md row 2 filled with commit hash
- [ ] Canonical docs updated per SPEC_SYNC.md in same commit
- [ ] Zero files under src/, app/, components/

---

## פאזה 3

### בדיקות אוטומטיות (CC מריץ)
- [ ] `git log --oneline main..pkg/morning-cleanup-2026-05-04` → 4 commits
- [ ] `git diff main..pkg/morning-cleanup-2026-05-04 --stat` → 0 src/ lines

### בדיקות מתודולוגיות
- [ ] STATUS.md row 3 filled with commit hash

---

## Closeout
- [ ] כל בדיקות הפאזות עוברות
- [ ] STATUS.md closeout checklist הושלם
- [ ] אין drift בין canonical docs לבין המערכת החיה
