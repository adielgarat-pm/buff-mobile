# BUFF — Gap Analysis

**מסמך:** השוואה בין מה שתוכנן (PRD/Feature Audit) למה שקיים בקוד `buff-mobile` היום + החלטות מהשיחות.

**עודכן:** 2 במאי 2026 (אחרי סשן Stitch + תובנות אמי)

**איך לקרוא:**

| סמל | משמעות |
|---|---|
| ✅ | קיים ועובד כפי שתוכנן |
| 🟡 | קיים חלקית — דורש השלמה |
| ❌ | לא קיים בקוד |
| 🆕 | קיים בקוד אבל **לא** ב-PRD המקורי |
| ⚠️ | סתירה בין PRD להחלטות |
| 🎯 | החלטה ב-2.5 — שונה מ-PRD המקורי |
| 🎨 | עוצב ב-Stitch ב-2.5 |

---

## סיכום מנהלים

| קטגוריה | כמות |
|---|---|
| ✅ קיים ועובד | 7 |
| 🟡 קיים חלקית | 6 |
| ❌ לא קיים — Must-Have ל-MVP | 11 |
| 🆕 קיים בקוד / לא ב-PRD | 4 |
| 🎯 החלטות חדשות מ-2.5 | 24 |
| 🎨 מסכים שעוצבו ב-Stitch | 6 (מתוך 8) |

**הפיצ'רים הקריטיים לפני MVP:**
- Teen UI (6 מסכים מעוצבים, 2 חסרים ב-Stitch)
- Buddy System V0.5 (רמות + Boosters)
- Daily Vibe Check
- Pause Mode
- UI לבחירת Pet Skin
- Daily Win Bonus — חיבור (Bonus Modal קיים)
- Empty state לילד-עם-קוד
- Wolf STORMY skin להוסיף ל-HEROIC_SKINS

**נדחה ל-1.1 / Phase 2:**
- Child-proposed tasks/rewards
- Cognitive Strategy Library
- Rest Tickets
- Calendar heat-map
- AI Insights
- Reward pricing guidance
- **Children Mode design pass עם אמי + Pastel theme**

---

## חלק א' — Onboarding

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| O-01 | V2 Onboarding | Keep as-is | 🟡 שונה | Unified 7-step flow |
| O-02 | Language selection at start | Keep as-is | 🟡 חלקי | i18n קיים |
| O-03 | Classic 6-step | Legacy | ❌ הוסר | תקין |
| O-04 | Family Code invite | Keep as-is | ✅ EXISTS | |
| O-05 | Starter Packs | Keep as-is | 🟡 שונה | timing 08:00/16:00/20:00 לכולם — לא תואם Stage |
| **O-06** | **Teen Buddy Choice screen** | 🎯 חדש | ❌ NOT EXISTS | 🎨 לעצב ב-Stitch (מסך 8) |

---

## חלק ב' — Parent Features

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| P-01 | Family Overview | Keep as-is | 🟡 PARTIAL | "Dashboard children fix" ב-backlog |
| P-02 | Mission Management | Keep as-is | ✅ EXISTS | |
| P-03 | Stage-based scheduling | Keep as-is | 🟡 חלקי | timing לא תואם |
| P-04 | Timetable | Keep as-is | ✅ EXISTS | |
| P-05 | My Gear / Bag Prep | Keep as-is | 🟡 PARTIAL | equipment בתוך Timetable |
| P-06 | The Shop | Keep + Expand | ✅ EXISTS | |
| P-07 | Daily Win Bonus | Keep as-is | 🟡 PARTIAL | Bonus Modal קיים. חסר branding |
| P-08 | View as Child | Keep as-is | ✅ EXISTS | |
| P-09 | Stickers | Keep as-is | 🟡 PARTIAL | i18n מלא + Alert placeholder |
| P-10 | Approve / reject completions | Keep as-is | ✅ EXISTS | |
| P-11 | Auto-approve trusted | Keep as-is | ❓ לא נבדק | |
| P-12 | Child-proposed missions | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-13 | Child-proposed rewards | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-14 | **PAUSE MODE** | Must Have | ❌ NOT EXISTS | **🎯 MVP** (D-2026-05-02-14) |
| P-15 | Reward pricing guidance | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| P-16 | Weekly Ignition Analysis | Keep as-is | 🟡 PARTIAL | useParentInsights קיים |
| P-17 | Trend Detector | Keep as-is | ❌ NOT EXISTS | |
| P-18 | Stage Performance | Keep as-is | ❓ לא נבדק | |
| P-19 | Reflection Log | Keep as-is | ❓ לא נבדק | |
| P-20 | AI Insights | Phase 2 | ❌ Phase 2 | תואם תוכנית |

