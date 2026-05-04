# verify-before-delete-protocol — Spec Sync

## Docs שנוגעים בהם

| Doc | פאזה | אופי השינוי |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | 1 | Append `### Lesson 2026-05-04` under existing `## Lessons` section |
| `CLAUDE.md` | 2 | Append `## Verify-Before-Delete Protocol` (Rules 1–5) after `## Read-only Snapshot Protocol`, before `## Environment`. **Note:** incident exposed that CLAUDE.md had no cleanup verification rules — gap existed since first EOD session (2026-05-03). |
| `docs/WORKFLOW.md` | 3 | Append `## Cleanup Procedure — אחרי merge ל-main` after `## EOD Protocol`, before `## טיפול בהפתעות` |

## Out of Scope

- `docs/BUFF_DECISIONS_LOG.md` — Adi's doc
- `docs/BUFF_GAP_ANALYSIS.md` — no scope changes
- All files under `src/`, `app/`, `components/` — zero code changes
- Existing sections of CLAUDE.md and WORKFLOW.md — no modifications, only additions

## Verification

- [ ] All 3 docs updated in their respective phase commits
- [ ] No drift: new rules in CLAUDE.md are reflected in WORKFLOW.md Cleanup Procedure
