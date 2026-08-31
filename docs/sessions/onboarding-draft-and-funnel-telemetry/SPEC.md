# Onboarding Draft + Funnel Telemetry — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**Slug:** `onboarding-draft-and-funnel-telemetry`
**Branch:** `claude/stuck-registrations-analysis-nro55c`
**Origin:** Stuck-registrations analysis, 2026-08-31 (see `ANALYSIS.md` in this folder for the full data investigation).
**Package type:** A (resumable onboarding draft) + B (step-level funnel telemetry). Bundled because B de-risks and measures A.

---

## Problem (one paragraph)

In the trustworthy cohort (auth-linked parents, last 60 days) the onboarding funnel is:
**27 signed up → 25 created family (93%) → 20 added a child (80%) → 9 child actually used it (45%).**
The single biggest onboarding leak is **"family created, no child added" (~20%)**. Root cause is structural:
`family_created` fires automatically at signup (`AuthContext.tsx:631`), but the child is only persisted at
**Step 5 of a 5-step wizard** via the `create_child_profile` RPC (`UStep5_Preview.tsx:274`). Everything the
parent enters in Steps 1–4 (name, age, gender, birthday, goal, challenges, motivator) lives **only in
in-memory navigation params**. A parent who quits before Step 5 loses all of it, leaves an empty family, and
leaves **no trace of which step lost them** — the `onboarding_abandoned_at_step` event type is declared but
never fired. Evidence: the two most recent signups (Aug 29 & 30) each have exactly one event, `family_created`,
then nothing.

---

## Capabilities & Bottlenecks

### מה Claude.ai (אני) יכולה
- לאשר את גישת ה-draft מול גישת "להזיז את ה-RPC ל-Step 1" (החלטת ארכיטקטורה — ראה Open Questions).
- לאשר copy של באנר ה-resume מול BUFF_VALUES (Pillar 2 — עידוד, לא האשמה).

### מה Claude Code (CC) יעשה
- Phase 1 (B): להוסיף `onboarding_step_reached` על mount של כל שלב באשף, dedup per app-session; לכתוב `scripts/onboarding-funnel.sql` שמפיק את המשפך משלב-לשלב.
- Phase 2 (A): לשמור draft ל-`profiles.onboarding_data` בכל `onNext`; להוסיף באנר "המשך הגדרה" בדשבורד ההורה כשיש 0 ילדים + draft; לנקות את ה-draft ב-`child_created`.
- אימות דו-פלטפורמי: Android emulator + `npm run web`.

### מה Adi חייבת לעשות בעצמה
- אימות ויזואלי סופי של באנר ה-resume על Android אמיתי (Hat 4).
- אישור ה-copy הסופי של הבאנר.

