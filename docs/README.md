# BUFF — Product Documentation

תיקייה זו מכילה את **source-of-truth** של מוצר BUFF.

**צוות:** Adi Elgarat German (founder, PM) + Itay (co-creator, מתבגר עם ADHD, בן 15)

---

## מסמכים בתיקייה

| קובץ | תוכן | מתי לקרוא |
|---|---|---|
| `BUFF_PRD.md` | Product Requirements Document — חזון, קהל יעד, מודל עסקי, scope של MVP | בתחילת החלטות אסטרטגיות |
| `BUFF_FEATURE_AUDIT.md` | רשימת פיצ'רים מקיפה עם החלטה לכל אחד | לפני בניית פיצ'ר |
| `BUFF_FEATURE_PRIORITIZATION.md` | פיצ'רים מתועדפים | תכנון סדר עבודה |
| `BUFF_USER_STORIES.md` | סיפורי משתמש עם acceptance criteria | לפני כתיבת קוד |
| **`BUFF_GAP_ANALYSIS.md`** ⭐ | **השוואה PRD ↔ קוד הקיים** | תמיד — לפני החלטות חדשות |
| **`BUFF_DECISIONS_LOG.md`** ⭐ | **תיעוד החלטות עם תאריך ונימוק** | תמיד — להבין למה דברים כפי שהם |
| **`BUFF_BUDDY_SYSTEM.md`** ⭐ | **מערכת BUDDY — רמות, Power-Ups, UI** | בעבודה על BUDDY/Teen UI |
| `README.md` | זה — אינדקס + פרוטוקול תחילת שיחה | תחילת שיחה |

---

## פרוטוקול תחילת שיחה עם Claude (claude.ai)

**ל-Claude אין זיכרון בין שיחות.** כדי להבטיח continuity, יש להדביק את ההודעה הבאה בתחילת כל שיחה חדשה:

```
היי קלוד, אני עדי. אני עובדת על BUFF — אפליקציית מובייל לילדים ומתבגרים עם ADHD.

הפרויקט: C:\Users\adiel\buff-mobile
GitHub: github.com/adielgarat-pm/buff-mobile

הצוות: אני (PM/founder) + הבן שלי Itay (קו-יוצר, בן 15, מתבגר עם ADHD).

לפני שתענה על כל דבר, תקרא את המסמכים הבאים בסדר הזה:

1. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_DECISIONS_LOG.md
   (מה הוחלט עד כה ולמה)

2. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_GAP_ANALYSIS.md
   (איפה הקוד עומד מול ה-PRD + תוכנית עבודה)

3. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_BUDDY_SYSTEM.md
   (מערכת BUDDY — חשוב להבין לפני כל החלטה הקשורה ל-BUDDY/Teen UI)

4. https://github.com/adielgarat-pm/buff-mobile/blob/main/SESSION_LOG.md
   (יומן הסשנים האחרונים)

5. אם השאלה דורשת ירידה לפרטי PRD מלא — גם:
   https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_PRD.md

אחרי שקראת, תגיד לי בקצרה (3-5 שורות):
- מה הסטטוס הנוכחי של הפרויקט
- באיזה שלב בתוכנית העבודה אנחנו (מתוך BUFF_GAP_ANALYSIS.md סעיף "הצעדים הבאים")
- השאלה הפתוחה הכי דחופה
- האם יש משהו במסמכים שלא ברור או נראה לא עדכני

ואז נמשיך מאיפה שעצרנו.
```

---

## הנחיות עבודה עם המסמכים

### במהלך שיחה
- כשמתקבלת החלטה חדשה → Claude יציע "תעדכני ב-`BUFF_DECISIONS_LOG.md`?"
- כשנגלה פער או ממצא חדש → Claude יציע "תעדכני ב-`BUFF_GAP_ANALYSIS.md`?"
- כשעולה רעיון BUDDY/Teen UI → Claude יציע "תעדכני ב-`BUFF_BUDDY_SYSTEM.md`?"
- **בלי "אישור עדכון" — לא מעדכנים.** החלטות בכוונה, לא בטעות.

### בסוף שיחה
1. עדכון `SESSION_LOG.md` (יומן יומי)
2. עדכון מסמכים רלוונטיים
3. Git commit ו-push

### בתחילת שיחה
- Claude קורא את 3 המסמכים העיקריים
- Claude מסכם את הסטטוס
- אם יש סתירה — Claude מציף לפני שמתקדמים

---

## מתי לעדכן את ה-PRD המקורי

ה-PRD (`BUFF_PRD.md`) נשאר **כפי שנכתב במקור**. שינויים מתועדים ב-`DECISIONS_LOG.md` ומשתקפים ב-`GAP_ANALYSIS.md`.

**יוצא מהכלל:** אחת ל-3 חודשים, או לפני אבני דרך משמעותיות (בילד פרודקשן, גיוס משקיעים), נכתבת גרסה חדשה של PRD שמשלבת החלטות. הגרסה הקודמת נשמרת בהיסטוריית Git.

---

## מצב נוכחי בתוכנית העבודה

(עדכן את זה בכל סיום סשן)

**שלב נוכחי:** שלב 0 — תכנון לפני קוד  
**מה נשאר לפני בילד:** 12-17 ימי עבודה (2-3 שבועות) — ראה `BUFF_GAP_ANALYSIS.md` סעיף "הצעדים הבאים"

**הצעד הבא הקרוב:**
- שאלון המשך ל-Itay (3-4 שאלות נשארו פתוחות — ראה GAP_ANALYSIS)
- עיצוב Teen UI ב-Stitch (אחרי שאלון Itay)

---

**עודכן לאחרונה:** 2 במאי 2026, אחרי סשן עם Itay