---

## חלק ג' — Children Features (Buddy Mode, 6-12)

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| C-01 | Daily Missions: one-task | Keep as-is | ❓ לא נבדק | |
| C-02 | Stage-based task flow | Keep as-is | 🟡 חלקי | |
| C-03 | Mission completion + buddy animation | Keep as-is | ❓ לא נבדק | |
| C-04 | Focus Fuel Meter | Keep as-is | ❓ לא נבדק | |
| C-05 | Buddy Evolution (4 stages) | Keep as-is | ✅ EXISTS | egg/hatchling/scout/guardian |
| C-06 | **Pet Skins** | Keep as-is | 🟡 PARTIAL | סכמה+תרגומים. **חסר UI לבחירה. צריך להוסיף Wolf** |
| C-07 | Command Center | Keep as-is | ❓ לא נבדק | |
| C-08 | The Shop (redeem) | Keep as-is | ✅ EXISTS | |
| C-09 | My Progress + ticket wallet | Keep as-is | ❓ לא נבדק | |
| C-10 | Rest Tickets | Keep + Expand | ❌ NOT EXISTS | **דחוי ל-1.1** |
| C-11 | My Gear / Bag Prep | Keep as-is | 🟡 PARTIAL | |
| C-12 | Cognitive Strategy Library | Keep as-is | ❌ NOT EXISTS | **דחוי ל-1.1** |
| C-13 | Day-Type Logic | Keep as-is | ❓ לא נבדק | |
| C-14 | Birthday Celebrations | Keep as-is | ❓ לא נבדק | |
| C-15 | Midnight Reset | Keep as-is | ❓ לא נבדק | |
| C-16 | Propose mission | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| C-17 | Propose reward | Must Have | ❌ NOT EXISTS | **דחוי ל-1.1** |
| C-18 | Offline mode | Should Have | ❌ NOT EXISTS | |

**הערה לעתיד:** Children Mode design pass עם אמי + Pastel theme — דחוי ל-1.1.

---

## חלק ד' — Teen Features (13-18) — 🎨 6 מסכים עוצבו ב-Stitch

| ID | פיצ'ר | PRD | מובייל | סטיץ' מסך | הערות |
|---|---|---|---|---|---|
| T-01 | Clean dashboard | Keep + Expand | ❌ | ✅ 01 + 02 | 2 גרסאות: with buddy + without |
| T-02 | Goals view | Keep + Expand | ❌ | 🟡 חלקי | חלק ממסך Profile (07) |
| T-03 | Deal-making | Must Have | ❌ | 🟡 חלקי | "Suggest a reward" קיים במסך 06 |
| T-04 | Streak tracker + grace | Keep + Expand | ❓ | — | **שונה** — Itay: streaks לא חשוב. Winning Streak (70%+) בלבד |
| T-05 | Calendar heat-map | Should Have | ❌ | — | **דחוי ל-1.1** |

### מסכי Stitch שעוצבו (2.5.2026)

