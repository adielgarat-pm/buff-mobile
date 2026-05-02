# BUFF — Gap Analysis

**מסמך:** השוואה בין מה שתוכנן (PRD/Feature Audit) למה שקיים בקוד `buff-mobile` היום.

**עודכן:** 2 במאי 2026 (אחרי שני audits של Claude Code)

**איך לקרוא:**

| סמל | משמעות |
|---|---|
| ✅ | קיים ועובד כפי שתוכנן |
| 🟡 | קיים חלקית — דורש השלמה |
| ❌ | לא קיים בקוד |
| 🆕 | קיים בקוד אבל **לא** ב-PRD המקורי |
| ⚠️ | סתירה בין PRD להחלטות מהשיחה ב-1.5–2.5.2026 |

---

## סיכום מנהלים — הערכה מתוקנת

**יותר מ-50% מ-MVP כבר קיים בקוד.** זה שינוי משמעותי לעומת מה שחשבנו ב-1.5.

| קטגוריה | כמות |
|---|---|
| ✅ קיים ועובד | 7 |
| 🟡 קיים חלקית | 6 |
| ❌ לא קיים | 11 |
| 🆕 קיים בקוד / לא ב-PRD | 4 |
| ⚠️ סתירה PRD↔החלטות 1.5 | 5 |

**הפיצ'רים הקריטיים שעדיין חסרים:** Teen UI (קטגוריה שלמה), Pause Mode, Daily Vibe Check, Rest Tickets, Child-proposed flow, Cognitive Strategy Library.

---

## חלק א' — Onboarding

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| O-01 | V2 Onboarding | Keep as-is | 🟡 שונה | Unified 7-step flow (UStep1-8) — שונה מ-V2 |
| O-02 | Language selection at start | Keep as-is | 🟡 חלקי | i18n קיים (1,036 keys בשתי שפות), בחירה לפני Welcome — לא נבדק |
| O-03 | Classic 6-step | Legacy | ❌ הוסר | תקין — לא נדרש במובייל |
| O-04 | Family Code invite | Keep as-is | ✅ EXISTS | ChildJoinScreen + family_code |
| O-05 | Starter Packs | Keep as-is | 🟡 שונה | STARTER_TASKS_BY_CHALLENGE קיים. ⚠️ timing 08:00/16:00/20:00 לכולם — לא תואם Stage |

**החלטות פתוחות מ-1.5:**
- timing של משימות סטרטר לפי Stage (במקום 3 זמנים קבועים)
- האם motivators צריכים להשפיע על משימות (כיום רק על rewards)
- Empty state לילד-עם-קוד

---

## חלק ב' — Parent Features

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| P-01 | Family Overview dashboard | Keep as-is | 🟡 PARTIAL | קיים אבל "Dashboard children fix" ב-backlog |
| P-02 | Mission Management | Keep as-is | ✅ EXISTS | |
| P-03 | Stage-based scheduling | Keep as-is | 🟡 חלקי | categories קיימים, timing לא תואם |
| P-04 | Timetable | Keep as-is | ✅ EXISTS | TimetableScreen + parse-schedule Edge Function |
| P-05 | My Gear / Bag Prep | Keep as-is | 🟡 PARTIAL | equipment בתוך Timetable. Bag Prep flow עצמאי — לא קיים |
| P-06 | The Shop (rewards) | Keep + Expand | ✅ EXISTS | store_rewards + REWARD_PICKS by motivator+age |
| P-07 | Daily Win Bonus | Keep as-is | 🟡 PARTIAL | **Bonus Modal קיים** (amount + note → credit_vault + bonus_log). חסר branding כ"Daily Win" + i18n מוכן |
| P-08 | View as Child | Keep as-is | ✅ EXISTS | ModeContext מלא (enterChildPreview/exit) |
| P-09 | Stickers | Keep as-is | 🟡 PARTIAL | i18n מלא + Alert placeholder. חסר picker + UI לילד |
| P-10 | Approve / reject completions | Keep as-is | ✅ EXISTS | |
| P-11 | Auto-approve trusted | Keep as-is | ❓ לא נבדק | |
| P-12 | **Child-proposed missions** | **Must Have** | ❌ NOT EXISTS | חסר. key differentiator vs Joon |
| P-13 | **Child-proposed rewards** | **Must Have** | ❌ NOT EXISTS | חסר |
| P-14 | **PAUSE MODE** | **Must Have** | ❌ NOT EXISTS | **PRD: "top user insight, retention fix"** |
| P-15 | Reward pricing guidance | Must Have | ❌ NOT EXISTS | מחשבון יכולת רווח יומית |
| P-16 | Weekly Ignition Analysis | Keep as-is | 🟡 PARTIAL | useParentInsights קיים (InsightCard + PhaseInsight + TaskInsight). Weekly Ignition הספציפי — לא |
| P-17 | Trend Detector | Keep as-is | ❌ NOT EXISTS | |
| P-18 | Stage Performance | Keep as-is | ❓ לא נבדק | אולי כלול ב-useParentInsights |
| P-19 | Reflection Log | Keep as-is | ❓ לא נבדק | |
| P-20 | AI Insights | Phase 2 | ❌ Phase 2 | תואם תוכנית |

