# teen-ui-my-stats-lite — SPEC

> Target state for this package. Authoritative until superseded by a later session.
> Wins over canonical docs during the package; canonical docs update at exit per SPEC_SYNC.md.

**Slug:** `pkg/teen-ui-my-stats-lite`
**Branch:** `pkg/teen-ui-my-stats-lite`
**Stitch design:** [docs/teen-ui-design/me-and-buddy/5b-my-stats/](../../teen-ui-design/me-and-buddy/5b-my-stats/)
**Dependency on:** none — uses existing `usePetState` / `useChildData` data only.
**Unblocks:** nothing yet (real 5B will replace this when `pkg/buddy-v05-backend` ships).

---

## Capabilities & Bottlenecks

### What Claude.ai (web) does
- Approves spec drift from Itay's 2026-05-02-approved 5B (no LEVEL pill, no BOOSTERS carousel, no hero image, no "Progress to LEVEL N").
- Confirms placement decision (5th tab vs settings-icon push).
- Reviews any new user-facing strings before merge.

### What Claude Code (CC) does
- Adds `GamerMyStatsScreen.tsx` under `src/screens/child/`.
- Wires it into navigation per the placement decision.
- Adds i18n strings under `gamerMyStats.*` namespace (en + he).
- Writes Jest unit test(s) for the screen's render-with-data and render-empty paths.
- Updates `docs/sessions/teen-ui-my-stats-lite/STATUS.md` per phase.

### What Adi must do herself
- Verify on physical device with Itay (final UX gate).
- Decide whether the lite version ships to closed-testing or waits for the full 5B (post-Buddy-V0.5 backend).
- Approve the merge.

### Bottlenecks / expected stop points
- **Navigation placement** — 3 options discussed below; CC will propose one in ROADMAP and wait for approval before coding.
- **Pastel-mode behavior** — pastel kids landing on the new tab; CC proposes a "coming soon" placeholder, surfaces for approval.

---

## Values Check

> 9 questions from `docs/BUFF_VALUES.md`. **Must pass all before CC writes code.**

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without virtual reward?**
   ✅ Yes. MY STATS is a self-tracking surface — it shows the child their own progress (streaks, days active, BUFFs balance), the same information a teen tracking gym/study habits would *want* to see. It does not gate any reward behind itself.
2. **Does this bring the child closer to a self-chosen reward?**
   ✅ Indirectly. The BUFFs balance shown on this screen is the bridge to the parent-defined / child-proposed reward. The screen makes the bridge legible without inventing new in-app currency loops.
3. **Does success feel like "I want to" or "I have to"?**
   ✅ "I want to" — there is no daily must-visit obligation, no penalty for not opening it, no streak for opening MY STATS itself.

### Pillar 2 — Positive Coaching
1. **Does the wording ever shame / compare / display failure?**
   ✅ No. Stats shown are factual counters (BUFFs balance, successful days count, streak length). No "you missed N days" framing. No comparison to other kids. No "0" with red coloring.
2. **If the child fails — is the response empathy or pressure?**
   ✅ Empathy. A child returning after a break sees the same stats they had before — no zeroed counters, no "your streak was broken on day X" history.
3. **Is there a "suffering / loss / anger" mechanic for BUDDY?**
   ✅ N/A — this is the Gamer (no-buddy) variant. No buddy character to suffer.

### Pillar 3 — Independence-Building
1. **Does this make the child more capable *without* the app?**
   🟡 Neutral. The screen is observational. It does not directly teach a skill, but it does support self-monitoring (an executive-function competency). A child who learns "I do better in the morning than the evening" from looking at their own data is building self-knowledge.
2. **Does the child have a voice in this feature?**
   ✅ Yes — Itay's preference for the no-buddy variant is the entire reason this screen exists ([GAP_ANALYSIS.md:139](../../BUFF_GAP_ANALYSIS.md)). A child who finds buddy characters babyish gets a screen that respects that.
3. **In 6 months, is this still necessary or did it do its job?**
   🟡 Still necessary as long as the child uses the app — but its purpose is *informational*, not *retentional*. If the child outgrows the app and uses paper tracking instead, the screen stops mattering with no withdrawal cost.

**Values Check Pass:** ✅ Yes. Three 🟡 entries are acknowledged-neutral, none are blocking.

---

## Goals
- Give Gamer-mode children a self-tracking surface ("MY STATS") that respects the no-buddy aesthetic.
- Wire a real entry point for the data the child already has (currently only visible on the dashboard).
- Establish the file/i18n/navigation skeleton that the post-V0.5 *real* 5B will extend (LEVEL pill, BOOSTERS carousel) without needing to redesign navigation.

