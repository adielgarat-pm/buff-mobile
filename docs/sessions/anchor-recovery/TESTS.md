# Anchor Recovery — Tests

> Pass/fail criteria per phase. Most are emulator-driven manual tests; some are unit (Jest) or DB-side (SQL).

---

## Phase 0 — Setup + schema verification

| # | Test | Expected |
|---|---|---|
| 0.1 | Branch `pkg/anchor-recovery` exists off `main` | ✓ |
| 0.2 | 6 files committed in `docs/sessions/anchor-recovery/` | ✓ |
| 0.3 | Supabase MCP `list_tables` on `notifications` | type column exists, free text — `'anchor_recovery'` insertable |
| 0.4 | Supabase MCP — `credit_vault.total_balance` is `integer NOT NULL DEFAULT 0` | ✓ |
| 0.5 | Adi answered OQ1-9 (or "accept all recommendations") | ✓ |
| 0.6 | **OQ9 copy explicitly approved by Adi** | ✓ (Pillar 2 gate) |

---

## Phase 1 — Inactivity Detector

| # | Test | Method | Expected |
|---|---|---|---|
| 1.1 | Manual SQL: make child X "inactive 6 days" + run cron | SQL: `DELETE` last 6 days of daily_progress; run pg_cron job manually | New row in `notifications` with `type='anchor_recovery'`, `child_id=X`, `is_read=false` |
| 1.2 | Run cron again | SQL run | NO new row (idempotency) |
| 1.3 | Pause-Mode family with inactive child | SQL: set `app_settings.is_paused=true`; run cron | NO notification created |
| 1.4 | Brand-new family (created today) with inactive kid (impossible state but defensive) | SQL: create family + child with `created_at = NOW()`; no progress | NO notification |
| 1.5 | Child with recent daily_progress | Has daily_progress in last 2 days | NO notification |
| 1.6 | Threshold = OQ1 value | SQL: child inactive (X-1) days | NO notification |
| 1.7 | Threshold = OQ1 value, exactly X days | SQL: child inactive exactly X days | Notification created |
| 1.8 | Jest unit test for detector query | `npm test` | All pass |

---

## Phase 2 — Parent Prompt UI

| # | Test | Method | Expected |
|---|---|---|---|
| 2.1 | Notification exists for kid → ParentDashboard shows banner | Emulator: parent opens dashboard | Banner visible above children "Today" section |
| 2.2 | Tap banner → modal opens | Emulator tap | Modal renders with kid name + 2 CTAs + dismiss |
| 2.3 | All Hebrew copy matches OQ9-approved version | Visual check | ✓ |
| 2.4 | **Banned-string grep** | `grep -r "פספסת\|החמצת\|missed\|failed\|מאחור" src/i18n/` | No matches |
| 2.5 | Dismiss button → modal closes, notification marked read | Emulator | Modal closes, refresh: no banner |
| 2.6 | Multi-kid: 2 kids inactive → single banner with sublist | Emulator | One banner, two child names |
| 2.7 | Pause Mode active → no banner even with notification | Emulator | Banner not shown |
| 2.8 | English locale | Emulator switch to EN | All copy English, same flow |

---

## Phase 3 — Auto-create anchor task

| # | Test | Method | Expected |
|---|---|---|---|
| 3.1 | Tap Vibe CTA | Emulator | New task in DB: title contains "מרגיש", credits=5, assigned_to=kid, standalone |
| 3.2 | Tap Meds CTA | Emulator | New task: title contains "תרופה", credits=5, time=07:30, standalone |
| 3.3 | Notification marked read after either tap | Emulator + DB | `is_read=true` |
| 3.4 | Toast appears with edit link | Emulator | Visible 3-5 sec, tap → navigates to ParentTasksScreen for kid |
| 3.5 | Rapid double-tap | Emulator | Only one task created (debounce) |
| 3.6 | Kid's app shows new task next session | Emulator: switch to kid role | Task visible in kid dashboard |

---

## Phase 4 — Vibe Check credit

| # | Test | Method | Expected |
|---|---|---|---|
| 4.1 | First Vibe Check today → +5 BUFFs | Emulator: kid taps vibe, then check credit_vault | total_balance += 5 |
| 4.2 | Second Vibe Check same day → no change | Emulator | total_balance unchanged from before second tap |
| 4.3 | Next day → can earn again | Emulator: change device date or wait | +5 again |
| 4.4 | Pause Mode active → no Vibe Check, no credit | Emulator | total_balance unchanged |
| 4.5 | Jest unit test on cap logic | `npm test` | Pass |

---

## Phase 5 — ParentTasksScreen template

| # | Test | Method | Expected |
|---|---|---|---|
| 5.1 | "Add Task" templates list: kid without standalone meds task | Emulator | "נטילת תרופה" first |
| 5.2 | "Add Task" templates list: kid WITH standalone meds task | Emulator | "נטילת תרופה" at end of list |
| 5.3 | "Add Task" templates list: kid with bundled meds ("ארוחת בוקר ותרופה") | Emulator | "נטילת תרופה" STILL first (heuristic per OQ7) |
| 5.4 | Tap "נטילת תרופה" template | Emulator | Task created: standalone, 5 BUFFs, 07:30 |

---

## Phase 6 — Final regression + ship

| # | Test | Method | Expected |
|---|---|---|---|
| 6.1 | All Behavior Contract Scenarios A-E pass | Emulator manual matrix | All ✓ |
| 6.2 | No banned strings in any code or i18n | Grep | No matches |
| 6.3 | **Values Check 9 questions** | Adi re-runs | All pass |
| 6.4 | BUFF_PRD §7 mentions Anchor Recovery | Visual diff | New line added |
| 6.5 | BUFF_GAP_ANALYSIS row exists | Visual diff | New row, Adi-approved |
| 6.6 | INTEGRATION_LEARNINGS updated | Diff | Any surprises captured |
| 6.7 | Memory file updated | Memory check | `project_buff_anchor_theory.md` notes shipped date + commit |

---

## Cross-cutting (every phase)

- [ ] Values Check passed at phase end
- [ ] No banned strings introduced
- [ ] No new dependencies installed without separate package approval
- [ ] No `daily_goal` changes (out of scope per SPEC § Non-goals)
- [ ] No onboarding changes (out of scope per SPEC § Non-goals)
- [ ] Pause Mode interaction tested where relevant