---

## חלק ג' — Child Features (Buddy Mode, 6-12)

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| C-01 | Daily Missions: one-task-at-a-time | Keep as-is | ❓ לא נבדק | |
| C-02 | Stage-based task flow | Keep as-is | 🟡 חלקי | categories קיימים, timing לא |
| C-03 | Mission completion + buddy animation | Keep as-is | ❓ לא נבדק | |
| C-04 | Focus Fuel Meter | Keep as-is | ❓ לא נבדק | |
| C-05 | **Buddy Evolution (4 stages)** | Keep as-is | ✅ **EXISTS** | egg/hatchling/scout/guardian @ 0/3/7/13 ימים. PetDisplay + EmojiPet + STAGE_THRESHOLDS |
| C-06 | **Pet Skins** | Keep as-is | 🟡 PARTIAL | סכמה + תרגומים מלאים. SWEET_SKINS (panda@30/capybara@50/unicorn@100) + HEROIC_SKINS. **חסר UI לבחירה/החלפה** |
| C-07 | Command Center | Keep as-is | ❓ לא נבדק | אולי ב-ChildSettingsScreen |
| C-08 | The Shop (redeem) | Keep as-is | ✅ EXISTS | |
| C-09 | My Progress + ticket wallet | Keep as-is | ❓ לא נבדק | |
| C-10 | **Rest Tickets** | Keep + Expand | ❌ NOT EXISTS | EmojiPet יש isResting prop (😴) אבל לא Ticket-system. PRD: "this is the daily disruption mechanism" |
| C-11 | My Gear / Bag Prep | Keep as-is | 🟡 PARTIAL | equipment בתוך Timetable |
| C-12 | **Cognitive Strategy Library** | Keep as-is | ❌ NOT EXISTS | PRD: "Unique educational layer" |
| C-13 | Day-Type Logic | Keep as-is | ❓ לא נבדק | |
| C-14 | Birthday Celebrations | Keep as-is | ❓ לא נבדק | |
| C-15 | Midnight Reset | Keep as-is | ❓ לא נבדק | |
| C-16 | **Propose mission to parent** | **Must Have** | ❌ NOT EXISTS | חסר |
| C-17 | **Propose reward to parent** | **Must Have** | ❌ NOT EXISTS | חסר |
| C-18 | Offline mode | Should Have | ❌ NOT EXISTS | |

---

## חלק ד' — Teen Features (Dashboard Mode, 13-15) — קטגוריה חסרה לחלוטין

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| T-01 | Clean dashboard (no buddy) | Keep + Expand | ❌ NOT EXISTS | **אין UI נפרד למתבגרים בכלל** |
| T-02 | Goals view | Keep + Expand | ❌ NOT EXISTS | |
| T-03 | Deal-making | Must Have | ❌ NOT EXISTS | |
| T-04 | Streak + grace mechanic | Keep + Expand | ❓ לא נבדק | |
| T-05 | Calendar heat-map | Should Have | ❌ NOT EXISTS | |

**הערה קריטית:** OPTIONS_BY_AGE כן מבחין בגיל (15-18 מקבל challenges שונים) — אבל ה-UI זהה לכל הילדים. מתבגר בן 16 רואה buddy כמו ילד בן 7. **זאת סתירה ישירה לפילוסופיה ב-PRD.**

---

## חלק ה' — System Features

| ID | פיצ'ר | PRD | מובייל | הערות |
|---|---|---|---|---|
| S-01 | Push Notifications (FCM) | Must Have | ❌ NOT EXISTS | ידוע ב-backlog |
| S-02 | Notification messages library | Keep as-is | ❓ לא נבדק | |
| S-03 | 15-Minute Rule | Keep as-is | ❓ לא נבדק | |
| S-04 | Dopamine Bridge | Keep as-is | 🟡 PARTIAL | מתבטא ב-pricing |
| S-05 | Parent Bonus +20 Buffs | Keep as-is | 🟡 PARTIAL | זהה ל-P-07 (Bonus Modal קיים) |
| S-06 | PWA Install | Remove | ✅ הוסר | תואם תוכנית |
| S-07 | **Daily Vibe Check** | Keep as-is | ❌ NOT EXISTS | **PRD: "Already fully implemented in current codebase" — לא נכון למובייל** |

