# theme-age-decouple — SPEC

> Target state for this package. Authoritative until superseded by a later session.
> Wins over canonical docs during the package; canonical docs update at close per SPEC_SYNC.md.
>
> **Origin:** Bug found by Lia (Noa's daughter, ~9) on 2026-08-30 — the child HQ
> (מפקדה) screen behaves differently between the Mint and Gamer "mirror" views.
> In Gamer she saw an inline task **list** with time-of-day tabs; in Mint she saw
> only summary tiles. She disliked that flipping the look changed what the screen does.
> Branch: `claude/mirror-view-behavior-inconsistency-vpw1d6`.

---

## The core diagnosis (why this is a real bug, not a cosmetic nit)

The Mint↔Gamer picker is documented as a **purely aesthetic** choice, explicitly
**not** age-gated — kid agency is Pillar 3:
- `BUFF_PRD.md:109` — *"Rationale for aesthetic-based modes (not age-gated): kid agency is Pillar 3."*
- It is a self-serve picker inside the child's own Menu — any child flips it, any age (`src/screens/child/ChildSettingsScreen.tsx:143`).

**But today that same toggle also swaps information architecture:**
| Axis | Mint skin | Gamer skin |
|---|---|---|
| HQ inline task list + time-of-day chips | ❌ none (tasks live on Quests tab) | ✅ inline on HQ (`GamerDashboardScreen.tsx:508–558`) |
| "סטטים" (Stats) bottom tab | ❌ hidden | ✅ shown (`ChildTabs.tsx:91–94`, gated on `isGamer`) |

So flipping a **skin** changes **functionality**. That is the defect. It has two concrete harms:
1. **Overwhelm for the youngest kids who freely pick the Gamer look.** Personas are explicit — Emi-type (6–9): *"Reading-heavy interfaces alienate her"* + needs one-task-at-a-time (`BUFF_PERSONAS.md:415, 410`). This is exactly Lia's case: a ~9-yo picked the dark look and got a teen-density inline list. Pillar 2 (overwhelm / predictability) risk.
2. **A duplicate task surface + its bug class.** In Gamer, a task exists in two places (HQ inline list *and* the Quests tab), each with its own completion path — the sync gymnastics are already documented as fragile (`INTEGRATION_LEARNINGS.md` IN-2026-06-13-01/02).

There is also a standing lesson pointing the same way — written after a **real user** hit a values bug from exactly this Mint/Gamer split:
> IN-2026-07-06-01: *"Any gate/filter behavior must go into both themes in the same commit, or live in a shared layer — not in the screen."*

## The fix in one sentence

**Decouple two axes that are currently conflated into one toggle: a free cosmetic
*skin* (any age) and an age-appropriate *experience depth*. Skin stays free; the
inline-list-on-HQ and the Stats tab follow the child's age band, not the skin.**

After this package: a 9-yo on the Gamer skin gets the age-appropriate simplified HQ
(dark/violet look, no overwhelming list); a 15-yo on the Mint skin gets the teen
dashboard depth (soft look, inline list + Stats tab). Look is theirs to choose;
depth follows their developmental need — which is exactly how PRD §6.1 already
distinguishes Children Mode (6–12, "training wheels") from Teen (13–18, self-initiation).

---

## Capabilities & Bottlenecks

### What Claude.ai (I) can do
- Author this SPEC, the Values Check, and the phased behavior contract.
- Map the exact code touchpoints (done below).

### What Claude Code (CC) will do
- Introduce a single shared **experience-band** signal derived from `age_group`
  (one hook/util, per IN-2026-07-06-01 "live in a shared layer, not the screen").
- Gate the HQ inline list + chips and the Stats tab on that signal instead of `themeName`.
- Phase 2 only: build the Mint-styled inline list + chips.
- Jest + typecheck; verify on Android **and** Web (Platform Parity rule).

### What Adi must do herself
- **Rule the spec conflict** (see Open Questions Q1) — this SPEC proposes a resolution but the PRD edit is Adi's call.
- **Loop in Itay** on Phase 1 before it ships — the Gamer HQ inline list is his approved Stitch design (`teen-ui-design/dashboard-no-buddy/design-notes.md` — "✅ Approved 2.5.2026"). Framing: we are *protecting the younger kids who love his Gamer look*, and his teen dashboard is untouched for the teens it was built for.
- Emulator / real-device visual verification (Hat 4).

### Bottleneck / expected stop points
- Itay's buy-in on Phase 1 gating (design ownership).
- Q3 fallback decision for children with no `age_group` (family-code signups).
- Whether Phase 2 (Mint-skin teen build) is in this package or a follow-up.

---

## Values Check

> 9 questions from `docs/BUFF_VALUES.md`. Must all pass before CC writes code.

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without any virtual reward?**
   Yes — this removes friction/overwhelm; it doesn't add a reward hook. Neutral-to-positive.
2. **Does it bring the child closer to a reward they chose?**
   Neutral — no change to reward mechanics. Tasks and BUFFs are unchanged; only *where/whether* the list renders changes.
3. **Does success feel like "I want to" or "I have to"?**
   Improved for juniors — a right-sized HQ makes daily wins feel achievable, not like a wall of chores (`BUFF_VALUES.md:38` — small absolute count, no paralyzing perfectionism).

### Pillar 2 — Positive Coaching
1. **Does the wording ever demean / compare / present failure?**
   No new copy that judges. Removing a long unattainable-feeling list from a young kid's HQ *reduces* implicit "look how much is left" pressure.
2. **If the child fails here, is the response empathy or pressure?**
   N/A — no failure state introduced. Right-sizing the surface is itself the empathetic move.
3. **Is there a suffering / loss / anger BUDDY mechanic?**
   No. Buddy behavior untouched.

### Pillar 3 — Independence-Building
1. **Does the feature make the child more capable *without* the app?**
   Yes — an age-appropriate surface (one-thing-forward for juniors; self-initiation dashboard for teens) matches the scaffolding each band actually needs (`BUFF_VALUES.md:111`).
2. **Does the child have a voice?**
   Yes, and it's *protected*: the skin stays a free choice at any age (the whole point). We stop the look-choice from silently costing them a usable layout.
3. **In 6 months, still necessary or did it do its job?**
   Structural correctness — it stays right as the child ages up (a junior who turns teen simply gains depth when their `age_group` advances).

**Values Check Pass:** [x] yes — no pillar fails. (Assumes Q3 fallback lands on the safe/junior side.)

---

## AI Token Cost
Not applicable — no LLM calls in this package.

---

## Goals
- One **shared** experience-band signal derived from `age_group` (not `themeName`), living in a hook/util per IN-2026-07-06-01.
- **HQ task list + time-of-day chips** presence follows the age band, both skins.
- **Stats (סטטים) tab** visibility follows the age band, both skins.
- Skin (Mint/Gamer look) remains a free per-child toggle at any age — **unchanged**.
- No duplicate task-completion surface for the junior band (list gone from HQ → single Quests path).
- Both platforms (Android native + Web) verified.

## Non-goals
- Changing the visual identity of either skin (colors, dark/light, buddy hero styling stay as-is).
- Changing task data, BUFFs, scheduling, Vibe/Low-Power, or the Quests tab itself.
- Re-opening the teen age threshold (12 vs 13 — the "D5" open decision / `CLAUDE.md:309` 13-17 flag). We reuse `isTeenAgeGroup` as-is.
- Removing the Gamer HQ list for **teens** — teens keep their approved dashboard.

## Behavior Contract

> What the system does end-to-end after this package closes.

**New shared signal — `experienceBand`:** `'junior' | 'teen'`, derived from the
active child's `pro_settings.age_group` via `isTeenAgeGroup()`:
- `'6-8' | '9-11'` → `junior`
- `'12-14' | '15-18'` → `teen`
- missing/unknown → **fallback** (see Q3; recommended: legacy skin heuristic as a
  one-time bridge, i.e. `gamer→teen`, `mint→junior`, so no current teen regresses).

Resolves for the real child session **and** parent view-as-child (previewed child's
`age_group`, same source ModeContext already reads at `ModeContext.tsx:68`).

**Matrix after the change** (skin = look only; band = depth):

| | Junior band (6–11) | Teen band (12–18) |
|---|---|---|
| **Mint skin** | soft look · summary HQ · no Stats tab · tasks on Quests *(today)* | soft look · **+ inline list + chips + Stats tab** *(Phase 2 build)* |
| **Gamer skin** | dark look · **summary HQ (list hidden)** · no Stats tab *(Phase 1 gate)* | dark look · inline list + chips + Stats tab *(today — unchanged)* |

**Phasing (recommend shipping Phase 1 first):**
- **Phase 1 — protective (fixes Lia's case; low risk):** For the **junior** band, hide
  the Gamer HQ inline list + chips (render the Gamer-styled summary HQ only) and hide
  the Stats tab — on **both** skins. Net effect: no young child, whatever look they pick,
  is handed a teen-density list. This is subtractive/gating only.
- **Phase 2 — parity (completes the promise; larger build):** For the **teen** band on
  the **Mint** skin, add a Mint-styled inline task list + time-of-day chips to the Pastel
  HQ and show the Stats tab. Additive; may be split into its own package (see Q4).

## Schema Changes
None required. Reuses existing `profiles.pro_settings.age_group` and `isTeenAgeGroup()`.
(If Q3 chooses a persisted default instead of a runtime fallback, that would be a
`pro_settings` backfill — flagged, not assumed.)

## API / Route / Navigation Changes
- `src/navigation/ChildTabs.tsx` — Stats tab (`ChildMyStats`) visibility switches from
  `isGamer` to `isTeen` (experience band). Keep the module-level stable-reference
  `HIDDEN_TAB_OPTIONS` pattern (`ChildTabs.tsx:44–48`) intact. Note: because `age_group`
  does **not** flip at runtime the way `themeName` does, this is *less* prone to the
  runtime-theme-switch tab thrash that `pkg/fix-runtime-theme-switch` fixed.
- New shared hook/util (proposed `useExperienceBand()` / `experienceBandFor(ageGroup)`)
  reading the active child's `age_group` from `AuthContext`/`ModeContext`.

## UI Changes
- `src/screens/child/GamerDashboardScreen.tsx` — gate the "Time-of-day filter chips",
  "Tasks section" title, and task list (`:508–558`) behind `band === 'teen'`. Junior
  renders the existing summary cards/fuel/BUFFs/Catch/buddy, no list.
- `src/screens/child/ChildDashboardScreen.tsx` (PastelChildDashboard) — **Phase 2 only**:
  add a Mint-styled task list + chips for `band === 'teen'`. Reuse the shared
  day-visibility + time-bucket logic (`utils/taskSchedule`, the `timeBucket` helper) —
  do not re-implement per screen (IN-2026-07-06-01).
- Reference: `docs/teen-ui-design/dashboard-no-buddy/` for the teen layout intent.

## Open Questions

> Things CC + Adi resolve in Plan Mode. Not pre-solved here.

- **Q1 (Adi — spec ruling):** The PRD is internally inconsistent — modes are
  "aesthetic, not age-gated" (§4.2) yet it lists different task features per mode
  (Pastel "one task at a time" `:211` vs Gamer "task list" `:224–226`). This SPEC
  resolves it as *skin = look (free, any age); depth = age band*. Adi confirms the
  PRD edit (Spec Sync) — CC must not silently pick.
- **Q2 (Itay — design ownership):** OK to hide his approved Gamer HQ inline list for
  the **junior** band (teens keep it)? Needed before Phase 1 ships.
- **Q3 (fallback for missing `age_group`):** Family-code signups have
  `pro_settings: { source: 'child_signup' }` with no `age_group` (`AuthContext.tsx:616`);
  legacy children may also lack it. Options: (a) default `junior` (safest — never
  overwhelm an unknown-age kid), (b) legacy skin heuristic bridge (`gamer→teen`,
  `mint→junior`) so no current teen regresses, (c) prompt the parent to set age.
  **CC recommendation: (b)** as a runtime bridge + surface an age-missing nudge in the
  parent's EditChild screen. Adi's final call.
- **Q4 (packaging):** Ship Phase 1 alone in this package (fixes the reported bug fast),
  Phase 2 as a follow-up? Or both together?

## Out of Scope
- Teen age-threshold change (12 vs 13 / 13-17) — separate flag (`CLAUDE.md:309`, "D5").
- Any visual redesign of either skin.
- Buddy visibility logic (already independently toggleable via `buddy_visible`).
- The Quests tab, task scheduling, BUFFs, Vibe Check, Low Power, Pause.
- Parent-side dashboards (the `dashboard-*` sessions are Parent-surface, unrelated).
