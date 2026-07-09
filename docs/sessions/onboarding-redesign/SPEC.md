# Onboarding Redesign — Activation-First — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.
>
> **Slug:** `onboarding-redesign` · **נוצר:** 2026-07-04 · **בעלים:** Adi (PM) · **מעצב/מתאם:** Claude.ai · **מבצע:** CC
> **גרסה:** v2 (אחרי סבב סקירה אדוורסרי PM / Marketing PM / CSM — ראה §Reviewer Traceability)

---

## 0. Why this package exists (הבעיה, מבוססת דאטה)

הורים "לא טורחים לחבר את הילדים". חקרנו את ה-DB (production, RN era ≥ 2026-05-25) והשורש **אינו** תוכן המשימות — אלא **המסירה וההפעלה, בעיקר ב-web**:

| מדד (RN era) | Web | Android |
|---|---|---|
| משפחות שהוסיפו ילד | 9 | 11 |
| **ימים פעילים בממוצע** | **0.00** | **7.64** |
| **השלמות משימה סה"כ** | **0** | **597** |

⚠️ **N קטן — קרא לפני שקובעים יעדים.** 0 מתוך 9 משפחות web ≠ "0% ודאי" — רווח סמך 95% על 0/9 מגיע עד ~30%. כל היעדים המספריים בסעיף §Success Metrics הם **directional** עד שנצבור N מספיק (ראה Measurement Plan). מה שכן ודאי: **המנגנון שבור בקוד** (למטה), וזה מסביר את הכיוון.

**מנגנון הכשל (אושש בקוד):**
1. **`UStep7_Phone` שבור ב-web** — `Share.share()` no-op (אין share sheet), לינק ההזמנה `buff://join/CODE` (סכמה נייטיב-בלבד, מת ב-web, אין דף join ב-https), וענף "אעשה מאוחר" מתזמן `expo-notifications` = no-op שקט ב-web.
2. **אין רגע "first task"** — האונבורדינג נגמר בדשבורד ריק, לא בהשלמת פעולה.
3. **מדד ההצלחה שגוי** — מודדים דגל `onboarding_complete` (UStep8) + קיום ילד, לא פעילות. עיוורים בין "נוצר ילד" ל"פעיל".
4. **8 שלבים** — מחקר: טור 3-שלבים ~72% סיום, 7-שלבים ~16%.

**מה שכן עובד ולא נוגעים בו:** מחולל המשימות (`generateStarterTasks`) — אוסף גיל/קושי/מוטיבטורים ב-child `pro_settings` ומייצר מיקרו-משימות קונקרטיות מותאמות (נכס יתרון מול Lovable). **לא בסקופ לשנות תוכן/אלגוריתם.**

**עוגן מחקרי:** Duolingo — הרשמה אחרי הערך הראשון = +20% D1. Greenlight/GoHenry — מסירה הורה→ילד כשלב מדרגה-ראשונה עם אישור + כניסת ילד בלי לוגין. QR desktop→mobile — טוב רק כשיש 2 מסכים באותו חדר. Activation = milestone נמדד.

---

## 1. Decision Gates — סטטוס (נסגרו 2026-07-04)

> שלושת הסוקרים דרשו: אלה חוסמות אישור. להלן הסטטוס אחרי חקירה.

