# `pkg/anchor-recovery` — SPEC

**Status:** `draft — awaiting Adi review; ready to spawn a CC session once approved`
**Slug:** `pkg/anchor-recovery`
**Branch:** `pkg/anchor-recovery` (off `main`)
**Source:** 2026-05-23 research session (war non-return analysis + Anchor Theory)
**Builds on:** `pkg/daily-vibe-check` (shipped) — adds credit + inactivity-trigger
**Drafted:** 2026-05-23 by Claude.ai

---

## Why this exists

The 2026-05-23 research session analyzed BUFF activity through the Israel-Iran war (28.2 → ~9.4) and afterward. Findings stored in memory ([[buff-war-non-return]], [[buff-anchor-theory]], [[buff-elgarat-test-case]]):

- **79% of pre-war active kids never returned** in the 6 weeks after the war ended (11 of 14)
- **Only 3 iron-men survived** — all had at least one **standalone bulletproof anchor** (medical/biological/autonomy task that doesn't depend on school context)
- **11 churners all lacked any standalone bulletproof anchor** — their task lists were school-shape-only, so when school broke, the entire graph became meaningless
- **No spontaneous re-acquisition mechanism exists** — once the habit breaks, parents don't restart, even when school returns

The product gap: BUFF V0 has nothing that detects "this kid hasn't been active in a while" and offers a gentle path back. Parents under low-bandwidth conditions (war, vacation, illness, holiday, work stress) don't think to add anchors themselves.

This package adds **one focused intervention point** — inactivity detection + parent prompt — that surfaces two recovery options (Vibe Check anchor, Medication anchor) when the habit chain breaks.

**Constraint set by Adi:** *No changes to onboarding.* The onboarding lightness is sacred. All anchor-recovery happens post-onboarding via gentle, dismissible prompts.

---

## Capabilities & Bottlenecks

### מה Claude.ai (אני) יכולה
- לקרוא קוד buff-mobile + Lovable JSON exports + Supabase via MCP
- לעצב SPEC + לרוץ Values Check
- להכין שאילתות חקירה (UGC library, daily_goal sanity, inactivity stats)

### מה Claude Code (CC) יעשה
- לכתוב Edge function או pg_cron query לזיהוי inactivity
- ליצור מסך/modal של Parent Anchor Recovery Prompt
- להוסיף credit logic ל-VibeCheckScreen (cap 1/day)
- לסדר מחדש את ParentTasksScreen template list (תרופה ראשונה)
- לכתוב migrations אם נדרשות
- לעדכן canonical docs לפי SPEC_SYNC

### מה Adi חייבת לעצמה
- לאשר את ה-Open Questions (אם לא "מקבלת את כל ההמלצות")
- להחליט על threshold של inactivity (3/5/7 ימים)
- אישור על copy של ההצעה להורה (sensitive — Pillar 2 risk)
- אישור על schema changes אם נדרש
- בדיקה ידנית באמולטור של flow ההצעה

### צוואר בקבוק / נקודות עצירה צפויות
- **Notification path uncertain:** האם push כבר עובד? (pkg/fcm-push-notifications נפרד)
- **Inactivity logic timing:** pg_cron יומי? Edge function שמופעל מהאפליקציה?
- **"Standalone anchor" detection:** איך מזהים heuristically אם כבר יש לילד anchor? (לפי title? קטגוריה? credits standalone?)
- **Multi-kid families:** trigger per-kid או per-family?

---

## Values Check

### Pillar 1 — Intrinsic Motivation

| Q | Answer |
|---|---|
| 1 — האם הילד היה רוצה גם בלי תגמול וירטואלי? | ✅ הפרומפט הוא להורה, לא לילד. הילד לא מקבל לחץ. אם הוא חוזר — זה מבחירה. ה-5 BUFFs על Vibe Check הוא הכרה ברגש שלו, לא סחיטה. |
| 2 — קרוב יותר לפרס שהילד בחר? | ✅ ה-5 BUFFs מצטרפים ל-credit_vault הקיים — מקרבים לפרס שכבר נבחר. אין currency חדש או lock-in. |
| 3 — "אני רוצה" ולא "אני חייב"? | ✅ אין משימה כפויה. ההורה מציע, הילד מבצע אם רוצה. אין re-prompt או streak. |

### Pillar 2 — Positive Coaching

| Q | Answer |
|---|---|
| 1 — האם הניסוח אי-פעם משפיל / משווה / מציג כשל? | 🟡 **CRITICAL RISK** — copy של ההצעה להורה חייבת לא להגיד "[ילד] לא הצליח", "פיספס X ימים", "מאחור". תמיד "שמנו לב ש-X לא היה פעיל לאחרונה, רוצה להציע התחלה רכה?" Adi approval מפורש על ה-copy לפני קוד. |
| 2 — אם הילד נכשל, התגובה היא empathy או pressure? | ✅ הפיצ'ר עצמו הוא empathy — מזהה שיש פאוזה, מציע התחלה רכה. אין pressure. |
| 3 — מנגנון "סבל / איבוד / כעס" של BUDDY? | ✅ אין. BUDDY לא "עצוב כי לא היית". המנגנון פנימי לחלוטין (Edge function → notification להורה), לא חוויה ילדית. |

### Pillar 3 — Independence-Building

| Q | Answer |
|---|---|
| 1 — מסוגל יותר *בלי* האפליקציה? | ✅ Vibe Check מלמד metacognition ("איך אני מרגיש?"). תרופה anchor מלמדת self-care קבועה. שתיהן skills מחוץ ל-BUFF. |
| 2 — לילד יש קול? | ✅ Vibe Check הוא הקול עצמו. ההורה מציע — הילד מבצע אם רוצה. |
| 3 — בעוד 6 חודשים עדיין הכרחי? | 🟡 ה-Vibe Check הופך אופציונלי כשהשגרה חוזרת. ה-anchor של תרופה משמעותו תלויה ביכולת הילד לקחת תרופה ללא תזכורת בעתיד. שני המקרים: scaffold שמתפוגג. ✅ |

**Values Check Pass:** [ ] כן / [ ] לא — **תלוי באישור Adi על copy** (Pillar 2 Q1). אחרת ✅.

---

## Goals

1. **Inactivity Detection** — מערכת אוטומטית שמזהה ילדים שלא היו פעילים ב-X ימים רצופים (X = TBD per OQ1)
2. **Parent Anchor Recovery Prompt** — מסך/notification להורה עם 2 הצעות:
   - **Vibe Check אנקור זמני** — להוסיף משימת Vibe Check עם 5 BUFFs cap 1/day
   - **Medication anchor** (אם אין כבר) — להוסיף משימה standalone (לא מוצמדת לארוחה)
3. **Vibe Check earns BUFFs** — שיפור ל-VibeCheckScreen הקיים: כל vibe check נותן 5 BUFFs, מקסימום פעם ביום
4. **"Add Task" template prioritization** — ב-ParentTasksScreen, תבנית תרופה מוצגת ראשונה ברשימת ההצעות

## Non-goals

- ❌ **שום שינוי באונבורדינג** — Adi-locked. הכל post-onboarding.
- ❌ **משימת Vibe Check default לכל ילד** — רק על-ידי הצעה contextual
- ❌ **זיהוי "context shift" אוטומטי** (vacation/חג) — V1 רק לפי inactivity. V1.1 יוסיף heuristics של context.
- ❌ **בניית UGC library** — נחקר במקביל כפכ' נפרד (ראה Appendix)
- ❌ **שינוי daily_goal defaults** — Improvement Package נפרד (`pkg/daily-goal-sanity`)
- ❌ **Streak / penalty / sad-BUDDY mechanics** — לא תואם Pillar 2
- ❌ **Auto-add anchors בלי אישור הורה** — תמיד דורש confirm
- ❌ **Push notification infrastructure** — תלוי `pkg/fcm-push-notifications` הנפרד; v1 משתמש ב-in-app בלבד

---

## Behavior Contract

### Scenario A — ילד inactive ל-X ימים (X per OQ1)

1. Edge function / pg_cron job יומי בודק לכל child profile: `MAX(daily_progress.created_at) WHERE child_id = X` — אם > X ימים, trigger.
2. נכתבת שורה ב-`notifications` עם type = `'anchor_recovery'`, child_id, parent_id.
3. בכניסת ההורה ל-ParentDashboardScreen, אם יש notification פתוחה — מוצג banner/modal:
   > "שמנו לב ש[ילד] לא היה פעיל ב-X הימים האחרונים. רוצה להציע התחלה רכה?"
4. ההורה רואה 2 כפתורי בחירה:
   - **A. Vibe Check** — "להוסיף משימת איך אני מרגיש (5 BUFFs)" [recommended]
   - **B. תרופה** (מוצג רק אם אין משימת תרופה standalone — heuristic per OQ7) — "להוסיף תזכורת תרופה לבוקר (5 BUFFs)"
   - **(C. Dismiss)** — "לא עכשיו"
5. בלחיצת A — משימת Vibe Check נוספת ל-tasks (assigned_to = child_id, special meta). מודיעה זמינות מ-עכשיו.
6. בלחיצת B — משימת "נטילת תרופה" נוספת (default time 07:30 per OQ6, standalone, 5 BUFFs).
7. בלחיצת C — notification.is_read = true. snooze ל-X ימים נוספים (OQ3).
8. ילד פותח את האפליקציה מחר → רואה את המשימה החדשה.

### Scenario B — ילד עושה Vibe Check (חדש או קיים)

1. Vibe Check fires (זרימה קיימת מ-pkg/daily-vibe-check).
2. בנוסף ל-INSERT ל-child_vibes — מעדכנים credit_vault.total_balance += 5 BUFFs.
3. **Cap:** רק אם זו ה-Vibe Check הראשונה היום (יום לפי `child_vibes.date`). אם כבר היה היום — אין credit נוסף.

### Scenario C — ההורה מבקר ב-ParentTasksScreen → Add Task

1. רשימת תבניות מובנות מוצגת.
2. **תבנית "נטילת תרופה"** ראשונה ב-suggested templates, עם default 07:30, 5 BUFFs, category=self-care, standalone (לא bundled עם ארוחת בוקר).
3. אם כבר קיימת משימת תרופה standalone לאותו ילד — התבנית עוברת לסוף הרשימה.

### Scenario D — Pause Mode פעיל

1. Inactivity Detector מדלג על משפחות עם Pause Mode פעיל — אין trigger, אין notification.
2. כשהמשפחה יוצאת מ-Pause — counter מתאפס (X ימים נספרים מאז). אין retroactive trigger.

### Scenario E — ילד חוזר לפעילות לבד

1. Inactivity Detector בודק `MAX(daily_progress.created_at)` — אם < X ימים, לא trigger.
2. כל notifications פתוחות עם type=anchor_recovery לאותו ילד → `is_read = true` אוטומטית.

---

## Schema Changes

**Preferred minimal approach:** השתמש בטבלת `notifications` הקיימת — הוסף `type='anchor_recovery'` בלי שינוי schema.

**Potentially needed:**
- אם נדרש להגביל re-fire (snooze): שדה `notifications.snooze_until timestamptz` או profile-level `last_anchor_recovery_prompt_at`. CC ב-Plan Mode יבדוק אם snooze logic אפשרי דרך תאריך של notification קיים.
- **No new tables needed.**

**Vibe Check credit:** משתמש ב-credit_vault הקיים. אין שינוי schema. RPC או trigger function שמוסיף 5 BUFFs כש-child_vibes משופץ (cap לפי daily_progress).

**Heuristic לזיהוי "standalone meds task" (per OQ7):** SQL pattern על `tasks.title` — מצב ש-title מכיל "תרופה" אבל **לא** מכיל "ארוחת" / "בוקר" / "ערב" כ-prefix. CC ב-Plan Mode יבדוק את הקבצים האמיתיים בסנפשוט ובלוובל לפני שמגדיר את ה-pattern.

---

## Files Likely Touched

- **New Edge function** או pg_cron job (TBD per OQ2):
  - `supabase/functions/anchor-recovery-detector/` (אם Edge)
  - או migration עם cron.schedule (אם pg_cron, בעקבות הצלחת `pkg/buddy-v05-backend`)
- **New screen / modal:**
  - `src/screens/parent/AnchorRecoveryPromptModal.tsx` או component שמוצמד ל-ParentDashboardScreen
- **Modified:**
  - `src/screens/parent/ParentDashboardScreen.tsx` — surface ה-notification
  - `src/screens/parent/ParentTasksScreen.tsx` — סידור מחדש של templates
  - `src/screens/child/VibeCheckScreen.tsx` + `src/hooks/useDailyVibe.ts` — credit logic
- **New i18n keys** (EN + HE):
  - `anchorRecovery.title`, `anchorRecovery.cta.vibeCheck`, `anchorRecovery.cta.meds`, `anchorRecovery.dismiss`
- **Update memory file** (likely):
  - `~/.claude/projects/.../memory/project_buff_anchor_theory.md` — add "implemented in `pkg/anchor-recovery` shipped {date}" note

---

## Open Questions for Adi

### OQ1 — Inactivity threshold

How many days of zero `daily_progress` triggers the prompt?

- **(a)** 3 days — early intervention, more sensitive
- **(b)** 5 days — balances avoidance of false positives (weekends, sick days)
- **(c)** 7 days — only for clear breaks

**CC recommendation:** **(b) 5 days.** Weekend doesn't trigger; mild illness doesn't trigger; but real breaks (5+ days) do.

### OQ2 — Notification mechanism

How is the parent informed?

- **(a)** In-app only — banner/modal on Dashboard open
- **(b)** Push notification + in-app — proactive
- **(c)** Email + in-app

**CC recommendation:** **(a) in-app only for v1.** Push depends on `pkg/fcm-push-notifications`. Email is overkill. v1.1 can add push.

### OQ3 — Re-fire cadence after dismiss

After parent dismisses, when can it re-fire?

- **(a)** Never (one-shot)
- **(b)** After 7 more days of inactivity
- **(c)** After 14 more days

**CC recommendation:** **(b) 7 days.** Respects dismiss but doesn't abandon.

### OQ4 — Auto-add vs confirm

When parent picks an anchor option, does the task get added automatically, or does an editable form appear first?

- **(a)** Add directly with defaults — frictionless
- **(b)** Show editable form (title, time, credits) before save
- **(c)** Add directly, link to "edit task" in confirmation toast

**CC recommendation:** **(c)** — frictionless add + visible edit path. Parents under low-bandwidth state need ONE click, but should know they can adjust.

### OQ5 — Vibe Check credit amount + cap

How much credit per Vibe Check?

- **(a)** 5 BUFFs, cap 1/day — minimal
- **(b)** 10 BUFFs, cap 1/day
- **(c)** 5 BUFFs, no cap (could grind)

**CC recommendation:** **(a)** — 5 BUFFs, 1 per day. Small enough to not distort the BUFF economy, capped to prevent grinding.

### OQ6 — Default time + credits for meds anchor

When the parent picks "add meds anchor", what defaults apply?

- **(a)** 07:30, 5 BUFFs, title "נטילת תרופה" (standalone)
- **(b)** Same + show "you can edit time after"
- **(c)** Ask the parent: morning / evening / both? — extra step

**CC recommendation:** **(a)** with toast in confirmation per OQ4(c). Morning-only is the most common ADHD pattern per [[buff-anchor-theory]].

### OQ7 — "Standalone meds" detection heuristic

How do we identify whether a kid already has a standalone meds task (so the meds option is hidden)?

- **(a)** Title contains "תרופה" or "medication" (any case)
- **(b)** Title === "תרופה" or "נטילת תרופה" (exact)
- **(c)** Title contains "תרופה" AND does NOT contain "ארוחת" / "בוקר" / "ערב"

**CC recommendation:** **(c)** — captures bundled cases as "missing standalone". Bundled = fragile per [[buff-anchor-theory]], so suggesting an addition is still valid.

### OQ8 — Multi-kid families

Trigger per-kid or per-family?

- **(a)** Per-kid — each child has independent inactivity counter
- **(b)** Per-family — one notification if ANY kid inactive

**CC recommendation:** **(a)** — independent. A family with one active and one inactive should get a prompt only about the inactive one.

### OQ9 — Copy approval (CRITICAL for Pillar 2)

The Hebrew prompt copy needs Adi's explicit approval before code. Initial draft:

> **Title:** "שמנו לב ש[ילד] לא היה פעיל לאחרונה"
> **Body:** "התחלות חדשות אחרי הפסקה הן הדבר הכי קשה. נציע משימה רכה אחת כדי לחזור?"
> **CTA A:** "להוסיף Vibe Check (איך אני מרגיש היום)"
> **CTA B:** "להוסיף תזכורת תרופה (אם רלוונטי)"
> **CTA C:** "לא עכשיו"

**Concerns:** "לא היה פעיל" עלול להישמע כביקורת. אלטרנטיבות:
- "[ילד] לא נכנס ל-BUFF לאחרונה — נציע לעזור?"
- "כל אחד צריך התחלה חדשה לפעמים. נעזור ל-[ילד] לחזור?"

**This needs Adi's call before code.**

---

## Proposed Phased Chunks

- **Phase 0** — Branch + SPEC + supporting files committed. Schema verification via Supabase MCP. CC inspects daily-vibe-check shipped code to understand the existing Vibe Check entry point.
- **Phase 1** — Inactivity Detector: pg_cron query נכתבת ובדוקה. INSERT ל-notifications. כשמופעל ידנית via SQL test. (No UI yet.)
- **Phase 2** — Parent Prompt UI: AnchorRecoveryPromptModal + integration ב-ParentDashboardScreen. כפתורים מגיבים אבל לא יוצרים tasks (logged only).
- **Phase 3** — Auto-create selected anchor task: לחיצה על Vibe/Meds → INSERT ל-tasks. Toast + edit link.
- **Phase 4** — Vibe Check credit: עדכון VibeCheckScreen / useDailyVibe — +5 BUFFs cap 1/day ל-credit_vault.
- **Phase 5** — ParentTasksScreen: meds template ראשונה ב-suggested templates list, עם logic של "כבר קיים?".
- **Phase 6** — i18n + Values Check + tests + close.

---

## Exit Deliverables — SPEC_SYNC matrix

לקובץ נפרד [SPEC_SYNC.md](./SPEC_SYNC.md).

---

## Risks

- **Pillar 2 violation in copy** — חמור. OQ9 חייב להיסגר לפני קוד.
- **Heuristic לזיהוי standalone meds עלול להחמיץ cases** — לדוגמה כותרת בעברית עם שגיאת הקלדה. אחרי 1-2 חודשים בייצור, נסקור heuristic accuracy.
- **Inactivity Detector על pg_cron** — תלוי שה-cron job ירוץ. אם הוא נכשל בשקט, אין anchor recovery. צריך monitoring (mostly via PR review of buddy-v05-backend pattern).
- **Multi-kid families ייצרו כפילות notifications** — אם 3 ילדים inactive, ההורה רואה 3 banners. UX issue. mitigation in Phase 2: collapse to single banner with multi-child sublist.

---

## Brief for the receiving CC session

```
Plan Mode. You are picking up pkg/anchor-recovery.

Read FIRST:
- CLAUDE.md
- docs/WORKFLOW.md
- docs/BUFF_VALUES.md
- docs/sessions/anchor-recovery/SPEC.md (this file — read ALL Open Questions)
- docs/sessions/anchor-recovery/SPEC_SYNC.md, TESTS.md, ROADMAP.md
- docs/sessions/daily-vibe-check/SPEC.md (Vibe Check shipped — read schema-verified section)
- src/screens/child/VibeCheckScreen.tsx + src/hooks/useDailyVibe.ts (entry point for credit)
- src/screens/parent/ParentDashboardScreen.tsx (insertion point for prompt)
- src/screens/parent/ParentTasksScreen.tsx (template list to reorder)

Then via Supabase MCP:
- list_tables on notifications, child_vibes, tasks, daily_progress (verify schemas)
- Check existence of any anchor_recovery type already used
- Verify credit_vault columns + RPC for adding BUFFs

Surface OQ1-9 to Adi for decisions. OQ9 (copy) is CRITICAL — Pillar 2 risk.

Branch off main as pkg/anchor-recovery. No code until Adi approves Phase 0.
Chunk-by-chunk per CLAUDE.md.

Memory references to read for full context:
- ~/.claude/projects/.../memory/project_buff_anchor_theory.md
- ~/.claude/projects/.../memory/project_buff_war_non_return.md
- ~/.claude/projects/.../memory/project_buff_elgarat_test_case.md
```

---

## Appendix — UGC Library Discovery (separate track, non-blocking)

The 2026-05-23 query revealed a viable UGC library — top tasks parent-created (excluding defaults) with real completion data by age band. **Highest-value findings:**

- **Age 9-11:** "תרופה" standalone — 38 completions (1 kid). Real-world proof that standalone meds anchor is the strongest pattern.
- **Age 15-18:** "נטילת תרופה" (morning) + "להתעורר לבד" + "נטילת תרופת ערב" — 12-14 completions each (Etay's setup).
- **Age 12-14:** "ארוחת בוקר ותרופות ובקבוק מים" — 15 completions (Pele's bundled meds). Survived war 1 week then churned. Anti-pattern data point.

A future package `pkg/task-library-from-ugc` can use this data (50+ tasks with completion rates by age band) to seed the "Add Task" template list with proven patterns. Not in scope for `pkg/anchor-recovery`.

---

**End of SPEC.**
