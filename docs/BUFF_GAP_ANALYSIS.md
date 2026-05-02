# BUFF — Gap Analysis

**מסמך:** השוואה בין מה שתוכנן (PRD/Feature Audit) למה שקיים בקוד `buff-mobile` היום + החלטות מהשיחות.

**עודכן:** 2 במאי 2026 (אחרי סשן עם Itay)

**איך לקרוא:**

| סמל | משמעות |
|---|---|
| ✅ | קיים ועובד כפי שתוכנן |
| 🟡 | קיים חלקית — דורש השלמה |
| ❌ | לא קיים בקוד |
| 🆕 | קיים בקוד אבל **לא** ב-PRD המקורי |
| ⚠️ | סתירה בין PRD להחלטות |
| 🎯 | החלטה ב-2.5 — שונה מ-PRD המקורי |

---

## סיכום מנהלים

יותר מ-50% מ-MVP כבר קיים בקוד. לאחר החלטות עם Itay (2.5), נוספו פיצ'רים ל-MVP מעבר ל-PRD המקורי.

| קטגוריה | כמות |
|---|---|
| ✅ קיים ועובד | 7 |
| 🟡 קיים חלקית | 6 |
| ❌ לא קיים — Must-Have ל-MVP | 9 |
| 🆕 קיים בקוד / לא ב-PRD | 4 |
| 🎯 החלטות חדשות מ-2.5 | 9 |

**הפיצ'רים הקריטיים שעדיין חסרים ל-MVP:**
- Teen UI (קטגוריה שלמה) — **הוחלט להכליל ב-MVP**
- Buddy System V0.5 (רמות + Power-Ups) — **חדש, החלטה מ-2.5**
- Daily Vibe Check
- UI לבחירת Pet Skin
- Daily Win Bonus — חיבור (Bonus Modal קיים)
- Empty state לילד-עם-קוד

**נדחה ל-1.1 / Phase 2:**
- Pause Mode
- Child-proposed tasks/rewards
- Cognitive Strategy Library
- Rest Tickets
- Calendar heat-map
- AI Insights

---

## חלק א' — Onboarding

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| O-01 | V2 Onboarding | Keep as-is | 🟡 שונה | Unified 7-step flow (UStep1-8) |
| O-02 | Language selection at start | Keep as-is | 🟡 חלקי | i18n קיים (1,036 keys), בחירה לפני Welcome — לא נבדק |
| O-03 | Classic 6-step | Legacy | ❌ הוסר | תקין |
| O-04 | Family Code invite | Keep as-is | ✅ EXISTS | |
| O-05 | Starter Packs | Keep as-is | 🟡 שונה | STARTER_TASKS_BY_CHALLENGE קיים. ⚠️ timing 08:00/16:00/20:00 לכולם — לא תואם Stage |

**החלטות פתוחות:**
- timing של משימות סטרטר לפי Stage
- האם motivators צריכים להשפיע על משימות
- Empty state לילד-עם-קוד

---

## חלק ב' — Parent Features

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| P-01 | Family Overview | Keep as-is | 🟡 PARTIAL | "Dashboard children fix" ב-backlog |
| P-02 | Mission Management | Keep as-is | ✅ EXISTS | |
| P-03 | Stage-based scheduling | Keep as-is | 🟡 חלקי | timing לא תואם |
| P-04 | Timetable | Keep as-is | ✅ EXISTS | |
| P-05 | My Gear / Bag Prep | Keep as-is | 🟡 PARTIAL | equipment בתוך Timetable |
| P-06 | The Shop | Keep + Expand | ✅ EXISTS | store_rewards + REWARD_PICKS |
| P-07 | Daily Win Bonus | Keep as-is | 🟡 PARTIAL | **Bonus Modal קיים** + i18n + DB. חסר branding כ-"Daily Win" |
| P-08 | View as Child | Keep as-is | ✅ EXISTS | ModeContext מלא |
| P-09 | Stickers | Keep as-is | 🟡 PARTIAL | i18n מלא + Alert placeholder. חסר picker |
| P-10 | Approve / reject completions | Keep as-is | ✅ EXISTS | |
| P-11 | Auto-approve trusted | Keep as-is | ❓ לא נבדק | |
| P-12 | Child-proposed missions | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-13 | Child-proposed rewards | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-14 | PAUSE MODE | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-15 | Reward pricing guidance | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-16 | Weekly Ignition Analysis | Keep as-is | 🟡 PARTIAL | useParentInsights קיים. Weekly Ignition הספציפי — לא |
| P-17 | Trend Detector | Keep as-is | ❌ NOT EXISTS | |
| P-18 | Stage Performance | Keep as-is | ❓ לא נבדק | |
| P-19 | Reflection Log | Keep as-is | ❓ לא נבדק | |
| P-20 | AI Insights | Phase 2 | ❌ Phase 2 | תואם תוכנית |

