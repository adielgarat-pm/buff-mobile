# Lovable Migration (Self-Serve) — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**Type:** Feature (קוד + סכמה + UI)
**Trigger:** שיחת תכנון 2026-05-26 — נועה ענתה ש"רוצה רשימה של כל מה שקיים, ובזמן הטעינה לבחור הכל / חלק". אדי הרחיבה: רוב המשתמשות יעדיפו self-serve, אבל לשמור אופציית "עזרה מחבר" כדי לא לבודד.
**Origin:** נטיעה בזיכרון `project_lovable.md` (2 משתמשות פעילות צריכות לעבור), ו-`project_buff_anchor_theory.md` (אובדן היסטוריה = שבירת anchor → churn).

---

## Capabilities & Bottlenecks

> מה כל אחד מהצדדים יכול ולא יכול לעשות בחבילה הזו.

### מה Claude.ai (אני) יכולה
- לסקור diffs של CC ולוודא ש-copy עומד ב-Pillars (במיוחד Pillar 2 — celebratory framing).
- לתאם בין החבילה הזו ל-`launch-comms-2026-06-01` (מסרים מסונכרנים: "ההיסטוריה שלך עוברת איתך").
- להציף קונפליקטים עם `childjoin-claim-orphans` — שתי החבילות נוגעות באותו pattern של "orphan family + claim" וצריך לעצב משותף.

### מה Claude Code (CC) יעשה
- **Phase 0:** verification queries מול `gfrongfnyigxsexuofrg` — לאמת שיש orphan families, איפה ה-email נשמר, ושסכמת ה-snapshot תואמת לסכמה הנוכחית.
- **Phase 1:** schema migrations (`families.email_lookup`, `migrated_at`, `scheduled_delete_at`), backfill, ו-`claim_lovable_family()` SQL function.
- **Phase 2:** detection logic ב-onboarding + Screen 1 ("מצאנו אותך").
- **Phase 3:** Screen 2 (bundle selector + per-item expand + smart tags).
- **Phase 4:** WhatsApp share intent ל"עזרה מחבר".
- **Phase 5:** edge cases, error states, manual "כבר היית ב-BUFF?" כניסה מההגדרות.
- כל ה-tests (unit + integration).

### מה Adi חייבת לעשות בעצמה
- לאשר Phase 0 results לפני שעוברים ל-Phase 1 (מהי המציאות בסכמה?).
- לאשר schema changes לפני apply (לפי CLAUDE.md — schema הוא של אדי, גם אם ב-mobile DB אין משתמשי prod).
- לסקור copy ל-Hebrew RTL + תחושה (מי שכותבת copy בסוף — Claude.ai, אבל אדי מאשרת).
- Hat-3 verification מול אמולטור: לאיה-mock account → Screen 1 מציג נכון → 3 הנתיבים מסתיימים כראוי.
- לתאם עם נועה ושני: לאחר merge — לשלוח להן את הקישור החדש, לאסוף feedback.

### צוואר בקבוק / נקודות עצירה צפויות
- **Phase 0 fail:** אם ה-snapshot לא מכיל orphan families כפי שאני מניחה, או אין שדה email-matchable — עוצרים לפני Phase 1 ומשנים גישה (JSON upload-only?).
- **Schema overlap עם `childjoin-claim-orphans`:** שתיהן מכניסות "claim orphan" pattern. צריך החלטה אם לאחד את ה-RPC או לשמור שתי פונקציות נפרדות. **המלצה:** RPC אחד גנרי `claim_orphan_family(family_id, claim_type, options)` עם enum (`'child_join' | 'lovable_migration'`).
- **Email mismatch:** אם משתמשת נרשמה לגרסה החדשה ב-email שונה מ-Lovable, היא לא תיתפס אוטומטית. צריך fallback ידני ("כבר היית ב-BUFF? לחצי כאן") — אבל זה Phase 5, לא חוסם V0.

---

## Values Check

> 9 שאלות מ-`docs/BUFF_VALUES.md`. **חייבים לעבור על כולן לפני שCC כותב קוד.**
> נכשל באחת = עצירה ודיון, לא ממשיכים בשקט.

