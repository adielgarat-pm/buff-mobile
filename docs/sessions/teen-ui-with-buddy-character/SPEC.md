# teen-ui-with-buddy-character — SPEC

> The "with-buddy" half of teen UI. Ships Wolf STORMY on the Gamer dashboard, the 5A Me & Buddy screen, the 03 Buddy Toggle (Hide?) confirmation modal, and — absorbed from `pkg/teen-ui-my-stats-full` which was never executed — the full 5B MY STATS extension plus the Settings "Hide Buddy" entry. After this merges, both the with-buddy and no-buddy variants of Teen UI are complete.

**Slug:** `pkg/teen-ui-with-buddy-character`
**Branch:** `pkg/teen-ui-with-buddy-character` (off `main`)
**Origin:** Graduated from the umbrella `docs/sessions/beta-2026-06-01/TRACK_7_teen_ui_with_buddy_character_SPEC.md` (on sibling branch `claude/busy-euclid-e43458`).
**Unblocks regression flows:** TRACK_6 #5 (Teen with-Buddy → Wolf STORMY dashboard), #6 (richer 03 Buddy Toggle modal).
**Target ship:** 2026-06-01.

---

## Capabilities & Bottlenecks (Capability Check)

### Adi (PM)
- Reviews each phase's plan before code; approves `approved, proceed` per chunk.
- Approves Wolf STORMY image variants when Phase 1 produces candidates.
- Redlines Buddy Story copy drafts (HE + EN) in Phase 5.

### CC (architect + implementer)
- All technical/architectural choices (component shape, navigation pattern, hook mutator design, file layout).
- Drafts Midjourney prompts for Wolf STORMY in Phase 1 — Adi picks the winning set.
- Implementation, unit tests, doc updates.
- Web-compat check per F-2026-05-14-01 before any new native dep (none anticipated).

### Bottlenecks
- **Wolf STORMY asset path**. Midjourney is the primary route; SVG silhouette fallback is the parachute (see Phase 1). The fallback exists specifically so this isn't a blocker.
- **Theme-switch regression risk** (IN-2026-05-14-04). Any change to `GamerDashboardScreen` must apply the module-level stable-constants pattern and pass rapid Mint↔Gamer toggle verification.

---

## Source-of-truth corrections vs the umbrella SPEC

Two drifts surfaced during pre-Phase-0 review of the umbrella TRACK_7 SPEC. Both are resolved here; the umbrella file is now historical.

### DRIFT-1 — `LevelPill` / `BoostersCarousel` / `HeroPlaceholder` / Hide-Buddy toggle do not exist on main

The umbrella SPEC claimed PR #46 (`pkg/teen-ui-my-stats-full`) shipped these reusable components. PR #46's actual diff (`git show 462c571 --stat`) only added the V0.5 backend (hook, types, schema, EOD pg_cron) plus the SPEC document for `teen-ui-my-stats-full`. The implementation work on the branch never happened; its last commit is literally `plan(teen-ui-my-stats-full): SPEC only`.

**Resolution: P2 — absorb the missing UI work into this package.** Single PR ships both Teen UI variants. The `pkg/teen-ui-my-stats-full` branch and its SPEC become historical; this SPEC supersedes it.

### DRIFT-2 — 03 is a confirmation modal, not a preview-both UI

The umbrella SPEC described 03 as "fancy preview-both modal (live preview dashboard with/without buddy)." The Stitch design at [docs/teen-ui-design/buddy-toggle-flow/](../../teen-ui-design/buddy-toggle-flow/) — ✅ Approved 2.5.2026 by Itay — shows a bottom-sheet confirmation modal:

