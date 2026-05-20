# pkg/daily-vibe-check — Tests

> Pass/fail criteria per phase. **Concrete and verifiable.** CC runs the automated ones; Adi runs the UI ones on Android emulator.

---

## Phase 0 — Foundation (this commit)

### Automated (CC)
- [x] `git branch --show-current` returns `pkg/daily-vibe-check`
- [x] `docs/sessions/beta-2026-06-01/TRACK_8_daily_vibe_check_SPEC.md` exists in worktree
- [x] `docs/sessions/daily-vibe-check/{SPEC,STATUS,TESTS,SPEC_SYNC,README}.md` all exist
- [x] SPEC.md contains the "Schema Verified" + "Decisions Locked" sections
- [x] `git diff --stat origin/main` shows ONLY changes under `docs/sessions/` (no `src/` touched)

### Manual (Adi)
- [ ] SPEC § "Schema Verified" matches the columns you see in Supabase Dashboard for `public.child_vibes`
- [ ] SPEC § "Decisions Locked" — confirm CC defaults are acceptable, or note overrides for Phase 1 plan
- [ ] (Optional) skim README + STATUS for sense

### Methodology (always)
- [x] STATUS.md updated with Phase 0 row
- [x] No canonical docs touched (Phase 0 is folder/spec only)
- [x] Values Check still passes — same as SPEC (no implementation yet)
- [x] No INTEGRATION_LEARNINGS entry needed yet (no surprises during Phase 0 beyond what was already surfaced in plan)

---

## Phase 1 — `useDailyVibe` data layer

### Automated
- [ ] `npm test -- useDailyVibe` — all unit tests green
  - getTodayKey returns YYYY-MM-DD
  - `shouldPrompt` false when today's row exists
  - `shouldPrompt` false when isPauseActive
  - `isLowPower` reflects persisted column, not just `vibe_level <= 2`
  - `recordVibe(1)` writes `low_power_mode = true`; `recordVibe(3)` writes `low_power_mode = false`
- [ ] TypeScript: `npx tsc --noEmit` exits 0

### Manual (Adi via Supabase Dashboard or via dev menu)
- [ ] After test insert via dev menu/SQL: row appears in `public.child_vibes` with correct `family_id`, `child_id`, `date`, `vibe_level`, `low_power_mode`
- [ ] No UI regression — dashboard still mounts and renders normally (hook is unused by UI yet)

### Methodology
- [ ] STATUS.md row added with phase=1, state=passed
- [ ] No SPEC_SYNC updates required (no canonical doc changes in Phase 1)
- [ ] Values Check still passes
- [ ] INTEGRATION_LEARNINGS appended if anything surprising

---

## Phase 2 — VibeCheck modal UI (Pastel + Gamer)

### Automated
- [ ] Snapshot/component tests for `VibeFaces` and `VibeBars` (optional)
- [ ] TypeScript clean

### Manual (Adi)
- [ ] Pastel theme: open as child for the first time today → 5-face modal appears → tap each face → row inserts correctly + modal dismisses
- [ ] Gamer theme: same flow with 5 lime bars
- [ ] Open same child again same day → no modal
- [ ] Toggle Pause Mode (as parent) → switch to child → no Vibe modal, PauseEmptyState renders normally
- [ ] Dismiss without rating → no row + no re-prompt on remount
- [ ] Hebrew toggle → RTL layout correct, all strings localized

### Methodology
- [ ] STATUS.md row + commit
- [ ] SPEC_SYNC: GAP_ANALYSIS S-07 → 🟡 partial (Phase 2 updates)
- [ ] Values Check passes against actual UI (not just SPEC)

---

## Phase 3 — Low Power Mode (filter + SOS + Instant Buff)

### Automated
- [ ] Unit tests: task filter reduces list to highest-priority + first self-care when isLowPower
- [ ] Unit tests: `sendSos()` sets `parent_sos_sent = true` AND inserts notification
- [ ] Unit tests: `awardInstantBuff()` increments `credit_vault.total_balance` by 5

### Manual (Adi)
- [ ] Insert vibe_level=1 via Supabase MCP for today, reload as child → trimmed task list (1-2 items) + SOS button + Instant Buff card visible + calm banner shown
- [ ] Tap SOS → confirmation appears → confirm → `parent_sos_sent` flips true (verify in MCP) + notification row inserted
- [ ] Tap Instant Buff → balance +5 visible in header
- [ ] Insert vibe_level=4 → normal full task list, no SOS, no Instant Buff
- [ ] No regression on Pastel + Gamer dashboards in normal mode

### Methodology
- [ ] STATUS.md + commit
- [ ] SPEC_SYNC: GAP_ANALYSIS S-07 → ✅ (Phase 3 updates)
- [ ] Values Check passes

---

## Phase 4 — Parent SOS notification surface

### Automated
- [ ] Unit test: parent dashboard surfaces `vibe_sos` notifications with abstract copy

### Manual (Adi)
- [ ] Child taps SOS → switch to parent device/account → notification visible within ~2 sec (realtime) with "[Kid] needs a moment" copy (EN + HE)
- [ ] Notification mark-as-read works

### Methodology
- [ ] STATUS.md + commit
- [ ] SPEC_SYNC: PRD §8.1 note added (Low Power Mode = Days 1-3 retention)

---

## Phase 5 — i18n sweep + regression + spec sync

### Automated
- [ ] All `vibeCheck.*` + `lowPower.*` keys exist in both `en.json` and `he.json`
- [ ] `npm test` whole suite green
- [ ] `npx tsc --noEmit` clean

### Manual (Adi) — TRACK_6 regression flow #9
- [ ] Vibe Check + Low Power Mode end-to-end on Android emulator
- [ ] Pause Mode still works (no Vibe regression)
- [ ] Task complete flow still works
- [ ] BUDDY flows still work (no shared state collision)

### Methodology (Closeout)
- [ ] STATUS.md closeout checklist complete
- [ ] PRD §7.1 line 215 spec-synced (Decision NEW-1)
- [ ] GAP_ANALYSIS S-07 → ✅
- [ ] INTEGRATION_LEARNINGS appended (PRD/GAP drift discovery + UTC follow-up)
- [ ] Git tag
- [ ] PR opened
- [ ] No drift between canonical docs and live system

---

## Closeout

- [ ] All phase tests passing
- [ ] STATUS.md closeout checklist complete
- [ ] End-to-end manual flow on emulator (all phases combined)
- [ ] PR merged, branch deleted per Verify-Before-Delete protocol
