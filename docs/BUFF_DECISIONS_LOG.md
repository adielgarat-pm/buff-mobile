# BUFF — Decisions Log

**מטרה:** תיעוד החלטות מוצריות והנדסיות עם תאריך ונימוק.

**מבנה:** כל החלטה כוללת תאריך, ההחלטה, הסיבה, ומסמכים שצריך לעדכן בעקבותיה.

---

## 2 במאי 2026

### D-2026-05-02-01: יצירת תיקיית `docs/` כ-source-of-truth

**ההחלטה:** מסמכי המוצר (PRD, Feature Audit, User Stories, Feature Prioritization, Gap Analysis, Decisions Log) ישבו בתיקייה `docs/` בתוך הריפו `buff-mobile`, בפורמט Markdown.

**סיבה:**
- Claude Code יכול לערוך ולקרוא ישירות
- היסטוריית גרסאות דרך Git
- Adi יכולה לפתוח ב-VS Code
- Claude (claude.ai) יכול לקרוא דרך GitHub URLs

**מסמכים מושפעים:** README.md בתוך docs/

---

### D-2026-05-02-02: Continuity protocol בין שיחות ב-claude.ai

**ההחלטה:** בתחילת כל שיחה חדשה ב-claude.ai, Adi תדביק הודעה סטנדרטית שמכוונת את Claude לקרוא את `docs/BUFF_PRD.md`, `docs/BUFF_GAP_ANALYSIS.md`, `docs/BUFF_DECISIONS_LOG.md`, ו-`SESSION_LOG.md`.

**סיבה:** Claude אין לו זיכרון בין שיחות (חוץ מזיכרון קצר ובסיסי). מסמכים הם ה-continuity layer.

**מסמכים מושפעים:** docs/README.md (יכלול את ההודעה לתחילת שיחה)

---

### D-2026-05-02-03: PRD יישאר באנגלית, שאר התיעוד בעברית

**ההחלטה:** PRD ו-User Stories יישארו בשפת המקור (אנגלית). Gap Analysis, Decisions Log, וסיכומי סשן יהיו בעברית.

**סיבה:** PRD הוא מסמך מקצועי שיכול לשמש משקיעים/שותפים פוטנציאליים. השפה ההפרטית (בין Adi לכלי AI) — עברית.

---

## 1 במאי 2026 (החלטות שכבר התקבלו ולא תועדו)

### D-2026-05-01-01: שני Supabase projects נפרדים — לא ממזגים

**ההחלטה:** הלוובל וה-מובייל ימשיכו עם DB-ים נפרדים. לא נעביר משתמשים מהלוובל למובייל.

**סיבה:**
- אין גישה ל-DB של הלוובל (Supabase project של לוובל, לא של Adi)
- אין משתמשים פעילים ב-DB של הלוובל (2 משפחות, אחת של Adi)
- ביטא של הלוובל = הוכחת יכולת, לא קהל לקוחות
- זה משחרר אותנו מ-pg_dump ומיגרציה מורכבת

**ההשלכה:** PRD section 9.2 "Database Migration" — לא תקף. צריך לעדכן.

---

### D-2026-05-01-02: Lovable יישאר חי עד פרודקשן + Landing page אחר כך

**ההחלטה:**
- הלוובל ימשיך לרוץ עד שהמובייל בפרודקשן
- ביום עליית המובייל ל-Play Store: הלוובל יוחלף ב-landing page פשוטה
- Landing page תכיל: "Download from Google Play" + שדה אימייל למתעניינים
- אחרי שכל המעוניינים עברו: ה-Supabase project של הלוובל יימחק

**סיבה:** 49 community subscribers + 86 הורים שנרשמו. ה-launch list החשוב ביותר.

**פעולה שבוצעה:** Adi ייצאה את ה-49 emails ל-CSV ושמרה במקום בטוח (1 במאי).

---

### D-2026-05-01-03: Founding Members — מי שיעבור מהלוובל

