# BUFF — Decisions Log

**מטרה:** תיעוד החלטות מוצריות והנדסיות עם תאריך ונימוק.

**מבנה:** כל החלטה כוללת תאריך, ההחלטה, הסיבה, ומסמכים שצריך לעדכן בעקבותיה.

---

## 2 במאי 2026 — סשן עם Itay (קו-יוצר)

### D-2026-05-02-04: Itay כשותף עיצוב פורמלי של Teen UI ו-Buddy System

**ההחלטה:** Itay (בנה של Adi, בן 15, עם ADHD) הוא שותף עיצוב פורמלי של Teen UI ושל מערכת BUDDY. עיצוב מתבצע ביחד איתו, לא רק עליו.

**סיבה:**
- Itay הוא היזם של BUFF יחד עם Adi
- הוא המשתמש המרכזי של Teen UI
- עיצוב על-בסיס הנחות PM/Designer בלי קלט שלו = מוצר לא מתאים לקהל היעד
- נכס שיווקי — "BUFF for Teens, designed by a teenager with ADHD"

**מסמכים מושפעים:** BUFF_TEEN_UI_BRIEF.md (לבנייה אחר כך), BUFF_BUDDY_SYSTEM.md

---

### D-2026-05-02-05: Teen UI — Must Have ל-MVP

**ההחלטה:** Teen UI (T-01 עד T-04) ייכלל ב-MVP, לא יידחה ל-1.1.

**סיבה:**
- Itay (בנה של Adi) הוא teen — בלי Teen UI, MVP לא רלוונטי לו
- 49 emails מהלוובל כוללים הורים שיש להם ילדים בני 13+
- מתבגר שיוריד את האפליקציה ויראה buddy childish יינטוש מיידית
- ההחלטה הקודמת מ-1.5 ("לדחות ל-1.1") הייתה שגויה לאור זאת

**זמן עבודה:** 5-7 ימים מימוש (אחרי עיצוב ב-Stitch)

**מסמכים מושפעים:** BUFF_GAP_ANALYSIS.md (Teen UI: ❌→Must MVP)

---

### D-2026-05-02-06: Teen UI Design Language — ירוק ניאון על שחור

