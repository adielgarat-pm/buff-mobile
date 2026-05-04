# morning-cleanup-2026-05-04 — Spec Sync

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | 1 | Append F-2026-05-03-07 (Buddy collections) + F-2026-05-03-08 (Pastel UI) under `## FLAGs פתוחים`, after F-05 |
| `docs/WORKFLOW.md` | 2 | Append `## EOD Protocol — סגירת יום` after `## Snapshots` section, before `## טיפול בהפתעות`. **Note:** EOD protocol gap discovered 2026-05-03 evening when first EOD was pushed directly to main (commit `b86dd2f`) without a PR, violating Rule 7. This package closes that gap. |

## Out of Scope

- `CLAUDE.md` — no changes needed (snapshot protocol already covers operational rules)
- `docs/BUFF_DECISIONS_LOG.md` — Adi's doc; no unilateral updates
- `docs/BUFF_GAP_ANALYSIS.md` — no scope changes
- All files under `src/`, `app/`, `components/` — zero code changes

## Verification

- [ ] TESTS.md includes grep verification for each doc changed
- [ ] All changes are in same commit as STATUS.md row update
- [ ] After all phases: no drift between docs and live system
