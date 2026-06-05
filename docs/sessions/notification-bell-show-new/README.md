# Notification Bell — Show New Only

> Turns the parent notification bell from an accumulating archive into a self-clearing "what's new" queue: shows only unread items, clears on explicit action (not on open), and lets task-performance INFO age out while action-required items persist until handled.

## סטטוס
`draft — awaiting Adi review`. ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו (כולל Type→class map + Values Check) |
| `ROADMAP.md` | רצף 3 הפאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |

> אין `PRINCIPLES.md` — העקרונות (Pillar-3 surveillance guard + class model) חיים ב-SPEC.md.
> אין `PROMPTS.md` — ה-brief למסירה לסשן ביצוע נמצא בתחתית SPEC.md.

## הקשר

זו חבילת **המשך** ל-`pkg/parent-notification-feed` (שכבר נשלחה). היא לא מוסיפה מסך/טבלה/פיצ'ר — היא מהדקת את סמנטיקת ה"נקרא/נוקה" של הפעמון לפי בקשת Adi (2026-06-05):

> "הפעמון צריך לנקות את כל ההתראות שנקראו ולא להציג התראות ישנות לא רלוונטיות. המטרה שלו להציג דברים חדשים."
> "לא נקרא ישאר עד שיטפלו בו אם דורש טיפול ותקשורת מול הילד, אם זה רק INFO על ביצוע משימות יוכל להעלם."

## רצף ביצוע

1. קראי SPEC.md במלואו — בעיקר ה-**Type → class map** (8 שורות) שאת צריכה לאשר.
2. branch: `pkg/notification-bell-show-new` (off main).
3. שיחה חדשה ב-CC, הדבק את ה-brief מתחתית SPEC.md + universal preamble.
4. סקרי תוכנית Phase 0, דחי כל self-approval, אישור `approved, proceed`.
5. בדיקות לפי TESTS.md אחרי כל פאזה.

## כללי המתודולוגיה (קבועים — מ-WORKFLOW.md)

- CC עובד תמיד ב-Plan Mode; אין self-approved decisions
- Inspect actual code לפני הצעות; chunk-by-chunk עם diff
- STATUS.md + canonical docs + INTEGRATION_LEARNINGS.md באותו commit כמו הקוד
- Values Check עובר לפני move-on (Pillars 1 & 2 strengthened, Pillar 3 net-positive)
