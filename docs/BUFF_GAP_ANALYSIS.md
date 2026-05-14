# BUFF — Gap Analysis

**מסמך:** השוואה בין מה שתוכנן (PRD/Feature Audit) למה שקיים בקוד `buff-mobile` היום + החלטות מהשיחות.

**עודכן:** 14 במאי 2026 (אחרי 4 חבילות Teen UI + bug fixes — ראה docs/eod-2026-05-14)

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
- ~~Teen UI~~ ✅ **4/8 מסכים שופחו** (01-no-buddy, 02, 04, 06, 5B-lite — נכון 14.5.2026); נותרו 03, 05A, 07, 08 (3 תלויים ב-Buddy V0.5, 2 צריכים עיצוב ב-Stitch)
- Buddy System V0.5 (רמות + Boosters + buddy_relationships tables) — **הצוואר הבא**, פותח מסכי 03/05A ואת ה-Full 5B
- Daily Vibe Check
- ~~Pause Mode~~ ✅ **שופח** (PR #22-25 — schema + parent UI + child UI + Welcome Back)
- ~~UI לבחירת Pet Skin~~ ✅ **שופח** (PR #27)
- Daily Win Bonus — חיבור (Bonus Modal קיים)
- Empty state לילד-עם-קוד
- ~~Wolf STORMY skin~~ ✅ **שופח** כ-Gamer day-0 default (PR #27)

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
| P-14 | **PAUSE MODE** | Must Have | ✅ EXISTS | Shipped via pkg/pause-mode (PRs #22-25): schema + parent UI + child UI + Welcome Back modal |
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
| C-06 | **Pet Skins** | Keep as-is | ✅ EXISTS | UI picker shipped (PR #27); Wolf added as Gamer day-0 default |
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
| T-01 | Clean dashboard | Keep + Expand | ✅ EXISTS (no-buddy variant) | ✅ 01 + 02 | Shipped as `GamerDashboardScreen` (PR #28). With-buddy variant pending Buddy V0.5 backend. |
| T-02 | Goals view | Keep + Expand | 🟡 PARTIAL | 🟡 5B lite shipped | `GamerMyStatsScreen` (PR #34/#39) renders 3-stat grid; LEVEL/BOOSTERS pending Buddy V0.5 |
| T-03 | Deal-making | Must Have | ❌ | 🟡 חלקי | "Suggest a reward" קיים במסך 06 |
| T-04 | Streak tracker + grace | Keep + Expand | ✅ EXISTS (in 5B lite) | — | **שונה** — Itay: streaks לא חשוב. Winning Streak (70%+) בלבד. "רצף נוכחי" shown on MY STATS screen. |
| T-05 | Calendar heat-map | Should Have | ❌ | — | **דחוי ל-1.1** |

### מסכי Stitch שעוצבו (2.5.2026)

| מסך | נושא | סטטוס |
|---|---|---|
| 01 | Dashboard with Buddy (Wolf STORMY) | 🎨 Approved by Itay; **with-buddy variant not yet implemented** (needs Buddy V0.5 backend) |
| 02 | Dashboard without Buddy (stat cards) | ✅ **Implemented** as `GamerDashboardScreen` (PR #28) |
| 03 | Buddy Toggle Modal | 🎨 Approved; **not implemented** (needs `buddy_relationships.buddy_visible`) |
| 04 | Tasks Detail (Today's Plan) | ✅ **Implemented** as `GamerTasksScreen` (PR #29) |
| 05A | Me & Buddy (with character) | 🎨 Approved; **not implemented** (needs Buddy V0.5 LEVEL/BOOSTERS) |
| 05B | My Stats (without character) | 🟡 **Lite version implemented** (PR #34/#39) — 3-stat grid only, no LEVEL/BOOSTERS/hero; full 5B pending Buddy V0.5 |
| 06 | Rewards Shop (FROM PARENT + FROM BUDDY) | ✅ **Implemented** as `GamerRewardsScreen` (PR #30); FROM BUDDY tab is a placeholder pending V0.5 boosters |
| 07 | Settings | ⏳ Not yet designed |
| 08 | Teen Onboarding Choice | ⏳ Not yet designed (חדש) |

**מיקום קבצים:** `docs/teen-ui-design/[01-08]/` — code.html + DESIGN.md + screen.png + design-notes.md

---

## חלק ה' — Buddy System V0.5 — 🎯 חדש מ-2.5

| רכיב | סטטוס | הערות |
|---|---|---|
| Friendship Levels (5 רמות) | ❌ NOT EXISTS | חדש. דורש DB schema — **proposed as `pkg/buddy-v05-backend`** |
| Boosters (6 סוגים) | ❌ NOT EXISTS | חדש — proposed as `pkg/buddy-v05-backend` |
| Me & Buddy / My Stats screen | 🟡 5B-lite shipped | `GamerMyStatsScreen` (PR #34/#39); 5A and full 5B pending Buddy V0.5 backend |
| Tap on buddy → screen | ❌ NOT EXISTS | חדש |
| Toast on level up | ❌ NOT EXISTS | חדש |
| buddy_relationships table | ❌ NOT EXISTS | DB — `pkg/buddy-v05-backend` |
| buddy_gifts_history table | ❌ NOT EXISTS | DB — `pkg/buddy-v05-backend` |
| buddy_daily_check table | ❌ NOT EXISTS | DB — `pkg/buddy-v05-backend` |
| EOD trigger | ❌ NOT EXISTS | logic — `pkg/buddy-v05-backend` |
| Hide/Show Buddy (Teen) | ❌ NOT EXISTS | UI + preference (D-13 v2) — needs `buddy_relationships.buddy_visible` |
| Welcome Back screen | ✅ EXISTS | Shipped as part of pkg/pause-mode (PR #24) |
| Pause Mode | ✅ EXISTS | Shipped via pkg/pause-mode (PRs #22-25) |
| **Wolf STORMY skin** | ✅ EXISTS | Added as Gamer day-0 default (PR #27) |
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

### מה שופח (נכון 14.5.2026)

| חבילה | PR | מה שופח |
|---|---|---|
| pkg/pause-mode (phases 0-5) | #22-25 | DB schema + Parent UI banner + Child UI + Welcome Back modal + Resume |
| pkg/pet-skins | #27 | Pet Skin picker UI + Wolf as Gamer day-0 default |
| pkg/teen-ui-gamer-dashboard | #28 | Stitch 02 dashboard (no-buddy variant, Itay's pick) → `GamerDashboardScreen` |
| pkg/teen-ui-tasks-detail | #29 | Stitch 04 → `GamerTasksScreen` |
| pkg/teen-ui-rewards-shop | #30 | Stitch 06a → `GamerRewardsScreen` |
| pkg/teen-ui-my-stats-lite (+ followup) | #34, #38, #39 | Stitch 5B-lite → `GamerMyStatsScreen` (3 stats only; LEVEL/BOOSTERS pending V0.5) |
| pkg/hide-paywall-from-child | #40 | Child viewers no longer see "Unlock ✨" CTAs across 4 screens; gentle "ask your parent" copy instead |
| pkg/fix-runtime-theme-switch | #41 | Theme toggle in Settings no longer blanks the tab navigator |

### מה נותר — סדר עבודה מוצע

**הצוואר הבא: Buddy V0.5 backend** — חוסם 4 מסכים (Stitch 01-with-buddy, 03, 05A, ו-Full 5B). זה הצעד היחיד שפותח הכי הרבה.

| תור | חבילה | חוסם / פותח |
|---|---|---|
| 1 | **`pkg/buddy-v05-backend`** | Schema (buddy_relationships, buddy_gifts_history, buddy_daily_check) + Friendship Levels logic + 2 Boosters + EOD trigger |
| 2 | **`pkg/teen-ui-with-buddy-bundle`** | Stitch 01-with-buddy + 03 Buddy Toggle + 05A Me & Buddy + extend 5B-lite to full 5B (LEVEL/BOOSTERS/hero) |
| 3 | `pkg/daily-vibe-check` | MVP critical, S-07 |
| 4 | `pkg/fcm-push-notifications` | MVP critical, S-01 |
| 5 | `pkg/childjoin-claim-orphans` | Data integrity fix (IN-2026-05-14-03) — small |
| 6 | Stitch design for 07 Settings + 08 Onboarding choice (Adi + Claude.ai) | Unblocks final teen flow |
| 7 | Empty state for child-with-code | UX polish, MVP |
| 8 | Daily Win Bonus branding hookup | UX polish, MVP |
| ⏳ deferred to 1.1 | Children Mode design pass (Pastel) + Stickers + Cognitive Strategy Library + Rest Tickets + Calendar heat-map + AI Insights + Reward pricing guidance | |

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
