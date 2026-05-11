# BUFF — Product Documentation

תיקייה זו מכילה את **source-of-truth** של מוצר BUFF.

**צוות:**
- **Adi Elgarat German** (founder, PM)
- **Itay** (co-creator של Teen UI, מתבגר עם ADHD, בן 15)
- **Emi** (פרסונה עתידית של Children Mode, בת 9)

---

## מסמכים בתיקייה

| קובץ | תוכן | מתי לקרוא |
|---|---|---|
| **`WORKFLOW.md`** ⭐ | **המסמך המגדיר של ה-workflow התלת-צדדי** | **תמיד — בתחילת כל סשן** |
| **`BUFF_VALUES.md`** ⭐ | **שלושת עמודי המוצר + Values Check** | **תמיד — לפני כל פיצ'ר** |
| `BUFF_PRD.md` | Product Requirements Document | בתחילת החלטות אסטרטגיות |
| `BUFF_FEATURE_AUDIT.md` | רשימת פיצ'רים מקיפה | לפני בניית פיצ'ר |
| `BUFF_FEATURE_PRIORITIZATION.md` | פיצ'רים מתועדפים | תכנון סדר עבודה |
| `BUFF_USER_STORIES.md` | סיפורי משתמש | לפני כתיבת קוד |
| **`BUFF_GAP_ANALYSIS.md`** ⭐ | **PRD ↔ קוד + תוכנית עבודה** | תמיד — לפני החלטות |
| **`BUFF_DECISIONS_LOG.md`** ⭐ | **תיעוד החלטות עם תאריך ונימוק** | תמיד |
| `INTEGRATION_LEARNINGS.md` | זיכרון ארוך טווח, FLAGs פתוחים | במהלך כל סשן (קריאה + הוספה) |
| **`BUFF_BUDDY_SYSTEM.md`** ⭐ | **מערכת BUDDY מלאה** | בעבודה על BUDDY/Teen |
| `sessions/_template/` | תבנית חבילת שיפור — להעתקה לכל חבילה חדשה | בתחילת חבילה חדשה |
| `teen-ui-design/` | **Mockups של Stitch + design notes** | בעבודה על Teen UI |
| `README.md` | זה — אינדקס + פרוטוקול | תחילת שיחה |

---

## תיקיית `teen-ui-design/`

מכילה את 6 המסכים המעוצבים ב-Stitch (2.5.2026):

```
teen-ui-design/
├── 01-dashboard-with-buddy/        ✅ Approved
│   ├── code.html
│   ├── DESIGN.md
│   ├── screen.png
│   └── design-notes.md
├── 02-dashboard-no-buddy/          ✅ Approved
├── 03-buddy-toggle-flow/           ✅ Approved
├── 04-tasks-detail/                ✅ Approved
├── 05-me-and-buddy/
│   ├── 5a-with-buddy/              ✅ Approved
│   └── 5b-my-stats/                ✅ Approved + Itay's preferred
├── 06-rewards-shop/                ✅ Approved
│   ├── 6a-from-parent/
│   └── 6b-from-buddy/
├── 07-settings/                    ⏳ Not yet designed
└── 08-teen-onboarding-choice/      ⏳ Not yet designed (חדש)
```

---

## פרוטוקול תחילת שיחה עם Claude (claude.ai)

**ל-Claude אין זיכרון בין שיחות.** הדביקי את ההודעה הבאה בתחילת כל שיחה חדשה:

```
היי קלוד, אני עדי. אני עובדת על BUFF — אפליקציית מובייל לילדים ומתבגרים עם ADHD.

הפרויקט: C:\Users\adiel\buff-mobile
GitHub: github.com/adielgarat-pm/buff-mobile

הצוות:
- אני (PM/founder)
- Itay, בני (קו-יוצר Teen UI, בן 15, מתבגר עם ADHD)
- Emi, בתי (פרסונה עתידית של Children Mode, בת 9)

לפני שתענה, תקרא את המסמכים הבאים בסדר:

**תמיד:**

1. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_VALUES.md
2. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_DECISIONS_LOG.md
3. https://github.com/adielgarat-pm/buff-mobile/blob/main/SESSION_LOG.md

**אם השיחה היא feature / code / SPEC — תקרא בנוסף:**

4. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_GAP_ANALYSIS.md
5. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_PRD.md
6. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_BUDDY_SYSTEM.md (אם נוגעים ב-BUDDY/Teen)

**אם השיחה היא marketing / brand / ad / Reels / Play Store / forum reply / persona / pitch — תקרא בנוסף:**

7. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_BRAND.md
8. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_PERSONAS.md
9. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_MESSAGING.md
10. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_COMPETITORS.md

**אם השיחה היא Teen UI — תסתכל גם על המסכים ב-Stitch:**
   https://github.com/adielgarat-pm/buff-mobile/tree/main/docs/teen-ui-design

אחרי שקראת, תגיד לי בקצרה (3-5 שורות):
- מה הסטטוס הנוכחי
- באיזה שלב בתוכנית העבודה אנחנו
- השאלה הפתוחה הכי דחופה
- האם משהו במסמכים לא ברור או נראה לא עדכני

ואז נמשיך מאיפה שעצרנו.
```

---

## הנחיות עבודה עם המסמכים

### במהלך שיחה
- כשמתקבלת החלטה חדשה → Claude יציע "תעדכני ב-`BUFF_DECISIONS_LOG.md`?"
- כשנגלה פער → Claude יציע "תעדכני ב-`BUFF_GAP_ANALYSIS.md`?"
- כשעולה רעיון BUDDY/Teen UI → Claude יציע "תעדכני ב-`BUFF_BUDDY_SYSTEM.md`?"
- **בלי "אישור עדכון" — לא מעדכנים.**

### בסוף שיחה
1. עדכון `SESSION_LOG.md`
2. עדכון מסמכים רלוונטיים
3. Git commit ו-push

### בתחילת שיחה
- Claude קורא את 3 המסמכים העיקריים
- Claude מסכם את הסטטוס
- אם יש סתירה — מציף לפני שמתקדמים

---

## מצב נוכחי (עדכן בסיום סשן)

**שלב נוכחי:** סוף שלב עיצוב Stitch (6 מתוך 8 מסכים)

**מה הושלם בסשן 2.5.2026 ערב:**
- ✅ 6 מסכי Teen UI מעוצבים ב-Stitch
- ✅ Itay בחר no-buddy (D-13 גרסה 2)
- ✅ אמי אישרה את ה-base aesthetic, רוצה pastel בעתיד
- ✅ עדכון מערכתי של 3 מסמכי docs

**הצעדים הבאים:**
1. מסך 07 ב-Stitch — Settings
2. מסך 08 ב-Stitch — Teen Onboarding Choice (חדש)
3. תיקוני Onboarding בקוד (Claude Code)
4. התחלת מימוש Buddy System V0.5

**מה נשאר לפני בילד:** 17 ימי עבודה (3-4 שבועות)

---

**עודכן לאחרונה:** 2 במאי 2026 ערב, אחרי סשן עיצוב Stitch
