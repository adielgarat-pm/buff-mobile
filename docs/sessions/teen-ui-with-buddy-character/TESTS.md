# teen-ui-with-buddy-character — Tests

> Acceptance criteria per phase. CC runs automated tests; Adi runs manual emulator/web checks where marked 🧑.

## Phase 0 — Session folder

- [ ] SPEC.md, ROADMAP.md, STATUS.md, SPEC_SYNC.md, TESTS.md exist under `docs/sessions/teen-ui-with-buddy-character/`.
- [ ] Adi reviews SPEC and approves (`approved, proceed`).
- 🧑 No code, no app verification needed.

## Phase 1 — Wolf STORMY assets

- [ ] 5 asset files exist at `assets/buddies/wolf-stormy-L{1,2,3,4,5}.png` (or SVG fallback at `assets/buddies/wolf-stormy-silhouette.*` if fallback chosen).
- [ ] Module-level `WOLF_ASSETS_READY` constant + static `require()` map present in a `src/components/buddy/wolfAssets.ts` (or equivalent).
- [ ] Project still builds: `npm run typecheck` ✅.
- 🧑 Adi has visually approved the 5 Midjourney variants OR explicitly approved shipping with the SVG fallback.

## Phase 2 — No-buddy path

**Automated:**
- [ ] `npm run typecheck` ✅.
- [ ] Jest: new tests for `setBuddyVisible` (optimistic + rollback paths) — 100% of new logic covered.
- [ ] Jest: new tests for `useChildTasksCompletedLifetime`.
- [ ] Snapshot tests for `LevelPill`, `BoostersCarousel`, `BuddyToggleModal` at multiple props.
- [ ] Existing `__tests__/GamerMyStatsScreen.test.tsx` updated and passing.
- [ ] i18n key validator script passes (per `pkg/test-infrastructure`).

**Manual (Expo web first per feedback_ui_verification, then emulator per F-2026-05-14-01 if any new native bits):**
- 🧑 Open Gamer-mode MY STATS tab → full Stitch 5B layout renders (LEVEL pill + 3 stats + progress bar + BOOSTERS carousel).
- 🧑 Numbers match `buddy_relationships` row (Adi verifies one child against Supabase SQL editor).
- 🧑 Settings → "Buddy view" entry → opens 03 modal in correct mode based on current `buddy_visible`.
- 🧑 Tap "Hide Buddy" in modal → modal closes, `buddy_visible → false` in DB (Adi spot-checks one row).
- 🧑 Re-open Settings → entry now says "Show Buddy?" → tap "Show Buddy" → `buddy_visible → true`.
- 🧑 Pause Mode active → MY STATS tab still short-circuits to `PauseEmptyState`.

**Doc updates (same commit as code):**
- [ ] STATUS row updated.
- [ ] BUFF_GAP_ANALYSIS rows for "5B MY STATS full" + "Hide Buddy in Settings" → ✅.
- [ ] INTEGRATION_LEARNINGS entry if anything surprised.

**Values Check (per WORKFLOW Sub-mode B):**
- [ ] All 9 questions still pass for the implemented behavior (not just the SPEC text).

## Phase 3 — With-buddy path

**Automated:**
- [ ] `npm run typecheck` ✅.
- [ ] Jest: snapshot tests for `BuddyHero` at sizes 'dashboard' and 'screen', levels L1-L5.
- [ ] Jest: tests for `GamerMeAndBuddyScreen` rendering at different levels + with `buddy_visible=false` redirect behavior (if any).
- [ ] Existing `__tests__` for `GamerDashboardScreen` updated and passing.

**Manual:**
- 🧑 Open Gamer-mode dashboard with `buddy_visible=true` → Wolf STORMY hero region renders above stats. Correct level art shown.
- 🧑 Tap on Wolf avatar (not the `×`) → stack push to 5A Me & Buddy.
- 🧑 5A renders: hero Wolf, name "Stormy", hearts chip, 3-stat grid, progress bar, Buddy Story line, BOOSTERS carousel.
- 🧑 Tap the `×` on dashboard Buddy avatar → 03 modal opens in 'hide' mode.
- 🧑 Confirm Hide → returns to dashboard, Buddy region gone, layout collapses cleanly (no empty gap).
- 🧑 From Menu/Profile entry → also pushes 5A.
- 🧑 With `buddy_visible=false`, Menu entry still works and 5A still renders (5A is the "Me & Buddy" lookup, not gated by `buddy_visible`).
- 🧑 Pause Mode active → both dashboard and 5A short-circuit to `PauseEmptyState`.

**Doc updates (same commit as code):**
- [ ] STATUS row updated.
- [ ] BUFF_GAP_ANALYSIS rows for "Dashboard with-Buddy variant", "5A Me & Buddy", "03 Buddy Toggle Modal" → ✅.

**Values Check:**
- [ ] All 9 questions still pass.

## Phase 4 — Regression + closeout

**Automated:**
- [ ] Full Jest suite passes.
- [ ] `npm run typecheck` ✅.

**Manual regression — IN-2026-05-14-04 mitigation:**
- 🧑 Open dashboard in Mint theme → switch to Gamer (Settings → Pet Skin → Wolf) → verify tab bar stays rendered, dashboard re-renders cleanly.
- 🧑 Rapid toggle Mint→Gamer→Mint→Gamer 5 times → no blank tab bar, no white flash, no crashed screen.
- 🧑 With Wolf selected, Hide Buddy → switch to Mint → switch back to Gamer → Buddy still hidden.

**Manual regression — TRACK_6 flows:**
- 🧑 Flow #5 (Teen with-Buddy → Wolf STORMY dashboard) — pass.
- 🧑 Flow #6 (richer 03 Buddy Toggle modal — confirmation, bullets, Keep/Hide buttons) — pass.

**Manual round-trip:**
- 🧑 Hide via dashboard `×` → Show via Settings entry → Hide via Settings entry → Show via … (verify both surfaces stay in sync).

**Closeout:**
- [ ] STATUS marked closed (all phases `_passed_`, closeout checklist complete).
- [ ] INTEGRATION_LEARNINGS final entries.
- [ ] `pkg/teen-ui-my-stats-full` branch closed (no PR). GAP_ANALYSIS note added.
- [ ] PR opened to main with link to this SPEC.
- [ ] After merge: Verify-Before-Delete protocol → branch cleanup.

**Values Check:**
- [ ] All 9 questions verified against shipped behavior (not just SPEC text).
