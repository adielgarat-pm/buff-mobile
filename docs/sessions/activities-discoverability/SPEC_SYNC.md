# Activities Discoverability — Spec Sync

> רשימת canonical docs שהחבילה הזו משנה, ממופה לפאזה שנוגעת בכל אחד.
> CC חייב לעדכן כל doc ברשימה כחלק מ-exit deliverable של הפאזה הנקובה.
> מאומת בסקירת ה-diff של הפאזה.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/RELEASE_QUEUE.md` | 2 (exit) | הוספת שורת Queued על ה-merge — feat/OTA, user-facing, Flow-Suite scenario. |
| `docs/sessions/activities-discoverability/STATUS.md` | 1–2 | STATUS של החבילה — phases, tests, verification, final copy. |

> This is a small, additive discovery package (one dashboard card + telemetry + copy). It does **not** change product scope, values, schema, or architecture, so the heavy canonical docs are intentionally untouched (see Out of Scope).

## Out of Scope

> Docs שעלולים להראות רלוונטיים אבל **מפורשות לא** משתנים בחבילה הזו, עם הסבר.

- `docs/BUFF_VALUES.md` — no new value posture; inherits the parent `activities-and-camp-lists` package's 9/9 (P3 EF-utility). Re-checked against built copy at exit, not re-authored.
- `docs/BUFF_GAP_ANALYSIS.md` / `docs/BUFF_PRD.md` — the feature already exists; this only makes it findable. No PRD/gap delta.
- `docs/BUFF_DECISIONS_LOG.md` — Adi's doc; the D1–D7 decisions are recorded in this session's SPEC, not appended to the log unilaterally (propose to Adi if she wants a log entry).
- `docs/INTEGRATION_LEARNINGS.md` — nothing surprised (no new failure class); no entry. The seasonal-copy learning was captured as CC memory, not a repo learning.

## Verification

- [x] Phase 2 (exit) updates RELEASE_QUEUE + STATUS as part of the same commit set.
- [x] STATUS.md records "doc updated per SPEC_SYNC" via this table.
- [x] After all phases — no drift between canonical docs and live system (feature name now consistent across card / screen title / Settings row).
