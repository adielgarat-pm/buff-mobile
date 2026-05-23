# Yesterday Recap

> Read-only parent-dashboard section showing what each child marked yesterday. No marking action, kid does not see it. Built in direct response to beta-user Shani (2026-05-21) and pre-validated against the Pillar 2 "no counts of failure" anti-pattern.

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## רקע

בקשת בטא מ-שני (אמא של מתן): רוצה לראות מה לא סומן אתמול, **בלי אפשרות לסמן בעצמה**. שלב התכנון עבר 3 איטרציות:

1. ❌ ילד מסמן בדיעבד — נפסל (מלמד הזנחה)
2. ❌ הורה מסמן בדיעבד — נפסל (פוגע בעצמאות)
3. ✅ **הורה רואה בלבד**, ילד לא רואה, פתח לשיחה ולא לבדיקה

ראי [INTEGRATION_LEARNINGS.md § F-2026-05-21-01](../../INTEGRATION_LEARNINGS.md) לסייגים הקריטיים שצריך לטפל בהם בפילטור (false-positives על "פספוסים" → Pillar 2 violation).

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו. כולל Values Check מלא ו-8 Open Decisions |
| `ROADMAP.md` | רצף פאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |

> **הערה:** אין `PRINCIPLES.md` — הפיצ'ר נשען על הקיים ב-BUFF_VALUES.md (לא דורש עקרונות ייחודיים שלא מכוסים שם).
> אין `PROMPTS.md` — הפרומפטים נמסרים בצ'אט עם universal preamble inlined.

## רצף ביצוע

1. סקרי [SPEC.md](./SPEC.md) במלואו. עני על 8 ה-Open Decisions (או אישור גורף "מקבלת את כל ההמלצות").
2. וודאי שאת ב-branch `pkg/yesterday-recap` (לא main).
3. פתחי שיחה חדשה ב-Claude Code (VS Code Extension).
4. הדביקי את הפרומפט שClaude.ai נתנה (universal preamble + phase 1).
5. סקרי את התוכנית של CC. דחי כל self-approved decision או scope creep.
6. אישור: `approved, proceed`. CC מבצע — כולל:
   - עדכוני canonical docs לפי [SPEC_SYNC.md](./SPEC_SYNC.md)
   - INTEGRATION_LEARNINGS.md אם הפתעות
   - שורת [STATUS.md](./STATUS.md) לפאזה הזו
   הכל ב-commit אחד.
7. הריצי את בדיקות הפאזה מ-[TESTS.md](./TESTS.md).
8. אם passed: עוברים לפאזה הבאה. אם failed: עצירה, fix, retest.
9. אחרי כל הפאזות: git tag `pkg/yesterday-recap/v1`, סימון STATUS.md closeout checklist.

## כללי המתודולוגיה (קבועים — מ-WORKFLOW.md)

- CC עובד תמיד ב-Plan Mode
- אין self-approved decisions
- Inspect actual code לפני הצעות
- Plan שולח chunk-by-chunk; סקירת diff אחרי כל אחד
- INTEGRATION_LEARNINGS.md לכל הפתעה
- STATUS.md ועדכוני canonical docs באותו commit כמו הקוד
- Values Check עובר לפני שmoved-on לכל פאזה — **קריטי לחבילה הזו (Pillar 2 risk)**
