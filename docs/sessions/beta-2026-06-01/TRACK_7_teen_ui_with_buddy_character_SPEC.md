# Track 7 — `pkg/teen-ui-with-buddy-character` SPEC

**Status:** `draft — awaiting Adi review; ready to spawn a CC session once approved`
**Slug:** `pkg/teen-ui-with-buddy-character`
**Branch:** `pkg/teen-ui-with-buddy-character` (off `main`)
**Unblocks regression flows:** #5 (Teen "with" → Wolf STORMY dashboard), partial #6 (richer 03 Buddy Toggle Modal vs the plain Settings toggle shipped in PR #46)
**Drafted:** 2026-05-16 by CC on `claude/busy-euclid-e43458`

---

## Why this exists

`pkg/teen-ui-my-stats-full` (PR #46) deliberately deferred the buddy-character pieces because the Wolf STORMY asset rendering had open questions. That deferred work is named here: this package brings 01-with-buddy, 05A Me & Buddy, and 03 Buddy Toggle Modal into the shipped product.

This is the "with-buddy" half of teen UI — the kid who chose to keep the buddy character in Teen Onboarding (Flow #3) needs this to actually see the buddy.

---

## Dependencies

| Dep | Status | Notes |
|---|---|---|
| `pkg/buddy-v05-backend` | ✅ shipped 2026-05-15 | Provides `buddy_relationships`, `useBuddyRelationship` hook, types |
| `pkg/teen-ui-my-stats-full` | ✅ merged PR #46 | Provides `LevelPill`, `BoostersCarousel`, `HeroPlaceholder` — reusable |
| **Wolf STORMY asset** | 🚩 **OPEN — Adi decision** | See Open Question 1 — blocks all 3 screens |
| Stitch 08 (Teen Onboarding Choice) | ❌ not designed | Separate package — but this one works regardless (default kids landing on the with-buddy branch is detected via `buddy_relationships.buddy_visible = true`, whether set by onboarding or Settings) |

---

## Goal

Make the kid who chose "with buddy" actually see the buddy.

After this merges:
- Gamer dashboard renders Wolf STORMY (replaces the empty top-of-screen area in `GamerDashboardScreen`)
- Tap on Wolf → navigates to 5A "Me & Buddy" screen (new) — a richer version of 5B with character hero, level art, and a "your buddy is..." status line
- 03 Buddy Toggle Modal — fancy preview-both modal (live preview of the dashboard with/without buddy) reachable from a dedicated "Change buddy view" entry in Settings (in addition to the plain toggle from PR #46)

---

## Values Check

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1 — child wants this without virtual reward? | ✅ Wolf is a *companion*, not a coin-dispenser. Per BUDDY_SYSTEM.md, the friendship grows from the kid's success, not from grinding. |
| Intrinsic Motivation | 2 — closer to a real reward? | ✅ Tap-on-buddy → 5A Me & Buddy → boosters carousel → some boosters tie to real-world reward affordances. |
| Intrinsic Motivation | 3 — "I want to" vs "I have to"? | ✅ Buddy is opt-in via `buddy_visible`. Nothing forces the kid to engage with the buddy. |
| Positive Coaching | 1 — no shame / failure framing? | ✅ Buddy is never sad (per D-2026-05-02-22 — sad buddy mechanic explicitly forbidden). Resting state ≠ sad. |
| Positive Coaching | 2 — empathy if child fails? | ✅ Wolf doesn't react to incomplete days. Friendship_level never decrements per V0.5 spec. |
| Positive Coaching | 3 — no suffering mechanic? | ✅ Hard rule. Verify in implementation: no animation triggers tied to "low completion" or "skipped day" — only positive events. |
| Independence-Building | 1 — more capable without app? | 🟡 Neutral — buddy is in-app companion. But: the kid choosing to hide buddy at any time IS the independence-building mechanic. |
| Independence-Building | 2 — child has voice? | ✅ Three voice points: Onboarding pick (Flow #3), Settings toggle (PR #46), 03 Buddy Toggle Modal (this package). |
| Independence-Building | 3 — in 6 months, still needed? | ✅ Either way: kid keeps wolf or hides wolf — both outcomes serve them. |

**Values Check: ✅ all 9 pass.**

---

## Goals

1. **Render Wolf STORMY in the Gamer dashboard** when `buddy_relationships.buddy_visible = true`. Reuses the dashboard layout from `GamerDashboardScreen`; adds a buddy hero region at top.
2. **Implement 5A Me & Buddy screen** — richer Stitch design with character hero, LEVEL art, friendship "status line", reusing `BoostersCarousel` from PR #46.
3. **Implement 03 Buddy Toggle Modal** — fancy preview-both modal (dashboard with vs without). Reachable from Settings via a dedicated entry. The plain toggle from PR #46 remains as a quick switch.
4. **Tap-on-buddy navigation** — tapping Wolf on dashboard navigates to 5A.

## Non-goals

- ❌ Onboarding Buddy Choice screen (Flow #3) — separate package: Stitch 08 design + impl
- ❌ Booster USE mechanics (Flow #8) — separate package
- ❌ Sound effects / haptics on tap-on-buddy
- ❌ Wolf animation (idle breathing, etc.) — static image first; animation is post-MVP polish
- ❌ Pastel-mode equivalent (Children Mode buddy) — deferred to 1.1
- ❌ Anything tied to Vibe Check (separate Track 8)

---

## Behavior Contract

After this merges:

1. **`buddy_visible = true` (the with-buddy variant):**
   - Gamer dashboard top region shows Wolf STORMY at the current `friendship_level`
   - Status line below: e.g. "Stormy is doing great" (L3+), "Stormy is settling in" (L1-L2)
   - Tap Wolf → navigates to 5A Me & Buddy
   - 5A renders character hero (larger Wolf), LEVEL pill (reused), progress bar (reused), BOOSTERS carousel (reused), and a new "Buddy Story" subsection (small flavor text per level)
2. **`buddy_visible = false`:** UI unchanged from PR #46 — Wolf does not render anywhere in Gamer mode
3. **Settings:**
   - The plain toggle from PR #46 stays (quick switch)
   - New "Change buddy view" entry below it opens the 03 Buddy Toggle Modal
   - 03 modal shows two preview cards (with-buddy / no-buddy) side by side. Tap = apply
4. **Pastel theme:** unchanged (children mode untouched per non-goal)
5. **Pause Mode:** Wolf shows in "resting" pose (not sad — per Pillar 2)

---

## Schema Changes

**None.** All needed schema is in `pkg/buddy-v05-backend`.

---

## Files Likely Touched

- `src/screens/child/GamerDashboardScreen.tsx` — adds buddy hero region (conditional on `buddy_visible`)
- `src/screens/child/GamerMeAndBuddyScreen.tsx` — **new file** (5A)
- `src/components/buddy/BuddyHero.tsx` — **new component** (Wolf at current level)
- `src/components/buddy/BuddyToggleModal.tsx` — **new component** (03)
- `src/screens/child/ChildSettingsScreen.tsx` — adds "Change buddy view" entry
- `src/navigation/ChildTabs.tsx` — possible route addition for 5A (or use stack-modal navigation pattern)
- `assets/buddies/wolf-stormy-L1.png` through `L5.png` — **new assets** (asset question OQ1)
- New i18n keys under `gamerBuddy.*`

---

## Open Questions for Adi

### OQ1 — Wolf STORMY asset source (BLOCKER)

The Wolf needs an actual image. Per F-2026-05-03-07 (BUFF_INTEGRATION_LEARNINGS), two Buddy collections exist as plans (Pastel + Gaming) but **no real Wolf assets are produced**. Options:

- **(a)** Generate via Midjourney / DALL-E now using the BUFF_BRAND.md §7.5 spec (Gamer aesthetic). 5 variations (L1-L5).
- **(b)** Use a placeholder geometric "Wolf head silhouette" SVG hand-coded by CC. No real Wolf art — abstract representation.
- **(c)** Adi sources from existing freelancer / Stitch export. Timeline unknown.

**Without an answer to this, the package can't be built.** Choose at SPEC review.

**CC recommendation:** (a) for option (b) timeline pressure — 1 hour of generation + iteration with Adi vs unknown freelancer wait.

### OQ2 — 5A "Buddy Story" copy

Each level (L1-L5) needs a 1-2 sentence flavor text. E.g. L1: "Stormy is settling into the den" / L5: "Stormy is your wingmate now." Adi writes? Or CC drafts + Adi reviews?

**CC recommendation:** CC drafts 5 variants in HE + EN, Adi reviews.

### OQ3 — Where does 5A live in navigation?

- **(a)** A tab in the Gamer tab bar (alongside Home / Tasks / Rewards / Stats / Menu)
- **(b)** Reachable only via tap-on-Wolf from Dashboard — no tab entry. Modal/stack push.

**CC recommendation:** (b) — keeps tab bar lean. Tap-on-Wolf is the discoverable path per Stitch design.

### OQ4 — 03 Buddy Toggle Modal — fancy preview vs Settings toggle redundancy

PR #46 shipped a plain toggle in Settings. Do we still need the 03 fancy modal?

- **(a)** Yes — the 03 modal is part of the Itay-approved Stitch design. The plain Settings toggle is for "quick power user" path; 03 is the discoverable path for new teens.
- **(b)** No — drop 03. The plain toggle is enough. Saves engineering time.

**CC recommendation:** (a) — Itay specifically wanted the preview-both UX. But surfacing as your call.

### OQ5 — "Buddy is resting" state during Pause Mode

What does Wolf look like when Pause is active? Per Pillar 2 — not sad. Options:
- Wolf sleeping (eyes closed)
- Wolf standing calmly with a Z above
- Hidden completely while Pause is on

**CC recommendation:** Wolf with closed eyes — preserves presence, signals rest without sadness.

---

## Proposed Phased Chunks

The receiving CC session will refine, but rough shape:

- **Phase 0** — Session folder + SPEC (this doc graduated to `docs/sessions/pkg/teen-ui-with-buddy-character/SPEC.md`), Values Check, dependency audit
- **Phase 1** — Asset prep (OQ1 resolved → assets in `assets/buddies/`)
- **Phase 2** — `BuddyHero` component + Gamer Dashboard integration (Flow #5 partial)
- **Phase 3** — 5A `GamerMeAndBuddyScreen` + tap-navigation (Flow #5 complete)
- **Phase 4** — 03 Buddy Toggle Modal + Settings entry (Flow #6 fancy variant)
- **Phase 5** — Regression: re-run TRACK_6 flows #5 + parts of #6 on real device

---

## Exit Deliverables — SPEC_SYNC matrix

| Phase | Canonical doc update | What changes |
|---|---|---|
| 0 | Session `STATUS.md` | open + chunk plan |
| 1 | Session `SPEC.md` | Asset paths + provenance |
| 2 | `BUFF_GAP_ANALYSIS.md` | Row T-01 `with-buddy variant` → ✅ |
| 3 | `BUFF_GAP_ANALYSIS.md` | Row T-02 / "Me & Buddy 5A" → ✅ |
| 4 | `BUFF_GAP_ANALYSIS.md` | Row "03 Buddy Toggle Modal" → ✅ |
| 5 | `STATUS.md` (session) + `INTEGRATION_LEARNINGS.md` | Closeout + any surprises |

---

## Risks

- **Wolf assets are the gate.** Without a decision on OQ1, this package can't start. Time-sensitive given 2026-06-01 target.
- **Animation creep.** Static images are sufficient; resist adding idle animations until post-MVP.
- **Theme switch regression risk.** Adding a buddy hero region to GamerDashboard is the kind of change that could blank the tab bar again (per IN-2026-05-14-04 root cause). Receiving session must apply the `module-level stable constants` pattern from `ChildTabs.tsx` and verify with rapid Mint ↔ Gamer toggle test.

---

## Brief for the receiving session

Paste this as the first message when you spin up a new CC session for this package:

```
Plan Mode. You are picking up pkg/teen-ui-with-buddy-character.

Read FIRST:
- CLAUDE.md
- docs/WORKFLOW.md
- docs/BUFF_VALUES.md
- docs/sessions/beta-2026-06-01/TRACK_7_teen_ui_with_buddy_character_SPEC.md
  (this is your SPEC source — read all of it including Open Questions)
- docs/sessions/buddy-v05-backend/SPEC.md (the backend you'll consume)
- docs/sessions/teen-ui-my-stats-full/SPEC.md (the predecessor — same patterns)
- docs/teen-ui-design/dashboard-with-buddy/, me-and-buddy/5a-with-buddy/,
  buddy-toggle-flow/ (Stitch designs)
- src/screens/child/GamerDashboardScreen.tsx, GamerMyStatsScreen.tsx
- src/hooks/useBuddyRelationship.ts, src/types/buddy.ts

Surface to Adi BEFORE proposing chunks:
- OQ1 Wolf asset decision (BLOCKER)
- OQ2-5 product calls from the SPEC

Branch off main as pkg/teen-ui-with-buddy-character. No code until Adi
approves Phase 0 (session folder + SPEC review). Chunk-by-chunk discipline
per CLAUDE.md. New native dep check per F-2026-05-14-01 if any added.
```
