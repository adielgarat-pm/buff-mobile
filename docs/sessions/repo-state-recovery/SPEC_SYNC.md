# repo-state-recovery — Spec Sync

## Docs שנוגעים בהם

| Doc | Chunk | אופי השינוי |
|---|---|---|
| `docs/BUFF_VALUES.md` | 1 | **Added to version control for the first time.** File existed on disk since 2026-05-02 but was never committed, despite being referenced as Required Reading in CLAUDE.md and WORKFLOW.md. Any fresh clone prior to this package would have lacked this canonical doc. |
| `docs/sessions/admin-dashboard-port/DEPLOYMENT.md` | 2 | Added to version control. Phase 10 (Vercel deploy) planning doc authored by Claude.ai 2026-05-04, saved to disk but not committed. Recovered as-is. |
| `docs/sessions/admin-dashboard-port/SPEC_SYNC.md` | 2 | New row added for DEPLOYMENT.md recovery. |
| `.gitignore` | 4 | Added patterns: `supabase/.temp/`, `docs/UPDATES_2026-05-02.md`, `docs/EOD_CLOSING_2026-05-02.md`, Hebrew directory, `/*.zip` |

## Out of Scope

- `CLAUDE.md` — already references BUFF_VALUES.md correctly; no change needed
- `docs/WORKFLOW.md` — already references BUFF_VALUES.md correctly; no change needed
- `docs/BUFF_DECISIONS_LOG.md` — Adi's doc; no unilateral updates
- `src/`, `admin-web/`, `supabase/` — zero code changes

## Verification

- [ ] `git ls-files docs/BUFF_VALUES.md` → path returned (Chunk 1)
- [ ] `git ls-files docs/sessions/admin-dashboard-port/DEPLOYMENT.md` → path returned (Chunk 2)
- [ ] `git status` → clean after Chunk 4
