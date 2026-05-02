# BUFF — Decisions Log

**מטרה:** תיעוד החלטות מוצריות והנדסיות עם תאריך ונימוק.

**מבנה:** כל החלטה כוללת תאריך, ההחלטה, הסיבה, ומסמכים שצריך לעדכן בעקבותיה.

---

## 2 במאי 2026 — סשן עם Itay (קו-יוצר)

### D-2026-05-02-04: Itay כשותף עיצוב פורמלי של Teen UI ו-Buddy System

**ההחלטה:** Itay (בנה של Adi, בן 15, עם ADHD) הוא שותף עיצוב פורמלי של Teen UI ושל מערכת BUDDY.

**סיבה:**
- Itay הוא היזם של BUFF יחד עם Adi
- הוא המשתמש המרכזי של Teen UI
- עיצוב על-בסיס הנחות PM/Designer בלי קלט שלו = מוצר לא מתאים
- נכס שיווקי — "BUFF for Teens, designed by a teenager with ADHD"

**מסמכים מושפעים:** BUFF_TEEN_UI_BRIEF.md, BUFF_BUDDY_SYSTEM.md

---

### D-2026-05-02-05: Teen UI — Must Have ל-MVP

**ההחלטה:** Teen UI (T-01 עד T-04) ייכלל ב-MVP.

**סיבה:**
- Itay הוא teen — בלי Teen UI, MVP לא רלוונטי לו
- 49 emails מהלוובל כוללים הורים שיש להם ילדים בני 13+
- מתבגר שיוריד את האפליקציה ויראה buddy childish יינטוש מיידית

**זמן עבודה:** 5-7 ימים מימוש (אחרי עיצוב ב-Stitch)

---

### D-2026-05-02-06: Teen UI Design Language — ירוק ניאון על שחור

