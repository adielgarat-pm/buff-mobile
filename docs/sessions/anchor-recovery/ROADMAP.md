# Anchor Recovery — Roadmap

> 6 phases. Every phase boundary is a gate. Phase 0 must close before Phase 1 starts. Adi approves each phase explicitly.

---

## פאזה 0 — Setup + schema verification (~1 hour)

**Scope:**
- Branch `pkg/anchor-recovery` created off `main`
- Session folder committed (6 files)
- Schema verification via Supabase MCP — confirm columns of:
  - `notifications` (existing types, can we add `'anchor_recovery'`?)
  - `child_vibes` (already verified in daily-vibe-check)
  - `tasks` (insertion structure for the new anchor task)
  - `credit_vault` (column for awarding 5 BUFFs)
- CC reviews `daily-vibe-check` shipped code to understand Vibe Check entry point

**תנאי עצירה:**
- [ ] Branch + folder pushed
- [ ] Schemas verified, documented in SPEC § "Schema Verified" addendum
- [ ] CC confirms no schema migration required (or, if needed, drafts migration for Phase 1)
- [ ] OQ1-9 resolved (Adi approved or deferred to in-phase decisions)
- [ ] OQ9 (copy) — Adi explicit approval recorded

**Exit Deliverables:**
- [ ] Schema verification appended to SPEC.md (Phase 0 close-out note)
- [ ] STATUS.md row for Phase 0
- [ ] No code changes yet — pure planning

---

## פאזה 1 — Inactivity Detector backend (~2.5 hours)

