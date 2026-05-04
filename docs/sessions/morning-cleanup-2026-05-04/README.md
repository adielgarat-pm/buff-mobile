# morning-cleanup-2026-05-04

> Close 2 FLAGs opened in EOD 2026-05-03 (Buddy design collections + Pastel UI) and add EOD Protocol section to WORKFLOW.md.

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו |
| `ROADMAP.md` | רצף פאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |

> **הערה:** אין `PROMPTS.md` ואין `PRINCIPLES.md`. ראי `docs/WORKFLOW.md` § Universal Preamble ו-`docs/BUFF_VALUES.md`.

## רצע ביצוע

1. קראי SPEC.md במלואו לפני שמתחילים.
2. וודאי שאת ב-branch `pkg/morning-cleanup-2026-05-04`.
3. אישור: `approved, proceed`. CC מבצע פאזה + עדכוני canonical docs + STATUS.md row — הכל ב-commit אחד.
4. הריצי בדיקות מ-TESTS.md אחרי כל פאזה.
