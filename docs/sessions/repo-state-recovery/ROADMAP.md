# repo-state-recovery — Roadmap

## Chunk 1 — Commit docs/BUFF_VALUES.md

**Scope:** Add `docs/BUFF_VALUES.md` (169 lines, disk-only since 2026-05-02) to version control as-is.

**תנאי עצירה:**
- `git ls-files docs/BUFF_VALUES.md` → returns path (file tracked)
- `git show HEAD -- docs/BUFF_VALUES.md | head -5` → matches disk content

**Exit Deliverables:**
- [ ] docs/BUFF_VALUES.md committed
- [ ] STATUS.md row 1 filled

---

## Chunk 2 — Commit DEPLOYMENT.md + update SPEC_SYNC

**Scope:** Add `docs/sessions/admin-dashboard-port/DEPLOYMENT.md` to version control. Update SPEC_SYNC.md with recovery note.

**תנאי עצירה:**
- `git ls-files docs/sessions/admin-dashboard-port/DEPLOYMENT.md` → returns path
- SPEC_SYNC.md has new row for DEPLOYMENT.md

**Exit Deliverables:**
- [ ] DEPLOYMENT.md committed
- [ ] SPEC_SYNC.md updated
- [ ] STATUS.md row 2 filled

---

## Chunk 3 — Delete 4 garbage files (no commit — never tracked)

**Scope:** `rm` four untracked files: `main`, `docs.zip`, `EOD_2026-05-03.md`, `WORKFLOW_FOUNDATION_INSTRUCTIONS.md`.

**תנאי עצירה:**
- `git status` no longer lists these 4 files
- No other untracked files were accidentally affected

**Exit Deliverables:**
- [ ] 4 files deleted
- [ ] STATUS.md row 3 filled (no commit hash — untracked, no footprint)

---

## Chunk 4 — Update .gitignore + STATUS close

**Scope:** Append 5 patterns to `.gitignore`. Update STATUS.md. Run final verification.

**תנאי עצירה:**
- `git status` → clean (only repo-state-recovery package files)
- `git log --oneline main..pkg/repo-state-recovery` → 5 commits
- `git diff main..pkg/repo-state-recovery --stat` → 0 src/ lines

**Exit Deliverables:**
- [ ] .gitignore updated
- [ ] STATUS.md all rows filled
- [ ] Final git status clean

---

## Closeout
- [ ] All chunks passed
- [ ] PR ל-main, merge (per Verify-Before-Delete Protocol)