**Scope:**
- pg_cron job daily — query: for each `child` profile, find `MAX(daily_progress.created_at)` and `MAX(child_vibes.created_at)`. If both > X days ago (X per OQ1), INSERT into `notifications` with `type='anchor_recovery'`.
- Idempotency: don't re-insert if there's already an unread `anchor_recovery` notification for this child.
- Skip Pause-Mode-active families (check `app_settings.is_paused` or equivalent).
- Skip children whose family was created in the last X+2 days (don't trigger for brand-new families).
- Add unit tests (Jest) for the detector logic via mocked queries.

**תנאי עצירה:**
- [ ] pg_cron job exists in Supabase, runs daily
- [ ] Manual test: SQL INSERT to make a child "inactive 5 days" → cron next run creates notification row
- [ ] Pause-active family does NOT get notification
- [ ] Already-notified family does NOT get duplicate notification
- [ ] No UI yet — notification visible only in DB

**Exit Deliverables:**
- [ ] Migration committed
- [ ] STATUS.md row for Phase 1
- [ ] SPEC.md updated with confirmed query shape
- [ ] INTEGRATION_LEARNINGS.md if surprises
- [ ] **No `src/` code changed yet**

---

## פאזה 2 — Parent Prompt UI (~3 hours)

**Scope:**
- `src/screens/parent/AnchorRecoveryPromptModal.tsx` — new component
- `src/screens/parent/ParentDashboardScreen.tsx` — check for unread `anchor_recovery` notifications on mount, show banner with "Take a moment" prompt → opens modal
- Modal shows:
  - Child name
  - "X days inactive" framing (Adi-approved copy from OQ9)
  - 2 CTA buttons: Vibe Check anchor / Meds anchor (if heuristic says missing)
  - Dismiss link
- Buttons currently LOG ONLY — no task creation yet (Phase 3 work)
- i18n keys per SPEC §UI

**תנאי עצירה:**
- [ ] Modal renders on dashboard when notification exists
- [ ] All copy matches Adi-approved version (OQ9)
- [ ] Dismiss closes modal + marks notification as read
- [ ] Multi-kid case: collapsed into single banner with sublist
- [ ] **Banned-string grep:** no `פספסת` / `החמצת` / `missed` / `failed` / `מאחור`
- [ ] Pause Mode active → no modal (defensive)

**Exit Deliverables:**
- [ ] שינוי קוד
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md
- [ ] STATUS.md
- [ ] Values Check passed against rendered output (Adi re-verifies Pillar 2 on real screen)

---

## פאזה 3 — Auto-create anchor task (~1.5 hours)

**Scope:**
- Vibe Check CTA: INSERT to `tasks` with title "איך אני מרגיש?", category=`self-care`, credits=5, assigned_to=child_id, special meta marking it as anchor.
- Meds CTA: INSERT to `tasks` with title "נטילת תרופה", category=`self-care`, credits=5, time=`07:30` (OQ6 default), assigned_to=child_id, standalone.
- Confirmation toast on parent dashboard: "[Task] נוסף ל-[ילד]. ניתן לערוך מסך משימות."
- Toast → tap → navigate to ParentTasksScreen for that child

**תנאי עצירה:**
- [ ] Vibe button creates task; appears for kid next time he opens dashboard
- [ ] Meds button creates task; default time 07:30
- [ ] Notification marked `is_read=true` after either button pressed
- [ ] Toast appears with edit link
- [ ] No duplicate task if button pressed twice rapidly

**Exit Deliverables:**
- [ ] שינוי קוד
- [ ] STATUS.md
- [ ] INTEGRATION_LEARNINGS.md if surprises

---

## פאזה 4 — Vibe Check credit (~1 hour)

**Scope:**
- `src/hooks/useDailyVibe.ts` — extend the existing INSERT to `child_vibes` flow to also update `credit_vault.total_balance += 5` for the child, IF this is the first vibe of the day (check via `child_vibes.date = today`).
- Use existing RPC or direct UPDATE — CC ב-Plan Mode יבדוק.
- Add unit test for cap logic.

**תנאי עצירה:**
- [ ] First vibe today → +5 BUFFs to credit_vault
- [ ] Second vibe same day → no credit change (cap)
- [ ] Next day → can earn again
- [ ] Pause Mode active → no credit (no vibe to begin with)

**Exit Deliverables:**
- [ ] שינוי קוד
- [ ] STATUS.md
- [ ] Unit test for cap logic

---

## פאזה 5 — ParentTasksScreen template prioritization (~1.5 hours)

**Scope:**
- `src/screens/parent/ParentTasksScreen.tsx` — בדיקה איך נראה היום מסך "Add Task" (ייתכן שכבר קיים, צריך לבדוק קוד)
- אם יש רשימת templates — להבטיח "נטילת תרופה" ראשונה כברירת מחדל
- אם הילד כבר מחזיק `tasks.title` שמכיל "תרופה" וגם לא מכיל "ארוחת"/"בוקר"/"ערב" → התבנית עוברת לסוף הרשימה
- אם אין רשימת templates — אז זו תוספת חדשה (out of scope for this package, mark as deferred)

**תנאי עצירה:**
- [ ] תבנית "נטילת תרופה" ראשונה ברשימה אם אין כבר משימה standalone
- [ ] התבנית עוברת לסוף הרשימה אם standalone כבר קיימת
- [ ] בלחיצה על התבנית — task נוצרת עם default time 07:30, standalone, 5 BUFFs

**Exit Deliverables:**
- [ ] שינוי קוד
- [ ] STATUS.md

---

## פאזה 6 — Values Check, i18n, regression, ship (~2 hours)

**Scope:**
- Re-run Values Check על המוצר המוגמר
- Hebrew + English copy review (Adi)
- בדיקה ידנית באמולטור של 4 הזרימות: A, B, C, E מ-SPEC § Behavior Contract
- BUFF_PRD update — להוסיף שורה ל-§7 על "Anchor Recovery"
- BUFF_GAP_ANALYSIS update — Adi proposes/writes row
- INTEGRATION_LEARNINGS update — לאסוף כל הפתעות מהפאזות
- Git tag `pkg/anchor-recovery/v1`

**תנאי עצירה:**
- [ ] כל 4 הזרימות passed באמולטור
- [ ] No banned strings remain (final grep)
- [ ] Values Check passes against final implementation (Adi re-runs 9 questions)
- [ ] Adi approved BUFF_PRD update
- [ ] Adi approved BUFF_GAP_ANALYSIS row

**Exit Deliverables:**
- [ ] שינוי קוד (test fixes if any)
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge, branch נמחק (per Verify-Before-Delete protocol)
- [ ] Git tag `pkg/anchor-recovery/v1` יוצר

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] כל canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר: `pkg/anchor-recovery/v1`
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge, branch נמחק
- [ ] Memory file `project_buff_anchor_theory.md` מעודכן: "implemented in pkg/anchor-recovery shipped {date}"
- [ ] Adi מודיעה ל-shani / nadav / other beta users on relevant follow-up
