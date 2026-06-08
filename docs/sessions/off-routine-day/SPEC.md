# SPEC — Off-Routine Day (per-child, default-bank MVP)

**Slug:** `off-routine-day` · **Branch:** `pkg/off-routine-day` · **Status:** SPEC (awaiting `approved, proceed`)
**Origin:** Tamar's community feedback (off-routine days = when her ADHD child is *most* scattered; Pause is the wrong tool). Co-designed in-thread by Tamar + Noa. Full research + task bank: `~/.claude/plans/mellow-rolling-lighthouse.md`.

## Goal
A **third day-state** — *Routine / Off-routine / Pause* — set **per child**. On an off-routine day the child's full weekday plan is swapped for a **light, age-appropriate default task set** (the "anchor + autonomy" bank), while the app stays **active** (unlike Pause, which goes silent). Catches the family at the **churn moment** (routine-break) instead of letting the habit fragment.

## Behavior contract (MVP)
- **Parent** turns "Off-routine day" **on for a specific child**, with a duration (Today / This weekend / Until a date) — entry point near `PauseModeCard` in the child's parent-settings / EditChild area.
- **While active for child C:**
  - C's task screens (HQ + Quests, **both** Mint & Gamer) show the **off-routine default bank** for C's `age_group`, **not** the routine plan.
  - Routine/school load is hidden (Domain 2 homework, Domain 3 organization, `hide_on_weekend` tasks).
  - Off-routine tasks **still earn BUFFs** — normal completion → credit loop, unchanged.
  - Gentle kid-facing banner (body-double voice): *"היום יום חופשי — תוכנית קלה, בקצב שלך"*. No failure/▢missed framing.
- **One tap off** (or auto-expire at the until-time) → the routine plan returns, untouched.
- **Pause supersedes:** if both Pause and Off-routine are active, Pause wins (silent).

## Decisions locked (per Adi, 2026-06-08)
- **Per-child**, not per-family (the kid who's scattered — not necessarily a sibling).
- **Default bank only** — zero parent setup in MVP (Tamar: "no headspace to think"). One tap, instant light plan.
- Content = the **age-banded bank** (6-8 / 9-11 / 12-14 / 15-18) from the plan's Part A3.

## Reuse (confirmed by exploration — most of this exists)
| Need | Reuse |
|---|---|
| Day-type + task filtering | `src/utils/schoolDay.ts`, `scheduleDays`/`hideOnWeekend` on `src/types/task.ts`, filters in `src/components/PhaseView.tsx` + `GamerTasksScreen.tsx` |
| Mode flag + realtime + banner UI | mirror Pause: `src/hooks/useAppSettings.ts`, `PauseBanner.tsx`/`PauseEmptyState.tsx` pattern, `pauseUtils.ts` derivation |
| Parent UI entry | mirror `src/components/PauseModeCard.tsx` |
| Off-routine content | tag a subset in `src/screens/onboarding/unified/starterTasks/taskLibrary.ts`; reuse `generateStarterTasks.ts` (age-band filter only) + `pickLang` bilingual |
| Parent writes the per-child flag | RLS already allows parent→own-device-child update (fixed in #189 / migration 022) ✅ |

## Net-new (small)
1. **Per-child flag** — `profiles.off_routine_until timestamptz null` (null = off; future ts = active until; mirrors `pause_until`). Migration + RLS already covers parent update.
2. **Off-routine content** — author the age-banded bank in `taskLibrary.ts` (`offRoutine: true` tag), `{en,he}`.
3. **Filter condition** — when off-routine active for the child: hide routine/school tasks, show the off-routine bank for the age band.
4. **Parent toggle** UI + **child banner**.

### Key implementation decision (resolve in Phase 0)
**How the off-routine tasks render + earn BUFFs.** Recommended: **seed them as real `tasks` rows** for the child for the active window (flagged `off_routine`, `schedule_days=[today]`), hide routine tasks via the existing filter, and reuse the unchanged completion→credit loop; expire/remove on exit. Alternative (render bank ephemerally + synthetic completion) avoids row churn but needs a parallel credit path. Lock this in Phase 0 before coding.

## Values Check (9 — all pass)
- **P1 Intrinsic:** ✅ bank centers autonomy (bounded fun, self-driven curiosity); success feels "I want", not "I must". Real-reward loop (BUFFs) intact.
- **P2 Positive coaching:** ✅ literally supports the *hardest* days; gentle banner, no failure counts, no sad-buddy. The anti-punishment move.
- **P3 Independence:** ✅ child drives (curiosity, choices); scaffold *adapts* to the day rather than disappearing; Phase 2 adds parent+child co-design.

## Non-goals (deferred to Phase 2+)
Parent customization (pick/add tasks) · adapted routine targets (steps→walk) · Vibe-Check emotional-availability gating · weekend auto-detection/suggest · **in-app AI affordance for kids** (serious children's-app safety/COPPA — out of scope; "explore with AI" stays an offline prompt).

## Verification
- **Hat-1:** `tsc` + jest (new: filter logic when off-routine active; bank generates per age band; Pause-supersedes).
- **Hat-3 (emulator):** parent toggles off-routine for a child → child HQ+Quests (Mint & Gamer) show the light bank, not the weekday plan → complete one → BUFFs credited → toggle off → routine returns → Pause+off-routine together = Pause wins.
- **Hat-4:** real-device feel + EN/Hebrew.

## Exit deliverables
Per `SPEC_SYNC.md` (to be added): update PRD/GAP if scope warrants; STATUS row; INTEGRATION_LEARNINGS if surprised; RELEASE_QUEUE row at merge.
