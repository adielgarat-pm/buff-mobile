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

### Phase 1 — Buddy assets (Wolf STORMY + Capybara LUNA)
**Goal:** Ship the buddy asset registry + per-skin SVG silhouettes so Phase 2/3 components can render Buddy regardless of PNG delivery status. PNGs land in a follow-up commit when Adi finishes Midjourney.

**Approach (locked in OQ1, extended for Capybara per Adi 2026-05-16):**
1. ✅ CC drafts 10 Midjourney prompts (5 wolf + 5 capybara) per BUFF_BRAND.md §7.5.
2. CC ships [src/components/buddy/buddyAssets.ts](../../../src/components/buddy/buddyAssets.ts) — `BUDDY_ASSETS_READY` constant + static `Record<BuddySkinId, Record<1..5, ImageSourcePropType | null>>` map + `getBuddyDefaultName()` helper (STORMY for wolf, LUNA for capybara).
3. CC ships [src/components/buddy/WolfSilhouette.tsx](../../../src/components/buddy/WolfSilhouette.tsx) — abstract wolf-head SVG, edge-glow scales with friendship level.
4. CC ships [src/components/buddy/CapybaraSilhouette.tsx](../../../src/components/buddy/CapybaraSilhouette.tsx) — parallel capybara-head SVG.
5. Adi runs Midjourney with the prompts (L3 first as anchor, then `--cref` for L1/L2/L4/L5), picks winning variants per buddy (max 2 prompt-iteration rounds).
6. Adi commits 10 PNGs to `assets/buddies/`.
7. CC follow-up commit: flip `BUDDY_ASSETS_READY = true`, uncomment the `require()`s.

**Stop condition for this commit (steps 1-4):** SVG silhouettes render. `npm run typecheck` passes. Phase 2 can start immediately on the fallback path.

**Stop condition for Phase 1 close (step 7):** All 10 PNGs landed and Adi has visually approved the result on Expo web, OR Adi has explicitly approved shipping on the SVG fallback for 2026-06-01.

**Exit deliverables:** STATUS row, INTEGRATION_LEARNINGS entry for egg-drop queued package (IN-2026-05-16-01), assets module + silhouettes committed.

---

### Phase 2 — No-buddy path (full 5B + Settings + shared components)
**Goal:** All work that pkg/teen-ui-my-stats-full was meant to ship. After this phase, the no-buddy variant works end-to-end on real device.

**Chunks:**

**2a. Hook mutators + helper hook**
- Add `setBuddyVisible(visible: boolean)` to `useBuddyRelationship` (optimistic + rollback).
- Add `setBuddyName(name: string | null)` to `useBuddyRelationship` (same pattern).
- New `useChildTasksCompletedLifetime(childId)` hook.
- Jest unit tests for all three.

**2b. Shared atomic components**
- `BuddyHero` (size: 'dashboard' | 'screen'; optional `onClose`). Renders `getBuddyAssetForLevel(skin, level)` ?? `<WolfSilhouette/CapybaraSilhouette>` based on `current_skin_id`.
- `LevelPill` (LEVEL N ●●●●○) — uses gender-aware HE labels (model A) driven by `profile.gender`.
- `BoostersCarousel` (Available / Used / Locked states).
- `BuddyToggleModal` (mode: 'hide' | 'show').
- `BuddyNameModal` — text input with default-name placeholder + Save/Cancel; calls `setBuddyName`.
- Snapshot tests for each at multiple level/state inputs.

**2c. Full 5B extension**
- Rewrite `GamerMyStatsScreen` to render the full Stitch 5B layout, reading from `useBuddyRelationship` + `useChildTasksCompletedLifetime` instead of `usePetState`.
- Pause Mode short-circuit preserved.
- i18n keys added (EN + HE), including the locked friendship-level labels:
  - L1 boy/other: `חברים` / girl: `חברות`
  - L2 boy/other: `חברים טובים` / girl: `חברות טובות`
  - L3 boy/other: `חברים קרובים` / girl: `חברות קרובות`
  - L4 boy/other: `החברים הכי טובים` / girl: `החברות הכי טובות`
  - L5 boy/other: `חברים לנצח` / girl: `חברות לנצח`
- Update existing `__tests__/GamerMyStatsScreen.test.tsx`.

**2d. Settings entries + modal wiring**
- Add "Buddy view" entry to `ChildSettingsScreen` (under Pet Skin section) → opens `BuddyToggleModal`.
- Add "Rename Buddy" entry directly below → opens `BuddyNameModal`.
- Both entries respect Pillar 3 (child voice, day-0 accessible).

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
- **First-launch trigger:** if `relationship.buddy_name === null` when 5A or dashboard first renders for this child, auto-open `BuddyNameModal`. After Save (or Cancel), `buddy_name` is set (or stays null with default shown). Modal does NOT re-open unless the child explicitly invokes Settings → Rename Buddy.

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