## Non-goals
- Pastel/Children-mode equivalent (deferred to 1.1 design pass with Emi, [GAP_ANALYSIS.md:49](../../BUFF_GAP_ANALYSIS.md)).
- Friendship LEVEL indicator, "Progress to LEVEL N" bar, BOOSTERS carousel — all require Buddy V0.5 backend which is queued as `pkg/buddy-v05-backend`.
- Hero image (sound-wave / equalizer pattern from Stitch 5B) — cosmetic, defer to V0.5 ship to avoid spec drift on the centerpiece.
- Settings screen 07 — separate package; the gear icon on MY STATS will be inert (no `onPress`) until 07 ships.
- Buddy-toggle preference logic (would let user switch between 5A and 5B) — needs `buddy_relationships` table, queued with Buddy V0.5.

---

## Behavior Contract

After this package merges, end-to-end:

1. A Gamer-mode child opens BUFF.
2. From `GamerDashboardScreen`, child can reach MY STATS via the placement chosen in ROADMAP (5th tab OR header-icon push).
3. MY STATS displays:
   - **Header:** title "MY STATS" (i18n `gamerMyStats.title`); back button (or no back if it's a tab); inert gear icon top-right (placeholder for screen 07).
   - **Stat cards (3-up grid):**
     - BUFFs balance — `totalBalance` from `useChildData`
     - Successful days — `petState.evolution_days_count` from `usePetState`
     - Current streak — `petState.daily_streak` from `usePetState`
   - **Visual style:** matches `GamerDashboardScreen` BUFF brand palette (deep violet canvas + lime accent), NOT Stitch's green-on-green.
4. If `useAppSettings.isPauseActive`, the screen shows the same `PauseEmptyState` pattern as the dashboard (no stats during pause — consistent with the pause-mode SPEC).
5. If the child has no data yet (new account, day 0), each stat card shows "0" with no error / scolding copy.
6. Pastel-mode children navigating to the same destination see a friendly placeholder string (or, per CC default, the destination is hidden for pastel theme — see Open Question 3).

## Schema Changes

**None.** This package adds zero columns, tables, or RLS rules. Pure UI on existing data.

## Prompts Changes

**None.**

## API / Route Changes

- **New screen:** `src/screens/child/GamerMyStatsScreen.tsx`
- **New theme dispatcher:** `src/screens/child/ChildMyStatsScreen.tsx` (mirrors `ChildDashboardScreen` pattern — picks Gamer or Pastel variant based on `useChildTheme`).
- **Navigation change:** depends on placement decision (see Open Question 1).
- **Hooks consumed (no changes):** `useChildData`, `usePetState`, `useAppSettings`, `useAuth`, `useMode`, `useTranslation`.

## UI Changes

- **One new screen** (Gamer variant): per [5b-my-stats/code.html](../../teen-ui-design/me-and-buddy/5b-my-stats/code.html), with the deferred items above stripped.
- **One new dispatcher** (Pastel placeholder).
- **Navigation entry point** added (TBD per Open Question 1).
- **i18n keys:** `gamerMyStats.title`, `gamerMyStats.statBuffs`, `gamerMyStats.statSuccessfulDays`, `gamerMyStats.statCurrentStreak`, `gamerMyStats.pastelPlaceholder` (en + he).

## Open Questions

> CC must resolve in Plan Mode (i.e. propose, get approval, then code). **Do not silently pick.**

1. **Navigation placement** — three candidates:
   - **(a) 5th bottom tab** in `ChildTabs.tsx` (label "STATS", icon `stats-chart-outline`). Pros: one-tap access, matches modern app patterns. Cons: 5 tabs is crowded; Pastel kids see a half-empty tab.
   - **(b) Push from `GamerDashboardScreen` settings-gear icon** ([line 156-158](../../../src/screens/child/GamerDashboardScreen.tsx), currently inert). Pros: no tab clutter; semantically odd (gear ≠ stats). Requires wrapping gamer tab in a stack navigator.
   - **(c) Push from a new "stats" icon** added to GamerDashboard header. Pros: clean semantics. Cons: requires stack wrapper and a header layout change.
   - **CC recommendation:** **(a) — 5th tab** is the lowest-friction, lowest-blast-radius option and matches Itay's likely mental model ("MY STATS is a place I go, not a thing I dig for"). Final call: Adi's.

2. **i18n: Hebrew copy for stat labels** — what wording? Options:
   - Literal: "BUFFים", "ימים מוצלחים", "רצף נוכחי"
   - Per Itay's voice: ?
   - **CC default:** literal translations of the EN labels, surface for Adi review before merge.

3. **Pastel-mode placeholder copy** — what does a pastel kid see if they reach this destination? Options:
   - "Coming soon!" — generic
   - "Your buddy is your best stats tracker — tap them on the home screen!" — redirects to existing buddy interaction
   - Hide the tab/destination entirely for pastel theme
   - **CC default:** hide for pastel theme (cleanest — no half-built UX shown to younger kids).

4. **Tap interactions on stat cards** — Stitch design has cards visually but no tap behavior defined.
   - **CC default:** inert (display only). V0.5 *real* 5B may add drilldown later.

5. **What replaces the Stitch hero image (sound-wave / equalizer) in lite?**
   - **CC default:** empty space — nothing to invent that won't conflict with the V0.5 hero design.
