# teen-ui-with-buddy-character — Roadmap

> Phase sequencing for this package. Each phase has its acceptance criteria in [TESTS.md](TESTS.md).
> CC runs each phase in Plan Mode, ships chunk-by-chunk with diff review, and updates STATUS.md as the phase exit deliverable.

## Phases

### Phase 0 — Session folder
**Goal:** Establish session folder, lock SPEC, commit Phase 0 baseline.

**Deliverables (this commit):**
- `docs/sessions/teen-ui-with-buddy-character/SPEC.md`
- `docs/sessions/teen-ui-with-buddy-character/ROADMAP.md` (this file)
- `docs/sessions/teen-ui-with-buddy-character/STATUS.md`
- `docs/sessions/teen-ui-with-buddy-character/SPEC_SYNC.md`
- `docs/sessions/teen-ui-with-buddy-character/TESTS.md`

**Stop condition:** Adi reviews and approves.

---

### Phase 1 — Wolf STORMY assets
**Goal:** Land 5 Wolf STORMY image variants (L1-L5) into `assets/buddies/`, with SVG fallback wired so the rest of the package isn't blocked on art.

**Approach (locked in OQ1):**
1. CC drafts 5 Midjourney prompts per BUFF_BRAND.md §7.5 (Gamer aesthetic: charcoal greys + neon green edge highlights, void-black background).
2. Adi runs prompts in Midjourney, picks the winning set (or asks for prompt iteration — max 2 rounds).
3. CC commits 5 `wolf-stormy-L{1,2,3,4,5}.png` files to `assets/buddies/`.
4. CC commits an SVG silhouette fallback at `assets/buddies/wolf-stormy-silhouette.tsx` (or PNG, TBD) — used by Phase 2/3 components when `WOLF_ASSETS_READY` is `false`.
5. CC adds a module-level `WOLF_ASSETS_READY` constant + static `require()` map.

**Stop condition:** Adi approves the 5 variants OR Adi approves shipping with the SVG fallback while Midjourney iterates async. Either way, Phase 2 can start.

**Exit deliverables:** STATUS row + asset paths recorded.

---

### Phase 2 — No-buddy path (full 5B + Settings + shared components)
**Goal:** All work that pkg/teen-ui-my-stats-full was meant to ship. After this phase, the no-buddy variant works end-to-end on real device.

**Chunks:**

**2a. Hook mutator + helper hook**
- Add `setBuddyVisible(visible: boolean)` to `useBuddyRelationship` (optimistic + rollback).
- New `useChildTasksCompletedLifetime(childId)` hook.
- Jest unit tests for both.

**2b. Shared atomic components**
- `BuddyHero` (size: 'dashboard' | 'screen'; optional `onClose`).
- `LevelPill` (LEVEL N ●●●●○).
- `BoostersCarousel` (Available / Used / Locked states).
- `BuddyToggleModal` (mode: 'hide' | 'show').
- Snapshot tests for each at multiple level/state inputs.

**2c. Full 5B extension**
- Rewrite `GamerMyStatsScreen` to render the full Stitch 5B layout, reading from `useBuddyRelationship` + `useChildTasksCompletedLifetime` instead of `usePetState`.
- Pause Mode short-circuit preserved.
- i18n keys added (EN + HE).
- Update existing `__tests__/GamerMyStatsScreen.test.tsx`.

**2d. Settings entry + 03 modal wiring**
- Add "Buddy view" entry to `ChildSettingsScreen` (under Pet Skin section).
- Tap → opens `BuddyToggleModal` in the appropriate mode.

**Stop condition:** No-buddy variant works end-to-end. Adi verifies on emulator/web that toggling Hide → re-renders 5B without Buddy expectation, and the Settings entry shows the right modal copy depending on current state.

