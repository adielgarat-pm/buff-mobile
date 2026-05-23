# Yesterday Recap — Roadmap

> 3 phases with explicit exit criteria. Every phase boundary is a gate.

## פאזה 1 — Hook + filter sieve + unit tests (~2.5 hours)

**Scope:**
- `src/utils/yesterdayRecapUtils.ts` — pure filter sieve function (per F-2026-05-21-01)
- `src/utils/__tests__/yesterdayRecapUtils.test.ts` — unit tests for the sieve
- `src/hooks/useYesterdayRecap.ts` — hook with realtime subscription, contract per SPEC §IN

**תנאי עצירה (concrete, measurable):**
- [ ] Hook returns correct structure for: 1 child + N tasks, 2 children, no children, paused family, family-created-today
- [ ] Filter sieve passes all unit tests:
  - Task included when all conditions met (positive case)
  - Task excluded when `schedule_days` doesn't include yesterday's weekday
  - Task excluded when `created_at > yesterday_end`
  - Task excluded when `assigned_to` doesn't match the child
  - Tasks with empty/null `schedule_days` default to all 7 days
  - Pause active → `shouldHide = true`
  - Family/child created today → `shouldHide = true`
- [ ] Realtime subscription fires when relevant `daily_progress` or `tasks` row changes
- [ ] No UI rendered yet — hook callable but not consumed

**Exit Deliverables:**
- [ ] שינוי קוד
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md (שורת פאזה 1 — none for this phase)
- [ ] STATUS.md מעודכן עם שורת הפאזה
- [ ] INTEGRATION_LEARNINGS.md אם הפתעות
- [ ] Values Check passed (Pillar 2 anti-pattern grep: no banned strings in hook code)

---

## פאזה 2 — UI integration (~3 hours)

**Scope:**
- `src/components/YesterdayRecapCard.tsx` per SPEC §IN visual spec
- Wire `useYesterdayRecap` into `ParentDashboardScreen.tsx` at the documented insertion point (after children "Today" cards `.map()` loop, before `</LinkChildModal>`)
- Section header "אתמול · 20.5" (per §5 decision)
- Empty state copy + "all complete" celebration variant
- i18n keys per SPEC §IN (EN + HE)
- Accessibility: ✓/○ `accessibilityLabel`s

**תנאי עצירה:**
- [ ] Section renders below "Today" on Parent Dashboard for at least one family scenario
- [ ] Cards collapsed by default; tap expands/collapses
- [ ] Visual hierarchy: "Today" cards visually dominant; "Yesterday" muted (smaller font, gray section title)
- [ ] Pause Mode hides the section entirely
- [ ] Empty state (no tasks yesterday OR all kids 0/0) doesn't render the section
- [ ] "All complete" celebration variant appears for kids who marked everything
- [ ] **Banned-string grep passes** on all package i18n strings: no `פספסת`, `החמצת`, `לא בוצעו`, `כשלון`, `missed`, `failed`

**Exit Deliverables:**
- [ ] שינוי קוד
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md (שורת פאזה 2 — i18n keys added; none of canonical)
- [ ] STATUS.md מעודכן
- [ ] INTEGRATION_LEARNINGS.md אם הפתעות
- [ ] Values Check passed against rendered output (re-verify Pillar 2 mitigations are visible)

---

## פאזה 3 — Edge case matrix + ship (~1.5 hours)

**Scope:**
- Manual emulator test matrix per [TESTS.md](./TESTS.md) Phase 3 section
- BUFF_PRD.md update: §7 add "Yesterday Recap" feature line
- BUFF_GAP_ANALYSIS.md update: add new row for this feature (propose to Adi — per CLAUDE.md rule, GAP_ANALYSIS is Adi's doc; CC proposes, doesn't write unilaterally)
- F-2026-05-21-01 status transition: `open` → `resolved` (in INTEGRATION_LEARNINGS.md)
- Git tag `pkg/yesterday-recap/v1`

**תנאי עצירה:**
- [ ] All Phase-3 test matrix scenarios pass in emulator
- [ ] No banned strings remain in any code or i18n (final grep)
- [ ] Values Check passes against final implementation (Adi re-runs the 9 questions)
- [ ] Adi approved BUFF_PRD update text
- [ ] Adi approved or wrote BUFF_GAP_ANALYSIS row

**Exit Deliverables:**
- [ ] שינוי קוד (test fixes if any)
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md (this phase: BUFF_PRD, F-2026-05-21-01 resolved)
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge, branch נמחק (per Verify-Before-Delete protocol)
- [ ] Git tag `pkg/yesterday-recap/v1` יוצר

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] כל canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר: `pkg/yesterday-recap/v1`
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge, branch נמחק
- [ ] Beta-user follow-up: send Shani the "it's live" WhatsApp message (Adi)