| מסך | נושא | סטטוס |
|---|---|---|
| 01 | Dashboard with Buddy (Wolf STORMY) | ✅ Approved by Itay |
| 02 | Dashboard without Buddy (stat cards) | ✅ Approved by Itay |
| 03 | Buddy Toggle Modal | ✅ Approved |
| 04 | Tasks Detail (Today's Plan) | ✅ Approved |
| 05A | Me & Buddy (with character) | ✅ Approved |
| 05B | My Stats (without character) | ✅ Approved + **Itay's preferred** |
| 06 | Rewards Shop (FROM PARENT + FROM BUDDY) | ✅ Approved |
| 07 | Settings | ⏳ Not yet designed |
| 08 | Teen Onboarding Choice | ⏳ Not yet designed (חדש) |

**מיקום קבצים:** `docs/teen-ui-design/[01-08]/` — code.html + DESIGN.md + screen.png + design-notes.md

---

## חלק ה' — Buddy System V0.5 — 🎯 חדש מ-2.5

| רכיב | סטטוס | הערות |
|---|---|---|
| Friendship Levels (5 רמות) | ❌ NOT EXISTS | חדש. דורש DB schema |
| Boosters (6 סוגים) | ❌ NOT EXISTS | חדש |
| Me & Buddy / My Stats screen | 🎨 עוצב | מסכים 5A + 5B ב-Stitch |
| Tap on buddy → screen | ❌ NOT EXISTS | חדש |
| Toast on level up | ❌ NOT EXISTS | חדש |
| buddy_relationships table | ❌ NOT EXISTS | DB |
| buddy_gifts_history table | ❌ NOT EXISTS | DB |
| buddy_daily_check table | ❌ NOT EXISTS | DB |
| EOD trigger | ❌ NOT EXISTS | logic |
| Hide/Show Buddy (Teen) | ❌ NOT EXISTS | UI + preference (D-13 v2) |
| Welcome Back screen | ❌ NOT EXISTS | logic + UI |
| Pause Mode | ❌ NOT EXISTS | DB + Parent UI + Resume |
| **Wolf STORMY skin** | ❌ NOT EXISTS | להוסיף ל-HEROIC_SKINS |
| **Teen Onboarding Buddy choice** | ❌ NOT EXISTS | מסך חדש (08 ב-Stitch) |

---

## חלק ו' — System Features

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| S-01 | Push Notifications (FCM) | Must Have | ❌ NOT EXISTS | 🎯 **MVP** — הבחנה ילדים/teens |
| S-02 | Notification messages library | Keep as-is | ❓ לא נבדק | |
| S-03 | 15-Minute Rule | Keep as-is | ❓ לא נבדק | |
| S-04 | Dopamine Bridge | Keep as-is | 🟡 PARTIAL | |
| S-05 | Parent Bonus +20 Buffs | Keep as-is | 🟡 PARTIAL | זהה ל-P-07 |
| S-06 | PWA Install | Remove | ✅ הוסר | |
| S-07 | **Daily Vibe Check** | Keep as-is | ❌ NOT EXISTS | **🎯 MVP** |

---

## חלק ז' — קיים בקוד אבל לא ב-PRD המקורי 🆕

| פיצ'ר | מקור |
|---|---|
| 🆕 RevenueCat | מומש בקוד |
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
| ⚠️ Founding Members | Beta users | משתמשי 49 emails | **D-2026-05-01-03** |
| 🎯 BUDDY scope | 4 stages + 10 skins | **V0.5 — מערכת רמות + Boosters** | **D-2026-05-02-08** |
| 🎯 Teen UI timing | "Phase 2" (1.5) | **MVP** (2.5) | **D-2026-05-02-05** |
| 🎯 Streaks | Streak grace mechanic | בוטל. רק Winning Streak | **D-2026-05-02-07** |
| 🎯 Vibe Check vs Rest Tickets | שניהם Must Have | Vibe Check ב-MVP, Rest ל-1.1 | **D-2026-05-02-10** |
| 🎯 Pause Mode | Must Have | (1.5: ל-1.1) → (2.5: חזר ל-MVP) | **D-2026-05-02-14** |
| 🎯 Teen Buddy | "no buddy" | **Onboarding choice** | **D-2026-05-02-13 v2** |

---

## הצעדים הבאים — תוכנית עבודה

### חסר לפני התחלת קוד
- [ ] מסך 07 — Settings ב-Stitch
- [ ] מסך 08 — Teen Onboarding Choice ב-Stitch (חדש בעקבות D-13 v2)

### שבוע 1
| יום | משימה |
|---|---|
| 1 | סיום Stitch (מסכים 7+8) + תיקוני Onboarding |
| 2 | Empty state ילד-עם-קוד + Daily Win connection |
| 3 | Pet Skin UI + Wolf skin להוסיף + שפה מעצימה |
| 4 | Buddy System V0.5 — DB schema + EOD trigger |
| 5 | Buddy System — Friendship Levels logic + 2 Boosters |

### שבוע 2
| יום | משימה |
|---|---|
| 6 | Buddy System — Me & Buddy + My Stats screens |
| 7 | Toast notifications + Hide/Show Buddy logic |
| 8 | Pause Mode (DB + Parent UI + Child UI + Resume) |
| 9 | Daily Vibe Check (start) |
| 10 | Daily Vibe Check (end) |

### שבוע 3
| יום | משימה |
|---|---|
| 11 | Teen UI מימוש — Dashboard (with/without Buddy) + Onboarding choice |
| 12 | Teen UI — Tasks Detail + Settings |
| 13 | Teen UI — Rewards Shop + Boosters integration |
| 14 | Stickers picker + Push Notifications setup |
| 15 | Welcome Back + Build + Internal Testing |
| 16-17 | בדיקה + תיקונים |

**סך הכל: 17 ימי עבודה = 3-4 שבועות**

---

## קריטריון "מוכן לפרודקשן"

**Adi + Itay מתקינים ובודקים:**

1. ✅ הורה חדש מוריד → אונבורדינג → רואה משימות הגיוניות
2. ✅ ילד 6-12 פותח → Buddy מציג, משימות ברורות
3. ✅ Teen פותח → **Onboarding שואל** "with or without Buddy?"
4. ✅ Teen בחר "without" → Dashboard נקי בסגנון 5B
5. ✅ Teen בחר "with" → Dashboard עם Wolf STORMY בסגנון 5A
6. ✅ Teen מ-Settings יכול לשנות בין השניים
7. ✅ הורה נותן Daily Win Bonus → ילד רואה
8. ✅ ילד מצליח 3 ימים מוצלחים → BUDDY מציע Theme Color (Booster ראשון)
9. ✅ ילד פותח Vibe Check → Low Power Mode מופעל אם נמוך
10. ✅ הורה מפעיל Pause Mode → באנר מוצג לילד → resume עובד
11. ✅ ילד לא נכנס 3+ ימים → Welcome Back screen
12. ✅ ילד מקבל פרס מההורה → מסך חוגג

12 הזרימות = מוכן ל-Closed Testing → Production.

---

## שאלות פתוחות

1. ⏳ **תאריך יצירת ה-PRD** — לא ידוע
2. ⏳ **Pricing סופי** — $9/$19 (PRD) או לעדכן לישראלי?
3. ⏳ **בחירת Theme Colors** — בדיוק 4 צבעים
4. ⏳ **השפה של BUDDY** — Adi כותב? AI? תבנית?
5. ⏳ **התנהגות BUDDY אם הילד לא הצליח 7 ימים** — ?
6. ⏳ **Pause Mode — ילד יכול לבקש?** — בינתיים: רק ההורה
7. ⏳ **שם ה-Buddy** — STORMY default או הילד בוחר?
8. ⏳ **Pet skins quality images** — לדייק במהלך implementation
9. ⏳ **Children Mode design + Pastel theme** — דחוי ל-1.1 (אמי תהיה co-designer)

---

**סוף מסמך.**