**Exit deliverables:**
- Update [BUFF_GAP_ANALYSIS.md](../../BUFF_GAP_ANALYSIS.md) — row "5B MY STATS full" → ✅, row "Hide Buddy in Settings" → ✅.
- STATUS row.
- Append to [INTEGRATION_LEARNINGS.md](../../INTEGRATION_LEARNINGS.md) if anything surprised.

---

### Phase 3 — With-buddy path (dashboard Buddy region + 5A)
**Goal:** After this phase, the with-buddy variant works end-to-end.

**Chunks:**

**3a. Dashboard Buddy region**
- Add hero region to `GamerDashboardScreen`, conditional on `useBuddyRelationship().relationship?.buddy_visible !== false`.
- Use module-level stable constants pattern (IN-2026-05-14-04).
- `×` button on top-right of avatar → opens `BuddyToggleModal` in 'hide' mode.
- Tap on Wolf (excluding `×`) → stack-push to `GamerMeAndBuddyScreen`.

**3b. 5A Me & Buddy screen**
- New `GamerMeAndBuddyScreen` per Stitch 5A.
- Reuses `BuddyHero` (size='screen'), `LevelPill`, `BoostersCarousel`.
- Buddy Story sub-line: stubbed lines for L1-L5, EN + HE (Adi redlines before Phase 4).
- Pause Mode short-circuit per existing pattern.

**3c. Navigation wiring**
- Register `GamerMeAndBuddyScreen` in the child stack navigator.
- Add Menu/Profile entry that pushes 5A (second entry point per Itay 5a design-notes).

**3d. Buddy Story copy finalized**
- CC drafts 5 EN + 5 HE lines; Adi redlines.
- Commit final strings to i18n.

**Stop condition:** With-buddy variant works end-to-end. Tap-on-Buddy from dashboard pushes 5A. Settings → 03 → Hide → dashboard re-renders without Buddy. Show again restores. Menu entry pushes 5A regardless of `buddy_visible`.

**Exit deliverables:**
- Update [BUFF_GAP_ANALYSIS.md](../../BUFF_GAP_ANALYSIS.md) — rows "Dashboard with-Buddy variant" → ✅, "5A Me & Buddy" → ✅, "03 Buddy Toggle Modal" → ✅.
- STATUS row.

---

### Phase 4 — Regression + closeout
**Goal:** Verify nothing regressed, close the package.

**Checks:**
- TRACK_6 flow #5 (Teen with-Buddy → Wolf STORMY dashboard) — pass on real device or Expo web.
- TRACK_6 flow #6 (richer 03 Buddy Toggle modal) — pass.
- Rapid Mint↔Gamer toggle (IN-2026-05-14-04) — tab bar stable, no blank screens.
- Pause Mode: dashboard + 5B + 5A all short-circuit to `PauseEmptyState` correctly.
- Hide → Show round-trip via dashboard `×` AND via Settings entry — both work.
- Mark `pkg/teen-ui-my-stats-full` branch closed (no PR; superseded by this package). Update GAP_ANALYSIS accordingly.

**Stop condition:** All checks pass. Adi gives green light.

**Exit deliverables:**
- STATUS marked closed.
- INTEGRATION_LEARNINGS.md updated with any drift/surprises.
- PR opened to `main`. After merge: git tag + branch cleanup per Verify-Before-Delete protocol.

---

## Stop conditions between phases

A phase does NOT start until:
1. The previous phase's STATUS row reads `_passed_`.
2. Adi has run any manual checks listed in TESTS.md and confirmed.
3. Exit deliverables (SPEC_SYNC doc updates, learnings) are in the same commit as the phase's code.

## Replan triggers

Trigger a replan (back to Plan Mode discussion with Adi) if:
- Midjourney can't produce teen-acceptable art in 2 rounds (Phase 1 → consider locking SVG path or extending timeline).
- A regression in IN-2026-05-14-04 appears during Phase 3 dashboard work that the stable-constants pattern doesn't fix.
- A new product requirement surfaces that touches the Behavior Contract.