**ההחלטה:** Teen UI יעוצב במשפחה ויזואלית של Spotify/gaming/cyberpunk:
- צבע ראשי: ירוק ניאון (#39FF14 או דומה)
- רקע: שחור עמוק (#0A0A0A)
- מינימליסטי, נקי, "אין ילדותי"
- חלוקה לפי חלקי יום

**סיבה:** Itay אמר שהוא אוהב "ירוק ניאון ושחור." Spotify/Instagram/WhatsApp הם 3 האפליקציות שלו.

---

### D-2026-05-02-07: ביטול Streaks רגילים — רק Winning Streak

**ההחלטה:** Streak רגיל יבוטל מ-MVP. נשמר רק "Winning Streak" — רצף ימים של 70%+.

**סיבה:** Itay אמר במפורש: "לא חשוב ואפילו לא ברור, רק מפריע." Streak 100% מתנגד לפילוסופיה של 70% Goal.

---

### D-2026-05-02-08: Buddy System V0.5 — מערכת רמות חברות + Boosters

**ההחלטה:** מערכת BUDDY מורחבת בהרבה ממה שהוחלט ב-1.5, מבוססת על Pokémon GO Buddy Adventure.

**רמות חברות:**
| רמה | שם | טריגר |
|---|---|---|
| 1 | Buddy Buddies | יום 1 |
| 2 | Good Friends | 3 ימים מוצלחים מצטברים |
| 3 | Close Friends | 10 ימים מוצלחים מצטברים |
| 4 | Best Friends | 30 ימים מוצלחים מצטברים |
| 5 | Forever Friends | 100 ימים מוצלחים מצטברים |

**יום מוצלח = 70%+ השלמה.** מצטברים, לא רצופים.

**Boosters — לא חנות:**
- Custom Theme Color (4 צבעים)
- ×2 Buffs (חד-פעמי)
- Skip Token
- הנחת פרס (50→25 buffs)
- Buddy Mood Pack
- Skin חדש

**עקרון מנחה: "לא קוסמטיקה. קשר."**

**Scaffold That Fades:** ברמות 1-2 BUDDY בוחר את המתנה. ברמות 3-5 הילד בוחר.

**מסמכים מושפעים:** BUFF_BUDDY_SYSTEM.md (חדש), BUFF_GAP_ANALYSIS.md

---

### D-2026-05-02-09: Tap על BUDDY במסך הראשי → פותח Me & Buddy

**ההחלטה:** הילד יכול לטאפ על דמות BUDDY במסך הראשי. גישה כפולה:
1. Tap על BUDDY (intuitive)
2. Sub-tab ב-Profile (מסודר)
3. Toast notification ברגעי שיא

**גם:** טאפ על buddy ביום רגיל → BUDDY מגיב במשהו קטן (animation/חיוך).

**סיבה:** Itay הציע. פותר את הדילמה "שקט בברירת מחדל אבל מעניין לחזור."

---

### D-2026-05-02-10: Daily Vibe Check נשאר ב-MVP — Rest Tickets ל-1.1

**ההחלטה:**
- Daily Vibe Check ייכלל ב-MVP (2-3 ימי עבודה)
- Rest Tickets יידחו ל-1.1

**סיבה:** Vibe Check משפיע על כל יום (השפעה רחבה). Rest Tickets — על יום בכמה ימים (השפעה צרה).

**הערה:** D-2026-05-02-14 (Pause Mode חוזר ל-MVP) משלימה את התמונה — Vibe Check ל-disruption יומי, Pause Mode ל-disruption מתוכנן.

---

### D-2026-05-02-11: עיצוב ב-Stitch לפני קוד

**ההחלטה:** Teen UI יעוצב ראשית ב-Google Stitch ע"י Adi + Itay. רק אחרי mockups, Claude Code יבנה קוד.

**זמן הערכה:** 1-2 ימים עיצוב + 5-7 ימים מימוש.

---

### D-2026-05-02-12: Notifications לפי קטגוריית גיל

**ההחלטה:** מערכת FCM Notifications:
- ילד 6-12: ההורה בוחר שעות
- מתבגר 13-15: הילד בוחר שעות. Default: צהריים + ערב, לא בוקר. **מקסימום 2 ביום.**

**סיבה:** Itay אמר במפורש: "לא מוגזמות, גג 2 ביום, צהריים + ערב, לא בוקר כשאני בביה"ס."

---

### D-2026-05-02-13: BUDDY ב-Teen Mode — Default On, Dismissible

**ההחלטה:** ב-Teen Mode (13-15):
- **Default = With Buddy** (buddy מוצג)
- כפתור "Hide Buddy" זמין במסך הראשי + ב-Settings
- ההעדפה נשמרת (preference persisted)
- אחרי הסתרה: framing משתנה מ-"Buddy gave you" ל-"You earned"
- המערכת רצה ברקע גם בלי buddy מוצג — Boosters עדיין מצטברים

**סיבה (Adi):**
- מתבגרים עם ADHD מצליחים מ-body doubling וירטואלי בכל גיל
- Itay בעצמו אמר "לא משנה לי" אבל בעצם רצה buddy
- Default Yes משדר חמימות. מי שלא רוצה — בלחיצה אחת זה הולך
- Default No עלול להחמיץ מתבגרים שירוויחו אבל לא יודעים לבקש

**מבטל את ההצעה הקודמת ש-Teen UI = no buddy by default.**

**מסמכים מושפעים:** BUFF_BUDDY_SYSTEM.md (סעיף Teen Mode), BUFF_GAP_ANALYSIS.md

---

### D-2026-05-02-14: Pause Mode חוזר ל-MVP

**ההחלטה:** Pause Mode (P-14) ייכלל ב-MVP, לא יידחה ל-1.1 כפי שהוחלט ב-1.5.

**סיבה (Adi):**
- Israel-specific: חופשים (סוכות, פסח, חופש גדול), מצבי קיצון (מלחמה)
- Global: יציאה משגרה, מחלה, טראומה
- בלי Pause Mode הילד "יכשל" בכל יום של הפסקה מתוכננת
- ההורה צריך לקבוע, לא הילד (Be the Coach principle)
- משלים את התמונה: Vibe Check ל-disruption יומי, Pause Mode ל-disruption מתוכנן

**מנגנון:**
- שדה `pause_mode_active` + `pause_until` ב-`app_settings` (קיים ב-PRD)
- ההורה מפעיל מהגדרות
- במהלך Pause: אין notifications, streaks/successful_days מוקפאים
- ילד פותח: באנר "BUFF is paused — see you on [date]"
- Resume: warm Welcome Back message

**זמן עבודה:** 1-2 ימים

**מסמכים מושפעים:** BUFF_GAP_ANALYSIS.md (P-14: ❌→Must MVP)

---

### D-2026-05-02-15: "Boosters" — שם רשמי לקטגוריה

**ההחלטה:** המתנות הפונקציונליות מ-BUDDY נקראות "Boosters" (לא Power-Ups, לא Gifts, לא Perks).

**סיבה (Itay):**
- קצר
- אנרגטי
- לא ילדותי
- מתאים לכל גיל
- ניטרלי מבחינת gender

**מסמכים מושפעים:** BUFF_BUDDY_SYSTEM.md (החלפת שם בכל מקום)

---

### D-2026-05-02-16: Sort order של משימות — מיקוד ביום נוכחי + click to navigate

**ההחלטה (Itay):** המסך הראשי מציג את חלק היום הנוכחי בלבד. בלחיצה על חלק יום אחר — מעבר. **כפי שכבר ממומש בקוד.**

**סיבה:** "עדיף מיקוד ביום ובקליק לעבור כמו שממומש עכשיו" (Itay).

**ההשלכה:** אין צורך בעבודה על sort order — נשאר as-is.

---

### D-2026-05-02-17: Welcome Back Behavior — חיבוק בלי האשמה

**ההחלטה (Itay):** אחרי 3+ ימים בלי כניסה, ה-app מציג BUDDY שמחבק עם הודעה כמו:
> "Hey, you're back! Let's start fresh today. No pressure — just one task at a time."

**מה לא יקרה:**
- אין שאלה "איפה היית"
- אין סטטיסטיקה של ימים שפספס
- אין הצגת streak שנשבר
- אין reset

**סיבה:** עקרון Safe Harbor — חיזוק חיובי בלבד. Itay אישר אפשרות א מבין 4 שהוצעו.

---

## 2 במאי 2026 — תיעוד מערכתי

### D-2026-05-02-01: יצירת תיקיית `docs/` כ-source-of-truth

**ההחלטה:** מסמכי המוצר ישבו בתיקייה `docs/` בריפו `buff-mobile`, בפורמט Markdown.

**סיבה:** Claude Code יכול לערוך, היסטוריית Git, נגיש ל-Adi וגם ל-Claude (claude.ai דרך GitHub).

---

### D-2026-05-02-02: Continuity protocol בין שיחות

**ההחלטה:** בתחילת כל שיחה ב-claude.ai, Adi מדביקה הודעה סטנדרטית שמכוונת את Claude לקרוא את DECISIONS_LOG, GAP_ANALYSIS, BUDDY_SYSTEM, ו-SESSION_LOG.

**סיבה:** Claude אין לו זיכרון בין שיחות. מסמכים = continuity layer.

---

### D-2026-05-02-03: PRD באנגלית, שאר התיעוד בעברית

**ההחלטה:** PRD ו-User Stories באנגלית. Gap Analysis, Decisions Log, Buddy System, סיכומי סשן בעברית.

**סיבה:** PRD למשקיעים/שותפים. שיחה פנימית — עברית.

---

## 1 במאי 2026

### D-2026-05-01-01: שני Supabase projects נפרדים — לא ממזגים

**ההחלטה:** לוובל ומובייל ימשיכו עם DB-ים נפרדים. אין מיגרציה.

**סיבה:** אין גישה ל-DB של הלוובל. אין משתמשים פעילים שצריך להעביר. ביטא = הוכחת יכולת.

**מסמכים מושפעים:** PRD section 9.2 — לא תקף

---

### D-2026-05-01-02: Lovable יישאר חי עד פרודקשן + landing page אחר כך

**ההחלטה:** הלוובל יוחלף ב-landing page ביום עליית המובייל. אחרי שכולם עברו, ה-Supabase של הלוובל יימחק.

**סיבה:** 49 community subscribers + 86 הורים. Launch list יקר.

---

### D-2026-05-01-03: Founding Members — מי שיעבור מהלוובל

**ההחלטה:** משתמשים שיעברו מהלוובל יקבלו `is_lifetime_access = true`. אין קודים.

**סיבה:** השדה כבר קיים ונקרא ב-`useSubscription.ts:81`.

---

### D-2026-05-01-04: BUDDY V0 — נדחה לעיון מחודש

**ההחלטה (1.5):** "BUDDY V0 = visual פשוט"

**תיקון 2.5 (D-2026-05-02-08):** Audit חשף ש-Buddy Evolution + Skins כבר קיימים. ההחלטה מ-1.5 הייתה מבוססת על חוסר מידע. **התיקון:** Buddy System V0.5 מלא ל-MVP.

---

### D-2026-05-01-05: RevenueCat מוגדר ועובד

**מצב:**
- Android API key אמיתי: `goog_JXENrpCCcYObBesSjSeFGoKvuaA`
- iOS key: לא קיים — Android-only ל-MVP
- Entitlement: "BUFF Premium"
- App User ID: Supabase user.id

---

### D-2026-05-01-06: Build path נדחה

**ההחלטה:** Build path (EAS / GitHub Actions / Local) דחוי.

**סטטוס:** Keystore גובה. סיסמאות שמורות. אפשר לבחור build path בכל רגע.

---

## 28-29 באפריל 2026

### D-2026-04-28: Google OAuth מוגדר וחתום
**פעולה שבוצעה:** OAuth 2.0 client + Supabase provider + buff://auth/callback. עובד ב-Pixel_7 AVD.

### D-2026-04-28: ParentOnboardingModals — תיקון crash
**הבעיה:** custom component בתוך Stack.Navigator → תוקן ל-Stack.Group.

### D-2026-04-29: ChildJoinScreen — תיקון keyboard ב-Android
**הבעיה:** KeyboardAvoidingView behavior undefined → undefined ב-Android.

### D-2026-04-29: Email confirmation — מבוטל
**ההחלטה:** ילדים משתמשים ב-fake @buff.app emails — Supabase email confirmation מבוטל.

---

## הנחיות תחזוקה

1. **כל החלטה משמעותית** מתועדת כאן עם תאריך ונימוק
2. **לא להשמיט נימוק**
3. **בכל סוף סשן** עם Claude — להוסיף החלטות חדשות
4. **בכל תחילת סשן** — Claude מתבקש לקרוא לפני שמתחיל
5. **אם החלטה משתנה** — לא למחוק! להוסיף החלטה חדשה שמתקנת, עם הפנייה לקודמת

---

**סוף מסמך.**