---

## חלק ג' — Child Features (Buddy Mode, 6-12)

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| C-01 | Daily Missions: one-task | Keep as-is | ❓ לא נבדק | |
| C-02 | Stage-based task flow | Keep as-is | 🟡 חלקי | |
| C-03 | Mission completion + buddy animation | Keep as-is | ❓ לא נבדק | |
| C-04 | Focus Fuel Meter | Keep as-is | ❓ לא נבדק | |
| C-05 | **Buddy Evolution (4 stages)** | Keep as-is | ✅ EXISTS | egg/hatchling/scout/guardian @ 0/3/7/13 ימים |
| C-06 | **Pet Skins** | Keep as-is | 🟡 PARTIAL | סכמה+תרגומים. חסר UI לבחירה |
| C-07 | Command Center | Keep as-is | ❓ לא נבדק | |
| C-08 | The Shop (redeem) | Keep as-is | ✅ EXISTS | |
| C-09 | My Progress + ticket wallet | Keep as-is | ❓ לא נבדק | |
| C-10 | Rest Tickets | Keep + Expand | ❌ NOT EXISTS | **דחוי ל-1.1** (D-2026-05-02-10) |
| C-11 | My Gear / Bag Prep | Keep as-is | 🟡 PARTIAL | |
| C-12 | Cognitive Strategy Library | Keep as-is | ❌ NOT EXISTS | **דחוי ל-1.1** |
| C-13 | Day-Type Logic | Keep as-is | ❓ לא נבדק | |
| C-14 | Birthday Celebrations | Keep as-is | ❓ לא נבדק | |
| C-15 | Midnight Reset | Keep as-is | ❓ לא נבדק | |
| C-16 | Propose mission | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| C-17 | Propose reward | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| C-18 | Offline mode | Should Have | ❌ NOT EXISTS | |

---

## חלק ד' — Teen Features (Dashboard Mode, 13-15) — 🎯 הוחלט: ב-MVP

**שינוי משמעותי מההחלטה ב-1.5:** Teen UI הוכלל ב-MVP. ראה D-2026-05-02-05 ו-D-2026-05-02-06.

| ID | פיצ'ר | PRD | מובייל | החלטה 2.5 |
|---|---|---|---|---|
| T-01 | Clean dashboard (no buddy) | Keep + Expand | ❌ | 🎯 **MVP** — צבעים: ירוק ניאון על שחור |
| T-02 | Goals view | Keep + Expand | ❌ | 🎯 **MVP** |
| T-03 | Deal-making | Must Have | ❌ | 🎯 **MVP** |
| T-04 | Streak tracker + grace | Keep + Expand | ❓ | 🎯 **שונה** — Itay: "streaks לא חשוב, רק מפריע." מוחלף ב-Winning Streak (70%+) בלבד |
| T-05 | Calendar heat-map | Should Have | ❌ | **דחוי ל-1.1** |

**Teen UI Design Principles (מ-Itay):**
- ירוק ניאון על שחור (השראה: Spotify)
- מינימליסטי, נקי, "אין ילדותי"
- חלוקה לפי חלקי יום
- ללא BUDDY במסך הראשי
- Notifications: 2 ביום, צהריים + ערב, **לא בוקר**

