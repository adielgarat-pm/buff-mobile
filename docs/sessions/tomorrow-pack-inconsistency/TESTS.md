# tomorrow-pack-inconsistency — Tests

> Concrete pass/fail per phase. Automated = CC (jest / tsc / i18n:check / web bundle). Emulator = Hat-3 via `buff-testing`, final visual = Adi (Hat-4).
> Reachability rule (WORKFLOW #11): every manual scenario starts at the **tab bar**, not at a deep-linked screen.

## Fixtures (shared)

Seed for child C (family F), where **tomorrow** = the weekday after the device's today:
- `timetables`: row for C with **no periods on tomorrow's weekday**; today's weekday has one period with equipment `"ארגז כלים"` under subject `"חוג אלקטרוניקה"` at 17:00 (mirrors Noa's screenshot).
- `activities` (all `status='active'`, `child_id=C`, `schedule_kind='recurring'`, `weekdays=[tomorrow]`):
  - `חוג נינג'ה` 16:15, equipment `["בגדי ספורט","נעלי ספורט"]`
  - `חוג כדורסל` 17:30, same equipment
  - `חוג הגנה עצמית ואומנויות לחימה` 18:15, same equipment
- Variant **T0**: additionally clear today's period → today has zero groups.
- Variant **SAT**: run on a Friday (tomorrow = Saturday) with one club on `saturday`.

---

## Phase 1 — PackingCard emphasis + collapse

### Automated (CC) — `src/components/__tests__/PackingCard.test.tsx`
Mock `useActivities` / `useTimetable` to return fixtures; mock `@react-navigation/native` and AsyncStorage as in `GamerDashboardScreen.test.tsx`.
- [ ] Today header renders with the primary style (assert `fontWeight: '800'` and `color: T.foreground`); tomorrow header with muted style.
- [ ] With today groups present, tomorrow's items are **not** in the tree until the tomorrow header is pressed; after press they are; after second press they are gone.
- [ ] With **T0**, tomorrow's items are in the tree on first render (auto-expanded).
- [ ] Collapsed tomorrow header contains **no digit characters** (regex `/\d/` over its text) — values guard.
- [ ] Toggling collapse does not change `checked` (tick an item, collapse, expand → still ticked; AsyncStorage `setItem` not called by the toggle).
- [ ] `camp.empty` renders only when both days have zero groups; **not** when today is empty but tomorrow has clubs.
- [ ] Clubs-only tomorrow renders three `source: 'activity'` groups with their times and both equipment rows each.
- [ ] `GamerDashboardScreen.test.tsx`, `fromTimetable.test.ts`, `packing.test.ts` still pass. `npm run typecheck` = 0 errors.

### Emulator / web (Hat-3, then Adi)
- [ ] HQ tab, Mint: today block visibly heavier than tomorrow; divider between them; chevron visible; accent bar on the reading-start side in **he** and **en**.
- [ ] Same on Gamer (dark) — contrast of the accent bar (`#22D3EE`) and muted header (`#7F8EA3`) acceptable.
- [ ] Tap tomorrow header → expands; items slightly muted; tap again → collapses. Tap target ≥ 44 px.
- [ ] Web (`npm run web`) shows the identical layout.

### Methodological
- [ ] STATUS.md row phase 1 = passed, with commit + test output.
- [ ] Values Check re-run: no count, no "missing" language anywhere on the card.

---

## Phase 2 — ציוד tab hosts PackingCard

### Automated (CC)
- [ ] `ChildBagPrepScreen` no longer imports `PeriodInfo`/`WeekDay`; no `bagPrep:` storage key remains in `src/` (`grep -rn "bagPrep:" src` → 0).
- [ ] No reference to `bagPrep.tomorrowOff`, `.noNeedToPack`, `.itemsReady`, `.checkAllItems`, `.bagReady`, `.readyForTomorrow` in `src/` (`grep`).
- [ ] `npm run typecheck`, `npm test`, `npm run i18n:check` clean. Web bundle builds.

### Emulator / web — Noa's scenario, end-to-end (Reachability)
- [ ] Cold start as child C → tap **ציוד** tab → the card shows today's "חוג אלקטרוניקה · 17:00 / ארגז כלים" and a collapsed "מחר" header. **No** "מחר יום חופש".
- [ ] Expand "מחר" → נינג'ה 16:15, כדורסל 17:30, הגנה עצמית 18:15, each with בגדי ספורט + נעלי ספורט.
- [ ] Tick "נעלי ספורט" under נינג'ה → switch to HQ tab → same item ticked there. Tick something on HQ → back to ציוד → ticked.
- [ ] Kill + relaunch app → ticks persist on both hosts.
- [ ] **T0** variant: ציוד tab opens with "מחר" already expanded.
- [ ] **SAT** variant: the Saturday club shows; no school group; no crash.
- [ ] Loading: on a slow network the shell shows a spinner, then the card. No flash of `camp.empty` before data arrives.
- [ ] View-as-Child (parent preview of C) shows C's gear, not the parent's.
- [ ] Both themes, he + en, Android **and** web.

### Methodological
- [ ] STATUS.md row; `INTEGRATION_LEARNINGS.md:78` open item → resolved (per SPEC_SYNC).
- [ ] Values Check re-run on the tab: no counter, no "mark all", no completion verdict.

---

## Phase 3 — i18n hygiene + docs
- [ ] Dead `bagPrep.*` keys removed from `he.json` **and** `en.json` (if Q4 = delete); `npm run i18n:check` clean.
- [ ] `SPEC_SYNC.md` rows applied; proposals for Adi's docs written in `STATUS.md` notes, **not** applied.
- [ ] No drift between SPEC §4 Behavior Contract and the running app (walk the 8 points).

---

## Sentry log health check (convention)
- [ ] Pre-deploy baseline recorded in the last-phase commit message.
- [ ] Post-deploy regression ≥ 15 min after merge: `new_issues_count = 0` or unrelated only.

## Closeout
- [ ] All phase tests pass; STATUS closeout checklist complete; git tag `pkg/tomorrow-pack-inconsistency/v1`.
