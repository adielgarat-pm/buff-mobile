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

## מסמכי שיווק / מותג (Brand Family)

| קובץ | תוכן | מתי לקרוא |
|---|---|---|
| `BUFF_BRAND.md` | Brand bible — זהות, טאגליינים, tone of voice, visual identity | marketing/brand session |
| `BUFF_PERSONAS.md` | 9 פרסונות (5 הורים + 4 ילדים) + emotional jobs mapping | marketing/copy session |
| `BUFF_MESSAGING.md` | Pitches, hooks, forum templates, Reels scripts, AI video prompts | marketing/copy session |
| `BUFF_COMPETITORS.md` | Landscape map + forum reply ammunition | positioning/sales session |
| `BUFF_FAQ.md` | תשובות אחידות לכל שאלה נפוצה | press/sales/forum reply |
| `BUFF_FOUNDER_STORY.md` | סיפור המקור של Adi/Itay/Emi (חלקים `[NEEDS INPUT]`) | About page/PR/podcasts |
| `BUFF_TESTIMONIALS.md` | מערכת ניהול עדויות + canonical Noa Morag quote | landing/Play Store/ads |
| `BUFF_GO_TO_MARKET.md` | Bootstrap GTM strategy (3 phases, 🆓/💰 tagging) | marketing planning |
| `BUFF_FOUNDING_100_KIT.md` | Phase 1 outreach kit ($99 lifetime offer) | Phase 1 execution |
| **`BUFF_MARKETING_BACKLOG.md`** ⭐ | **Top-level marketing inventory + 4-wave execution order** | **marketing session start** |
| `BUFF_ADVISOR_OUTREACH_KIT.md` | Phase 2 clinician/coach outreach (10-name list + 3 ready pitches) | Phase 2 outreach |
| `BUFF_BLOG_CONTENT_MAP.md` | 30-post plan with source anchors + cadence + per-post template | content/SEO work |

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
11. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_FAQ.md
12. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_FOUNDER_STORY.md
13. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_TESTIMONIALS.md
14. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_GO_TO_MARKET.md
15. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_FOUNDING_100_KIT.md
16. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_MARKETING_BACKLOG.md
17. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_ADVISOR_OUTREACH_KIT.md
18. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_BLOG_CONTENT_MAP.md

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
