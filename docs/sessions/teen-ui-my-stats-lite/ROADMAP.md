# teen-ui-my-stats-lite — Roadmap

> Phases with explicit stop conditions. Each phase boundary is a checkable gate.

## Phase 1 — Screen + i18n

**Scope:**
- Add `src/screens/child/GamerMyStatsScreen.tsx` rendering header + 3-up stat grid using existing data sources (`usePetState`, `useChildData`, `useAppSettings`).
- Add `src/screens/child/ChildMyStatsScreen.tsx` dispatcher (Gamer → real screen, Pastel → null/placeholder).
- Add i18n keys (`gamerMyStats.*`) in `src/i18n/en.json` + `src/i18n/he.json`.
- Pause Mode: respect `useAppSettings.isPauseActive` (render `PauseEmptyState` like the dashboard does).
- Brand palette: deep violet canvas + lime accent (matches `GamerDashboardScreen`, NOT Stitch's green-on-green).

**Stop conditions (concrete, measurable):**
- Screen file compiles under existing tsconfig (tightened in pkg/test-infrastructure).
- All 5 i18n keys present in both en + he with non-empty values.
- Screen renders Pause empty-state when `isPauseActive === true` (verified in unit test).
- No new dependencies added (verify `package.json` diff is zero).

**Exit Deliverables:**
- [ ] Code as scoped above
- [ ] STATUS.md updated with phase 1 row
- [ ] Values Check still passes (verified against actual rendered behavior, not just SPEC text)

---

## Phase 2 — Navigation wiring

**Scope:**
- Add `ChildMyStats` to `ChildTabsParamList` in `src/navigation/types.ts`.
- Add 5th tab in `src/navigation/ChildTabs.tsx` — **conditionally rendered for Gamer theme only** (hidden for Pastel per Q3 default).
- Tab config: label key `tabs.child.stats`, icon `stats-chart-outline` / `stats-chart`.

**Stop conditions:**
- Gamer-themed child sees 5 tabs: HQ, Quests, Shop, **STATS**, Menu.
- Pastel-themed child sees 4 tabs: HQ, Quests, Shop, Menu (unchanged from current).
- Navigating to STATS tab renders `GamerMyStatsScreen` with real data.
- Navigation does not crash when theme changes at runtime (verified manually by switching theme in Settings).

**Exit Deliverables:**
- [ ] Code as scoped above
- [ ] STATUS.md row for phase 2
- [ ] Manual smoke test — Adi confirms tab appears + works

---

## Phase 3 — Tests + closeout

**Scope:**
- Jest unit test in `__tests__/` for `GamerMyStatsScreen`:
  - Renders 3 stat cards with mocked hook data
  - Renders `PauseEmptyState` when `isPauseActive === true`
  - Shows "0" placeholder when data is missing/loading (no crash)
- Update canonical docs per SPEC_SYNC.md.
- Final STATUS.md closeout checklist.

**Stop conditions:**
- `npm test` (Jest) passes including new tests.
- TypeScript check passes.
- All canonical doc updates committed.

**Exit Deliverables:**
- [ ] Tests added + passing
- [ ] Canonical docs synced
- [ ] STATUS.md closeout checklist complete
- [ ] PR opened against `main`

---

## Closeout

- [ ] All phases passed per TESTS.md
- [ ] All canonical docs synced per SPEC_SYNC.md
- [ ] STATUS.md closeout checklist complete
- [ ] PR to main, fast-forward merge, branch deleted (per Verify-Before-Delete protocol in CLAUDE.md)