**הערה כללית:** זו חבילת onboarding להורה (לא לילד) — אבל ההשלכות על הילד עמוקות, כי מה שעובר הוא היסטוריה ש*הילד* בנה. הניתוח מחיל את הפילרים על שני הצדדים.

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?**
   ✅ כן. הילד לא רואה את המעבר ישירות — הוא חווה רציפות ("BUFF נראה אחרת אבל המשימות שלי והפרסים שלי עדיין כאן"). זה ההיפך מתגמול — זה כיבוד של ההון שכבר נצבר.
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?**
   ✅ עקיף — שמירת יתרת ה-BUFFs פירושה שהילד עדיין במרחק שבנה אל הפרס שלו (לאיה: 2,180/X לפרס הבא; מתן: 708/750 לעוגיות במטבח).
3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?**
   ✅ "אני רוצה" — ההורה בוחרת מתי וכמה להעביר; אין דדליין; "התחילי נקי" אפשרי. אין כפיה.

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?**
   ⚠️ **דגל:** הניסוח המוצע "8 משימות באנגלית, כנראה לא בשימוש" יכול להרגיש משפיל ("יש לי בלגן"). **mitigation שכבר ב-SPEC:** לנסח "8 משימות שמערכת BUFF הקודמת יצרה אוטומטית" — מסיט אחריות מהמשתמש אל המערכת.
   ⚠️ **דגל:** הצגת snapshot חתוך ב-04-09 — אם משתמשת עשתה פעילות אחרי, לא נראה אותה. צריך משפט הסבר: "ההיסטוריה כוללת את כל מה שצברת עד 9 באפריל. פעילות חדשה מהחודש האחרון תיווסף עם הזמן."
2. **אם הילד נכשל — האם התגובה היא empathy או pressure?**
   ✅ N/A ישיר לילד. אבל אם המעבר נכשל טכנית — error state חייב להיות empathic: "משהו לא עבד, ננסה שוב יחד" ולא "Error 500".
3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?**
   ✅ N/A — BUDDY לא חלק מה-snapshot שמועבר.

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?**
   ✅ עקיף — שמירת המבנה שכבר עבד (סדר יום, פרסים שהוגדרו יחד) מאפשרת לילד להמשיך להתרגל לאותה rhythm במקום לבנות מאפס. רציפות = independence-friendly.
2. **האם לילד יש קול בפיצ'ר?**
   ⚠️ **דגל:** ב-V0 ההורה לבד מחליטה. הילד לא נשאל "אילו משימות לשמור?". **מיתון:** ההורים שמעבירים הם בדיוק אלו ש*כבר* בנו את הרשימה עם הילד ב-Lovable, אז הקול שלו מקודד שם. ל-V1 לשקול: "התייעצי עם {שם הילד} לפני שתבחרי" tooltip.
3. **בעוד 6 חודשים, הפיצ'ר עדיין הכרחי או עשה את עבודתו?**
   ✅ **עושה את עבודתו ונעלם.** Migration הוא event חד-פעמי per משתמשת. אחרי שכל המשתמשות הקיימות עברו → הקוד יכול להישאר רדום או להימחק. דוגמה לפיצ'ר self-extinguishing טוב.

**Values Check Pass:** ✅ עובר עם 3 flags לזכור:
- **Pillar 2 flag 1:** copy של "כללי משפחה באנגלית" חייב להסיט אחריות אל "המערכת הקודמת", לא אל ההורה.
- **Pillar 2 flag 2:** הוספת משפט הסבר על חתך ה-snapshot (04-09) במסך 1.
- **Pillar 3 flag:** לתעד ב-`BUFF_GAP_ANALYSIS.md` שילד-קול ב-migration הוא V1 candidate.

---

## Goals

- משתמשת קיימת מ-Lovable, בהתחברות ראשונה לגרסה החדשה, רואה מסך יחיד שמזהה אותה ומציע: **העבר הכל / בחרי / התחילי נקי.**
- "העבר הכל" = tap אחד → כל המשימות + פרסים + יתרת BUFFs נטענות לחשבון החדש.
- "בחרי" = רשימה מקובצת (bundles), עם default = הכל מסומן, ועם expand-to-per-item לדיוק.
- "התחילי נקי" = onboarding רגיל; orphan family נמחק רך אחרי 30 יום.
- "אני צריכה עזרה" = WhatsApp share intent עם רשימה pre-filled (asynchronous, ללא קופיילוט חי).
- אפס אובדן data ל-bundle שבחרה.
- הקוד self-extinguishing — אפשר להסיר אחרי 6 חודשים.

## Non-goals

