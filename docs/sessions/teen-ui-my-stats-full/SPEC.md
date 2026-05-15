# teen-ui-my-stats-full — SPEC

> Extends the shipped 5B-lite version of `GamerMyStatsScreen` to the full Stitch 5B design now that V0.5 backend is live.
> Plus: a simple Hide/Show Buddy toggle in Settings (the `buddy_visible` column from V0.5).

**Slug:** `pkg/teen-ui-my-stats-full`
**Branch:** `pkg/teen-ui-my-stats-full`
**Depends on:** `pkg/buddy-v05-backend` must be merged first (this package imports `useBuddyRelationship` + `levelForSuccessfulDays` + types from `src/types/buddy`).
**Origin:** Phase 2 of the V0.5 rollout. Lite version shipped 2026-05-14 in `pkg/teen-ui-my-stats-lite` (PR #34/#39); backend shipped 2026-05-15 in `pkg/buddy-v05-backend` (PR open). This package makes the backend visible.

**Scoped down from the original "with-buddy-bundle" idea.** The 5A Me & Buddy screen, the 03 Buddy Toggle Modal, and the 01-with-buddy dashboard variant all need buddy character assets (Stormy Wolf rendered) which may not be ready. Those become `pkg/teen-ui-with-buddy-character` later.

---

## Capabilities & Bottlenecks

### Adi (PM)
- Reviews the 4 product Open Questions below.
- Approves any new user-facing copy.
- Decides if Hide/Show Buddy belongs in this package or a later one (CC default: include — it's small).

### CC (architect + implementer)
- All technical/architectural choices.
- Implementation, tests, doc updates.

### Bottlenecks
- **V0.5 backend PR must merge first** — this package imports `useBuddyRelationship` and types from `src/types/buddy` which only exist after that merge.

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without virtual reward?**
   ✅ Yes — the LEVEL pill and "X more days until you level up" are progress visualizations the child *requested* to see (per Stitch design feedback). Not gating, not asking.
2. **Does this bring the child closer to a self-chosen reward?**
   ✅ The BOOSTERS carousel surfaces gifts that include real-world reward affordances (e.g. reward-discount at L5).
3. **Does success feel like "I want to" or "I have to"?**
   ✅ "I want to" — no daily-must-visit, no penalty for not opening MY STATS.

### Pillar 2 — Positive Coaching
1. **Does the wording ever shame / compare / display failure?**
   ✅ No. The "X days until next level" copy is forward-looking ("3 more days!"), never "you missed N days." Successful_days_count never decrements per V0.5 spec.
2. **If the child fails — is the response empathy or pressure?**
   ✅ Empathy. A child returning after a break sees the same level + same count + same boosters they had — no zeroing.
3. **Is there a "suffering / loss / anger" mechanic for BUDDY?**
   ✅ N/A — this screen is the no-buddy variant. No buddy character to suffer.

### Pillar 3 — Independence-Building
1. **Does this make the child more capable *without* the app?**
   🟡 Neutral — observational. Same as the lite version.
2. **Does the child have a voice in this feature?**
   ✅ Yes — the Hide/Show Buddy toggle wires the V0.5 `buddy_visible` preference. A teen who finds buddy characters babyish gets to remove the buddy entirely (per Itay's feedback that drove the whole 5B branch).
3. **In 6 months, is this still necessary or did it do its job?**
   ✅ Still useful as long as the child uses the app; not a withdrawal-risk affordance.

**Values Check Pass:** ✅ Yes.

---

## Goals
- Replace the 3-stat lite content of `GamerMyStatsScreen` with the full Stitch 5B design: hero element + LEVEL pill + 3-stat grid + "Progress to LEVEL N" bar + BOOSTERS carousel.
- The screen reads from `buddy_relationships` (server source of truth) instead of (or alongside) `usePetState` (per-device).
- Add a Hide/Show Buddy toggle in `ChildSettingsScreen` that updates `buddy_relationships.buddy_visible`.
- A new write helper on the buddy hook for the `buddy_visible` toggle (the read hook from V0.5 is read-only — this package adds a focused mutator).

## Non-goals
- **No 5A Me & Buddy implementation** — separate package. This screen is the no-buddy variant only.
- **No 01 with-buddy dashboard variant** — separate package.
- **No 03 Buddy Toggle Modal** — fancy preview-both design. We ship a plain toggle in Settings instead.
- **No booster USE mechanics.** The BOOSTERS carousel renders cards; tapping an available booster shows a "coming soon" alert (or is inert). The use mechanics package handles application logic.
- **No tap-on-buddy navigation** — there is no buddy character on this screen. N/A.
- **No theme color picker.** A theme_color gift granted at L2 is *visible* in the carousel but the child can't apply it yet.
- **No level-up toast.** `has_pending_gift` is shown as a small badge on the BOOSTERS section title; full toast UI is a separate package.

---

## Behavior Contract

After this package merges:

1. A Gamer-mode child opens MY STATS tab.
2. Screen renders, in order top-to-bottom:
   - **Header** — "MY STATS" title + inert gear icon (unchanged from lite).
   - **Hero** — `<HeroPlaceholder>` element (per Open Question 1 below). NOT the full Stitch sound-wave SVG yet — TBD per OQ.
   - **LEVEL pill** — "LEVEL N ●●●●○" where N comes from `buddy_relationships.friendship_level` and the dots filled = N out of 5.
   - **Stat grid (3 cards)** — Days Active (`successful_days_count`), Successful Days (same as Days Active for now — see Open Question 2), Tasks Completed (lifetime, fetched from `daily_progress`). The lite version's "Total Buffs" / "Current Streak" stats stay in the dashboard; here we show the friendship stats.
   - **Progress to LEVEL N bar** — uses `daysUntilNextLevel()` from `src/types/buddy`. Hidden if at L5.
   - **BOOSTERS carousel** — horizontal scroll of `buddy_gifts_history` rows. Visual states: Available (lime border + glow, tappable but inert with "coming soon" alert), Used (faded, `is_used=true`), Locked (visible for L4/L5 boosters not yet earned, with 🔒 overlay).
3. If `useAppSettings.isPauseActive`, screen short-circuits to `PauseEmptyState` (unchanged from lite).
4. Child opens `ChildSettings` (Menu tab) → new "Hide Buddy" toggle row appears under the Pet Skin section. Toggling updates `buddy_relationships.buddy_visible` immediately. Effect on UI of OTHER screens is out of scope (those changes happen in `pkg/teen-ui-with-buddy-character`).
5. Pastel theme: this screen still doesn't render (the tab is hidden for Pastel, per `pkg/teen-ui-my-stats-lite`).

## Schema Changes

**None.** All needed schema is from `pkg/buddy-v05-backend`.

## Prompts Changes

**None.**

## API / Route Changes

- **New mutator on the buddy hook:** `useBuddyRelationship` extended with `setBuddyVisible(visible: boolean)` returning `{ error: Error | null }`. Optimistic update + Supabase write + rollback on error (mirrors the pattern in `useAppSettings.togglePause`).
- **New tasks-completed lifetime helper:** `useChildTasksCompletedLifetime(childId)` — small hook that counts `daily_progress` rows for the child (completed=true, revoked_at IS NULL). Could go in `useChildProgress` but creating a focused hook keeps `useChildProgress` un-bloated.
- No new routes / screens / navigation changes (extends an existing screen + adds a row to an existing screen).

## UI Changes

- `src/screens/child/GamerMyStatsScreen.tsx` — substantially extended (see Behavior Contract).
- `src/screens/child/ChildSettingsScreen.tsx` — adds Hide Buddy toggle row.
- `src/components/buddy/HeroPlaceholder.tsx` — new component for the Stitch 5B hero element.
- `src/components/buddy/LevelPill.tsx` — new component (`LEVEL N ●●●●○`).
- `src/components/buddy/BoostersCarousel.tsx` — new component.
- New i18n keys under `gamerMyStats.full.*` (EN + HE).

## Open Questions (product — for Adi)

### 1. Hero element source
Stitch 5B shows a "sound wave / abstract geometric pattern" in green as the hero element above the LEVEL pill. Implementation options:

- **(a)** Render an SVG via `react-native-svg` (the package is already installed) — lightweight, scales perfectly, no asset pipeline. CC writes a hand-coded SVG that approximates the Stitch design.
- **(b)** Use an image asset — needs the asset created/sourced. Either Stitch can export it or we generate it (Midjourney/etc.).
- **(c)** Skip the hero entirely for this package, ship just the stats + LEVEL + BOOSTERS. Add hero in a polish pass later.

**CC recommendation:** **(c)** for this package — keeps scope tight; visual polish without it is acceptable for a teen audience. The hero is decorative, not informational. **Adi: redirect if you'd rather have the hero in this PR.**

### 2. "Days Active" vs "Successful Days" — is the distinction worth showing?
Stitch 5B shows two stats with different labels: **"DAYS ACTIVE"** (47) and **"SUCCESSFUL DAYS"** (32). Currently we have one number (`successful_days_count`) that matches "Successful Days." "Days Active" would mean "calendar days since the friendship started" or "days the child opened the app at least once." Different concept.

- **(a)** Show both — add a `days_active` calculation (probably `EXTRACT(DAY FROM now() - relationship_started_at)` or count of `buddy_daily_check` rows where the child appeared). Backend change needed.
- **(b)** Drop "Days Active" — show only "Successful Days." Stitch design becomes 2 stats, not 3.
- **(c)** Show both with the same number for now (since `relationship_started_at` exists; "Days Active" = days since that started). Different number from "Successful Days." Adds info without backend work.

**CC recommendation:** **(c)** — maps to existing data, keeps Stitch's 3-card layout. Adi: redirect if "Days Active" isn't the right framing.

### 3. Theme color application
The L2 gift is `theme_color` — child gets to pick a custom accent color. Where does the color picker UI live?

- **(a)** Tapping the theme_color card in the BOOSTERS carousel opens a small picker modal. **Belongs in this package** (because the carousel exists here).
- **(b)** Theme color picker lives in Settings, a separate package.
- **(c)** Theme color is just visible in the carousel as a "you earned this" badge; the actual color application is in a future booster-mechanics package.

**CC recommendation:** **(c)** — keeps this package laser-focused on display. Booster USE = separate package per V0.5 SPEC scope. Adi: redirect if you'd rather we let kids actually pick the color now.

### 4. Settings toggle copy
The Hide Buddy toggle row needs a label + helper text.

- **CC default copy (EN):** "Show Buddy character" (toggle ON = buddy visible). Helper text: "Some teens prefer just stats. Your call."
- **CC default copy (HE):** "הצג דמות באדי" / "חלק מהמתבגרים מעדיפים רק נתונים. תחליט/י בעצמך."

**Adi: redirect either string if it doesn't match BUFF voice.**

## Out of Scope

- 5A Me & Buddy screen
- 03 Buddy Toggle Modal (fancy preview-both UX)
- 01 with-buddy dashboard variant
- Tap-on-buddy navigation (no buddy character here)
- Booster USE mechanics
- Theme color picker UI (per OQ3 default)
- Level-up toast notification
- L4 + L5 trigger logic (still V0.5 Phase 2)
- Children Mode (Pastel theme) equivalent — deferred to 1.1 design pass
