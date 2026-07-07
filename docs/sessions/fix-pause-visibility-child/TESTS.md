# fix-pause-visibility-child — TESTS

## Hat 1 — static + unit (2026-07-06)

- `npx tsc --noEmit` — ✅ clean (exit 0).
- New Jest suites:
  - `ChildTasksScreen.pause.test.tsx` — 3 tests: pause-ON hides task list (PauseEmptyState, no PhaseView, no header), pause-OFF renders normally, loading wins over pause. ✅
  - `ChildRewardsScreen.pause.test.tsx` — 2 tests: pause-ON hides shop but keeps header/balance, pause-OFF renders empty-shop state. ✅
  - `taskScheduling.test.ts` — parity table updated to the all-7-days null default + 2 new tests: explicit `[]` hidden on every day; null visible incl. Saturday. ✅
- Full suite: **545/545 tests pass**, 54/55 suites. The 1 failing suite (`ThemeContext.test.tsx`, supabase realtime websocket in jsdom) fails identically on origin/main without this package's changes (verified via stash run).
- `npm run i18n:check` — new key `parentTasks.oneTimeHint` resolves in both locales. One pre-existing failure on main (`category.other`, TaskTimelineSection) — flagged as a separate task, not from this package.

## Hat 3 — emulator (Pixel_7, dev client, Metro 8083, 2026-07-06)

Scenario driven via adb/uiautomator on Adi's real dev family (Itay/Emmy/Leia):

1. **Family Pause ON** (Settings → Take a break → Just today → YES, PAUSE) → parent settings shows "BUFF is paused / Paused until Tue, Jul 7". ✅
2. **View-as-Child (Emmy, Mint theme, Hebrew)**:
   - Dashboard: "☕️ אנחנו בהפסקה" (pre-existing correct behavior — regression ✅)
   - **קווסטים (Tasks tab): "אנחנו בהפסקה" — the task list is GONE.** This was the reported bug; before the fix the full 10-task list rendered here. ✅ **FIX VERIFIED**
   - **חנות (Shop): pause state shown, header + 861 Buffs balance still visible** (reassurance) — was unguarded before. ✅ **FIX VERIFIED**
3. **Resume now** → parent dashboard pause banner cleared. ✅
4. **Per-task pause + realtime (the exact Noa scenario):** with Emmy's child view open, `UPDATE tasks SET schedule_days='{}'` on "סידור חדר" ran server-side →
   - `18:20:41 [useChildData] raw tasks from Supabase` fired **within seconds, without any navigation or restart** — the postgres_changes event on `tasks` (migration 040) triggered a live refetch; the row came back with `schedule_days: []`.
   - Restore (`{0..6}`) at 18:21:27 → second live refetch. **2/2 realtime events received.** ✅ **FIX VERIFIED**
   - Emmy's two genuinely-paused tasks (`ללכת ברגל לבית ספר`, `לפנות תיק אוכל מהתיק`, both `[]`) stay hidden from her quest list. ✅
5. Known emulator noise, not app bugs: RevenueCat `BILLING_UNAVAILABLE` LogBox toast (no Play billing on emulator); uiautomator dumps go stale while a LogBox animation runs (tooling learning — see INTEGRATION_LEARNINGS).

## Web (Expo Web, port 19006, 2026-07-06)

- Bundle + boot smoke: app loads, no new console errors. Pause gates and the realtime subscription are platform-neutral JS (`AppState` maps to the page-visibility API on web; supabase-js realtime uses the browser WebSocket).
- Auth-gated child screens can't be exercised headlessly — per standing rule, Adi's manual web check applies if desired; code paths are shared 1:1 with the emulator-verified flows.

## Hat 4 — real devices (pending, Adi)

- Two-device: parent phone activates family pause / per-task pause → child phone (own-device child) updates within seconds, no restart.
