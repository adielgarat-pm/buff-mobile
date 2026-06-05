# Notification Bell — Show New Only — Spec Sync

> רשימת canonical docs שהחבילה משנה, ממופה לפאזה. CC מעדכן כחלק מ-exit deliverable.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/BUFF_FEATURE_AUDIT.md` | 3 | הערה: הפעמון = תור unread-only עם מחלקות ACTION (נשאר עד טיפול) / INFO (פג אחרי N ימים) |
| `docs/INTEGRATION_LEARNINGS.md` | 1, 3 | הסרת auto-mark-on-open; מודל ACTION/INFO; fail-safe (סוג לא-מוכר → ACTION) |
| `docs/RELEASE_QUEUE.md` | 3 | שורת Queued לרכבת הבאה (versionCode הבא אחרי 28) |
| `src/i18n/he.json`, `src/i18n/en.json` | 2 | (אם OQ-N7) "Mark all as read" → "Clear all" / "נקה הכל" + a11y |

> שאר ה-canonical docs — לא רלוונטיים (ראי Out of Scope).

## Out of Scope

- `docs/BUFF_PRD.md` — הפיד עצמו כבר טופל ב-`pkg/parent-notification-feed` (החלטת PRD שם). שינוי ההתנהגות הזה לא דורש סעיף PRD חדש; אם Adi רוצה לתעד את מודל ACTION/INFO ב-PRD — החלטה שלה (לא חד-צדדי).
- `docs/BUFF_VALUES.md` — מסמך של Adi; לא מעודכן חד-צדדית. ה-Values Check חי ב-SPEC.md.
- `docs/BUFF_GAP_ANALYSIS.md` — מסמך של Adi; אם נדמה שצריך שורה, מציעים ולא כותבים.
- `docs/BUFF_BUDDY_SYSTEM.md` — לא נוגע ב-BUDDY.
- מיגרציות Supabase — **אין schema change**. רק סמנטיקת read/filter בצד הלקוח.

## Verification

- [ ] כל פאזה ב-ROADMAP.md כוללת עדכוני docs כחלק מה-chunk הרלוונטי.
- [ ] TESTS.md כולל "doc updated per SPEC_SYNC" בפאזות 1-3.
- [ ] אחרי כל הפאזות — אין drift בין canonical docs לבין ההתנהגות החיה.
