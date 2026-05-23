# `pkg/dashboard-today-yesterday-toggle` — SPEC

**Status:** `executing — Adi requested 2026-05-23 after pkg/dashboard-clarity-cleanup`
**Slug:** `pkg/dashboard-today-yesterday-toggle`
**Branch:** `pkg/dashboard-today-yesterday-toggle` (off `pkg/dashboard-clarity-cleanup`)
**Builds on:** `pkg/dashboard-clarity-cleanup` (must merge first)
**Source:** Adi clarified during dashboard cleanup that two stacked sections (TODAY + YESTERDAY) make the dashboard dense; wants a single section with a toggle defaulting to Today
**Drafted:** 2026-05-23

---

## Why this exists

Today the Parent Dashboard renders two stacked sections:
1. **TODAY** — children cards with today's task progress (lines 278-376)
2. **אתמול · D.M** — YesterdayRecapCard list for kids with scheduled tasks yesterday (lines 378-409)

This creates information density and visual weight that competes with the actually-actionable surface (Today). Adi's call: replace the dual-section layout with a single section + **Today/Yesterday toggle pills**, defaulting to Today.

Pillar-2 rationale: Today is the actionable, forward-looking surface. Yesterday is reflective / read-only. Defaulting to Today and making Yesterday opt-in respects parent attention and avoids accidentally framing the dashboard around "what did/didn't happen yesterday" (which can drift into failure-counting).

---

## Locked decisions (CC defaults, Adi may override)

| # | Decision | Rationale |
|---|---|---|
| **OQ-DTY-1** | **Pills** (segmented buttons) — `[ היום ●   אתמול · D.M ]` — at the top of the unified section, replacing the static "TODAY" label | Simpler than tabs (no underline), more visually obvious than a dropdown. Date-stamping the Yesterday pill ("אתמול · 23.5") gives the parent context. |
| **OQ-DTY-2** | **State NOT persisted** — `view` resets to `'today'` on every mount | Pillar 2 — Today is the actionable default; locking parent into Yesterday-mode across sessions would skew focus toward what didn't happen. Simpler implementation (no AsyncStorage). |
| **OQ-DTY-3** | **Anchor Recovery modal is independent** of the toggle — always renders when there's an unread prompt + not shown-today, regardless of which view is active | Anchor Recovery is an event-driven intervention, not a view. Coupling it to the toggle would either hide it (bad — defeats the package) or weirdly couple two unrelated concerns. |
| **OQ-DTY-4** | **`+ Add Child` button hidden** when `view === 'yesterday'` | Adding a child is a today/future action — has no meaning in the yesterday view. Reduces visual noise. |
| **OQ-DTY-5** | **Yesterday pill is HIDDEN when** `yesterdayHidden === true` (Pause Mode active, no kids, or no kid had scheduled tasks yesterday) | When there's no yesterday to look at, the toggle is pointless. Better to show no pills than a dead pill. Falls back to current "TODAY" label without toggle. |
| **OQ-DTY-6** | **YesterdayRecapCard component reused as-is** | Keeps the package surgical. Card visual already passed pkg/yesterday-recap Values Check. |
| **OQ-DTY-7** | **Toggle pill copy** — HE: "היום" / "אתמול · {D.M}". EN: "Today" / "Yesterday · {M/D}". | Matches existing `dashboard.today` and `dashboard.yesterday` i18n where they exist; date format mirrors current yesterday section header. |

---

## Values Check

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1-3 | ✅ no change to reward / motivation surface |
| Positive Coaching | 1 — shame framing? | ✅ Defaulting to Today and making Yesterday opt-in REDUCES the dashboard's tendency to frame things around "what didn't happen". Net positive. |
| Positive Coaching | 2 — empathy on miss? | ✅ Yesterday cards (when chosen) use the already-shipped softened YesterdayRecapCard which is Pillar-2-compliant. |
| Positive Coaching | 3 — suffering mechanic? | ✅ none |
| Independence-Building | 1-3 | ✅ no kid-facing change |

**All 9 pass.**

---

## Behavior contract

### Scenario A — Normal day, kids have today + yesterday data
- Mount: pills render `[היום ●  |  אתמול · 23.5]`, Today active
- Add Child button visible
- Children cards render in Today shape (existing)
- Parent taps "אתמול" → pills swap (`היום | אתמול ●`), Add Child button HIDDEN
- Children cards swap to YesterdayRecapCard list (filtered to kids with `totalScheduled > 0`)
- Parent taps "היום" → swaps back

### Scenario B — Yesterday hidden (Pause Mode / no kids / no yesterday data)
- Pills do NOT render
- Section header falls back to static "TODAY" label (existing behavior)
- Add Child button visible
- Today cards render as today
- No Yesterday section anywhere

### Scenario C — Anchor Recovery modal interaction
- Modal mount logic unchanged (per OQ-DTY-3)
- Modal renders ON TOP of dashboard regardless of toggle state
- Tapping CTAs / dismiss in modal does NOT affect toggle state

### Scenario D — Cross-session
- Parent quits app while view='yesterday'
- Next mount: view resets to 'today' (per OQ-DTY-2)

---

## Files Touched

- `src/screens/parent/ParentDashboardScreen.tsx`:
  - Add local state `const [view, setView] = useState<'today' | 'yesterday'>('today')`
  - Replace lines 278-289 (section header + Add Child) with toggle pills + conditional Add Child
  - Wrap existing children render block (lines 291-376) in `view === 'today' &&`
  - Move yesterday cards rendering (lines 378-409) inside `view === 'yesterday' &&`, drop the standalone section header
  - Add styles for `togglePills`, `togglePillActive`, `togglePillInactive`, `togglePillText*`
- `src/i18n/he.json` + `src/i18n/en.json`:
  - New keys `dashboard.toggle.today` (=`היום`/`Today`) and `dashboard.toggle.yesterday` (=`אתמול · {{date}}`/`Yesterday · {{date}}`)
  - Add `dashboard.toggle.a11y.today` + `dashboard.toggle.a11y.yesterday` for accessibility
- `docs/sessions/dashboard-today-yesterday-toggle/*` — new session folder

## Files NOT Touched

- `src/components/YesterdayRecapCard.tsx` — reused as-is (OQ-DTY-6)
- `src/hooks/useYesterdayRecap.ts` — same hook, same data shape
- `src/hooks/useAnchorRecovery*` — independent (OQ-DTY-3)
- App.tsx + `__YesterdayRecapPreviewHarness.tsx` — Adi's WIP, untouched

---

## Tests (manual, emulator)

1. Default mount: `[היום ●  |  אתמול]` visible, Today cards render ✅
2. Tap "אתמול" → pills swap, YesterdayRecapCard list renders, "+ Add Child" hidden ✅
3. Tap "היום" → swap back ✅
4. Pause Mode active → no pills, "TODAY" label, Today cards ✅
5. Cold reopen after using Yesterday → view defaults back to Today ✅
6. Anchor recovery modal still renders on top (when applicable) regardless of view ✅
7. Banned-string grep on i18n: 0 hits ✅

---

## Phase plan

Single chunk. ~30 min.

---

**End of SPEC.**
