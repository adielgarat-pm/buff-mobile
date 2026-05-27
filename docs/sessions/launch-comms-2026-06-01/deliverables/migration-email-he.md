# Migration Email (HE) — Lovable → Mobile

**Cohort:** 49 משתמשים עם `marketing_consent = true` במייל הראשי.
**Send date:** 2026-06-01 (אולי 2026-05-30).
**Send via:** MailerLite (או הכלי הקיים).
**Lang:** עברית בגוף + English signature block.

---

## Subject Line

> BUFF עברה לאנדרואיד — ה-Lifetime שלך מחכה

---

## Email Body (copy/paste ready)

```
שלום,

בוקרים שקטים בלי לחזור על אותו דבר חמש פעמים. ילד שמתחיל לבד.
שגרה שמחזיקה את עצמה — בלי שאת מחזיקה אותה ביד.
זאת BUFF, ועברנו לאפליקציית אנדרואיד מקורית.

━━━━━━━━━━

*מה השתנה*

השנה האחרונה הרצנו את BUFF בגרסת ווב. עכשיו האפליקציה האנדרואידית מוכנה —
והיא יותר טובה: עובדת ברקע, שולחת תזכורות בזמן, מהירה ויציבה.
גרסת הווב תיסגר בקרוב.

━━━━━━━━━━

*איך מעבירים את ה-Lifetime שלך — 3 שלבים*

1. **הרשמה** — באפליקציה, עם **אותו חשבון Google** שהשתמשת בו ב-Lovable.

2. **הפעלה** — ענ/י לי במייל אחרי שנרשמת. אני מפעיל/ה את ה-Lifetime ידנית
   (תוך 24 שעות, בדרך כלל פחות).

3. **משוב** — בעוד מספר שבועות אבקש ממך משוב קצר על החוויה.
   זה החלק שלך בעסקה — ומה ששומר על ה-Lifetime פעיל לטווח ארוך.

הורדת האפליקציה: [APK_OR_PLAY_STORE_URL]

━━━━━━━━━━

*מה עובר ומה לא*

✓ הגישה ה-Lifetime + כל הפיצ'רים העתידיים
✗ המשפחה, הילדים, המשימות והפרסים שהגדרת ב-Lovable — לא עוברים אוטומטית.
   את בונה אותם מחדש בתוך onboarding (3–5 דקות).

━━━━━━━━━━

*רוצה עזרה במעבר?*

אם נוח לך לבנות מחדש — onboarding לוקח 3-5 דקות וזה הכי מהיר.
אם את מעדיפה שאני אעזור — תכתבי לי בחזרה ונעשה את ההעברה ביחד.
שתי האפשרויות תקפות. אין הבדל בתוצאה.

━━━━━━━━━━

*אם נרשמת בחשבון Google אחר*

תכתבי לי בחזרה למייל הזה ואטפל בזה ידנית. שום משתמש לא נופל בין הכיסאות.

━━━━━━━━━━

אם BUFF עזרה לך — דירוג ב-Play Store עוזר למשפחות נוספות למצוא אותנו:
[PLAY_STORE_RATING_URL]

תודה שהייתם איתנו במסע הזה.
עד שהם כבר לא יזדקקו לנו.


Adi Elgarat German
Founder @ BUFF | Mom of an ADHD teen
On a mission to make the ADHD app your kid grows out of — and the home around it calmer.
adi@buffadhd.com · buffadhd.com · linkedin.com/in/adi-elgarat-german
```

---

## Placeholders to fill before sending

| Placeholder | מה למלא | אם לא מוכן | 
|---|---|---|
| `[APK_OR_PLAY_STORE_URL]` | Play Store internal testing URL, או .apk ישיר עם הסבר sideload | חייב למלא לפני שליחה — בלי URL אין מסר |
| `[PLAY_STORE_RATING_URL]` | URL לעמוד ה-rating של BUFF ב-Play Store | אם BUFF עדיין לא ב-public testing — להסיר את שתי השורות (החל מ-"אם BUFF עזרה לך...") |

## Pre-send checklist

- [ ] APK / Play Store URL ממולא
- [ ] Adi בדקה במובייל איך המייל נראה (Gmail Android + Gmail web)
- [ ] בדיקה ידנית של 1 grant על חשבון dev (Adi עצמה) דרך ה-playbook
- [ ] 49 מיילים ב-MailerLite (או הכלי הקיים)
- [ ] שעת שליחה: 09:00-11:00 בבוקר (מקסימום peak לבדיקה במהלך היום של ההורה)

## Post-send monitoring (Adi)

- 0-2 שעות: לבדוק שאין bounce-rate חריג
- 24 שעות: לבדוק `auth.users` חדשים → להריץ playbook §1
- 1-3 ימים: לטפל ב-replies אישית
- 1-2 שבועות: להתחיל follow-up למשוב לפי playbook §4

## Brand Check evidence

- ✅ פתיחה ב-WHAT (calm mornings, kid who self-starts) — לא ב-HOW
- ✅ אין הזכרה של BUFFs / BUDDY / 70% / streaks / coins / rewards
- ✅ Mission tagline ("עד שהם כבר לא יזדקקו לנו") sandwich-frame ל-sign-off
- ✅ Founder credibility ב-signature (Founder + Mom of ADHD teen — trust signal #1)
- ✅ אין סימני קריאה, אין empathy גנרי
