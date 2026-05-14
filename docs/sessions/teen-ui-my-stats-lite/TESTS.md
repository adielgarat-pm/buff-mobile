# teen-ui-my-stats-lite — Tests

> Pass/fail criteria per phase. **Concrete, verifiable.**

## How tests run

- **Automated:** Jest unit tests under `__tests__/` (CC runs `npm test`).
- **Manual:** Adi runs the app on Android emulator + verifies with Itay on physical device.

---

## Phase 1 — Screen + i18n

### Automated (CC runs)
- [ ] Screen file compiles under tightened tsconfig (no new errors).
- [ ] `npm test` passes (Phase 1 has no new tests yet — verify suite still green).

### Methodological (always)
- [ ] STATUS.md phase 1 row added with state=passed
- [ ] Values Check still passes against rendered behavior (not just SPEC text)
- [ ] No surprises requiring INTEGRATION_LEARNINGS.md entry

---

## Phase 2 — Navigation wiring

### Automated (CC runs)
- [ ] TypeScript check passes (`ChildTabsParamList` discriminates correctly).
- [ ] No new lint errors from `ChildTabs.tsx`.

### Manual (Adi on emulator)
- [ ] Open BUFF as a child profile with Gamer theme → 5 tabs visible (HQ, Quests, Shop, **STATS**, Menu)
- [ ] Tap STATS → `GamerMyStatsScreen` renders with the child's real BUFFs balance, successful days, current streak
- [ ] Switch theme to Pastel via Settings → tabs collapse to 4 (no STATS) without crash
- [ ] Switch back to Gamer → STATS tab returns
- [ ] During Pause Mode → STATS tab shows `PauseEmptyState`, not the stat grid

### Methodological
- [ ] STATUS.md phase 2 row added
- [ ] Values Check verified against actual UI

---

## Phase 3 — Tests + closeout

### Automated (CC runs)
- [ ] New Jest test file passes — covers: stat-grid render, Pause empty-state, zero-data fallback
- [ ] Full `npm test` suite passes
- [ ] `npx tsc --noEmit` passes
- [ ] i18n key validator script (added in pkg/test-infrastructure) passes — no missing keys

### Manual (Adi on physical device with Itay)
- [ ] Itay opens BUFF on his phone → STATS tab is discoverable + readable
- [ ] Itay confirms the data shown matches what he expects from his actual usage
- [ ] Itay confirms the lite version is "good enough for now" OR flags drift complaints (which become `pkg/buddy-v05-backend` requirements)

### Methodological
- [ ] All canonical docs updated per SPEC_SYNC.md
- [ ] STATUS.md closeout checklist complete
- [ ] PR opened, ready for merge

---

## Closeout

- [ ] All phase tests pass
- [ ] STATUS.md closeout checklist complete
- [ ] Git tag created: `pkg/teen-ui-my-stats-lite/v1`
- [ ] No drift between canonical docs and live system
- [ ] End-to-end manual test on emulator confirms full package flow