- Title: "Hide Buddy?"
- Subtitle: "Your Buddy keeps helping you in the background. You'll still earn Boosters and level up."
- Three ✓ bullets: Boosters still arrive / Friendship levels still progress / Show Buddy again anytime in Settings.
- Buttons: Keep Buddy (outline lime) / Hide Buddy (filled lime).
- Background = dimmed dashboard (the Buddy is faintly visible through blur — that's the "preview").

**Resolution: per [CLAUDE.md](../../../CLAUDE.md) doc hierarchy, the Stitch design wins.** 03 is the hide-confirmation modal that fires from any hide attempt (dashboard `×` on Buddy, or Settings entry). No separate preview UI is built.

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| `pkg/buddy-v05-backend` | ✅ shipped 2026-05-15 | Provides `buddy_relationships` table, `useBuddyRelationship` read-hook, `src/types/buddy.ts` (`BuddyRelationship`, `BuddyGift`, `levelForSuccessfulDays`, `daysUntilNextLevel`, `FRIENDSHIP_LEVEL_THRESHOLDS`). |
| `pkg/teen-ui-my-stats-full` | ✋ **superseded by this package** | Branch + SPEC doc remain in repo for traceability; will be closed (no PR) once this package ships. |
| `pkg/teen-ui-my-stats-lite` | ✅ shipped 2026-05-14 (PR #34 / #39) | Lite version of 5B in `main` today. Replaced by Phase 2 of this package. |
| Wolf STORMY asset | 🟢 **path locked: Midjourney primary, SVG silhouette parachute** | See Phase 1. |
| Stitch 08 (Teen Onboarding Buddy Choice) | ❌ not designed | Out of scope. Default `buddy_visible = true` is set at child-profile creation per `pkg/buddy-v05-backend` backfill. |

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without virtual reward?**
   ✅ Wolf is a *companion*, not a coin dispenser. Per [BUFF_BUDDY_SYSTEM.md](../../BUFF_BUDDY_SYSTEM.md), the friendship grows from the child's success, not from grinding.
2. **Does this bring the child closer to a self-chosen reward?**
   ✅ Tap-on-Buddy → 5A → BOOSTERS carousel surfaces gifts that include real-world reward affordances at higher levels.
3. **Does success feel like "I want to" or "I have to"?**
   ✅ Buddy is opt-in via `buddy_visible`. Nothing forces engagement.

### Pillar 2 — Positive Coaching
1. **Does the wording ever shame / compare / display failure?**
   ✅ No. "X more days until you level up" is forward-looking. `successful_days_count` never decrements per V0.5 spec.
2. **If the child fails — is the response empathy or pressure?**
   ✅ Wolf doesn't react to incomplete days. `friendship_level` never decrements. The 03 confirmation modal bullets ("Friendship levels still progress") proactively prevent loss-anxiety when hiding Buddy.
3. **Is there a "suffering / loss / anger" mechanic for Buddy?**
   ✅ Hard rule — none. No animation triggers tied to "low completion" or "skipped day." Pause Mode short-circuits per existing pattern (no Buddy rendered during Pause — by absence rather than a sad pose). Verify in Phase 4 tests.

### Pillar 3 — Independence-Building
1. **Does this make the child more capable *without* the app?**
   🟡 Neutral — Buddy is an in-app companion. But the *option to hide* is the independence-building mechanic.
2. **Does the child have a voice in this feature?**
   ✅ Three voice points: dashboard `×` on the Buddy avatar (03 modal), Settings "Hide Buddy" entry (03 modal), and the eventual Teen Onboarding Buddy Choice (Stitch 08, separate package).
3. **In 6 months, is this still necessary or did it do its job?**
   ✅ Either outcome serves the kid — keeps Wolf, or hides Wolf and works the no-buddy stats variant. Both are first-class.

**Values Check Pass:** ✅ all 9 pass.

---

## Locked Open Questions

All five umbrella OQs are resolved here, recorded for traceability.

| OQ | Resolution | Notes |
|---|---|---|
| OQ1 — Wolf STORMY asset | **(a) Midjourney primary + (b) SVG silhouette parachute** | Phase 1 generates 5 variants per BUFF_BRAND.md §7.5 Gamer spec. If 2 iteration rounds don't produce teen-acceptable art, ship the SVG and swap in Midjourney art post-merge. Stops being a blocker. |
| OQ2 — 5A Buddy Story copy | **CC drafts 5 lines × {HE, EN}; Adi redlines** | Lines surface as a 1-line "Buddy Story" sub-line per friendship level. Stub text used during Phase 5 dev; finalized before merge. |
| OQ3 — 5A entry points | **Both — tap-on-Buddy (stack-modal push) + Menu/Profile sub-entry. No new top-level tab.** | Matches Itay's 5a [design-notes.md](../../teen-ui-design/me-and-buddy/5a-with-buddy/design-notes.md) which specifies both. Tab bar stays at 5 (Home / Tasks / Rewards / Stats / Menu). |
| OQ4 — 03 modal scope | **Per DRIFT-2: 03 = confirmation modal per Stitch. No separate plain Settings toggle.** | Both surfaces (dashboard `×`, Settings entry) open the same 03 modal. Itay-approved bullets do Pillar 2 work. |
| OQ5 — Pause Mode Buddy state | **Moot — short-circuit to `PauseEmptyState` per existing pattern.** | [GamerDashboardScreen.tsx:122](../../../src/screens/child/GamerDashboardScreen.tsx:122) + [GamerMyStatsScreen.tsx:58](../../../src/screens/child/GamerMyStatsScreen.tsx:58) already short-circuit. 5A will follow the same pattern. No Buddy character rendered during Pause; no 6th asset variant needed. Pillar 2 satisfied by absence. |

---

## Goal

After this merges, **both Teen UI variants are complete**:

**With-buddy variant** (`buddy_visible = true`):
- Gamer dashboard renders Wolf STORMY at current `friendship_level` in a top hero region, with a small `×` button to hide.
- Tap on Wolf → 5A "Me & Buddy" screen (stack push) with hero Wolf, LEVEL pill, 3-stat grid, "Progress to next level" bar, BOOSTERS carousel, and a 1-line Buddy Story flavor text per level.
- Menu/Profile area surfaces an entry that opens 5A (second entry point per Itay design).
- The dashboard `×` opens the 03 Hide-Buddy confirmation modal.

**No-buddy variant** (`buddy_visible = false`):
- Gamer dashboard renders without the Buddy region (no Wolf).
- 5B MY STATS tab renders the **full** Stitch 5B layout (LEVEL pill + 3 stats + progress bar + BOOSTERS carousel), reading from `buddy_relationships`. The 5B-lite version on `main` is replaced.
- Settings screen has a "Hide Buddy" entry that opens the same 03 modal.

**Shared:**
- `useBuddyRelationship` gains a `setBuddyVisible(visible: boolean)` mutator. Optimistic update + Supabase write + rollback on error (mirrors `useAppSettings.togglePause`).
- During Pause Mode, both dashboard and 5A/5B short-circuit to `PauseEmptyState` (no Buddy rendered).

---

## Non-goals

- ❌ Onboarding Buddy Choice screen (Stitch 08) — separate package.
- ❌ Booster USE mechanics — separate package. The carousel renders states (Used / Available / Locked); tapping an Available booster shows "coming soon."
- ❌ Theme color picker UI — L2 theme_color gift is *visible* in the carousel but not applicable yet.
- ❌ Level-up toast notifications — `has_pending_gift` shows as a small badge on the BOOSTERS section title; full toast is a separate package.
- ❌ Realtime subscription on `useBuddyRelationship` — still poll-once + `refetch`.
- ❌ Wolf idle-breathing / animations — static images. Animation is post-MVP polish.
- ❌ Pastel/Children-Mode equivalent of Buddy/5A — deferred to 1.1.
- ❌ Sound effects / haptics on tap-on-Buddy.
- ❌ Any change to `pet_state` AsyncStorage state — coexists per V0.5 spec.

---

## Behavior Contract

1. **`buddy_visible = true`:**
   - Gamer dashboard top region shows Wolf STORMY at current `friendship_level`.
   - "Best Friends ❤❤❤❤❤" chip below the Wolf — N filled hearts (lime green per [5a design-notes.md](../../teen-ui-design/me-and-buddy/5a-with-buddy/design-notes.md)), 5-N empty.
   - Small `×` button at top-right of Buddy avatar → opens 03 modal.
   - Tap on Wolf avatar (excluding the `×`) → stack push to 5A.
2. **`buddy_visible = false`:**
   - Dashboard renders without the Buddy region. Layout collapses cleanly (no empty space).
3. **5B (MY STATS tab)** — always renders the **full** layout regardless of `buddy_visible`:
   - Header (unchanged from lite).
   - LEVEL pill: `LEVEL N ●●●●○` (N filled out of 5).
   - 3-stat grid: **Days Together** (days since `relationship_started_at`) / **Successful Days** (`successful_days_count`) / **Tasks Completed** (lifetime via new `useChildTasksCompletedLifetime` hook).
   - "Progress to LEVEL N+1" bar using `daysUntilNextLevel()`. Hidden at L5.
   - BOOSTERS carousel reading from `buddy_gifts_history` for this child. Card states: Available (lime border + glow, tappable → "coming soon" alert), Used (faded, `is_used=true`), Locked (visible for L4/L5 boosters not yet earned, with 🔒 overlay).
   - Pause Mode: short-circuits to `PauseEmptyState` (unchanged from lite).
4. **5A (Me & Buddy)** — new screen, stack-push from dashboard tap or Menu/Profile entry:
   - Hero Wolf at current level (larger than dashboard avatar).
   - Wolf name (default `'Stormy'`; reads `buddy_relationships.buddy_name` if non-null).
   - "Best Friends" chip with N green hearts.
   - 3-stat grid (same as 5B).
   - "Progress to next level" bar.
   - **Buddy Story** sub-line per level (the OQ2 copy — 1 short line, e.g. L1 "Stormy is settling in" / L5 "Stormy is your wingmate now").
   - BOOSTERS carousel (same component as 5B).
   - Pause Mode: short-circuits to `PauseEmptyState`.
5. **Settings (`ChildSettingsScreen`)** — new "Buddy view" entry under the Pet Skin section. Tapping it opens 03 modal regardless of current state:
   - If currently visible → modal says "Hide Buddy?", Hide button toggles `buddy_visible → false`.
   - If currently hidden → modal says "Show Buddy?", Show button toggles `buddy_visible → true`. Same bullets, reversed CTAs.
6. **03 Buddy Toggle Modal** — single component, parameterized on current visibility. Per Stitch design:
   - Bottom-sheet with handle.
   - Dimmed dashboard underneath (per Stitch — visible only when invoked from dashboard).
   - Buttons toggle `buddy_visible` via `setBuddyVisible()`. Optimistic UI; on error, alert + revert.
7. **Pastel theme** — unchanged. Children mode is not touched (per non-goals).

---

## Schema Changes

**None.** All needed schema is in `pkg/buddy-v05-backend`.

---

## API / Route Changes

- **Hook mutator added:** `useBuddyRelationship` gains `setBuddyVisible(visible: boolean): Promise<{ error: Error | null }>`. Optimistic state update + Supabase `UPDATE buddy_relationships SET buddy_visible = $1, updated_at = now() WHERE child_profile_id = $2` + rollback-on-error. Pattern mirrors [useAppSettings.togglePause](../../../src/hooks/useAppSettings.ts).
- **New hook:** `useChildTasksCompletedLifetime(childId)` — counts `daily_progress` rows for the child (`completed=true AND revoked_at IS NULL`). Focused helper; not folded into `useChildProgress` to keep that hook un-bloated.
- **Navigation:** stack-push route for 5A `GamerMeAndBuddyScreen`. Likely a new screen registered in the child stack navigator (parallel to existing stack screens) rather than a tab.

---

## UI Changes

| Path | Change |
|---|---|
| `src/screens/child/GamerDashboardScreen.tsx` | Adds Buddy hero region (conditional on `buddy_visible`) above stats. Applies module-level stable-constants pattern per IN-2026-05-14-04. |
| `src/screens/child/GamerMyStatsScreen.tsx` | Replaces lite content with full Stitch 5B layout (LEVEL pill + 3 stats + progress bar + BOOSTERS carousel). |
| `src/screens/child/GamerMeAndBuddyScreen.tsx` | **New** — 5A. |
| `src/screens/child/ChildSettingsScreen.tsx` | Adds "Buddy view" entry that opens 03 modal. |
| `src/navigation/ChildTabs.tsx` (or appropriate stack file) | Registers `GamerMeAndBuddyScreen` for stack-push from dashboard + Menu entry. |
| `src/components/buddy/BuddyHero.tsx` | **New** — renders Wolf at current level + optional `×` button + hearts chip. Shared by dashboard + 5A. |
| `src/components/buddy/LevelPill.tsx` | **New** — `LEVEL N ●●●●○`. |
| `src/components/buddy/BoostersCarousel.tsx` | **New** — horizontal scroll, three card states. |
| `src/components/buddy/BuddyToggleModal.tsx` | **New** — 03 confirmation, parameterized by current `buddy_visible`. |
| `assets/buddies/wolf-stormy-L1.png` … `wolf-stormy-L5.png` | **New** — 5 Midjourney variants per BUFF_BRAND.md §7.5. SVG fallback if needed. |
| `src/hooks/useBuddyRelationship.ts` | Adds `setBuddyVisible` mutator. |
| `src/hooks/useChildTasksCompletedLifetime.ts` | **New** — counts `daily_progress` rows. |
| `src/i18n/en/gamerBuddy.json`, `src/i18n/he/gamerBuddy.json` (paths TBD per existing i18n layout) | New keys: hero status lines, 03 modal strings, "Buddy view" Settings entry, "Days Together"/"Successful Days"/"Tasks Completed" stat labels, Buddy Story lines L1-L5, "coming soon" alert. |

---

## Architectural Decisions

| # | Decision | Reasoning |
|---|---|---|
| 1 | **`BuddyHero` is one component** with a `size` prop ('dashboard' \| 'screen') and an optional `onClose` (the `×`). Used in both dashboard and 5A. | Single source of Wolf rendering — no two-implementation drift. |
| 2 | **`BuddyToggleModal` is one component** parameterized by `mode: 'hide' \| 'show'`. | Same bullets and structure; CTA copy and effect flip. |
| 3 | **Wolf asset selection by level via static `require()` map** — no dynamic URI. | Expo metro can't dynamically `require` paths; the map is a Record<1\|2\|3\|4\|5, ImageSourcePropType>. Tree-shake friendly. |
| 4 | **5A is a stack-push, not a tab.** Menu/Profile entry routes to the same stack screen. | Keeps tab bar lean. Itay's 5a design-notes match. |
| 5 | **`setBuddyVisible` lives on `useBuddyRelationship`**, not as a separate hook. | The mutator is intrinsic to the relationship row; pairing it with the reader avoids context-import sprawl. |
| 6 | **Phase 1 ships assets behind a fallback gate.** If `WOLF_ASSETS_READY` (a module-level constant set when assets land) is `false`, `BuddyHero` renders the SVG silhouette. Swappable in a 1-line PR. | Decouples asset delivery from code delivery; protects 2026-06-01. |
| 7 | **3-stat grid uses identical components in 5A and 5B.** | YAGNI separate components — same shape, same data source. |
| 8 | **No realtime subscription.** Refetch on app foreground (existing pattern) catches overnight EOD level-ups. | Adds complexity (channel cleanup, RLS edge cases) not needed for MVP. Toast-on-level-up is a separate package. |

---

## Proposed Phased Chunks

See [ROADMAP.md](ROADMAP.md) for the full phase breakdown. Quick shape:

- **Phase 0** — Session folder (this commit). No code.
- **Phase 1** — Wolf STORMY assets via Midjourney (Adi approves variants); SVG fallback wired.
- **Phase 2** — No-buddy path. Shared components (LevelPill, BoostersCarousel, BuddyToggleModal), `setBuddyVisible` mutator, `useChildTasksCompletedLifetime` hook, full 5B extension, Settings "Buddy view" entry.
- **Phase 3** — With-buddy path. `BuddyHero`, dashboard hero region + `×`, tap-on-Buddy navigation, `GamerMeAndBuddyScreen` (5A), Menu/Profile entry.
- **Phase 4** — Regression: TRACK_6 flows #5 + #6, rapid Mint↔Gamer toggle (IN-2026-05-14-04), exit deliverables.

---

## Risks

- **Theme-switch regression** (IN-2026-05-14-04). Mitigated by Decision 1+6 (module-level constants) and Phase 4 rapid-toggle verification.
- **Midjourney quality** for Wolf variants. Mitigated by Decision 6 (SVG fallback) — Phase 1 doesn't block.
- **Animation creep**. Resisted — static images only.
- **Scope creep into booster USE mechanics**. Carousel renders states only; "coming soon" alert is the contract.

---

## Out of Scope

- Booster USE mechanics (×2 Buffs day-application, Skip Token use flow, Reward Discount apply).
- Theme color picker UI.
- Level-up toast notifications.
- Levels 4+5 EOD logic (backend Phase 2).
- Realtime subscription on `useBuddyRelationship`.
- Pastel/Children-Mode Buddy equivalent.
- Onboarding Buddy Choice (Stitch 08).
- Multi-language Buddy names (default `'Stormy'`, customization is future polish).

---

**Last reviewed:** 2026-05-16 (CC, Phase 0 draft)
