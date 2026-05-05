# repo-state-recovery — Tests

> All tests are grep/ls/git-based. No emulator tests — docs/.gitignore only package.

## Chunk 1

### אוטומטי (CC)
- [ ] `git ls-files docs/BUFF_VALUES.md` → returns the path (file now tracked)
- [ ] `wc -l docs/BUFF_VALUES.md` → 169 lines (content unchanged)
- [ ] `git diff HEAD~1 HEAD -- docs/BUFF_VALUES.md | head -3` → shows file added

### מתודולוגי
- [ ] STATUS.md row 1 filled with commit hash
- [ ] Zero changes under src/, app/, components/, admin-web/

---

## Chunk 2

### אוטומטי (CC)
- [ ] `git ls-files docs/sessions/admin-dashboard-port/DEPLOYMENT.md` → returns path
- [ ] `grep "DEPLOYMENT" docs/sessions/admin-dashboard-port/SPEC_SYNC.md` → returns line

### מתודולוגי
- [ ] STATUS.md row 2 filled with commit hash
- [ ] Zero changes under src/, app/, components/, admin-web/

---

## Chunk 3

### אוטומטי (CC — post-deletion)
- [ ] `ls main 2>/dev/null || echo "gone"` → "gone"
- [ ] `ls docs.zip 2>/dev/null || echo "gone"` → "gone"
- [ ] `ls EOD_2026-05-03.md 2>/dev/null || echo "gone"` → "gone"
- [ ] `ls WORKFLOW_FOUNDATION_INSTRUCTIONS.md 2>/dev/null || echo "gone"` → "gone"
- [ ] `git status` → 4 files no longer listed as untracked

### מתודולוגי
- [ ] STATUS.md row 3 filled (no commit hash — untracked files have no footprint)

---

## Chunk 4

### אוטומטי (CC)
- [ ] `grep "supabase/.temp" .gitignore` → returns the line
- [ ] `grep "UPDATES_2026-05-02" .gitignore` → returns the line
- [ ] `git status` → clean (working tree clean)
- [ ] `git log --oneline main..pkg/repo-state-recovery` → 5 commits
- [ ] `git diff main..pkg/repo-state-recovery --stat` → 0 lines under src/

### מתודולוגי
- [ ] STATUS.md all rows filled + closeout checked
- [ ] Values Check passed (Pillar 3 indirect)

---

## Closeout
- [ ] Verify-Before-Delete Protocol applied after merge
- [ ] `git ls-files docs/BUFF_VALUES.md` → tracked on main
- [ ] `git status` → clean on main
