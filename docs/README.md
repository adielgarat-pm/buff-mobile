# BUFF — Product Documentation

תיקייה זו מכילה את **source-of-truth** של מוצר BUFF — PRD, Feature Audit, User Stories, ניתוחי פערים, והחלטות.

---

## מסמכים בתיקייה

| קובץ | תוכן | מתי לקרוא |
|---|---|---|
| `BUFF_PRD.md` | Product Requirements Document — חזון, קהל יעד, מודל עסקי, scope של MVP | בתחילת כל החלטה אסטרטגית |
| `BUFF_FEATURE_AUDIT.md` | רשימת פיצ'רים מקיפה עם החלטה לכל אחד (Keep/Remove/Phase 2) | לפני בניית פיצ'ר חדש |
| `BUFF_FEATURE_PRIORITIZATION.md` | רשימת פיצ'רים מתועדפת (Must Have / Should Have / Nice / Out) | לתכנון סדר עבודה |
| `BUFF_USER_STORIES.md` | סיפורי משתמש עם acceptance criteria | לפני כתיבת קוד של פיצ'ר |
| `BUFF_GAP_ANALYSIS.md` | **השוואה בין PRD לקוד הקיים** — מה קיים, מה חסר, מה שונה | תמיד — לפני קבלת החלטות חדשות |
| `BUFF_DECISIONS_LOG.md` | **תיעוד החלטות עם תאריך ונימוק** | תמיד — להבין למה דברים כפי שהם |
| `README.md` | זה — אינדקס + פרוטוקול תחילת שיחה | תחילת שיחה |

---

## פרוטוקול תחילת שיחה עם Claude (claude.ai)

**ל-Claude אין זיכרון בין שיחות.** כדי להבטיח continuity, יש להדביק את ההודעה הבאה בתחילת כל שיחה חדשה:

```
היי קלוד, אני עדי. אני עובדת על BUFF — אפליקציית מובייל לילדים עם ADHD.

הפרויקט: C:\Users\adiel\buff-mobile
GitHub: github.com/adielgarat-pm/buff-mobile

לפני שתענה לי על כל דבר, תקרא את המסמכים הבאים בסדר הזה:

1. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_DECISIONS_LOG.md
   (מה הוחלט עד כה ולמה)

2. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_GAP_ANALYSIS.md
   (איפה הקוד עומד מול ה-PRD)

3. https://github.com/adielgarat-pm/buff-mobile/blob/main/SESSION_LOG.md
   (היומן של מה שעשינו בסשנים האחרונים)

4. אם השאלה דורשת — גם:
   https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_PRD.md

אחרי שקראת, תגיד לי בקצרה (3-4 שורות):
- מה הסטטוס הנוכחי של הפרויקט
- מה השאלה הפתוחה הכי דחופה
- האם יש משהו במסמכים שלא ברור או נראה לא עדכני

ואז נמשיך.
```

---

## הנחיות עבודה עם המסמכים

### במהלך שיחה
- כשמתקבלת החלטה חדשה — Claude יציע "תעדכני ב-`BUFF_DECISIONS_LOG.md`?"
- כשנגלה פער או ממצא חדש — Claude יציע "תעדכני ב-`BUFF_GAP_ANALYSIS.md`?"
- בלי "אישור עדכון" — לא מעדכנים. החלטות מתעדים בכוונה, לא בטעות.

### בסוף שיחה
1. עדכון `SESSION_LOG.md` (יומן יומי)
2. עדכון `BUFF_DECISIONS_LOG.md` (החלטות חדשות)
3. עדכון `BUFF_GAP_ANALYSIS.md` (אם התגלו ממצאים)
4. Git commit ו-push

### בתחילת שיחה
- Claude קורא את 3 המסמכים העיקריים
- Claude מסכם את הסטטוס ב-3-4 שורות
- אם יש סתירה בין מסמכים — Claude מציף לפני שמתקדמים

---

## מתי לעדכן את ה-PRD המקורי

ה-PRD עצמו (`BUFF_PRD.md`) נשאר **כפי שנכתב במקור**. שינויים מתועדים ב-`DECISIONS_LOG.md` ומשתקפים ב-`GAP_ANALYSIS.md`.

**יוצא מהכלל:** אחת ל-3 חודשים, או לפני אבני דרך משמעותיות (בילד פרודקשן, גיוס משקיעים), נכתבת גרסה חדשה של PRD שמשלבת את ההחלטות. הגרסה הקודמת נשמרת בהיסטוריית Git.

---

## הקובץ הזה מבוסס על

- 4 מסמכים שנכתבו באפריל 2026: PRD v2.0, Feature Audit v1.0, User Stories v2.0, Feature Prioritization v2.0
- 2 audits של Claude Code על קוד `buff-mobile` ב-2 במאי 2026
- שיחות עם Claude (claude.ai) מ-29 באפריל עד 2 במאי 2026
- SESSION_LOG.md מ-28-29 באפריל

---

**עודכן לאחרונה:** 2 במאי 2026
