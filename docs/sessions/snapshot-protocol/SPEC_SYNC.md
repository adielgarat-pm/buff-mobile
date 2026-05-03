# snapshot-protocol — Spec Sync

> רשימת canonical docs שהחבילה הזו משנה, ממופה לפאזה שנוגעת בכל אחד.
> CC חייב לעדכן כל doc ברשימה כחלק מ-exit deliverable של הפאזה הנקובה.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `CLAUDE.md` | 1 | Append `## Read-only Snapshot Protocol` section (Rules 1–5 + scope) after `## Operating Rules`, before `## Environment` |
| `docs/WORKFLOW.md` | 2 | Append `## Snapshots — Adi / Claude.ai / CC handoff` section after `## עבודה ב-Plan Mode עם CC`, before `## טיפול בהפתעות`. **Note:** `docs/WORKFLOW.md` was created 2026-05-03 and did not cover snapshot handoffs; this package closes that gap. |
| `docs/INTEGRATION_LEARNINGS.md` | 3 | Append `## Lessons` parent section + `### Lesson 2026-05-03` entry, after `## רשומות שנפתרו`, before `## איך למלא ערך חדש` |

## Out of Scope

- `docs/BUFF_PRD.md` — no feature changes
- `docs/BUFF_GAP_ANALYSIS.md` — no scope changes
- `docs/BUFF_BUDDY_SYSTEM.md` — no BUDDY changes
- `docs/BUFF_DECISIONS_LOG.md` — Adi's doc; no unilateral updates from CC
- `docs/BUFF_VALUES.md` — no pillar changes
- All files under `src/`, `app/`, `components/` — zero code changes

## Verification

- [ ] כל פאזה ב-ROADMAP.md כוללת עדכוני docs כחלק מה-chunk
- [ ] TESTS.md כולל grep verification לכל doc שנוגעים בו
- [ ] אחרי כל הפאזות — אין drift בין canonical docs לבין המערכת החיה
