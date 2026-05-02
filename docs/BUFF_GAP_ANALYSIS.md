# BUFF — Gap Analysis

**מסמך:** השוואה בין מה שתוכנן (PRD/Feature Audit) למה שקיים בקוד `buff-mobile` היום + החלטות מהשיחות.

**עודכן:** 2 במאי 2026 (אחרי תשובות Itay והחלטות Adi)

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
| ❌ לא קיים — Must-Have ל-MVP | 10 |
| 🆕 קיים בקוד / לא ב-PRD | 4 |
| 🎯 החלטות חדשות מ-2.5 | 14 |

**הפיצ'רים הקריטיים שעדיין חסרים ל-MVP:**
- Teen UI (קטגוריה שלמה)
- Buddy System V0.5 (רמות + Boosters)
- Daily Vibe Check
- **Pause Mode** (חזר ל-MVP — D-2026-05-02-14)
- UI לבחירת Pet Skin
- Daily Win Bonus — חיבור (Bonus Modal קיים)
- Empty state לילד-עם-קוד

**נדחה ל-1.1 / Phase 2:**
- Child-proposed tasks/rewards
- Cognitive Strategy Library
- Rest Tickets
- Calendar heat-map
- AI Insights
- Reward pricing guidance

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
| P-14 | **PAUSE MODE** | Must Have | ❌ NOT EXISTS | **🎯 חוזר ל-MVP (D-2026-05-02-14)** |
| P-15 | Reward pricing guidance | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-16 | Weekly Ignition Analysis | Keep as-is | 🟡 PARTIAL | useParentInsights קיים |
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

**שינוי משמעותי:** Teen UI הוכלל ב-MVP (D-2026-05-02-05). **תיקון נוסף (D-2026-05-02-13):** Buddy ב-Teen Mode הוא **default on, dismissible**.

| ID | פיצ'ר | PRD | מובייל | החלטה 2.5 |
|---|---|---|---|---|
| T-01 | Clean dashboard | Keep + Expand | ❌ | 🎯 **MVP** — צבעים: ירוק ניאון על שחור. Buddy default on, dismissible |
| T-02 | Goals view | Keep + Expand | ❌ | 🎯 **MVP** |
| T-03 | Deal-making | Must Have | ❌ | 🎯 **MVP** |
| T-04 | Streak tracker + grace | Keep + Expand | ❓ | 🎯 **שונה** — Itay: "streaks לא חשוב, רק מפריע." מוחלף ב-Winning Streak (70%+) בלבד |
| T-05 | Calendar heat-map | Should Have | ❌ | **דחוי ל-1.1** |

**Teen UI Design Principles (מ-Itay):**
- ירוק ניאון על שחור (השראה: Spotify)
- מינימליסטי, נקי, "אין ילדותי"
- חלוקה לפי חלקי יום
- **Buddy default on, dismissible** (D-2026-05-02-13)
- Notifications: 2 ביום, צהריים + ערב, **לא בוקר**

**Sort order:** מיקוד ביום נוכחי + click to navigate (D-2026-05-02-16) — **כבר ממומש בקוד**, אין עבודה חדשה.

---

## חלק ה' — Buddy System V0.5 — 🎯 חדש מ-2.5

**מערכת חדשה שלא הייתה ב-PRD המקורי.** ראה BUFF_BUDDY_SYSTEM.md למפרט מלא.

| רכיב | סטטוס | הערות |
|---|---|---|
| 🎯 Friendship Levels (5 רמות) | ❌ NOT EXISTS | חדש. דורש DB schema |
| 🎯 Boosters (6 סוגים) | ❌ NOT EXISTS | חדש. כל אחד דורש לוגיקה משלו |
| 🎯 Me & Buddy screen | ❌ NOT EXISTS | חדש. UI חדש |
| 🎯 Tap on buddy → screen | ❌ NOT EXISTS | חדש. trigger ב-Home |
| 🎯 Toast notification on level up | ❌ NOT EXISTS | חדש |
| 🎯 buddy_relationships table | ❌ NOT EXISTS | DB |
| 🎯 buddy_gifts_history table | ❌ NOT EXISTS | DB |
| 🎯 buddy_daily_check table | ❌ NOT EXISTS | DB |
| 🎯 EOD trigger לעדכון successful_days_count | ❌ NOT EXISTS | logic |
| 🎯 Hide/Show Buddy (Teen) | ❌ NOT EXISTS | UI + preference saved (D-2026-05-02-13) |
| 🎯 Welcome Back screen (3+ days absence) | ❌ NOT EXISTS | logic + UI (D-2026-05-02-17) |
| 🎯 Pause Mode | ❌ NOT EXISTS | DB + Parent UI + Resume (D-2026-05-02-14) |

**העיקרון:** "לא קוסמטיקה. קשר." BUDDY נותן Boosters לפי **ימים מוצלחים מצטברים** (70%+), לא רצופים.

**MVP scope (Phase 1):**
- 3 רמות ראשונות + לוגיקה
- 2 Boosters בסיסיים: Custom Theme Color, ×2 Buffs
- מסך Me & Buddy בסיסי
- Toast on level up
- Hide/Show Buddy (Teen)
- Welcome Back screen
- Pause Mode