### צוואר בקבוק / נקודות עצירה צפויות
- אין schema/RLS changes → **אין** צורך באישור Supabase schema (אומת: `onboarding_events` INSERT מתירני ל-family scope, `event_type` הוא free-text; `profiles.onboarding_data` ניתן לעדכון ע"י ההורה תחת policy "Users can update their own profile").
- N קטן (יחידות ספרות בשבוע) → המדידה תיקח זמן לצבור מובהקות. זו תשתית, לא A/B.

---

## Values Check

> 9 שאלות מ-`docs/BUFF_VALUES.md`. חייבים לעבור על כולן לפני שCC כותב קוד.

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?** — לא רלוונטי ישירות; זו תשתית onboarding בצד ההורה. עקיף: מוריד חיכוך כדי שהילד בכלל יגיע לאפליקציה.
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?** — עקיף: כן, כי הוא מגדיל את הסיכוי שההגדרה תסתיים והילד יתחיל.
3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?** — הבאנר להורה חייב להיות הזמנה ("המשך להגדיר את מאיה"), לא חובה/נזיפה.

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?** — **חד-משמעית לא.** copy הבאנר: עידוד ("כמעט סיימת"), אף פעם לא "נטשת/לא סיימת".
2. **אם הילד נכשל — האם התגובה empathy או pressure?** — אין ילד בלולאה הזו; זה צד ההורה בלבד.
3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?** — לא.

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר בלי האפליקציה?** — ניטרלי; מאפשר לילד להתחיל בכלל.
2. **האם לילד יש קול בפיצ'ר?** — לא רלוונטי (צד הורה).
3. **בעוד 6 חודשים — הכרחי או עשה את עבודתו?** — התשתית (telemetry) הכרחית לאורך זמן; ה-draft הכרחי כל עוד האשף בן 5 שלבים.

**Values Check Pass:** [x] כן — התלוי היחיד: copy הבאנר חייב להיות עידוד ולא האשמה (Pillar 2). CC מביא נוסח, Adi מאשרת.

---

## AI Token Cost

- **לא רלוונטי — אין קריאת LLM בחבילה הזו.** (telemetry + persistence בלבד.)

---

## Goals
- **G1 (B):** להפוך את שלב הנטישה באשף ל-queryable — לדעת אם מאבדים ב-Step 1 (שם/גיל), Step 3 (אתגרים) או Step 5 (preview/save).
- **G2 (A):** ששום הורה לא יתחיל מאפס. מי שנוטש באמצע — הנתונים שהזין נשמרים, ובפתיחה הבאה מוצע לו להמשיך.
- **G3 (A):** להפוך "משפחה ריקה" מ-dead end ל-recoverable state (בסיס ל-re-engagement push עתידי).
- **G4:** אפס schema/RLS changes; תאימות מלאה Android + Web.

## Non-goals
- לא לקצר את האשף מ-5 שלבים (החלטה נגזרת ש-B ימדוד קודם — חבילה נפרדת).
- לא re-engagement push/email (חבילה נפרדת; החבילה הזו רק מכינה את ה-state).
- לא לתקן את bucket "auth אבל אין פרופיל בכלל" (leak נפרד — ראה Out of Scope).
- לא לתקן ילדים יתומים `family_id=NULL` (חבילת `childjoin-claim-orphans` הקיימת).
- לא לגעת ב-`create_child_profile` RPC, ב-triggers, או ב-duplicate guard.

## Behavior Contract

> מה המערכת עושה end-to-end אחרי שהחבילה נסגרת.

**B — Step telemetry**
- על mount של כל שלב באשף (UStep1..UStep6) נכתבת שורה ל-`onboarding_events`:
  `event_type='onboarding_step_reached'`, `source='onboarding'`, `variant=<step id>` (למשל `'1_child_profile'`),
  `family_id` = משפחת ההורה, `child_id=NULL` (טלמטריית צד-הורה, עקבי עם `parent_tab_viewed`, Pillar 2).
- Dedup: כל `variant` נכתב **פעם אחת per app-session** (מודל ה-Set של `capture_entry_seen`), כדי ש-remount/חזרה אחורה לא ינפחו.
- שלב הנטישה נגזר: `max(step_reached)` למשפחה שאין לה `child_created` → משפך שלב-לשלב ב-`scripts/onboarding-funnel.sql`.

**A — Resumable draft**
- בכל `onNext` של שלב, ההורה עושה upsert ל-`profiles.onboarding_data` תחת מפתח ממודר:
  ```jsonc
  onboarding_data.wizard_draft = {
    childName, ageGroup, gender, birthDate,
    mainChallenge, additionalChallenges, motivators,   // מצטבר ככל שמתקדמים
    lastStep: '3_challenges',
    updatedAt: '<iso>'
  }
  ```
  כתיבה fire-and-forget (לעולם לא חוסמת/מפילה את הזרימה — אותה פוסטורה כמו `onboardingFunnel`).
- בפתיחת דשבורד ההורה: אם למשפחה **0 ילדים** ו-`wizard_draft` קיים (ולא ישן מ-TTL, ברירת מחדל 14 יום) →
  מוצג באנר עדין: *"המשך להגדיר את {childName} — כמעט סיימת"* + CTA. אין באנר אם יש כבר ילד או אין draft.
- לחיצה על ה-CTA → כניסה מחדש לאשף עם ה-draft מוזרק (v1: כניסה ל-UStep1 prefilled; ראה Open Question על deep-resume).
- ב-`child_created` מוצלח (UStep5) → `wizard_draft` מנוקה (`null`) כדי שלא יופיע שוב.

## Schema Changes

> **אין.** אומת:
- `onboarding_events`: policy `family insert own onboarding_events` — `with_check: family_id = get_my_family_id()`. `event_type` free-text → אין migration ל-event חדש.
- `profiles.onboarding_data` (jsonb, קיים): policy `Users can update their own profile` — `user_id = auth.uid()`. ההורה יכול לעדכן. אין column/constraint חדש.

## API / Route Changes
- **`src/lib/onboardingFunnel.ts`**: להוסיף `'onboarding_step_reached'` ל-`OnboardingEventType` (הרחבת type בלבד — הטבלה כבר מקבלת free-text).
- **`src/lib/onboardingDraft.ts` (חדש)**: `saveWizardDraft(userId, partial)`, `loadWizardDraft(userId)`, `clearWizardDraft(userId)`.
  ⚠️ **`saveWizardDraft` חייב read-modify-write** (או merge `||` בצד-שרת) על `profiles.onboarding_data` — `update({onboarding_data:{wizard_draft}})` נאיבי ידרוס את כל ה-jsonb וימחק מפתחות-אח עתידיים. fire-and-forget, never throws.
  ⚠️ **`loadWizardDraft` עושה read עצמאי** — `AuthContext.Profile` (`AuthContext.tsx:35-52`) **לא** חושף את `onboarding_data` (למרות `select('*')`), אז אין לשרשר דרך `useAuth().profile`.
- **`src/lib/onboardingStepReached.ts` / hook `useStepReachedLog` (חדש)**: מעטפת dedup — module-level `Set<familyId+step>`, איפוס per app process. **מעתיק מילה-במילה את `src/lib/parentCapture/entryTelemetry.ts:21-37`**.
- **`src/navigation/types.ts`**: `UStep1` params מקבל `draft?: WizardDraft` (בנוסף ל-`prefillName`/`existingChildId` הקיימים) — `types.ts:44`.
- אין Supabase functions / RPC changes.

## UI Changes
- **5 מסכי הזנת-הנתונים בלבד** — `UStep1, UStep2_Goal, UStep3_Challenges, UStep4_Motivator, UStep5_Preview` — מקבלים `useStepReachedLog(stepId)` (mount-once-per-session). **לא** UStep6/ChildAccess/UStep8 (הם אחרי `child_created`, מחוץ ל-leak). הערה: אין רצף 1–6 רציף; המספור הפנימי כבר מתפצל (`UStep5_Preview.tsx:41` = `STEP=4;TOTAL=6`) — `stepId` הוא label יציב (`'1_child_profile'`...), לא נגזר מהמספור.
- **UStep1_ChildProfile**: seed ראשוני של `childName/ageGroup/gender/birthDate` מ-`params.draft` (היום seed רק ל-`childName` דרך `prefillName`, `UStep1:50-53`); קריאת `saveWizardDraft` ב-`onNext`. שלבים 2–4 קוראים `saveWizardDraft` ב-`onNext` שלהם (שם מצטברים `mainChallenge`/`additionalChallenges`/`motivators`).
- **UStep5_Preview**: `clearWizardDraft` **רק** בענף `child_created` המוצלח (`UStep5_Preview.tsx:273-275`) — לא בענפי `existingChildId`/retry.
- **ParentDashboardScreen**: באנר "המשך הגדרה" (component חדש `ResumeOnboardingBanner`, מדגם ה-`ResumeHandoffBanner` הקיים). תנאי render: **`childrenCount === 0 && draftFresh`** — הגייטינג ה-authoritative הוא 0-ילדים (עצמאי מהצלחת ה-clear, כך ש-draft ישן אחרי clear שנכשל בכתיבת fire-and-forget נשאר לא-מזיק).
- Copy: he.json / en.json — מפתחות חדשים לבאנר. **עידוד בלבד** (Values Pillar 2).

## Decisions (Architect review, 2026-08-31 — Plan agent)

> ה-Open Questions הוכרעו לאחר סקירת ארכיטקט מול הקוד. **עדיין ממתין לאישור Adi על הכיוון הכולל.**

- **OQ1 → גישת draft, מאושרת (חוזקה).** מעבר ל-triggers: ה-idempotency guard ב-`UStep5_Preview.tsx:302-307` מדלג על הזרעת המשימות מבוססות-האתגר כאשר `existingTaskCount > 0`. יצירת ילד ב-Step 1 → ה-triggers זורעים משימות דיפולט → ה-guard **ידלג בשקט** על המשימות המותאמות (אתגר/מוטיבטור, שעדיין לא ידועים בשלב 1). כלומר יצירה מוקדמת לא רק מכפילה — היא **מבטלת את ההתאמה-אישית** שהאשף קיים כדי לאסוף. child creation נשאר ב-Step 5, ללא שינוי.
- **OQ2 → v1 רדוד (UStep1 prefilled).** deep-resume לא בטוח ב-v1: טיפוסי ה-params הם required+non-null, אז אי-אפשר לבנות params חוקיים ל-`UStep4` מ-draft חלקי של הורה שנטש ב-Step 2; בנוסף back-stack שבור. לבחון deep-resume רק אם B יראה clustering ב-Step 4.
- **OQ3 → module-level `Set`, איפוס per app launch.** persistence חוצה-session תסתיר נטישה חוזרת — בדיוק האות שהמשפך צריך.
- **OQ4 → 14 יום, נשאר.** הנתונים שורדים ב-jsonb מעבר לחלון; רק הבאנר מוסתר.
- **OQ5 → DB-only ב-v1.** parity-safe, שורד reinstall; resume באותו-session כבר מכוסה ע"י nav params חיים. mirror מוסיף נתיב-כתיבה שני ללא תועלת ב-v1.
- **Phasing → "B קודם" נכון.** B עצמאי ואפס-סיכון, ופלטו (איזה שלב מדמם) הוא הקלט שמכריע את עומק ה-resume ב-OQ2. Precondition: `useStepReachedLog` צריך `familyId` — קיים כבר ב-UStep1 (משפחה נוצרת ב-signup), אין hazard סדר.
- **Web מרוויח מ-A יותר מסתם parity:** ב-Expo Web refresh/סגירת-טאב באמצע האשף מוחקת את כל ה-nav params — בדיוק מקרה הנטישה — ואין push לשחזור. ה-draft חשוב **יותר** ב-web.

## Open Questions

> כל ה-OQ המקוריים הוכרעו ב-Decisions למעלה. נותרה **החלטה אחת ל-Adi**:
- **האם לאשר את כיוון החבילה כולו** (draft + telemetry, ללא נגיעה ב-RPC), ולפתוח PR / להתחיל Phase 1.

## Out of Scope

> רשימה מפורשת. עוזרת לCC להישאר ממוקד.

- קיצור/מיזוג שלבי האשף (נגזר מ-B, חבילה נפרדת).
- re-engagement push / email על draft נטוש.
- bucket "auth ללא פרופיל" (leak ~7–10%): משתמש כמו `1ea01415` — התחבר, אפס פרופיל, session 0 שניות. bootstrap guard/retry — חבילה נפרדת.
- ילדים יתומים `family_id=NULL` (3 מקרים) — `childjoin-claim-orphans` הקיים.
- העמודות המתות `onboarding_step` / `is_activated` (לא נכתבות בשום מקום בריפו) — ניקוי/החייאה בחבילה נפרדת.
- דליפת engagement "ילד נוצר אך לא השתמש" (55%) — מעבר ל-onboarding.
- **נטישת "ילד שני"**: הבאנר גייטד על 0 ילדים, אז הורה שנטש בהוספת ילד נוסף לא מקבל resume, וה-draft עלול לשאת `childName` ישן. מקובל ל-v1, מצוין מפורשות.
- **אימות אינטראקציית triggers×idempotency** (רלוונטי רק אם אי-פעם חוזרים ליצירה-מוקדמת): לוודא אם ה-AFTER-INSERT triggers של `create_child_profile` באמת מכניסים ל-`tasks` (מול buddy/vault בלבד). לא בסקופ (draft לא נוגע), אבל להירשם ב-INTEGRATION_LEARNINGS.

---

## Implementation Phasing

**Phase 1 — B (telemetry).** עצמאי, סיכון נמוך, נשלח ראשון. מוסיף `onboarding_step_reached` + `useStepReachedLog` + `scripts/onboarding-funnel.sql`. Exit: אירועים נכתבים על שני הפלטפורמות; שאילתת המשפך רצה.

**Phase 2 — A (draft + banner).** לאחר ש-B ירוץ מספיק כדי לרמז על שלב הנטישה. מוסיף `onboardingDraft.ts` + כתיבה/ניקוי draft באשף + `ResumeOnboardingBanner`. Exit: נטישה + פתיחה מחדש משחזרת prefilled, על שני הפלטפורמות; `child_created` מנקה draft.

Rationale: B קודם כי הוא מודד את הבעיה ש-A פותר, ומיידע את UX ה-resume (Step 1 vs Step 4 → resume רדוד מספיק או צריך deep).

## Test Plan

> רמת סיכון: Phase B 🟢 נמוך-מאוד · Phase A 🟡 נמוך-בינוני (3 נקודות: כתיבת draft לא חוסמת ניווט · גייטינג הבאנר לא נוגע בהורים קיימים · RMW לא דורס jsonb).

**E2E אוטונומי מלא — בלי OAuth.** אומת בקוד: `SignupScreen` → `signUp` → `supabase.auth.signUp({email,password})`, וההמשך משתמש ב-`authData.user` **מיידית** ללא המתנה לאישור-מייל (`AuthContext.tsx:532+`) → autoconfirm בפועל. לכן CC יכול ליצור הורה-בדיקה עם אימייל+סיסמה ולרוץ מקצה-לקצה על **אמולטור וגם web**, בלי Adi.

**היגיינת חשבונות-בדיקה (חשוב — זו buff-production):** אימיילים מתויגים בבירור (למשל `e2e+<slug>@bufftest.dev`), וניקוי אחרי כל ריצה דרך Supabase MCP (מחיקת auth.users + profiles/families/onboarding_events של אותו slug). להירשם ב-STATUS מה נוצר/נמחק.

### Hat 1 — סטטי + Jest (100% אוטונומי, נכנס ל-CI)
- `tsc` typecheck (union `OnboardingEventType`, טיפוסי params/prefill).
- Jest חדשים: `onboardingDraft` (save=merge, load, clear-only-on-success, TTL) · `useStepReachedLog` (fires-once/session/step) · פונקציית גייטינג הבאנר (0-kids+fresh→show; has-kid→hide; stale→hide; no-draft→hide).
- רגרסיה: כל בדיקות ה-onboarding הקיימות עוברות.

### Hat 3 — Android emulator (adb, אוטונומי; דורש lease דרך buff-emulator)
כל התרחישים על **הורה email+password חדש**:
1. Happy path מלא → ילד נוצר, משימות נוצרו, draft נוקה, ואחריו **אין** באנר.
2. נטישה בכל שלב (1/2/3/4) → פתיחה מחדש → באנר → prefilled → סיום → ילד נוצר.
3. **הורה קיים עם ילדים → דשבורד בלי באנר** (no-regression קריטי).
4. מסלול שם-כפול ב-Step 5 עדיין עובד עם draft בתמונה.
5. אין חסימת-ניווט בין שלבים (כתיבת draft fire-and-forget).

### Web — `npm run web` (אוטונומי)
- Happy path + **המקרה הקריטי:** התחלת אשף → **refresh לדפדפן באמצע** → פתיחה מחדש → הבאנר משחזר (ב-web ה-params מתים).
- רינדור הבאנר תקין ב-web.

### אימות DB — Supabase MCP (אחרי כל ריצה)
- שורות `onboarding_step_reached` נכתבו + הרצת `scripts/onboarding-funnel.sql`.
- `onboarding_data.wizard_draft` נכתב → נוקה.
- **מבחן RMW:** שתילת מפתח-אח ב-`onboarding_data` ואימות שהוא **שורד** שמירת draft.

### Hat 4 — רק Adi
- ליטוש ויזואלי סופי של הבאנר על Android אמיתי · הרשמת Google OAuth אמיתית מקצה-לקצה.
- **לא ניתן לבדיקה אוטונומית:** TTL על פני ימים אמיתיים · ריצה חוצת-מכשירים · OAuth production.

## Exit Deliverables (per CLAUDE.md)
- עדכון canonical docs לפי `SPEC_SYNC.md` (GAP_ANALYSIS: לסגור/לעדכן את "no child added" leak; INTEGRATION_LEARNINGS: ממצא dead-columns + RPC-trigger constraint).
- שורה ב-`STATUS.md`: state, date, commit, tests, learnings link.
- Values Check מאומת מול ההתנהגות (copy הבאנר), לא רק מול ה-SPEC.