- ❌ סנכרון דו-כיווני חי עם Lovable (אין API ציבורי).
- ❌ העברת פעילות שאחרי 2026-04-09 (חתך ה-snapshot). V1 candidate.
- ❌ העברת `daily_progress`, `child_vibes`, `buddy_relationships`, `buddy_daily_check`, `pet_state`, `pwa_events` (לא ב-snapshot, ראו `lovable-exports/README.md`).
- ❌ Real-time co-edit בין הורה לחבר/בן-זוג ב-migration screen.
- ❌ migration למשתמשות net-new (שלא היו ב-Lovable) — הן נכנסות ל-onboarding רגיל.
- ❌ child voice במעבר (V1 candidate — `BUFF_GAP_ANALYSIS.md` flag).
- ❌ ממשק ניהול ל-Adi לראות מי עברה ומי לא (אם נדרש — חבילה נפרדת, `pkg/admin-migration-status`).

## Behavior Contract

> מה המערכת עושה end-to-end אחרי שהחבילה הזו נסגרת.

1. משתמשת מ-Lovable נכנסת לגרסה החדשה ב-email שלה.
2. ב-Supabase trigger / app-side check: בודקים אם יש `families` row עם `email_lookup = lower(auth.users.email)` ועדיין `auth_user_id IS NULL`.
3. אם יש — onboarding mounter מנתב ל-`LovableMigrationScreen1` במקום ל-Welcome רגיל.
4. Screen 1 מציג: שם משפחה, ילדים, וסיכום בכל ילד (X משימות / Y פרסים / Z BUFFs). 3 כפתורים.
5. "**העבר הכל**" → קורא `claim_orphan_family(family_id, 'lovable_migration', {all: true})` → מקשר `auth_user_id`, משאיר את כל הצאצאים, מסמן `migrated_at` → ניווט ל-Welcome רגיל.
6. "**בחרי**" → Screen 2: bundles עם checkboxes. expand → per-item. tap "המשך" → RPC עם `{checked_task_ids, checked_reward_ids, transfer_balance, ...}` → מוחק unchecked, משאיר checked, מקשר → Welcome.
7. "**התחילי נקי**" → confirmation modal ("ההיסטוריה תישמר 30 יום, נמחקת אחר-כך") → RPC עם `{all: false, scheduled_delete: true}` → יוצר family חדשה אמפטית מקושרת ל-auth.uid, מסמן orphan ב-`scheduled_delete_at = now() + 30d` → Welcome.
8. nightly cron (`lovable_snapshot_cleanup`) מוחק orphan families שעבר זמנן.
9. אם email לא נמצא ב-snapshot → onboarding רגיל (משתמשת לא רואה את המסך).
10. **Fallback ידני (Phase 5):** בהגדרות → "כבר היית ב-BUFF?" → טופס למילוי email Lovable → אם נמצא orphan, מציג את אותו Screen 1.

## Schema Changes

> טבלאות, columns, types, constraints. SQL-like notation, **לא** מיגרציה אמיתית — זה output של CC ב-Plan Mode.

```sql
-- families: לאפשר זיהוי orphan + ניהול lifecycle של claim
ALTER TABLE families ADD COLUMN email_lookup TEXT;
ALTER TABLE families ADD COLUMN migrated_at TIMESTAMPTZ;
ALTER TABLE families ADD COLUMN scheduled_delete_at TIMESTAMPTZ;
ALTER TABLE families ADD COLUMN migration_source TEXT;  -- 'lovable' | NULL לעתיד

CREATE INDEX idx_families_email_lookup ON families(email_lookup)
  WHERE auth_user_id IS NULL;  -- partial index, רק orphans

CREATE INDEX idx_families_scheduled_delete ON families(scheduled_delete_at)
  WHERE scheduled_delete_at IS NOT NULL;

-- backfill (Phase 1):
-- ערך email_lookup מהמקור שיתגלה ב-Phase 0 (אולי profiles.parent_email,
-- אולי metadata jsonb, אולי שדה חדש שצריך לאתר)

-- RPC משותף עם childjoin-claim-orphans (החלטה דרושה):
CREATE OR REPLACE FUNCTION claim_orphan_family(
  p_family_id UUID,
  p_claim_type TEXT,  -- 'lovable_migration' | 'child_join'
  p_options JSONB     -- migration choices
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
  -- 1. validate: family is orphan (auth_user_id IS NULL)
  -- 2. validate: email_lookup matches auth.email() (for lovable_migration)
  -- 3. atomically:
  --    - UPDATE families SET auth_user_id = auth.uid(), migrated_at = now()
  --    - DELETE tasks/rewards/etc not in p_options.keep_ids
  --    - IF p_options.start_fresh: skip claim, create new family, set scheduled_delete_at
  -- 4. return success summary
$$;

-- nightly cron (pg_cron):
SELECT cron.schedule(
  'lovable_snapshot_cleanup',
  '0 3 * * *',
  $$DELETE FROM families WHERE scheduled_delete_at < now()$$
);
```