**ההחלטה:** במקום קודים מיוחדים, משתמשים שיעברו מהלוובל יקבלו `is_lifetime_access = true` כברירת מחדל.

**סיבה:**
- השדה `is_lifetime_access` כבר קיים בטבלת profiles ונקרא ב-`useSubscription.ts:81`
- אין צורך לבנות מערכת קודים
- מתאים לפילוסופיה של "המשפחות שמאמינות מוקדם"

**ההשלכה:** PRD section 5.2 "Beta User Free-for-Life" — חצי-תקף. הקריטריונים שונים.

---

### D-2026-05-01-04: BUDDY V0 — נדחה לעיון מחודש

**ההחלטה (שתוקנה ב-2.5):** ב-1.5 הוחלט "BUDDY V0 = visual פשוט + 5-7 הודעות, History/Achievements/Friendship Hearts ל-1.1".

**תיקון 2.5:** Audit חשף ש-Buddy Evolution (4 stages: egg/hatchling/scout/guardian @ 0/3/7/13 ימים) ו-Pet Skins (panda/capybara/unicorn + HEROIC) **כבר קיימים בקוד**. ההחלטה מ-1.5 הייתה מבוססת על חוסר מידע.

**סטטוס:** **בעיון מחודש.** צריך:
1. לוודא שה-UI לבחירת skin קיים
2. להחליט אם להשלים ל-MVP או לדחות ל-1.1

---

### D-2026-05-01-05: RevenueCat configuration

**ההחלטה:** RC מותקן ועובד עם:
- Android API key: `goog_JXENrpCCcYObBesSjSeFGoKvuaA` (אמיתי, hardcoded)
- iOS API key: לא קיים — Android-only ל-MVP
- Entitlement: "BUFF Premium"
- App User ID: Supabase user.id

**סטטוס:** PaywallScreen + useSubscription + purchaseService קיימים ופעילים. Bonus: יש grace period flag עד 1.5.2026 (פג).

**פעולה נדרשת:** להעביר את ה-API key מ-hardcoded ל-`.env` (אחרי MVP).

---

### D-2026-05-01-06: Build path נדחה

**ההחלטה:** ההחלטה בין EAS Production / GitHub Actions / `eas build --local` נדחתה.

**סיבה:** מכסת EAS חופשית מתחדשת ב-1.5 (30 builds חדשים). אין לחץ מיידי.

**סטטוס:** Keystore הורד וגובה ב-1.5. סיסמאות שמורות. אפשר לבחור build path בכל רגע.

---

## 28-29 באפריל 2026 (סיכום מ-SESSION_LOG)

### D-2026-04-28: Google OAuth מוגדר וחתום
**פעולה שבוצעה:** OAuth 2.0 client + Supabase provider + buff://auth/callback. עובד ב-Pixel_7 AVD.

### D-2026-04-28: ParentOnboardingModals — תיקון crash
**הבעיה:** custom component בתוך Stack.Navigator → תוקן ל-Stack.Group.

### D-2026-04-29: ChildJoinScreen — תיקון keyboard ב-Android
**הבעיה:** KeyboardAvoidingView behavior undefined → undefined ב-Android.

### D-2026-04-29: Email confirmation — מבוטל
**ההחלטה:** ילדים משתמשים ב-fake @buff.app emails — Supabase email confirmation מבוטל.

---

## הנחיות לתחזוקה של Decisions Log

1. **כל החלטה מוצרית או הנדסית משמעותית** מתועדת כאן עם תאריך ונימוק
2. **לא להשמיט את הנימוק** — בעוד 3 חודשים נחזור לקרוא ונרצה להבין למה
3. **בכל סוף סשן** עם Claude — להוסיף החלטות חדשות
4. **בכל תחילת סשן** — Claude מתבקש לקרוא לפני שמתחיל
5. **אם החלטה משתנה** — לא למחוק! להוסיף החלטה חדשה שמתקנת, עם הפנייה לקודמת

---

**סוף מסמך.**
