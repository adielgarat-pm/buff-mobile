# הצעה — מסך Admin: Funnel + Family Deep-Dive (Tester Learning Mode)

**Status:** Proposal / אפיון (לא התחיל קוד)
**Created:** 2026-06-07
**Builds on:** `docs/sessions/admin-dashboard-port/SPEC.md` + `AUDIT.md` (Lovable port)
**Trigger:** 12 בודקים בחלון 14 יום. צריך עיניים על ההתנהגות שלהם *עכשיו*.

---

## 1. Context — למה זה, ולמה עכשיו

יש 12 בודקים שצריכים להישאר 14 יום עם האפליקציה. זה הרגע שבו יש לראשונה **משתמשים אמיתיים במובייל**, והמטרה היחידה היא ללמוד כמה שיותר מההתנהגות שלהם: איפה הם נתקעים, מה הם בחרו באונבורדינג, מה השאירו/הורידו/הוסיפו, ומי מהם עדיין פעיל ביום 3 / 7 / 14.

**מה כבר קיים (לא בונים מאפס):**
- `admin-web/` — אפליקציית Vite + React + shadcn נפרדת, עם Magic-Link auth + `is_admin()` RLS gate שכבר עובדים. ה‑Dashboard עצמו עדיין stub ריק (`admin-web/src/pages/Dashboard.tsx`).
- `admin_users` table + `is_admin()` function כבר ב‑DB, Adi כבר רשומה כאדמין.
- ה‑SPEC המקורי כבר תיעד את כל פיצ'רי האדמין של Lovable (funnel, KPIs, charts, family deep-dive, JSON export).

**מה ההצעה הזו משנה מול ה‑SPEC המקורי:** ה‑SPEC תוכנן ל‑scale (charts, KPIs, 8-12 שעות, 3-5 סשנים). בקוהורט של 12 — **גרפים ו‑KPI aggregates כמעט חסרי ערך** (n קטן מדי). מה שמייצר למידה הוא שני מסכים מבוססי‑*אנשים*, לא מספרים: (א) Funnel שמראה **מי** בכל שלב, (ב) כרטיס משפחה עם כל הנתונים כולל diff האונבורדינג. ההצעה ממקדת את הסשן הראשון בשני אלה ודוחה את ה‑charts.

---

## 2. תובנת מפתח מהנתונים (אומת מול ה‑DB החי, 2026-06-07)

ה‑DB של המובייל מכיל **204 משפחות** — אבל רובן ה‑snapshot המיובא של Lovable (283 פרופילים). **קוהורט הבודקים האמיתי במובייל מזוהה נקי** כך:

> ילד שב‑`profiles.pro_settings` יש מפתח `onboarding_data` = עבר אונבורדינג במובייל.
> פרופילי ה‑snapshot של Lovable **לא** מכילים את המפתח הזה.

שאילתה זו החזירה בדיוק את הבודקים — **11 משפחות** (כולל Adi, Buff Demo, ו‑buffapp הטסט):