**RLS:** הפונקציה `SECURITY DEFINER` עם בדיקה מפורשת ש-`auth.email() = families.email_lookup`. אחרי claim, RLS רגיל של families חל.

## Prompts Changes (אם רלוונטי)

> אילו prompts (DB rows + /docs/PROMPTS.md אם יש) משתנים, ומה ההתנהגות החדשה.

לא רלוונטי — אין שינוי prompts. (BUDDY V0.5 לא ב-snapshot, אז המעבר לא נוגע ב-prompts.)

## API / Route Changes

> Supabase functions / RN screens / navigation routes / hooks.

**New screens:**
- `app/onboarding/LovableMigrationScreen1.tsx` — detection result + 3-button choice
- `app/onboarding/LovableMigrationScreen2.tsx` — bundle selector + expand
- `app/onboarding/LovableMigrationConfirm.tsx` — "מעבירה..." loader

**New navigation:**
- Onboarding router: לפני `Welcome`, קורא `useLovableMigrationCheck()` hook. אם match → ניתוב ל-Screen 1.

**New hooks:**
- `useLovableMigrationCheck()` — קורא RPC `check_lovable_orphan(email)` → מחזיר `{found: bool, family_id?: UUID, summary?: {children: [...]}}`
- `useClaimOrphanFamily()` — wraps `claim_orphan_family` RPC

**New RPCs:**
- `check_lovable_orphan(email TEXT)` — read-only, returns summary without claiming
- `claim_orphan_family(...)` — defined in §Schema

**Route in הגדרות (Phase 5):**
- `app/settings/PreviousAccount.tsx` — fallback ידני ל-email מ-Lovable שלא נטען אוטומטית

## UI Changes

> מסכים, copy, components.

### Screen 1 — "מצאנו אותך"

```
[BUFF logo קטן בראש]

מצאנו את ההיסטוריה שלך 💛

לאיה (7)
  · 14 משימות
  · 5 פרסים
  · 2,180 BUFFs שצברה

[העבר הכל]              ← primary, large, BUFF mint
[בחרי מה להעביר]        ← secondary, outline
[התחילי נקי]            ← tertiary, text-link, smaller

ℹ️ ההיסטוריה כוללת את כל מה שצברתם עד 9 באפריל.
```

### Screen 2 — "מה להעביר?"

```
מה תרצי להעביר?

▼ לאיה (7)
  ☑ 14 משימות          [פתחי לעריכה]
  ☑ 5 פרסים            [פתחי לעריכה]
  ☑ יתרת 2,180 BUFFs

▼ הגדרות משפחה (8 משימות + 5 פרסים)
  ☐ משימות שמערכת BUFF הקודמת יצרה אוטומטית

[המשך]                    [אני צריכה עזרה]
```

### Screen 2 expanded — Tasks per child

```
משימות של לאיה

☑ 07:00  👕 התלבשות ונעליים  (15)
☑ 07:20  שירותים וצחצוח שיניים  (10)
☑ 07:30  לקחת שעון יד  (10)
☑ 07:30  ארוחת בוקר  (10)            💡 כפילות מזוהה
☑ 07:30  🍳 ארוחת בוקר ותרופות  (10)  💡 כפילות מזוהה
...
[בחר/בטל הכל]           [סגור]
```

### Confirmation modal — "התחילי נקי"

```
בטוחה שתרצי להתחיל נקי?

ההיסטוריה של לאיה תישמר אצלנו 30 יום.
אם תתחרטי, אפשר לשחזר דרך תמיכה.

[ביטול]    [כן, להתחיל נקי]
```

### WhatsApp share intent — "אני צריכה עזרה"

טקסט pre-filled שנפתח ב-WhatsApp:

```
היי, אני עוברת לגרסה חדשה של BUFF ויש לי בחירה להעביר ילד פריט-פריט.
זו הרשימה הקיימת — מה דעתך מה כדאי להעביר?

לאיה (7), צברה 2,180 BUFFs

משימות:
07:00  התלבשות ונעליים  (15 BUFFs)
07:20  צחצוח שיניים  (10)
07:30  לקחת שעון יד  (10)
07:30  ארוחת בוקר  (10)  ← כפילות
07:30  ארוחת בוקר ותרופות  (10)  ← כפילות
...

פרסים:
140  פטור ממטלה מעצבנת
280  ערב סרט ופופקורן
...

אעדכן אחרי שאחליט. תודה!
```