**Phase 2 (אחרי MVP, לפני 1.1):**
- Skip Token, Buddy Mood Pack, הנחת פרס
- 5 רמות מלאות
- Push notifications לרמות

---

## חלק ו' — System Features

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| S-01 | Push Notifications (FCM) | Must Have | ❌ NOT EXISTS | 🎯 **MVP** — עם הבחנה ילדים/teens (D-2026-05-02-12) |
| S-02 | Notification messages library | Keep as-is | ❓ לא נבדק | |
| S-03 | 15-Minute Rule | Keep as-is | ❓ לא נבדק | |
| S-04 | Dopamine Bridge | Keep as-is | 🟡 PARTIAL | |
| S-05 | Parent Bonus +20 Buffs | Keep as-is | 🟡 PARTIAL | זהה ל-P-07 |
| S-06 | PWA Install | Remove | ✅ הוסר | תואם תוכנית |
| S-07 | **Daily Vibe Check** | Keep as-is | ❌ NOT EXISTS | **🎯 MVP** (D-2026-05-02-10) |

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
| 🎯 BUDDY scope | 4 stages + 10 skins | **V0.5 — מערכת רמות + Boosters** | **D-2026-05-02-08** |
| 🎯 Teen UI timing | "Phase 2" (1.5) | **MVP** (2.5) | **D-2026-05-02-05** |
| 🎯 Streaks | Streak grace mechanic | בוטל. רק Winning Streak | **D-2026-05-02-07** |
| 🎯 Vibe Check vs Rest Tickets | שניהם Must Have | Vibe Check ב-MVP, Rest ל-1.1 | **D-2026-05-02-10** |
| 🎯 Pause Mode | Must Have | (1.5: ל-1.1) → (2.5: חזר ל-MVP) | **D-2026-05-02-14** |
| 🎯 Teen Buddy | "no buddy" | **default on, dismissible** | **D-2026-05-02-13** |

---

## הצעדים הבאים — תוכנית עבודה ל-3-4 שבועות

### שבוע 1
| יום | משימה | זמן |
|---|---|---|
| 1 | עיצוב Stitch — Teen UI (4 מסכים) | 1 |
| 2 | Stitch סיום + תיקוני Onboarding | 1 |
| 3 | Empty state ילד-עם-קוד + Daily Win connection | 1 |
| 4 | Pet Skin UI + שפה מעצימה | 1 |
| 5 | Buddy System V0.5 — DB schema + EOD trigger | 1 |

### שבוע 2
| יום | משימה | זמן |
|---|---|---|
| 6 | Buddy System — Friendship Levels logic + 2 Boosters | 1 |
| 7 | Buddy System — Me & Buddy screen + Toast | 1 |
| 8 | **Pause Mode** (DB + Parent UI + Child UI + Resume) | 1 |
| 9 | Daily Vibe Check (start) | 1 |
| 10 | Daily Vibe Check (end) | 1 |

### שבוע 3
| יום | משימה | זמן |
|---|---|---|
| 11 | Teen UI מימוש — Dashboard (with/without Buddy versions) | 1 |
| 12 | Teen UI — Goals + Deal-making | 1 |
| 13 | Teen UI — Boosters in Teen mode + Hide Buddy + סיום styling | 1 |
| 14 | Stickers picker + Push Notifications setup | 1 |
| 15 | Welcome Back screen + Build + העלאה ל-Internal Testing | 1 |
| 16-17 | בדיקה + תיקונים | 2 |

**סך הכל: 17 ימי עבודה = 3-4 שבועות**

---

## קריטריון "מוכן לפרודקשן"

**אחרי בילד Internal Testing, Adi + Itay מתקינים ובודקים:**

1. ✅ הורה חדש מוריד → אונבורדינג → רואה משימות הגיוניות
2. ✅ ילד 6-12 פותח → Buddy מציג, משימות ברורות
3. ✅ Teen פותח → Dashboard עם Buddy by default
4. ✅ Teen לוחץ Hide Buddy → preference נשמר → dashboard נקי
5. ✅ הורה נותן Daily Win Bonus → ילד רואה
6. ✅ ילד מצליח 3 ימים מוצלחים → BUDDY מציע Theme Color (Booster ראשון)
7. ✅ ילד פותח Vibe Check → Low Power Mode מופעל אם נמוך
8. ✅ הורה מפעיל Pause Mode → באנר מוצג לילד → resume עובד
9. ✅ ילד לא נכנס 3+ ימים → Welcome Back screen מופיע
10. ✅ ילד מקבל פרס מההורה → מסך חוגג

אם 10 הזרימות עוברות = מוכן ל-Closed Testing → Production.

---

## שאלות פתוחות

1. ⏳ **תאריך יצירת ה-PRD** — לא ידוע (April 2026)
2. ⏳ **Pricing סופי** — $9/$19 (PRD) או לעדכן לישראלי?
3. ⏳ **בחירת Theme Colors** — בדיוק 4 צבעים (ירוק ברירת מחדל + 3 נוספים)
4. ⏳ **השפה של BUDDY** — Adi כותב? AI? תבנית?
5. ⏳ **התנהגות BUDDY אם הילד לא הצליח 7 ימים** — קלי / משתתף / מתעלם?
6. ⏳ **Pause Mode — ילד יכול לבקש?** — או רק ההורה? (בינתיים: רק ההורה)

---

**סוף מסמך.**
