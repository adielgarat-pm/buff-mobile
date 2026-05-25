# Sentry + EAS Android — Resumption

> Resumes two paused packages (`pkg/expo-health-and-eas-android` + `pkg/sentry-crash-monitoring`) that were lost when their branches were deleted between 2026-05-16 and 2026-05-25 without merging to main. Ships fresh production AAB v10 with Sentry crash monitoring to Play Console Internal Testing for the 2026-06-01 beta launch.

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו |
| `ROADMAP.md` | רצף פאזות 0-5 + Closeout עם תנאי עצירה |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |

> אין `PRINCIPLES.md` — חבילת תשתית בלי עקרונות ייעודיים מעבר ל-BUFF_VALUES.
> אין `PROMPTS.md` — פרומפטים נמסרים בצ'אט מ-Claude.ai.

## רקע הקריסה (תקציר — מלא ב-SPEC.md)

ב-2026-05-16 שני packages עצרו mid-Phase-4 לפני merge:
- `pkg/expo-health-and-eas-android` — Phases 0-3 done, AAB v8 built
- `pkg/sentry-crash-monitoring` — Phases 0-3 done, AAB v9 IN_PROGRESS

ה-RESUMPTION_NOTES_2026-05-16.md הציע שלוש אופציות resume (publish v9 / publish v8 / fresh build). בפועל ה-branches נמחקו לפני שמיש מהאופציות בוצעה, וכל הקוד והdocs בכלל אבדו. ה-diagnosis ב-2026-05-25 אישר Path C (fresh build) כיחיד בר-ביצוע.

## רצף ביצוע

ראי [ROADMAP.md](./ROADMAP.md). כל phase chunk-by-chunk עם diff לאישור Adi.

## כללי המתודולוגיה (קבועים — מ-WORKFLOW.md)

- CC עובד תמיד ב-Plan Mode
- אין self-approved decisions
- Inspect actual code לפני הצעות
- Plan שולח chunk-by-chunk; סקירת diff אחרי כל אחד
- INTEGRATION_LEARNINGS.md לכל הפתעה
- STATUS.md ועדכוני canonical docs באותו commit כמו הקוד
- Values Check עובר לפני שmoved-on לכל פאזה