**מסמך מפורט:** BUFF_TEEN_UI_BRIEF.md (יבנה אחר כך — אחרי שאלון Itay)

---

## חלק ה' — Buddy System V0.5 — 🎯 חדש מ-2.5

**מערכת חדשה שלא הייתה ב-PRD המקורי.** ראה BUFF_BUDDY_SYSTEM.md למפרט מלא.

| רכיב | סטטוס | הערות |
|---|---|---|
| 🎯 Friendship Levels (5 רמות) | ❌ NOT EXISTS | חדש. דורש DB schema |
| 🎯 Power-Ups (6 סוגים) | ❌ NOT EXISTS | חדש. כל אחד דורש לוגיקה משלו |
| 🎯 Me & Buddy screen | ❌ NOT EXISTS | חדש. UI חדש |
| 🎯 Tap on buddy → screen | ❌ NOT EXISTS | חדש. trigger ב-Home |
| 🎯 Toast notification on level up | ❌ NOT EXISTS | חדש |
| 🎯 buddy_relationships table | ❌ NOT EXISTS | DB |
| 🎯 buddy_gifts_history table | ❌ NOT EXISTS | DB |
| 🎯 buddy_daily_check table | ❌ NOT EXISTS | DB |
| 🎯 EOD trigger לעדכון successful_days_count | ❌ NOT EXISTS | logic |

**העיקרון:** "לא קוסמטיקה. קשר." BUDDY נותן Power-Ups לפי **ימים מוצלחים מצטברים** (70%+), לא רצופים.

**MVP scope (Phase 1):**
- 3 רמות ראשונות + לוגיקה
- 2 Power-Ups בסיסיים: Custom Theme Color, ×2 Buffs
- מסך Me & Buddy בסיסי
- Toast on level up

**Phase 2 (אחרי MVP, לפני 1.1):**
- Skip Token, Buddy Mood Pack, הנחת פרס
- 5 רמות מלאות
- Push notifications

---

## חלק ו' — System Features

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| S-01 | Push Notifications (FCM) | Must Have | ❌ NOT EXISTS | 🎯 **MVP** — עם הבחנה בין ילדים (הורה בוחר) ל-teens (ילד בוחר, max 2/day) |
| S-02 | Notification messages library | Keep as-is | ❓ לא נבדק | |
| S-03 | 15-Minute Rule | Keep as-is | ❓ לא נבדק | |
| S-04 | Dopamine Bridge | Keep as-is | 🟡 PARTIAL | |
| S-05 | Parent Bonus +20 Buffs | Keep as-is | 🟡 PARTIAL | זהה ל-P-07 |
| S-06 | PWA Install | Remove | ✅ הוסר | תואם תוכנית |
| S-07 | **Daily Vibe Check** | Keep as-is | ❌ NOT EXISTS | **PRD: "fully implemented" — לא נכון. 🎯 MVP** (D-2026-05-02-10) |

---

## חלק ז' — קיים בקוד אבל לא ב-PRD המקורי 🆕

| פיצ'ר | מקור |
|---|---|
| 🆕 RevenueCat (purchaseService, useSubscription, PaywallScreen) | מומש בקוד |
| 🆕 Google OAuth | SESSION_LOG 28.4 |
| 🆕 LinkChildModal + useUnlinkedChildren | SESSION_LOG 29.4 |
| 🆕 simulateSubscribed dev flag | useSubscription |

---

## חלק ח' — סתירות PRD ↔ החלטות (פתורות וגלויות)