| # | Gate | סטטוס | ממצא |
|---|---|---|---|
| **DG1** | דיספוזיציית web | ✅ **נסגר (Adi):** web = **surface להתקנה/מסירה, לא הפעלת-ילד** | web PWA בלי push/session מתמשך לא מקיים לולאה יומית. ה-gate ל-web = **conversion להתקנה בטלפון הילד**, לא web-activation. מתואם עם [[project_web_to_native_cta]] (#316). first-task-together = לשיתוף-מכשיר. |
| **DG2** | RLS write ל-`daily_progress` | ✅ **נסגר — אין צורך בשינוי RLS** | policy *"Users can manage their progress"* = `ALL USING (family_id = get_my_family_id())`. **family-scoped, לא user-scoped** → הורה ב-View-as-Child וגם own-device child כותבים כל עוד family_id תואם. הכאב הקודם היה על `profiles.user_id` (טבלה אחרת). **אבל אין עמודת `source` ב-daily_progress** → נדרשת הוספה ל-tagging של seed (Phase 0). |
| **DG3** | https join surface (#301) | 🟡 **חלקי:** infra קיים, child-join עדיין דרוש | `landing-web/pages/Join.tsx` קיים אך הוא **referral hop** (`?ref=CODE`→RoleSelection, הרשמת הורה חדש) — לא child-join-by-code. `linking.ts` = `buff://` בלבד (https "not in MVP scope"). על web האפליקציה (www) ממפה paths → ייתכן ש-`www.buffadhd.com/join/:code`→ChildJoin עובד; **דורש אימות + עבודת #301** (autofill Install Referrer). QR/https delivery (Phase 3) חסום עד אימות. |
| **DG4** | QR + email | ✅ **נסגר:** QR = dep חדש; **email = אין sender** | אין ספריית QR ב-package.json (`react-native-svg` קיים) → QR = Improvement Package נפרד (approval). **אין נתיב email טרנזקציוני** (edge functions: insights/capture/schedule/push/rc/track — אף אחד לא שולח email; אין קוד שכותב `email_logs`). → **email reminder נדחה לחבילה עתידית; v1 = in-app banner בלבד** (כבר primary ב-v2). |

**מסקנה:** DG1+DG2+DG4 סגורים. DG3 חוסם רק את Phase 3 (QR/https delivery). **Phase 0 + Phase 1 + Phase 2 חופשיים להתקדם** (Phase 2 בלי חסם RLS).

**כלל:** אף phase לא נכנס ל-code לפני שה-Gate שלו סגור.

---

## Capabilities & Bottlenecks

### מה Claude.ai (אני) יכולה
- לתכנן זרימה, **Copy Table מלא (EN+HE)**, מדדי משפך + guardrails, ולתקף מול 3 העדשות.

### מה Claude Code (CC) יעשה
- RN screens (UStep1–8), hook מדידה + attribution, platform-split של מסירה, QR component (בכפוף DG4), email-reminder + in-app banner, מיגרציית `onboarding_events`, RLS spike, jest + tsc. אימות דו-פלטפורמי (Android emulator + Expo web).

### מה Adi חייבת לעשות בעצמה
- **DG1** (החלטת מוצר). אישור **Copy Table** סופי (Pillar-gated). אישור deploy דף join https + App Links (DG3). Hat-4 end-to-end (QR הורה→טלפון ילד→join→session, וידוא **הילד לא רואה מסך לוגין** [[feedback_kids_never_login]]).

### צוואר בקבוק / נקודות עצירה
- RLS write (DG2). דף join #301 (DG3). Web push לא קיים → email + in-app banner הם ה-loop ב-web. N קטן → זמן עד מובהקות.

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. **בלי תגמול וירטואלי?** כן — "המשימה הראשונה יחד" = חוויית "עשיתי", לא מטבע. BUFFs/חיה = עיטור.
2. **מקרב לפרס שהילד בחר?** כן — משימות מותאמות לקושי+מוטיבטור.
3. **"אני רוצה" ולא "חייב"?** כן — נצחון קטן מובטח, בלי gate כופה. **(ראה CSM #1: presence-gate מונע "תיאטרון הורה" שסותר את זה.)**

### Pillar 2 — Positive Coaching
1. **ניסוח משפיל/משווה?** לא — "בואו נתחיל יחד", "נטע מוכנה". אין השוואה, אין "פספסת".
2. **אם נכשל — empathy?** כן — הנודג' הזמנה עדינה, לא לחץ/ספירת כשל.
3. **מנגנון סבל/כעס של BUDDY?** לא.
4. **[חדש — ציר בושת ההורה]** נודג' Phase 4 חייב לעבור Values גם מול **ההורה**: "נטע עדיין לא התחילה" חוזר = guilt-drip. לכן cap 1–2 ואז עצירה + opt-out (§Failure & Re-engagement).

### Pillar 3 — Independence-Building
1. **מסוגל יותר בלי האפליקציה?** כן — מסירה למכשיר הילד + כניסה עצמאית בלי לוגין; משימות = הרגלי-חיים.
2. **לילד קול?** כן — first-task מזמינה בחירה/סימון עצמי; ממשיך proposed_by_child.
3. **בעוד 6 חודשים?** אונבורדינג חד-פעמי, בונה לולאה ומתפוגג.

**Values Check Pass:** [x] כן — בכפוף ל-presence-gate (Pillar 1) ול-cap/opt-out בנודג' (Pillar 2).

---

## Goals
- **G1** — מדד ההצלחה = **פעילות ילד אמיתית**, לא דגל UStep8 (הגדרה חד-משמעית ב-§Success Metrics, כולל הפרדת seed-row).
- **G2** — לתקן מסירת web (in-app banner + copy-link/WhatsApp שאפשר לכבד, ו-QR/https בכפוף DG3) → לשבור את ה-0%.
- **G3** — "משימה ראשונה יחד" עם **presence-gate**, פלטפורמה-אגנוסטי.
- **G4** — לקצר 8→≤5 שלבים **בלי לפגוע** בשדות ש-`generateStarterTasks` צורך.
- **G5** — למדוד את כל המשפך **כולל attribution** (source/variant) כדי להוכיח אימפקט וללמוד ערוץ.

## Non-goals
- לא לשנות אלגוריתם/תוכן מחולל המשימות.
- לא לשנות תמחור/paywall (רק לוודא שלא חוסם time-to-value).
- לא Web push חדש (fallback = email + in-app banner).
- **Referral parent→parent (ויראליות)** — **מחוץ לסקופ v1** (ראה §Out of Scope; מסירים את הטענה הקודמת שStep E מזריק referral — הוא handoff הורה→ילד, לא referral).

---

## Success Metrics (הגדרה חד-משמעית — עדשת PM/CSM)

**עיקרון-על (כל 3 הסוקרים):** *כל אישור נמדד רק אחרי שהפעולה אומתה שהגיעה לילד אמיתי.* לכן מפרידים seed מ-real.

### שני מדדים נפרדים — לא לבלבל
- **M-milestone (UX, צפוי גבוה):** נכתבה שורת first-task ב-Step D. **מתויגת `source='onboarding_first_task'`.** זה **לא** ה-North Star — זה אישור שהשלב עבד.
- **M-activation (Primary / North Star):** שורת `daily_progress` **שלא seed** — כלומר או (א) `source != 'onboarding_first_task'`, או (ב) ביום קלנדרי אחר מיום האונבורדינג, או (ג) child-authored אחרי handoff. **רק M-activation מגדיר הצלחה.**

**Presence-gate ב-Step D (CSM #1):** "האם {child} איתך עכשיו?" — כן → first-task-together (כותב seed, מתויג). לא → דילוג ישיר ל-handoff, **לא נכתבת השלמה**. seed לעולם לא מפעיל את M-activation לבד.

| מדד | הגדרה | Baseline | יעד (directional) | תפקיד |
|---|---|---|---|---|
| **M-activation@wk1** | daily_progress non-seed בשבוע-1, **מפוצל לפי platform-of-activation** | web 0% · android (הגדרה למטה) | web: לשבור 0% (gate); overall: guardrail | **Primary/North Star** |
| M-milestone | seed נכתבה ב-Step D | ∅ | גבוה | UX health |
| Add-child | משפחות עם ≥1 ילד | ~68% | ↑ (guardrail) | guardrail |
| Invite honored (web) | "העתקתי/שלחתי" עם אישור שאפשר לכבד | ∅ (שבור) | ≥90% מסתיים באישור | delivery |
| **Guardrails — אסור להידרדר** | child-authored completion · Day-7 retention · add-child · abandonment מ-Step D | — | לא לרעה | **חוסם ship** |

**Android baseline מדויק:** יש להגדיר ב-Phase 0 — מונה = משפחות android עם ≥1 שורת daily_progress non-seed; מכנה = משפחות android עם ≥1 ילד; חלון = 24ש'/7ימים. הערך "~60%/7.64 ימים" בסעיף §0 הוא indicative בלבד עד שנחשב פורמלית.

**Platform-of-activation split (Marketing P2):** web-signup→native-activation **נספר כ-native**, לא web. המדד מבחין בין הפלטפורמה שבה נכתבה שורת ה-daily_progress לבין פלטפורמת ההרשמה. אם DG1="move to native" — ה-gate ל-web הופך ל**conversion להתקנה**, לא web-activation.

### Measurement Plan (PM #1)
- **before/after, לא A/B** (אין נפח לזרועות). לרשום run-rate שבועי אמיתי של הרשמות web, לחשב זמן עד N מספיק לאפקט זיהוי.
- **Decision rule מראש:** "ship-to-all אם ≥X מתוך N הראשונים מפעילים (M-activation), ואף guardrail לא נסוג." X/N נקבע ב-Phase 0 מול ה-run-rate.
- כל שינוי מאחורי **feature flag** + שדה `variant` באירועים לבידוד cohort.
- עד N מספיק — המדד directional; זה מוצהר, לא מוסתר.

---

## Behavior Contract (הזרימה, end-to-end)

**זרם (≤5 שלבים עד משימות → Aha → מסירה):**

1. **Step A — הילד קודם:** שם + גיל + קושי ראשי + multi-select קליל של נוספים (מיזוג UStep2+3, **תוך שמירה על כל השדות ש-`generateStarterTasks` צורך** — ראה Guardrail G4). שם הורה רק אם חסר.
2. **Step B — מוטיבטור** (≥1).
3. **Step C — תצוגת משימות כפרס:** "בנינו {n} משימות ל-{childName}". יצירת פרופיל ילד + insert משימות. **אידמפוטנטי** (אין כפילות ילד/משימות ב-resume — [[childjoin-claim-orphans]] dup class). **Empty/thin fallback** אם המחולל מחזיר <2 (CSM #10): copy חלופי + הבטחת ≥1 משימה ברת-השלמה ל-Step D.
4. **Step D — 🌟 משימה ראשונה יחד (חדש):**
   - **presence-gate** ("איתך עכשיו?"). לא → דילוג ל-Step E בלי כתיבה.
   - כן → הילד/יחד מסמנים משימה → **קודם כתיבה מאומתת, ואז חגיגה** (CSM #2: הפוך את הסדר; לעולם לא קונפטי על כתיבה שנכשלה). כישלון → retry ידידותי + אירוע `first_task_write_failed`, בלי קונפטי.
5. **Step E — מסירה למכשיר הילד (platform-split + device-detection):**
   - **native / same-device:** "תמשיכו כאן" (shared-device) או share (buff:// עובד).
   - **web, single-device / mobile-web:** **מובילים בלינק https + WhatsApp/העתקה** (QR מודח לדסקטופ עם 2 מסכים — CSM #3). אישור מסירה: אם דף join חי (DG3) → "✓ נשלח"; אחרת → **"הלינק הועתק"** (טענה שאפשר לכבד).
   - **later = יציאה מכובדת (CSM #6):** אין dead-end. ההורה יוצא לדשבורד עם **באנר resume מתמשך** ("עדיין לא מסרת ל-{child} — שלח שוב"). Banner = ה-loop-closer הראשי (שורד spam), email = משני.

**Invariants:**
- כל אישור ("✓", קונפטי, banner) **מגובה בפעולה מאומתת** — אחרת מנוסח כטענה שאפשר לכבד ("הועתק"), לא כ"נשלח".
- ההורה **תמיד** יוצא עם handoff מאומת **או** תזכורת גלויה ובת-חידוש — לעולם לא מבוי סתום ולא tap כפוי.
- הכל תקף Android + Web ([[feedback_android_web_platform_parity]]); כל Alert דרך `crossAlert` ([[project_platform_layer_crossalert]]).
- כל copy דרך `t()` keys; רזולוציית שפה ב-Step D נבדקת תחת View-as-Child (מלכודת שם-לטיני/ילד-עברי [[project_child_language_latin_name_trap]], [[project_i18n_three_language_sources]]).

---

## Failure, Resume & Re-engagement Contract (עדשת CSM)

| מצב כשל | התנהגות |
|---|---|
| RLS חוסם כתיבת first-task | retry ידידותי, אירוע `first_task_write_failed`, בלי קונפטי; אם DG2 דורש שינוי RLS → migration נפרד עם approval |
| QR לא נסרק / מכשיר יחיד | להוביל לינק https + WhatsApp/העתקה; QR רק דסקטופ 2-מסכים |
| דף join לא חי (#301) | לא להציג "נשלח"; להציג "הועתק"; לחסום שלב עד Hat-4 |
| email ל-spam | **in-app dashboard banner** הוא הראשי (שורד spam); email משני |
| הפרעה/reload באמצע | לשמור progress, לחדש בשלב האחרון; Step C אידמפוטנטי; אירועים `onboarding_resumed`, `onboarding_abandoned_at_step` |
| מחולל מחזיר 0–1 משימות | Step C fallback copy + הבטחת ≥1 משימה ל-Step D |
| ילד רואה מסך לוגין ב-join | אסור — post-join = session מתמשך, אפס credential UI, autofill דרך Install Referrer; Hat-4 מאמת cold-install |

**Re-engagement (Phase 4):** **cap 1–2 נודג'ים ואז עצירה**; opt-out (email unsubscribe + in-app "אל תזכיר"); email דורש from/domain, תבנית HE+EN, unsubscribe (CAN-SPAM/GDPR, מוצר סמוך-ילדים). טון אמפתי, עובר Values מול ציר בושת-ההורה.

---

## ROADMAP (chunked, sizes, MVP cut-line)

| Phase | תוכן | Size | תלות |
|---|---|---|---|
| **Phase 0** | Instrumentation: `onboarding_events` + `useOnboardingFunnel` (`family_created` **עם attribution: source/landing_variant/utm**, `child_created`, `tasks_generated`, `invite_shown`, `invite_sent{method}`, `join_page_viewed`, `child_first_open`, `first_task_complete` עם `source` ו-`variant`). סגירת DG1+DG2. חישוב android baseline. **ללא שינוי UX.** | **S–M** | — |
| **Phase 1 (MVP core)** | מסירת web *כנה* בלי תלות #301: **in-app resume banner** + copy-link/WhatsApp (בר-כיבוד) + email-reminder (בכפוף DG4) עם cap/opt-out. שובר את ה-loop השקט. | **M** | DG4(email) |
| **Phase 2** | First-task-together (Step D) עם presence-gate + write-then-celebrate. הלוור הפלטפורמה-אגנוסטי. | **M** | **DG2 (RLS)** |
| **Phase 3** | QR + https-join delivery (מותנה #301 חי) + מיזוג שלבים UStep2+3 (בכפוף Guardrail G4). | **M–L** | **DG3 (#301)** |
| **Phase 4** | Re-engagement caps/opt-out (חלקו כבר ב-Phase 1 banner). | **S** | DG4 |

**MVP cut-line (PM #9):** **Phase 0 + Phase 1** = למדוד + לתקן את ה-loop השקט של web בלי תלות חיצונית. Phase 2 הוא הלוור הבא ברגע ש-DG2 סגור. אם צריך לחתוך — Phase 3/4 נדחים; Phase 0+1 עומדים לבד ונמדדים.

## Schema Changes (SQL-like)

```sql
-- Phase 0
create table public.onboarding_events (
  id            bigint generated always as identity primary key,
  family_id     uuid references public.families(id),
  child_id      uuid,
  event_type    text not null,   -- family_created|child_created|tasks_generated|invite_shown|
                                  -- invite_sent|join_page_viewed|child_first_open|first_task_complete|
                                  -- first_task_write_failed|onboarding_resumed|onboarding_abandoned_at_step
  method        text,            -- qr|https_link|whatsapp|copy|share|later_email
  source        text,            -- for first_task: onboarding_first_task | child_authored | organic
  variant       text,            -- feature-flag cohort
  acquisition   jsonb,           -- {utm_source, utm_campaign, landing_variant} on family_created
  platform      text,            -- web|android|ios (platform-of-activation for first_task rows)
  occurred_at   timestamptz not null default now()
);
-- RLS: family-scoped insert/select; service-role aggregation.
-- GRANT anon, authenticated explicitly — MCP-created tables לא יורשים ([[reference_mcp_table_grants]]).

-- daily_progress: להוסיף/לוודא הבחנת seed
-- אם אין עמודת source ב-daily_progress → להוסיף source text default null; seed = 'onboarding_first_task'.
-- (schema change על טבלה קיימת → apply_migration + flag existing-user impact — [[feedback_schema_change_gate]])
```

## API / Route / Hook Changes
- **New:** `useOnboardingFunnel()`; `FirstTaskTogether` (Step D, presence-gate); `ChildHandoff` platform-split (`.web.tsx` link/QR / `.native.tsx` share); dashboard resume banner. QR רק בכפוף DG4 (אין dependency בלי approval).
- **Changed:** `UStep5_Preview` → פיצול preview (C) מ-first-task (D). `UStep7_Phone` → `ChildHandoff`. `linking.ts` → https join prefix (תלוי #301).
- **Metric-of-record** עובר ל-M-activation; gate ניווט נשאר `onboardingComplete && hasChildren` אך לא מוגדר כ"הצלחה".

## UI / Copy Table (EN + HE — Pillar-gated, כל השורות דרך t())

| מקום | EN | HE | Pillar note |
|---|---|---|---|
| Step C reveal | "We built {n} missions for {child} 🎯" | "בנינו {n} משימות ל-{child} 🎯" | פרסונליזציה כפרס |
| Step C empty/thin | "Let's start {child} with one small win." | "בואו נתחיל את {child} מנצחון קטן אחד." | בלי אנטי-קליימקס |
| Step D presence | "Is {child} with you right now?" | "{child} איתך עכשיו?" | presence-gate |
| Step D invite | "Let's do the first one together." | "בואו נעשה את הראשונה יחד." | body-double, בלי BUFFs/count |
| Step D success (חיה) | "You started. That's the hard part. 🐾" | "התחלת. זה החלק הקשה. 🐾" | WHY/WHAT, body-double test |
| Step D write-fail | "Almost — let's try that once more." | "כמעט — ננסה שוב." | בלי בושה |
| Step E web lead | "Get BUFF on {child}'s phone" | "הביאו את BUFF לטלפון של {child}" | outcome-led |
| WhatsApp body | "{child}, your BUFF is ready — open it here: {link}" | "{child}, ה-BUFF שלך מוכן — פתחו כאן: {link}" | external brand surface |
| Confirm (join live) | "✓ Sent to {child}" | "✓ נשלח ל-{child}" | רק אם דף join חי |
| Confirm (fallback) | "Link copied" | "הלינק הועתק" | טענה בת-כיבוד |
| Resume banner | "You haven't handed BUFF to {child} yet — send the link" | "עדיין לא מסרת את BUFF ל-{child} — שלחו את הלינק" | dignified exit |
| Email subject | "{child}'s BUFF is waiting" | "ה-BUFF של {child} מחכה" | cap 1–2, unsubscribe |
| Nudge (Phase 4) | "{child} hasn't started yet — want to send it again?" | "{child} עדיין לא התחיל/ה — לשלוח שוב?" | אמפתי, לא guilt; ציר בושת-הורה |

> כל השורות טעונות אישור Adi לפני merge. RTL + failure/confirmation strings נבדקים ב-Hat-3 (Marketing P1, CSM #11).

## Open Questions (CC פותר ב-Plan Mode — לא Decision Gates)
- מיקום מדויק של presence-gate ב-nav stack.
- האם resume banner חי ב-ParentDashboard בלבד או גם ב-tab bar.
- פורמט אירוע `first_task_complete` כדי לאפשר join ל-`invite_sent.method` שהוליד אותו (attribution של שיטת מסירה→activation).

## Out of Scope
- אלגוריתם/תוכן מחולל המשימות · תמחור/paywall · Web push · Teen/Children Mode UI מעבר לנקודת first-task · **Referral parent→parent / win-card ויראלי** (חבילה עתידית נפרדת; הוסר claim מטעה מ-v1) · co-parent/multi-child onboarding עומק (רק שלא נשבר).

---

## Reviewer Traceability (איך v2 סוגר את הסקירה)

| # | Objection (PM/MKT/CSM) | תוקן ב- |
|---|---|---|
| PM1 | N קטן, אין measurement plan | §Success Metrics → Measurement Plan (before/after, decision rule, run-rate) |
| PM2/9 | sequencing, אין MVP/sizes | ROADMAP עם sizes + MVP cut-line (Phase 0+1) |
| PM3/5, CSM1, MKT-P2 | מדד self-satisfying (seed) | M-milestone vs M-activation + presence-gate + platform-of-activation split + guardrails |
| PM4 | יעדים לא נגזרים, "top-quartile" | הוסר; android baseline מוגדר פורמלית; web=gate, overall=guardrail |
| PM6, CSM2 | RLS פתוח | DG2 (spike לפני Phase 2) + write-then-celebrate + fail contract |
| PM7, CSM4 | תלות #301 | DG3 hard gate; confirmation מותנה דף join חי |
| PM8, DG4 | QR/email hand-wave | DG4; email compliance + in-app banner ראשי |
| PM10 | ≤5 שלבים כ-proxy | הודח ל-Phase 3 constraint + Guardrail G4 (שדות מחולל) |
| PM11, MKT-P0 | Q1 אסטרטגי | DG1 (Adi, ב-Phase 0) + פיוס עם web-to-native |
| MKT-P0 copy | copy hand-waved | Copy Table מלא EN+HE כולל WhatsApp/email/failure |
| MKT-P0 referral | referral נטען ולא סופק | הוסר מ-v1, מוצהר Out of Scope |
| MKT-P1 attribution | אין source/variant | `acquisition` jsonb + `variant` על האירועים |
| MKT-P1, CSM11 | bilingual/RTL checkbox | t() keys + View-as-Child language test + RTL ב-Hat-3 |
| MKT-P1 | seam דף join | `join_page_viewed` event + דף join כ-DG3 |
| CSM3 | QR single-device | device-detection; https/WhatsApp מובילים |
| CSM5/8 | email deliverability/shame | in-app banner ראשי; cap 1–2; opt-out; parent-shame Values axis |
| CSM6 | invariant לוכד הורה | "later" = יציאה מכובדת + resume banner |
| CSM7 | resume/idempotency | Failure contract: resume + Step C אידמפוטנטי + events |
| CSM9 | kids-never-login ב-join | Behavior invariant + Hat-4 cold-install verify |
| CSM10 | empty tasks ב-Step C | fallback copy + הבטחת ≥1 משימה |
