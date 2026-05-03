# snapshot-protocol

> Prevent snapshot fabrication and recommendation cascade. Adds a Read-only Snapshot Protocol to CLAUDE.md, a Snapshot Template + Verification Gate to WORKFLOW.md, and records the 2026-05-03 incident in INTEGRATION_LEARNINGS.md.

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

> **הערה:** אין `PROMPTS.md`. הפרומפטים נמסרים בצ'אט מ-Claude.ai עם universal preamble inlined.
> ראי `docs/WORKFLOW.md` § Universal Preamble.

> **הערה:** אין `PRINCIPLES.md`. אין עקרונות ספציפיים לחבילה הזו — ראי `docs/BUFF_VALUES.md` ו-`docs/WORKFLOW.md`.

## רצע ביצוע

1. קראי SPEC.md במלואו. וודאי שהוא תואם את כוונתך לפני שמתחילים.
2. וודאי שאת ב-branch מתאים (לא main). שם branch: `pkg/snapshot-protocol`.
3. פתחי שיחה חדשה ב-Claude Code (VS Code Extension).
4. הדביקי את הפרומפט שClaude.ai נתנה (universal preamble + phase 1).
5. סקרי את התוכנית של CC. דחי כל self-approved decision או scope creep.
6. אישור: `approved, proceed`. CC מבצע — כולל עדכוני canonical docs, STATUS.md row — הכל ב-commit אחד.
7. הריצי את בדיקות הפאזה מ-TESTS.md.
8. אם passed: עוברים לפאזה הבאה. אם failed: עצירה, fix, retest.
9. אחרי כל הפאזות: git tag, סימון STATUS.md closeout checklist.

## כללי המתודולוגיה (קבועים — מ-WORKFLOW.md)

- CC עובד תמיד ב-Plan Mode
- אין self-approved decisions
- Inspect actual code לפני הצעות
- Plan שולח chunk-by-chunk; סקירת diff אחרי כל אחד
- INTEGRATION_LEARNINGS.md לכל הפתעה
- STATUS.md ועדכוני canonical docs באותו commit כמו הקוד
- Values Check עובר לפני שmoved-on לכל פאזה