---

## חלק ו' — קיים בקוד אבל לא ב-PRD המקורי 🆕

| פיצ'ר | מקור |
|---|---|
| 🆕 RevenueCat (purchaseService, useSubscription, PaywallScreen) | מומש בקוד, מתועד ב-SESSION_LOG |
| 🆕 Google OAuth | SESSION_LOG 28.4 |
| 🆕 LinkChildModal + useUnlinkedChildren | SESSION_LOG 29.4 — לפתרון empty state ילד-עם-קוד |
| 🆕 simulateSubscribed dev flag | useSubscription |

---

## חלק ז' — סתירות PRD ↔ החלטות 1.5

| נושא | PRD | החלטה 1.5 | פתרון |
|---|---|---|---|
| ⚠️ DB | Single Supabase + migrate | שני DBs נפרדים, לא נעבור | **PRD לא תקף — לעדכן** |
| ⚠️ Beta migration | Free-for-life למשתמשים שעמדו בקריטריון | מתחילים נקי | **PRD לא תקף — לעדכן** |
| ⚠️ Pricing | $0/$9/$19, ילדים 1/3/∞ | פתוח | **PRD תקף עד החלטה אחרת** |
| ⚠️ Founding Members | Beta users שעמדו בקריטריון | משתמשי 49 emails מהלוובל (אם רוצים) | **PRD לא תקף — לעדכן** |
| ⚠️ BUDDY V0 | 4 stages + 10 skins **קיימים בקוד** | "פשוט מאוד, דמות + 2 mood" | **ההחלטה מ-1.5 שגויה — Buddy Evolution כבר קיים בקוד.** צריך לבדוק UI לבחירת skin ולהשלים אם חסר |

**הערה חשובה:** ההחלטה מ-1.5 על "BUDDY פשוט" התקבלה לפני שידעתי שיש כבר 4 stages + skins בקוד. **זאת הזדמנות לתקן ל-MVP מלא יותר** במקום לבנות BUDDY מאפס.

---

## הצעדים הבאים — סדר מתוקן

### חובה לפני בילד MVP (גרסה מתוקנת על-פי הממצאים):

1. **לבדוק UI לבחירת/החלפת Pet Skin** (זה היחיד שחסר ל-Pet Skins מלאים)
2. **לחבר Daily Win Bonus** — קיים Bonus Modal + i18n + DB. רק לחבר ולעצב כ-"Daily Win"
3. **לתקן timing של משימות** — לפי Stage (החלטה מ-1.5)
4. **לתקן empty state ילד-עם-קוד** (החלטה מ-1.5)
5. **שפה מעצימה למשימות** (החלטה מ-1.5)
6. **Stickers** — להחליף Alert placeholder ב-picker + UI לילד
7. **לקבל החלטה על Teen UI** — קריטי בגלל 49 משתמשים מהלוובל. חלקם בוודאות עם ילדים 13+

### Should Have ל-MVP (אם נספיק):
- Daily Vibe Check (S-07)
- Rest Tickets (C-10)
- Push Notifications FCM

### דחייה ל-1.1:
- Pause Mode (P-14)
- Child-proposed (P-12, P-13, C-16, C-17)
- Reward pricing guidance (P-15)
- Cognitive Strategy Library (C-12)
- Calendar heat-map (T-05)

### Phase 2 (תואם PRD):
- AI Insights (P-20)
- Therapist sharing
- iOS App Store

---

## שאלות פתוחות — להחלטה הבאה

1. **תאריך יצירת המסמכים** — לא ידוע (כתוב "April 2026"). חשוב כי יקבע אם החלטות מאוחרות יותר עוברות אליהם
2. **Buddy Evolution + Skins ל-MVP או 1.1?** — קיים כמעט מלא בקוד. שווה להשלים?
3. **Teen UI ל-MVP?** — אם 49 משתמשים מהלוובל יוזמנו, חלק מהילדים שלהם 13+
4. **Pricing סופי** — $9/$19 (PRD) או לעדכן לישראלי?
5. **Daily Vibe Check ב-MVP?** — PRD אומר "fully implemented" אבל לא במובייל. אם חשוב — לבנות. אם לא — להוריד מ-PRD
6. **Rest Tickets ב-MVP?** — מנגנון disruption יומי. PRD: Must Have. במובייל: לא קיים

---

**סוף מסמך.**
