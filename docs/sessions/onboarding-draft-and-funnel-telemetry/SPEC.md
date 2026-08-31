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
- **`src/lib/onboardingFunnel.ts`**: להוסיף `'onboarding_step_reached'` ל-`OnboardingEventType` (הרחבת type בלבד — הטבלה כבר מקבלת free-text). לשקול helper דק ל-dedup per-session.
- **`src/lib/onboardingDraft.ts` (חדש)**: `saveWizardDraft(userId, partial)`, `loadWizardDraft(userId)`, `clearWizardDraft(userId)` — עוטפים read/merge/update של `profiles.onboarding_data.wizard_draft`. fire-and-forget, never throws.
- **`src/navigation/types.ts`**: `UStep1` params מקבל `draft?: WizardDraft` (בנוסף ל-`prefillName`/`existingChildId` הקיימים).
- אין Supabase functions / RPC changes.

## UI Changes
- **UStep1..UStep6**: hook קטן `useStepReachedLog(stepId)` (mount-once-per-session).
- **UStep1_ChildProfile**: seed ראשוני של `childName/ageGroup/gender/birthDate` מ-`params.draft` אם קיים; קריאת `saveWizardDraft` ב-`onNext` (וכן בשלבים 2–4 ב-`onNext`, שם מצטברים `mainChallenge`/`motivators`).
- **UStep5_Preview**: `clearWizardDraft` אחרי `child_created` מוצלח.
- **ParentDashboardScreen**: באנר "המשך הגדרה" (component חדש `ResumeOnboardingBanner`, מדגם ה-`ResumeHandoffBanner` הקיים), מותנה ב-0-children + draft-exists + TTL.
- Copy: he.json / en.json — מפתחות חדשים לבאנר. **עידוד בלבד** (Values Pillar 2).

## Open Questions

> דברים שCC חייב לפתור ב-Plan Mode. לא לפתור מראש פה.

- **OQ1 (החלטת ארכיטקטורה — הכי חשוב):** בניתוח הצעתי במקור "להריץ `create_child_profile` כבר ב-Step 1".
  לאחר בדיקת הקוד זה **מסוכן**: ה-RPC מפעיל AFTER-INSERT triggers שזורעים buddy_relationships + default
  tasks/rewards + credit_vault, ו-UStep5 מוסיף משימות מבוססות-אתגר → סיכון לכפל משימות/נתונים חלקיים.
  לכן ה-SPEC בוחר בגישת **draft** (לא נוגעים ב-RPC/triggers). **צריך אישור Adi שזו הגישה הנכונה** לפני קוד.
- **OQ2 (resume depth):** v1 חוזר ל-UStep1 prefilled (ההורה מקליק מהר קדימה). deep-resume ישיר ל-`lastStep`
  אפשרי (הטיפוסים תומכים ב-params מצטברים) אבל מגדיל surface. v1 רדוד או deep מיד?
- **OQ3 (session-dedup store):** module-level `Set` (כמו capture) איפוס בכל app launch — מספיק? או צריך persistence ל-dedup חוצה-session (סיכון לכתיבת-חסר מול כתיבת-יתר)?
- **OQ4 (TTL):** 14 יום ל-draft banner — נכון? מעבר לזה הבאנר נעלם (הנתונים נשארים ב-jsonb).
- **OQ5 (AsyncStorage mirror):** להתחיל DB-only (parity-safe, שורד reinstall), או להוסיף mirror מקומי ל-resume מיידי באותו session? נטייה: DB-only ב-v1.

## Out of Scope

> רשימה מפורשת. עוזרת לCC להישאר ממוקד.

- קיצור/מיזוג שלבי האשף (נגזר מ-B, חבילה נפרדת).
- re-engagement push / email על draft נטוש.
- bucket "auth ללא פרופיל" (leak ~7–10%): משתמש כמו `1ea01415` — התחבר, אפס פרופיל, session 0 שניות. bootstrap guard/retry — חבילה נפרדת.
- ילדים יתומים `family_id=NULL` (3 מקרים) — `childjoin-claim-orphans` הקיים.
- העמודות המתות `onboarding_step` / `is_activated` (לא נכתבות בשום מקום בריפו) — ניקוי/החייאה בחבילה נפרדת.
- דליפת engagement "ילד נוצר אך לא השתמש" (55%) — מעבר ל-onboarding.

---

## Implementation Phasing

**Phase 1 — B (telemetry).** עצמאי, סיכון נמוך, נשלח ראשון. מוסיף `onboarding_step_reached` + `useStepReachedLog` + `scripts/onboarding-funnel.sql`. Exit: אירועים נכתבים על שני הפלטפורמות; שאילתת המשפך רצה.

**Phase 2 — A (draft + banner).** לאחר ש-B ירוץ מספיק כדי לרמז על שלב הנטישה. מוסיף `onboardingDraft.ts` + כתיבה/ניקוי draft באשף + `ResumeOnboardingBanner`. Exit: נטישה + פתיחה מחדש משחזרת prefilled, על שני הפלטפורמות; `child_created` מנקה draft.

Rationale: B קודם כי הוא מודד את הבעיה ש-A פותר, ומיידע את UX ה-resume (Step 1 vs Step 4 → resume רדוד מספיק או צריך deep).

## Exit Deliverables (per CLAUDE.md)
- עדכון canonical docs לפי `SPEC_SYNC.md` (GAP_ANALYSIS: לסגור/לעדכן את "no child added" leak; INTEGRATION_LEARNINGS: ממצא dead-columns + RPC-trigger constraint).
- שורה ב-`STATUS.md`: state, date, commit, tests, learnings link.
- Values Check מאומת מול ההתנהגות (copy הבאנר), לא רק מול ה-SPEC.