| משפחה | ילדים | נרשם | משימות | challenge עיקרי |
|---|---|---|---|---|
| ParentTest520 | 1 | 06-07 | 5 | academic_perf |
| רחל סנאי | 2 | 06-06 | 10 | homework_focus, organisation |
| Jonathan D | 1 | 06-05 | 5 | calm_mornings |
| Shelly H | 1 | 06-04 | 10 | morning_routine (5 מתוכן הוצעו ע"י הילד!) |
| judith Galili | 1 | 06-01 | 5 | screen_balance |
| Tamar Belek | 1 | 05-31 | 8 | screen_balance |
| Shani Yitbark | 1 | 05-30 | 12 | organisation |
| Noa Morag | 1 | 05-26 | 14 | calm_mornings |
| ... | | | | |

זה אומר ש‑**ה‑funnel-as-people ישים מיידית** — אפשר לרשום שם הורה, ילד, מתי נרשם, ובאיזה שלב הוא תקוע, לכל אחד מ‑11–12 הבודקים.

### Gotchas שאומתו (חשוב לבנייה):
1. **`tasks.is_system_generated = 0` לכל המשימות** — הדגל לא נכתב באונבורדינג. ❗ לכן **אי אפשר** להסתמך עליו כדי לדעת "מה הוצע באונבורדינג מול מה שההורה הוסיף". את ה‑"kept/removed/added" צריך לשחזר מ‑`onboarding_data` (ראה §4.2).
2. **`tasks.proposed_by_child` כן עובד** — Shelly H למשל עם 5 משימות שהילד הציע. אות engagement חזק ששווה להבליט.
3. **אין `completed_at` בטבלת `tasks`** — השלמות חיות ב‑`daily_progress` (`completed`, `completed_at`, `revoked_at`, `child_id`, `date`). זה מקור האמת למעקב 14 יום ול‑"פעיל ב‑7 ימים אחרונים".
4. **אין שדה `is_test_account`** — סינון טסטים = לפי תבנית שם (`test`, `buffapp.`, `Demo`, וכו'). יש `is_deleted` ו‑`is_activated` בפרופיל.
5. ה‑DB משותף ל‑snapshot של Lovable → **כל שאילתות האדמין חייבות לסנן ל‑cohort** (`pro_settings ? 'onboarding_data'`), אחרת ה‑funnel יוצף ב‑200 משפחות לא רלוונטיות.

---

## 3. מבנה מוצע — 3 טאבים (במקום 6 של Lovable)

לקוהורט בודקים, מוצע shell מינימלי:

| Tab | תוכן | עדיפות |
|---|---|---|
| **Tester Board** (default) | Funnel-as-people + מעקב 14 יום | P0 — סשן 1 |
| **Family** (modal/drill-down) | כל נתוני המשפחה כולל onboarding diff | P0 — סשן 1 |
| **Pulse** (aggregates) | מספרי funnel, completions, charts | P1 — אחרי שיש מספיק data |

---

## 4. המסכים — אפיון מפורט

### 4.1 — Tab A: "Tester Board" (Funnel-as-people)

במקום funnel של מספרים, **טבלה אחת שבה כל שורה = בודק אחד**, וה‑funnel הוא העמודות. כך רואים גם את ה‑drop-off וגם *מי בדיוק* נתקע — מוכן ל‑CRM ידני (להרים טלפון לבודק).

**עמודות הטבלה (שורה לכל משפחה/ילד):**

| עמודה | מקור | הערה |
|---|---|---|
| הורה | `profiles` role=parent, `display_name` | |
| ילד/ים | `profiles` role=child, `display_name` | |
| נרשם לפני | `families.created_at` | "3 ימים" |
| **Stage** | מחושב | Signed up → Activated → Engaged → Active (ראה למטה) |
| משימות | count `tasks` | + תג אם יש `proposed_by_child` |
| השלמות 7 ימים | `daily_progress` `completed_at >= now()-7d` | מדד ה‑engagement האמיתי |
| פעיל לאחרונה | max(`daily_progress.completed_at`) | "היום" / "לפני 4 ימים" ⚠️ |
| **דגל** | מחושב | 🔴 Stuck / 🟡 Churn Risk / 🟢 Active |

**הגדרת ה‑Stages (זהה ל‑SPEC, מסונן ל‑cohort):**
- **Signed up** — יש משפחה.
- **Activated** — הוסיפו ≥1 ילד.
- **Engaged** — נוצרה ≥1 משימה.
- **Active (WAU)** — השלמה ≥1 ב‑7 ימים האחרונים (`daily_progress`).

**דגלי Attention (CRM triage):**
- 🔴 **Stuck in Onboarding** — נרשם >24ש', אין ילד.
- 🟡 **Churn Risk** — היה פעיל, אבל אין פעילות 4+ ימים.
- 🟢 **Active** — השלמה ב‑3 ימים אחרונים.

**Widget מעל הטבלה — "Day-by-day retention" (ייחודי לחלון ה‑14 יום):**
רשת קטנה של 14 עמודות (יום 1..14 מאז תחילת הבדיקה), שורה לכל בודק, תא ירוק אם הייתה השלמה ביום הזה. זה ה‑view היחיד שעונה ישירות על "מי שורד את 14 הימים" — בדיוק השאלה של הקוהורט הזה.

### 4.2 — Tab B: "Family Deep-Dive" (כל נתוני המשפחה)

לחיצה על שורה → modal עם כל מה שביקשת. חמישה אזורים:

**1. סיכום משפחה**
שם הורה, אימייל, שפה, תאריך הצטרפות, סטטוס pro/lifetime, מספר ילדים.

**2. כל ילד**
שם, גיל/age_group, gender, balance של BUFFs, streak, תאריך פעילות ראשונה/אחרונה.

**3. בחירות האונבורדינג** (מ‑`pro_settings.onboarding_data`)
- `mainChallenge` + `additionalChallenges` (האתגרים שבחרו)
- `motivators` (1-2 motivators → שמכתיבים את הפרסים)

**4. ⭐ Onboarding Task Diff — מה השאירו / הורידו / הוסיפו**
זה הלב של בקשת הלמידה. כיוון ש‑`is_system_generated` לא נכתב, משחזרים את הסט שהוצע:
- **הוצע** = הרצת `generateStarterTasks({ageGroup, gender, mainChallenge, additionalChallenges})` (קוד קיים: `src/screens/onboarding/unified/starterTasks/generateStarterTasks.ts`) על נתוני ה‑`onboarding_data` של הילד.
- **משימות נוכחיות** = `tasks` של הילד.
- **Kept** = משימה שהוצעה ועדיין קיימת (התאמת title).
- **Removed** = הוצעה ולא קיימת → *הבודק בחר להוריד אותה* (אות חזק על relevance).
- **Added** = קיימת אך לא בסט שהוצע → *הבודק הוסיף ידנית* (אות על מה באמת חשוב להם). מסומן בנוסף אם `proposed_by_child=true`.
- תצוגה: 3 עמודות (✅ נשארו / ❌ הורידו / ➕ הוסיפו) עם הכותרות.

**5. פרסים** (`store_rewards`)
title, emoji, size, `credits_needed`, `is_redeemed` — לראות אם הגדירו פרסים ריאליים ואם נוצלו.

**ייצוא JSON** (כמו ב‑Lovable) — כפתור שמוריד `family-{name}-{date}.json` עם children[], tasks[], rewards[], onboarding_data, timetable. שימושי לשיתוף נתוני בודק בודד לניתוח עמוק.

---

## 5. גישת בנייה (איך, לא רק מה)

**שתי אפשרויות לשכבת הנתונים:**

- **אופציה A (מומלץ לסשן 1): client-side queries עם RLS.**
  ה‑`is_admin()` policy כבר נותן ל‑Adi read לכל הטבלאות. הטבלה והמודאל יכולים לקרוא ישירות מ‑`profiles`/`tasks`/`store_rewards`/`daily_progress` עם `supabase-js` ב‑admin-web. אין צורך ב‑RPC חדש. מהיר להוצאה, מספיק ל‑n=12.
  - אתגר יחיד: ה‑Onboarding Diff (§4.2/4) צריך את לוגיקת `generateStarterTasks`. שתי דרכים: (1) להעתיק את ה‑pure helper ל‑admin-web (הוא לא תלוי ב‑RN), או (2) RPC ב‑Postgres. **מומלץ (1)** — reuse של קוד קיים, אפס שינוי schema.

- **אופציה B (לעתיד, כשעוברים ל‑Pulse/charts): RPCs** כמו ב‑Lovable (`get_admin_app_pulse_v2` וכו'). עדיף כשיש aggregations כבדות. לא נדרש ל‑12 בודקים.

**שינויי schema:** ❌ אין. הכל קריא מהקיים. (אם בעתיד נרצה לדעת מקור משימה בלי שחזור — אפשר להתחיל לכתוב `is_system_generated=true` באונבורדינג, אבל זה שינוי נפרד באפליקציה, מחוץ ל‑scope.)

---

## 6. Phasing מוצע

| # | Phase | פלט | זמן |
|---|---|---|---|
| 1 | **Tester Board** — טבלת funnel-as-people + retention grid (אופציה A) | רואים את כל 12 בשלב + פעילות 14 יום | ~60-90 דק׳ |
| 2 | **Family Deep-Dive modal** — סיכום, ילדים, onboarding choices, פרסים | כל נתוני המשפחה במקום אחד | ~60 דק׳ |
| 3 | **Onboarding Task Diff** — port של generateStarterTasks + diff view | kept/removed/added | ~45-60 דק׳ |
| 4 | **JSON export** | קובץ לכל משפחה | ~30 דק׳ |
| 5 | (P1) **Pulse tab** — funnel counts + completion trend | aggregates כשיהיה data | סשן נפרד |

**MVP-minimum לראות התנהגות בודקים:** Phases 1-3.

---

## 7. Values Check
זהה ל‑SPEC המקורי §6 — Admin הוא כלי ל‑Adi, לא נחשף לילד, אין extrinsic creep. עובר. תוספת אזהרה: ה‑"Removed tasks" יכול להתפרש כשיפוט על משפחה — אבל זה data למידה פנימי, לא דירוג, ולא נחשף.

---

## 8. Decisions (Adi, 2026-06-07)
1. ✅ **Scope סשן 1** — Tester Board + Family Deep-Dive + Onboarding Diff (Phases 1-3). ה‑Pulse/charts נדחים.
2. ✅ **Test accounts** — להציג **עם תג "test"** (Adi / Buff Demo / buffapp / ParentTest520), לא להסתיר.
3. ✅ **Deploy** — ישר ל‑Vercel / `admin.buffadhd.com`. דורש מ‑Adi: חשבון Vercel + env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) + custom domain. CC יכין את הקוד + `vercel.json`; ה‑connect של ה‑repo וה‑domain הם פעולות חשבון של Adi.

### עדיין פתוח:
- **תחילת חלון 14 יום** — יום 1 = `families.created_at` של כל בודק בנפרד (מומלץ, כי הם נרשמו בתאריכים שונים), או תאריך קבוע לכל הקוהורט? ברירת מחדל אם לא יוחלט: per-tester.
- **Onboarding Diff מקור אמת** — בינתיים שחזור מ‑`generateStarterTasks`. שדרוג עתידי אופציונלי: להתחיל לכתוב `is_system_generated=true` באונבורדינג (שינוי נפרד באפליקציה).

---

**End of Proposal.**

---

## 9. Build Status (2026-06-07 — BUILT, awaiting Vercel deploy)

Phases 1-3 implemented in `admin-web/`. Typecheck + production build pass.

**Backend:** `get_admin_tester_board()` RPC (migration `admin_tester_board_rpc`) — read-only, `is_admin()`-gated, SECURITY DEFINER. Returns the cohort (families with `pro_settings->'onboarding_data'`) with parent/children/tasks/rewards/completions.

**Frontend (new files under `admin-web/src/`):**
- `lib/types.ts`, `lib/api.ts` (raw-fetch RPC, avoids supabase-js Magic-Link deadlock), `lib/cohort.ts` (stage/flag/retention/funnel derivation), `lib/labels.ts`, `lib/starterTitles.ts`, `lib/onboardingDiff.ts`
- `lib/starterTasks/` — copied task templates (taskLibrary + onboardingData) for title matching, decoupled via `appTypes.ts`
- `hooks/useTesterBoard.ts`, `components/TesterBoard.tsx` (container + view), `RetentionStrip.tsx`, `badges.tsx`, `FamilyModal.tsx`
- `pages/Dashboard.tsx` wired to the board; `vercel.json` (SPA rewrites)

**Verified:** board renders (funnel 5→5→5→3, retention strips, 🟢/🟡/⚪ flags, TEST tag, kid-proposed badge); family modal renders full data + onboarding diff (checked against real cohort data via DB + live generator in browser).

### ⚠️ Two findings that changed the diff design
1. **Testers were onboarded with the OLD positional task source** (`STARTER_TASKS_BY_CHALLENGE`), not the new `generateStarterTasks` engine. Reconstructing the "offered" set via the current engine produced 0 matches — so the diff cannot reconstruct exact kept/removed/added by re-running the generator.
2. **Testers heavily personalize tasks** — e.g. Tamar's אלון: only 2 of 8 tasks match any known BUFF template; the other 6 are custom-worded ("מסכים כבויים עד 20:00", "להיכנס למיטה אחרי בקשה אחת"). Strong engagement signal, but it makes title-matching unreliable.

**Consequence:** the diff now honestly shows **"kept BUFF templates" vs "personalized / added"** (+ a personalization %), and states that **"removed" is not reconstructable** without ground truth. To recover true kept/removed/added for future cohorts: start writing `tasks.is_system_generated=true` (or snapshot the offered set) at onboarding — a separate app change.

### Update (2026-06-07, follow-up) — stage filter + child visibility
- **Cohort widened** (RPC `tester_board_cohort_union`): now `created_at >= 2026-05-20` **OR** has a mobile-onboarded child. This surfaces families that **signed up but never added a child** (previously invisible) — the real "stuck at signup" cases. Now 14 families incl. 3 childless (all test accounts so far).
- **Filter by where they're stuck:** funnel cards are clickable (filter to families *stuck exactly at* that stage; each card shows "N stuck here"); plus an "Attention" chip row (🔴 Stuck / ⚪ Not started / 🟡 Churn risk / 🟢 Active) with counts. Filters compose; "Clear filter" resets.
- **Child visibility:** child names shown as prominent `👤 name age` chips; families with no child show a bold amber **"⚠️ No child yet"** — so Adi knows the names before calling parents, and sees at a glance who hasn't added a kid.

### Adi's remaining steps (Vercel)
1. Connect the repo to Vercel, **root directory = `admin-web/`**.
2. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (mobile project).
3. Point `admin.buffadhd.com` at the deployment.
4. Magic-Link login as `adi.elgarat@gmail.com` (already in `admin_users`) → board loads live.
