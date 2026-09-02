# tomorrow-pack-inconsistency — Tests

> Concrete pass/fail per phase. Automated = CC (jest / tsc / i18n:check / web bundle). Emulator = Hat-3 via `buff-testing`, final visual = Adi (Hat-4).
> Reachability rule (WORKFLOW #11): every manual scenario starts at the **tab bar**, not at a deep-linked screen.

## Fixtures (shared)

Seed for child C (family F), where **tomorrow** = the weekday after the device's today:
- `timetables`: row for C with **no periods on tomorrow's weekday**; today's weekday has one period, subject `"אמנות"` 09:00, equipment `"תיקיית אמנות"` (exercises the school builder).
- `activities`, today: `חוג אלקטרוניקה` 17:00, equipment `["ארגז כלים"]`, `weekdays=[today]` (Noa's screenshot shows it with the ✨ activity icon — it is an activity, not a timetable subject).
- `activities`, tomorrow (all `status='active'`, `child_id=C`, `schedule_kind='recurring'`, `weekdays=[tomorrow]`):
  - `חוג נינג'ה` 16:15, equipment `["בגדי ספורט","נעלי ספורט"]`
  - `חוג כדורסל` 17:30, same equipment
  - `חוג הגנה עצמית ואומנויות לחימה` 18:15, same equipment
- Variant **T0**: additionally clear today's period → today has zero groups.
- Variant **SAT**: run on a Friday (tomorrow = Saturday) with one club on `saturday`.

---

## Phase 1 — PackingCard emphasis + collapse

### Automated (CC) — `src/components/__tests__/PackingCard.test.tsx`
Mocks: `useActivities` / `useTimetable` return fixtures plus a controllable `loading`; `@react-navigation/native` (`useNavigation`, `useFocusEffect`) as in `GamerDashboardScreen.test.tsx:31`; `ThemeContext` as in `PetDisplay.test.tsx` (bare `useChildTheme` throws); AsyncStorage via the **global** `jest-setup.ts` mock (has `multiGet` — do not copy the Gamer test's `getItem/setItem`-only override). `toHaveStyle` is available from RNTL ≥12.4 (`^12.7.2` installed).
- [ ] Today pill uses mock `primary`/`primaryForeground`; today block has `borderStartWidth: 3` + mock `accent`; tomorrow pill uses mock `muted`/`mutedForeground`; tomorrow header text equals `childTasks.tomorrow` (with the `t: key => key` mock assert the key and the `day` param via a spy).
- [ ] Collapsed tomorrow header shows the first tomorrow group's title as hint; expanded header shows no hint.
- [ ] Tomorrow rows have no `opacity` style.
- [ ] `defaultTomorrowExpanded` prop: `true` → rows present on first render; `false`/absent → absent, unless today is empty (auto-expand).
- [ ] Tomorrow header has `accessibilityRole="button"` and `accessibilityState.expanded` that flips on press.
- [ ] Pressing the tomorrow header removes every tomorrow row from the tree; pressing again restores them. Default state per Q6 (test the chosen default; if Q6 = collapsed, also test the **T0** auto-expand).
- [ ] While collapsed, no text node exists between the tomorrow header and `camp.addMine` (stronger than a digit regex, which is vacuous under the `t: key => key` mock).
- [ ] Toggling collapse does not change `checked` (tick an item, collapse, expand → still ticked; AsyncStorage `setItem` not called by the toggle).
- [ ] With `loading=true` on either hook: spinner, **no** `camp.empty`, no groups. With both `false` and both days empty: `camp.empty`. Today empty + tomorrow clubs: no `camp.empty`.
- [ ] Focus-effect: after writing a new id into AsyncStorage, invoking the captured `useFocusEffect` callback re-reads it into `checked`.
- [ ] Clubs-only tomorrow renders three `source: 'activity'` groups with their times and both equipment rows each.
- [ ] `GamerDashboardScreen.test.tsx`, `fromTimetable.test.ts`, `packing.test.ts` still pass. `npm run typecheck` = 0 errors.

### Emulator / web (Hat-3, then Adi)
- [ ] HQ tab, Mint: today reads as one contained block (rail `#C084FC` down its start edge + filled pill) and tomorrow as a second, quieter block; the pill does not look more important than the card title; rail and pill on the reading-start side in **he** and **en**.
- [ ] Same on Gamer (dark): accent bar `#A855F7` on `#1E2436`, muted header `#7F8EA3` — both legible.
- [ ] Web: Tab to the tomorrow header, Enter/Space toggles it; screen reader announces expanded/collapsed.
- [ ] Tap tomorrow header → expands; items slightly muted; tap again → collapses. Tap target ≥ 44 px.
- [ ] Web (`npm run web`) shows the identical layout.

### Methodological
- [ ] STATUS.md row phase 1 = passed, with commit + test output.
- [ ] Values Check re-run: no count, no "missing" language anywhere on the card.

---

## Phase 2 — ציוד tab hosts PackingCard

### Automated (CC)
- [ ] `ChildBagPrepScreen` no longer imports `PeriodInfo`/`WeekDay`; no `bagPrep:` storage key remains in `src/` (`grep -rn "bagPrep:" src` → 0).
- [ ] No reference to `bagPrep.tomorrowOff`, `.noNeedToPack`, `.itemsReady`, `.checkAllItems`, `.bagReady`, `.readyForTomorrow`, `gear.noSpecialEquipment` in `src/` (`grep`).
- [ ] Exactly one `useTimetable` / one `useActivities` call per mounted host (no shell-side duplicate hook).
- [ ] `npm run typecheck`, `npm test`, `npm run i18n:check` clean. Web bundle builds.

### Emulator / web — Noa's scenario, end-to-end (Reachability)
- [ ] Cold start as child C → tap **ציוד** tab → today block (rail + pill) with "אמנות" and "חוג אלקטרוניקה · 17:00 / ארגז כלים", then "מחר · יום {weekday}" **expanded** (per-host default; if Q6 = global, per Adi) listing נינג'ה 16:15, כדורסל 17:30, הגנה עצמית 18:15, each with בגדי ספורט + נעלי ספורט. **No** "מחר יום חופש".
- [ ] HQ tab, same data: "מחר" collapsed to one row showing the weekday + "חוג נינג'ה · 16:15" hint + chevron; tap → expands.
- [ ] Tick all of today's items → today pill turns success-styled and "✓ מוכנים!" appears in foreground colour; rows stay visible.
- [ ] Tick "נעלי ספורט" under נינג'ה → switch to HQ tab → same item ticked there **without relaunch** (focus-reload). Tick something on HQ → back to ציוד → ticked.
- [ ] Kill + relaunch app → ticks persist on both hosts.
- [ ] **T0** variant: behaviour per Q6 (if collapsed default: "מחר" opens expanded).
- [ ] **SAT** variant: the Saturday club shows; no school group; no crash.
- [ ] Loading: on a slow network the card shows its header + spinner, then the groups. No flash of `camp.empty` (throttle network in the emulator / DevTools on web).
- [ ] View-as-Child (parent preview of C) shows C's gear, not the parent's.
- [ ] Both themes, he + en, Android **and** web.

### Methodological
- [ ] STATUS.md row; `INTEGRATION_LEARNINGS.md:78` open item → resolved (per SPEC_SYNC).
- [ ] Values Check re-run on the tab: no counter, no "mark all", no completion verdict.

---

## Phase 3 — i18n hygiene + docs
- [ ] Dead `bagPrep.*` + `gear.noSpecialEquipment` keys removed from `he.json` **and** `en.json` (Q4: delete); `npm run i18n:check` clean.
- [ ] `SPEC_SYNC.md` rows applied; proposals for Adi's docs written in `STATUS.md` notes, **not** applied.
- [ ] No drift between SPEC §4 Behavior Contract and the running app (walk the 8 points).

---

## Sentry log health check (convention)
- [ ] Pre-deploy baseline recorded in the last-phase commit message.
- [ ] Post-deploy regression ≥ 15 min after merge: `new_issues_count = 0` or unrelated only.

## Closeout
- [ ] All phase tests pass; STATUS closeout checklist complete; git tag `pkg/tomorrow-pack-inconsistency/v1`.