| נושא | PRD | החלטה | פתרון |
|---|---|---|---|
| ⚠️ DB | Single Supabase + migrate | שני DBs נפרדים | **D-2026-05-01-01** |
| ⚠️ Beta migration | Free-for-life לפי קריטריון | מתחילים נקי | **D-2026-05-01-02** |
| ⚠️ Pricing | $0/$9/$19, ילדים 1/3/∞ | **פתוח** | להחלטה |
| ⚠️ Founding Members | Beta users שעמדו בקריטריון | משתמשי 49 emails | **D-2026-05-01-03** |
| 🎯 BUDDY scope | 4 stages + 10 skins | **V0.5 — מערכת רמות + Power-Ups** | **D-2026-05-02-08** |
| 🎯 Teen UI timing | "Phase 2" (1.5) | **MVP** (2.5) | **D-2026-05-02-05** |
| 🎯 Streaks | Streak grace mechanic | בוטל. רק Winning Streak | **D-2026-05-02-07** |
| 🎯 Vibe Check vs Rest Tickets | שניהם Must Have | Vibe Check ב-MVP, Rest ל-1.1 | **D-2026-05-02-10** |

---

## הצעדים הבאים — תוכנית עבודה ל-2-3 שבועות

### שלב 1: עיצוב Teen UI ב-Stitch (1-2 ימים)

- Adi + Itay עובדים יחד
- 7 מסכים ראשונים: Dashboard, Tasks Detail, Power-Ups Shop (כתחנה ב-"Me & Buddy"), Rewards Shop, Propose to Parent, Settings, Insights
- Output: screenshots + brief לכל מסך

**שאלון המשך ל-Itay לפני התחלה:**
- שמות הרמות בגרסת Teen — להשאיר או לשנות?
- ה-default sort של המשימות — Stage או "All for today"?
- שם ל-Power-Ups Shop?

---

### שלב 2: תיקונים מהירים בקוד (1-2 ימים, במקביל לעיצוב)

- ✅ Timing של משימות לפי Stage (לא 08:00/16:00/20:00 קבוע)
- ✅ Empty state לילד-עם-קוד (Edge Function או UI)
- ✅ שפה מעצימה למשימות
- ✅ "Homework & grades" → "Homework & focus"
- ✅ אופציות כפולות בין שלבים 2 ו-3
- ✅ Section B + ScrollView ב-Step 3
- ✅ Dashboard children fix
- ✅ Daily Win Bonus — חיבור Bonus Modal הקיים + branding
- ✅ Stickers — picker UI + UI לילד

---

### שלב 3: Buddy System V0.5 — Phase 1 (3-4 ימים)

- DB schema (3 טבלאות חדשות)
- EOD trigger
- מסך Me & Buddy בסיסי
- Toast notifications
- 2 Power-Ups בסיסיים: Custom Theme Color, ×2 Buffs
- UI לבחירת Pet Skin (השלמת UI שחסר ל-Pet Skins הקיימים)

---

### שלב 4: Daily Vibe Check (2-3 ימים)

- מסך כניסה יומי עם 5 emojis/bars
- Low Power Mode logic
- SOS button להורה
- Instant Buff option

---

### שלב 5: Teen UI מימוש (5-7 ימים)

- מבוסס על mockups מ-Stitch
- מסך אחר מסך
- כולל T-01, T-02, T-03 (T-04 משתנה ל-Winning Streak)

---

### שלב 6: בילד + Internal Testing (1 יום)

- EAS build (יש 30 חינמיים מ-1.5)
- Play Console Internal Testing
- Adi + Itay מתקינים, עוברים על כל מסך, רושמים פערים

---

**זמן כולל:** 12-17 ימי עבודה = **2-3 שבועות**

---

## שאלות פתוחות

1. ⏳ **תאריך יצירת ה-PRD** — לא ידוע (April 2026). חשוב לדעת אם החלטות מאוחרות עוברות אליהם
2. ⏳ **Pricing סופי** — $9/$19 (PRD) או לעדכן לישראלי?
3. ⏳ **שמות רמות BUDDY בגרסת Teen** — Itay יבחר
4. ⏳ **בחירת Theme Colors** — בדיוק 4 צבעים (ירוק ברירת מחדל + 3 נוספים)
5. ⏳ **השפה של BUDDY** — Adi כותב? AI? תבנית?
6. ⏳ **התנהגות BUDDY אם הילד לא הצליח 7 ימים** — קלי / משתתף / מתעלם?

---

**סוף מסמך.**
