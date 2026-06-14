# schedule-equipment-backpack — SPEC

> Branch: `pkg/schedule-equipment-backpack`
> Goal: Close the loop **parent enters equipment per lesson → child sees what to pack for tomorrow.**

## Scope

Reuse what already exists; build only the gap.

**Already existed (verified, reused — not rebuilt):**
- `PeriodInfo.equipment?: string` — `src/types/timetable.ts:12`
- Parent VIEW renders the 🎒 badge — `src/screens/parent/TimetableScreen.tsx`
- Parser extracts equipment in all paths and `periodsToTimetable` persists it — `src/utils/timetableParser.ts`
- `manualUpdateLesson(day, idx, Partial<PeriodInfo>)` already accepts `equipment`
- i18n: `timetable.equipmentForLesson`, `timetable.equipmentBagPlaceholder`, full `bagPrep.*` + `gear.*` namespaces — already present in **both** `he.json` and `en.json`

**Built this package:**
1. Parent equipment text input per lesson in **MANUAL** and **REVIEW** modes (wired through existing `manualUpdateLesson` / `updatePeriod`).
2. New child packing screen `ChildBagPrepScreen` — resolves tomorrow's weekday, reads `timetable[tomorrow]`, renders per-lesson equipment as a checkable list, persists "packed" state locally.
3. Exactly one new `ChildTabs` entry (`ChildBagPrep`, label `tabs.child.gear`).

**Out of scope (other stream owns):** any activities / חוג / camp concept. The child screen is modelled as `PackSource[]` so those sources can be appended later; only the `school` source is implemented now.

## Decisions (approved by Adi)

- **D1 — Entry point: Tab only.** The `d3_pack_timetable` starter id is discarded at onboarding (`UStep5_Preview.tsx` inserts task rows without it; no `tasks.strategy_id` column), so a reliable task-tap → screen wiring is not possible without a schema + onboarding change that is outside this package's lane. → Reach the screen via its tab; defer task-tap wiring (see FLAG below).
- **D2 — Persistence: AsyncStorage**, key `bagPrep:{childId}:{YYYY-MM-DD(tomorrow)}` → array of checked item ids. No schema change; resets naturally each day.
- **D3 — Child copy: body-double subset only.** The reserved `*Credits` / `bonus` / `points` / "I'm hungry" keys are intentionally NOT used (fail Pillar 1 & 2). Only value-safe keys are wired.

## Values Check (9/9 — Pass)

**Pillar 1 — Intrinsic Motivation**
1. Useful with zero virtual reward? **Yes** — knowing what to pack is real-world useful.
2. Moves toward child-chosen real reward, not an app-made one? **N/A reward** — builds a real readiness habit, no currency involved.
3. Feels "I want" not "I must"? **Yes** — "I'm ready for tomorrow" (`bagPrep.readyForTomorrow`).

**Pillar 2 — Positive Coaching**
1. Ever demeaning / blaming / comparing / showing failure? **No** — unchecked items just stay unchecked; no counts of failure.
2. On "failure", empathy not pressure? **Yes** — no "you forgot" anywhere.
3. Any buddy/app suffering-loss-anger mechanic? **No** — the `notification.gearMaster*` "I'm hungry" + `gear.nightMission` bonus keys are deliberately unused.

**Pillar 3 — Independence-Building**
1. More capable without the app? **Yes** — externalizes working memory so the child packs without a nagging parent (scaffold that fades).
2. Child has a voice? **Yes** — child chooses what to check.
3. Does its job and fades? **Yes** — no lock-in, no streak.

## Files changed

| File | Change |
|---|---|
| `src/screens/parent/TimetableScreen.tsx` | Equipment input per lesson in MANUAL + REVIEW; rows → cards (`equipCard`/`cardTopRow`/`equipRow`) |
| `src/screens/child/ChildBagPrepScreen.tsx` | **NEW** — packing screen (school source, tomorrow resolution, checklist, AsyncStorage, empty states) |
| `src/navigation/types.ts` | `ChildBagPrep` added to `ChildTabsParamList` |
| `src/navigation/ChildTabs.tsx` | import + `TAB_CONFIG` entry (`briefcase` icon) + one `Tab.Screen` |
| `src/i18n/en.json`, `src/i18n/he.json` | `tabs.child.gear` ("Gear" / "ציוד") |

Untouched (confirmed no change needed): `useTimetable.ts`, `timetableParser.ts`, `timetable.ts` type, DB schema, onboarding, migrations.

## Open FLAG

🚩 **Task-tap → packing screen not wired.** The evening `d3_pack_timetable` task still completes inline; the screen is reached via its tab. Robust task-tap wiring needs a future package: add `tasks.strategy_id` column (schema approval) + preserve the starter id in `UStep5_Preview.tsx` insert + branch the child task tap to navigate. Both files are outside this package's declared ownership.

## Verification

- `tsc --noEmit` — clean (EXIT 0).
- `npm run i18n:check` — all static keys resolve in both locales.
- Expo web bundle — clean (1664 modules, no bundle errors); app boots to role-selection; no new console errors (only pre-existing RTL `direction` web warnings).
- **Pending Adi (auth-gated):** parent enters equipment in MANUAL + REVIEW and it saves & shows 🎒; child opens Gear tab, sees tomorrow's items, checks them, state survives reload; weekend/empty → "day off" state.