### Smart tags — heuristics

- 💡 **כפילות מזוהה** = שתי משימות עם אותו `time` ו-Jaccard similarity של title > 0.6
- 🕓 **לא נוצל ב-30 יום** = רק אם snapshot כולל `daily_progress` (Phase 0 לקבוע). אם לא — נשמיט.

## Open Questions

> דברים שCC חייב לפתור ב-Plan Mode. **לא לפתור מראש פה.**

1. **Email matching field:** איפה ב-snapshot שמור ה-email של בעלת ה-Lovable account? `profiles.parent_email`? `families.metadata jsonb`? אין? **Phase 0 חייב לענות.**
2. **RPC unification עם `childjoin-claim-orphans`:** האם RPC אחד גנרי עם enum, או שתי פונקציות נפרדות? המלצה: אחד, אבל מצריך תיאום עם אותה חבילה.
3. **Last-activity date ב-Screen 1?** האם להראות "פעילות אחרונה: 12 באפריל"? יותר כן/לא? **טריידאוף:** יותר אמון אבל יותר עומס מסך. ההמלצה: לא ב-V0, אולי ב-V1 אם משתמשות מתלוננות.
4. **Per-item editing depth ב-Screen 2 expand:** רק check/uncheck, או גם עריכת זמן/שם? **המלצה:** check/uncheck בלבד ב-V0. עריכה דרך App הרגילה אחרי המעבר.
5. **Family with multiple parents (e.g. שני הורים שניהם היו ב-Lovable):** מי שמתחבר ראשון תופס. השני רואה "החשבון כבר חובר". **או** — Add-Parent flow רגיל מאפשר לו להצטרף. ההמלצה: אופציה 2.
6. **Sentry breadcrumb:** האם לרשום ב-Sentry את ה-choice (`all`/`some`/`fresh`)? יש PII? **המלצה:** כן, ללא PII — רק enum.
7. **Email shared by both Lovable and Mobile (e.g. אדי במהלך בדיקות):** אם כבר יש family מקושר → מסתיר את המסך, מציג notice בהגדרות שיש snapshot orphan ניתן לטעון.
8. **קצב migration ב-claim RPC:** אם משפחה גדולה (50+ משימות), האם זה sub-second? צריך לבדוק על stress test.

## Out of Scope

> רשימה מפורשת. עוזרת לCC להישאר ממוקד.

- ❌ העלאת JSON עדכני מ-Lovable (V1 — תוסף ל-snapshot הקיים).
- ❌ Admin dashboard לאדי לראות מי עברה (חבילה נפרדת אם נדרש).
- ❌ Onboarding לילד אחרי המעבר (משתמש ב-Welcome הקיים).
- ❌ עריכת תוכן ב-Screen 2 (שינוי שם, זמן, קרדיט) — רק check/uncheck.
- ❌ Undo button אחרי "מעברתי" — אם רוצה לשנות, דרך App הרגילה (delete task/reward).
- ❌ נוטיפיקציות תזכורת ("עברת חצי, השלימי") — לא ב-V0.
- ❌ העברת BUDDY relationships, pet state, vibes, daily_progress — לא ב-snapshot.
- ❌ Animations מעבר מתוחכמות — V0 מספיקה ב-spinner פשוט.
- ❌ A/B testing על default choices — V0 ראיון איכותני עם נועה ושני.

---

## Phases summary (quick view)

| Phase | Scope | Exit criterion | Approval needed |
|---|---|---|---|
| 0 | Verification (read-only MCP queries) | Snapshot structure understood, email field identified | אדי מאשרת לפני Phase 1 |
| 1 | Schema + claim RPC + cron | Unit tests pass | אדי מאשרת schema |
| 2 | Detection + Screen 1 ("מצאנו אותך") | Test-account login shows Screen 1 with correct counts | אדי Hat-3 verifies |
| 3 | Screen 2 (bundles + expand + smart tags) | "בחרי" flow end-to-end על test account | אדי + Itay UX review |
| 4 | "עזרה מחבר" (WhatsApp intent) | share intent fires on Android device | אדי Hat-3 verifies |
| 5 | Edge cases + fallback "כבר היית ב-BUFF?" | All edge cases from §Open + §Out handled | merge + comms |

---

**Last reviewed:** 2026-05-26
**Owner:** Adi + Claude.ai (web spec) + Claude Code (implementation)
**Status:** Draft — pending Phase 0 verification