**ההחלטה:** Teen UI יעוצב במשפחה ויזואלית של Spotify/gaming/cyberpunk:
- צבע ראשי: ירוק ניאון (#39FF14 או דומה)
- רקע: שחור עמוק (#0A0A0A)
- ללא buddy מוצג בדשבורד (Itay: "בלי דמות בכלל")
- מינימליסטי, נקי
- חלוקה לפי חלקי יום (Morning/Noon/Afternoon/Evening) — Itay אישר

**סיבה:** Itay אמר באופן ספציפי שהוא אוהב "ירוק ניאון ושחור." Spotify/Instagram/WhatsApp הם 3 האפליקציות שלו. ה-Teen UI צריך להרגיש בתוך אותה משפחה.

**מסמכים מושפעים:** BUFF_TEEN_UI_BRIEF.md, BUFF_GAP_ANALYSIS.md

---

### D-2026-05-02-07: ביטול Streaks רגילים — רק Winning Streak

**ההחלטה:** Streak רגיל (1 יום בלי השלמה = שובר) יבוטל מ-MVP. נשמר רק "Winning Streak" — רצף ימים של 70%+.

**סיבה:**
- Itay אמר במפורש: "לא חשוב ואפילו לא ברור, רק מפריע"
- Streak 100% מתנגד לפילוסופיה של 70% Goal
- Winning Streak (כבר ב-PRD ובפילוסופיה) הוא הסטריק האמיתי של BUFF

**מסמכים מושפעים:** BUFF_GAP_ANALYSIS.md (T-04 streak grace mechanic — לא רלוונטי), BUFF_BUDDY_SYSTEM.md

---

### D-2026-05-02-08: Buddy System V0.5 — מערכת רמות חברות + Power-Ups

**ההחלטה:** מערכת BUDDY מורחבת בהרבה ממה שהוחלט ב-1.5, מבוססת על Pokémon GO Buddy Adventure. כוללת:

**רמות חברות:**
| רמה | שם | טריגר |
|---|---|---|
| 1 | Buddy Buddies | יום 1 |
| 2 | Good Friends | 3 ימים מוצלחים מצטברים |
| 3 | Close Friends | 10 ימים מוצלחים מצטברים |
| 4 | Best Friends | 30 ימים מוצלחים מצטברים |
| 5 | Forever Friends | 100 ימים מוצלחים מצטברים |

**יום מוצלח = 70%+ השלמה** (תואם 70% Goal). **מצטברים, לא רצופים.**

**מתנות (Power-Ups) — לא חנות:**
- Custom Theme Color (4 צבעים)
- כפל נקודות חד-פעמי (×2 buffs ליום אחד)
- Skip Token (לדלג על משימה אחת בלי לשבור 70%)
- הנחת פרס (50→25 buffs, חד-פעמי)
- Buddy Mood Pack (אנימציות חדשות)
- Skin חדש (מ-SWEET/HEROIC הקיימים)

**עקרון מנחה: "לא קוסמטיקה. קשר."** BUDDY הוא נותן, לא חנות.

**Scaffold That Fades:** ברמות 1-2 BUDDY בוחר את המתנה. ברמות 3-5 הילד בוחר.

**סיבה:**
- Itay הציע "מערכת פרסים באפליקציה" (item shop חינמיים) — Adi חידדה ל"BUDDY נותן, לא חנות"
- מתחבר לפילוסופיה הקיימת של 70% Goal, Safe Harbor, Be the Coach
- ה-PRD המקורי דיבר על "Buddy Evolution" אבל לא על מערכת חברות פונקציונלית — זה תוספת על PRD, לא סתירה
- Adi חידדה: יחידת המדידה = יום מוצלח, לא משימה (כדי שלא יעניש משפחות עם 4 משימות / 10 משימות באופן שונה)

**מסמכים מושפעים:** BUFF_BUDDY_SYSTEM.md (חדש — מסמך מלא), BUFF_GAP_ANALYSIS.md (BUDDY: 🟡 PARTIAL → 🟡 Major expansion)

---

### D-2026-05-02-09: Tap על BUDDY במסך הראשי → פותח Me & Buddy

**ההחלטה:** הילד יכול לטאפ על דמות BUDDY במסך הראשי, מה שיפתח מסך "Me & Buddy" (היסטוריה, רמה, מתנות, סטטיסטיקות).

**גישה כפולה:**
1. Tap על BUDDY (intuitive)
2. Sub-tab ב-Profile (מסודר)
3. Toast notification ברגעי שיא (level up + pending gift)

**גם:** טאפ על buddy ביום רגיל (בלי מתנה חדשה) → BUDDY מגיב במשהו קטן (animation/חיוך). הופך אותו לחי.

**סיבה:** Itay הציע את זה. זה פותר את הדילמה "שקט בברירת מחדל אבל מעניין לחזור" — BUDDY כבר במסך, רק מקבל פעולה.

**מסמכים מושפעים:** BUFF_BUDDY_SYSTEM.md

---

### D-2026-05-02-10: Daily Vibe Check נשאר ב-MVP — Rest Tickets ל-1.1

**ההחלטה:**
- **Daily Vibe Check** ייכלל ב-MVP (2-3 ימי עבודה)
- **Rest Tickets** יידחו ל-1.1 (יש isResting prop ב-EmojiPet, אפשר להרחיב מאוחר)

**סיבה:** Vibe Check משפיע על כל יום (השפעה רחבה). Rest Tickets משפיעים על יום בכמה ימים (השפעה צרה). שניהם חשובים, רק אחד דחוף.

**ההשלכה:** Vibe Check תופס את התפקיד של "disruption response" ל-MVP. Rest Tickets ירחיבו את היכולת אחר כך.

**מסמכים מושפעים:** BUFF_GAP_ANALYSIS.md (S-07 Vibe Check: ❌→Must MVP, C-10 Rest Tickets: ❌→1.1)

---

### D-2026-05-02-11: עיצוב ב-Stitch לפני קוד

**ההחלטה:** Teen UI יעוצב ראשית ב-Google Stitch (כלי עיצוב AI) ע"י Adi + Itay. רק אחרי שיש mockups, Claude Code יבנה את הקוד.

**סיבה:**
- Stitch מהיר לעיצוב mockups
- Itay יכול לראות ולתת פידבק לפני שכותבים שורת קוד
- Claude Code עובד טוב יותר עם mockup ברור מאשר תיאור מילולי
- חיסכון בזמן — שינוי בעיצוב < שינוי בקוד

**זמן הערכה:** 1-2 ימים עיצוב ב-Stitch + 5-7 ימים מימוש בקוד.

**מסמכים מושפעים:** BUFF_TEEN_UI_BRIEF.md (יבנה בנפרד אחר כך)

---

### D-2026-05-02-12: notifications לפי קטגוריית גיל

**ההחלטה:** מערכת FCM Notifications תתמוך ב:
- ילד 6-12: ההורה בוחר שעות (timing קבועות)
- מתבגר 13-15: הילד בוחר שעות. ברירת מחדל: צהריים + ערב, לא בוקר (Itay)
- מקסימום 2 ביום למתבגרים

**סיבה:** Itay אמר במפורש: "לא מוגזמות, גג 2 ביום, צהריים + ערב, לא בוקר כשאני בביה"ס."

**מסמכים מושפעים:** BUFF_GAP_ANALYSIS.md (S-01 FCM scope), BUFF_TEEN_UI_BRIEF.md

---

## 2 במאי 2026 — תיעוד מערכתי

### D-2026-05-02-01: יצירת תיקיית `docs/` כ-source-of-truth

**ההחלטה:** מסמכי המוצר ישבו בתיקייה `docs/` בריפו `buff-mobile`, בפורמט Markdown.

**סיבה:** Claude Code יכול לערוך, היסטוריית Git, נגיש ל-Adi וגם ל-Claude (claude.ai דרך GitHub).

**מסמכים מושפעים:** docs/README.md (אינדקס)

---

### D-2026-05-02-02: Continuity protocol בין שיחות

**ההחלטה:** בתחילת כל שיחה ב-claude.ai, Adi מדביקה הודעה סטנדרטית שמכוונת את Claude לקרוא את DECISIONS_LOG, GAP_ANALYSIS, BUDDY_SYSTEM, ו-SESSION_LOG.

**סיבה:** Claude אין לו זיכרון בין שיחות. מסמכים = continuity layer.

**מסמכים מושפעים:** docs/README.md

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

**פעולה שבוצעה:** ה-49 emails ייוצאו ל-CSV ב-1.5.

---

### D-2026-05-01-03: Founding Members — מי שיעבור מהלוובל

**ההחלטה:** משתמשים שיעברו מהלוובל יקבלו `is_lifetime_access = true` כברירת מחדל. אין קודים.

**סיבה:** השדה כבר קיים ונקרא ב-`useSubscription.ts:81`. מתאים לפילוסופיה.

**מסמכים מושפעים:** PRD section 5.2 — קריטריונים שונים מהמקור

---

### D-2026-05-01-04: BUDDY V0 — נדחה לעיון מחודש

**ההחלטה (1.5):** "BUDDY V0 = visual פשוט + 5-7 הודעות, History/Achievements ל-1.1"

**תיקון 2.5 (D-2026-05-02-08):** Audit חשף ש-Buddy Evolution + Skins כבר קיימים בקוד. ההחלטה מ-1.5 הייתה מבוססת על חוסר מידע. **התיקון:** Buddy System V0.5 מלא ל-MVP (ראה D-2026-05-02-08).

---

### D-2026-05-01-05: RevenueCat מוגדר ועובד

**מצב:**
- Android API key אמיתי: `goog_JXENrpCCcYObBesSjSeFGoKvuaA` (hardcoded ב-purchaseService.ts:9)
- iOS key: לא קיים — Android-only ל-MVP
- Entitlement: "BUFF Premium"
- App User ID: Supabase user.id

**פעולה דחויה:** העברה ל-`.env` אחרי MVP.

---

### D-2026-05-01-06: Build path נדחה

**ההחלטה:** ההחלטה בין EAS Production / GitHub Actions / Local — דחויה.

**סיבה:** מכסת EAS חופשית מתחדשת ב-1.5. אין לחץ מיידי.

**סטטוס:** Keystore גובה ב-1.5. סיסמאות שמורות. אפשר לבחור build path בכל רגע.

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
2. **לא להשמיט נימוק** — בעוד 3 חודשים נחזור ונרצה להבין למה
3. **בכל סוף סשן** עם Claude — להוסיף החלטות חדשות
4. **בכל תחילת סשן** — Claude מתבקש לקרוא לפני שמתחיל
5. **אם החלטה משתנה** — לא למחוק! להוסיף החלטה חדשה שמתקנת, עם הפנייה לקודמת (D-2026-05-01-04 ↔ D-2026-05-02-08)

---

**סוף מסמך.**
