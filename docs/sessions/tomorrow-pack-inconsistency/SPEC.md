# tomorrow-pack-inconsistency — SPEC

> Target state for this package. Authoritative until superseded by a later session.
> Wins over canonical docs during the package; canonical docs are updated at exit per `SPEC_SYNC.md`.
>
> **Origin:** beta tester Noa, WhatsApp 2026-09-02 07:22–07:23 (two screenshots).
> **Investigation:** this session (read-only) + architect review. No code has been changed yet.
> **Successor of:** `docs/sessions/noaa-behavior-spec/` — closes the half of D1 that session deferred.

---

## 0. TL;DR

Two child-facing "what to pack" surfaces disagree about the same tomorrow, and neither makes today vs tomorrow visually distinct. Root cause: the **ציוד tab** (`ChildBagPrepScreen`) is the pre-consolidation fork that never received the noaa-behavior-spec bridge — it reads the school timetable only, computes tomorrow with a different date engine, keeps its own check-off storage, and still carries the `n/total` counter the values rule forbids. **Fix: make the ציוד tab host the already-canonical `PackingCard` (one source of truth, one date engine, one storage), and inside `PackingCard` make "today" the visually dominant section with "tomorrow" collapsible.** No schema, no new dependency, no navigation change.

---

## 1. What Noa reported (anchored to the screenshots)

| # | Noa's words (verbatim) | Surface | Observed |
|---|---|---|---|
| R1 | *"לא יודעת אם זה בגלל שזה ציוד של חוגים, זה לא מופיע בחלק של סידור תיק למחר"* | ציוד tab — "סידור תיק למחר" | Empty state **"מחר יום חופש! 🎉 / אין צורך להכין תיק - תהנה מהמנוחה!"** while the HQ card lists 3 clubs tomorrow (נינג'ה 16:15, כדורסל 17:30, הגנה עצמית 18:15 — בגדי ספורט + נעלי ספורט each). |
| R2 | *"מופיע היום ומחר וזה לא בולט מה בדיוק זה להיום ומה למחר (לא בולט מספיק). אולי להבליט את ההבדל? או לעשות את מחר בחלק שאפשר לצמצם ולהרחיב?"* | HQ card — "נארוז יחד?" | Section labels "היום" / "מחר" render identically (12px, bold, muted). Both sections always expanded. |

Noa's own diagnosis in R1 ("because it's club gear?") is **correct**.

---

## 2. Root cause (code-anchored, verified by architect)

### 2.1 The two surfaces

| | **HQ card — "נארוז יחד?"** | **ציוד tab — "סידור תיק למחר"** |
|---|---|---|
| Component | `src/components/PackingCard.tsx` → `PackingCard` | `src/screens/child/ChildBagPrepScreen.tsx` → `ChildBagPrepScreen` |
| Mounted at | `ChildDashboardScreen.tsx:218`, `GamerDashboardScreen.tsx:538` | `src/navigation/ChildTabs.tsx:119` (tab `ChildBagPrep`, label `tabs.child.gear`) |
| Data sources | **two, merged**: `useTimetable` via `lib/packing/fromTimetable.ts` **+** `useActivities` via `lib/activities/packing.ts` | **one**: `useTimetable` only |
| Supabase | `timetables` (weekday→periods blob) **+** `activities` (per-row `equipment` jsonb, `schedule_kind`, `weekdays`/`on_date`) | `timetables` only |
| Day scope | today **and** tomorrow | tomorrow only |
| "Tomorrow" engine | `isoShift(todayISO(), 1)` — parsed at **local noon**, recomputed every render (`PackingCard.tsx:19-33,46-47`) | `new Date(); d.setDate(d.getDate()+1)` → `getDay()` weekday bucket, computed **once per mount** (`ChildBagPrepScreen.tsx:82-84`) |
| Empty state | `camp.empty` only when today **and** tomorrow are both empty (`:104,157`) | `bagPrep.tomorrowOff` when `!tomorrow \|\| tomorrowPeriods.length === 0` (`:147`) — i.e. **"no school periods"**, activities never consulted |
| Check-off storage | `buff_packing_${childId}_${iso}` per day (`:67`) | `bagPrep:${childId}:${ymd}` (`:99`) — **separate**; a tick on one surface is invisible on the other |
| Counter / verdict UI | none (by design, noaa D2) | `checkedCount/allItems.length`, "סמן הכל", "התיק מוכן למחר!" (`:134-135,181-186,232-247`) |

### 2.2 The mechanism of R1

```ts
// ChildBagPrepScreen.tsx:86-90 — the ONLY source built
const sources = useMemo<PackSource[]>(() => [buildSchoolSource(tomorrowPeriods)], [...]);

// ChildBagPrepScreen.tsx:146-158 — the "day off" gate
// No school tomorrow (weekend or empty timetable) → nothing to pack.
if (!tomorrow || tomorrowPeriods.length === 0) { /* 🎉 bagPrep.tomorrowOff */ }
```

Clubs (חוגים) live in the `activities` table. A day with three clubs and no school lessons has `tomorrowPeriods.length === 0`, so the tab declares a day off. The card, which also runs `buildPackingGroups(activities, childId, tomorrow)`, shows the clubs. Same tomorrow, different inputs.

### 2.3 Why this exists — the half-finished consolidation

`docs/sessions/noaa-behavior-spec/` (2026-07) fixed the **opposite** direction of the same asymmetry (R3 there: camp gear typed into the timetable was invisible on the HQ card). Its D1 bridged **timetable → card** and made `PackingCard` the unified surface (today+tomorrow, noon-anchored dates, per-day storage, no counter). Its STATUS explicitly deferred the other half:

> *"ChildBagPrep tab consolidation (D1 option 2 — remove/redirect the separate ציוד tab now that HQ shows today+tomorrow): deferred; touches `ChildTabs` owned by a sibling session. … The BagPrep screen also still has a `count/total` progress counter that contradicts the no-counter rule."* — `noaa-behavior-spec/STATUS.md` § Non-goals / deferred

`ChildBagPrepScreen.tsx:46-49` still reserves `key: 'school'; // future: 'activity' | 'camp' (other stream)`. That future never arrived. **The ציוד tab is not a peer of the card; it is the stale fork.** Every defect in the table above is a symptom of that one fact.

### 2.4 The mechanism of R2

```ts
// PackingCard.tsx:161-162 — identical treatment for both days
{renderSection(today,    t('camp.today'),    todayGroups)}
{renderSection(tomorrow, t('camp.tomorrow'), tomorrowGroups)}
// PackingCard.tsx:180 — the one shared header style
sectionLabel: { fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 2 }  // color: T.mutedForeground
```

No divider between the day blocks, no emphasis difference, no collapse. On a day with several groups the list reads as one continuous checklist.

### 2.5 Latent issues found in passing (real, in scope only where marked)

- **L1 — Split check-off state.** Ticking "נעלי ספורט" on the HQ card does not tick it on the ציוד tab and vice-versa (different storage keys). Consolidation fixes this for free. *(in scope — falls out of D1)*
- **L2 — Stale tomorrow on the tab.** `tomorrowDate` is memoised `[]`; a tab left mounted across midnight keeps yesterday's "tomorrow". `PackingCard` recomputes per render. *(in scope — falls out of D1)*
- **L3 — Card copy says "today" but card shows tomorrow too.** `camp.cardSub` = *"מה לוקחים היום, בקצב שלך"*, `camp.empty` = *"היום אין מה לארוז — תהנו!"* — both pre-date the today+tomorrow split. *(copy decision for Adi — see Open Questions)*
- **L4 — Dead / never-used bagPrep keys.** `bagPrep.bagReadyCredits`, `.undo`, `.undone`, `.undoneDesc`, `.bagReadyToast`, `.bagAlreadyReady`, `.credits`, `.waterBottle`, `.food`, `.phoneCharger`, `.importantItems`, `.lessons` are not referenced by the current screen. *(cleanup — see D5)*

---

## 3. Decisions

> D1–D2 are the package. D3–D5 are consequences that need an explicit call. Recommendation first, alternatives after. **Adi decides; CC does not self-approve.**

### D1 — Consolidate onto `PackingCard`: the ציוד tab hosts the card *(core)*

**Recommendation:** `ChildBagPrepScreen` becomes a thin screen shell (title + `T.background` + `ScrollView` + loading spinner) that renders `<PackingCard childId={previewChildId ?? profile?.id ?? null} />`. All bespoke timetable-only logic in the file is deleted (`WEEKDAY_BY_JS`, `PackItem`/`PackSource`, `splitEquipment`, `buildSchoolSource`, `ymd`, the `bagPrep:` storage, the counter/markAll/bagReady footer, the day-off branch). The tab entry in `ChildTabs.tsx` is **not touched**.

**Why:**
- One date engine, one merge, one storage scheme. R1, L1, L2 disappear by construction rather than by reconciliation.
- Values compliance falls out for free: the counter, "סמן הכל" and the "bag ready" verdict — the three pieces of miss/pressure framing that live only in this file — are deleted instead of re-justified.
- Zero navigation blast radius. `ChildTabs.tsx` stays as is (the ownership concern that stalled noaa D1-option-2).
- No new logic to test: `fromTimetable.test.ts` and `packing.test.ts` already cover the merge.

**Alternatives considered:**
- *(rejected)* **Teach `ChildBagPrepScreen` to also read activities.** Re-implements the merge and the noon-anchored date logic a second time, keeps two storage keys, and still requires stripping the counter. This duplication is exactly what produced the bug; it would drift again.
- *(rejected)* **Copy-only change** ("מחר אין בית ספר" instead of "יום חופש"). Cannot distinguish a true day off from a clubs-only day without reading activities, and leaves the clubs unpackable on the tab.
- *(deferred, Adi's call)* **Remove the ציוד tab entirely.** Touches `ChildTabs.tsx` + `ChildTabsParamList` + any deep links to `ChildBagPrep`. Possible follow-up once the hosted card has proven itself; not required for the fix. See Open Question Q1.

### D2 — In `PackingCard`: "today" dominant, "tomorrow" collapsible *(Noa R2)*

**Recommendation:** keep one card, two sections, but differentiate them:

| | Today (`camp.today`) | Tomorrow (`camp.tomorrow`) |
|---|---|---|
| Header | 14px / weight 800 / `T.foreground`, leading 4×16 accent bar in `T.primary` | 12px / weight 700 / `T.mutedForeground`, trailing `chevron-down` / `chevron-up` in `T.mutedForeground`; whole header row is a `TouchableOpacity` (min-height 44) |
| Separator | — | `borderTopWidth: 1, borderTopColor: T.border` above the header, `marginTop: 12` |
| Body | as today | when expanded: same rows, item label at `opacity: 0.85` (prep, not now); when collapsed: nothing |
| Default state | always expanded (not collapsible) | **collapsed**, except: if `todayGroups.length === 0` → **expanded** (otherwise the child lands on an empty card with only "+ הוסף לעצמי") |
| State | — | ephemeral `useState`; **not** persisted (Q3) |
| Counts | none | none — the collapsed header is **label + chevron only**; never "3 פריטים" (values guard, Pillar 2) |
| "מוכנים!" | unchanged (`camp.allPacked` when every id in the section is checked) | unchanged; shows only when expanded |

**Why not a segmented today/tomorrow toggle:** it hides today whenever the child looks at tomorrow and adds a mode to manage — the opposite of "today is zero-tap". **Why not emphasis alone:** on a long merged list the boundary still blurs, which is Noa's exact complaint.

All tokens used (`foreground`, `mutedForeground`, `primary`, `border`, `success`, `card`) exist in both Mint and Gamer palettes (`ThemeContext.tsx:88-138`). No new colours.

### D3 — Tab title copy

The tab screen title is `bagPrep.title` = *"סידור תיק למחר"* / *"Packing bag for tomorrow"*. After D1 the tab shows today **and** tomorrow. **Recommendation:** re-point the shell title to a scope-neutral string. Proposed: reuse `camp.cardTitle` (*"נארוז יחד?"*) so tab and card share one name, **or** a new `bagPrep.title` value *"הציוד שלי"* / *"My gear"* (matches the tab label `tabs.child.gear`). **Adi picks the string** (Open Question Q2). CC must not invent copy.

### D4 — Loading state in the shell

`PackingCard` renders nothing until its hooks resolve; the old tab showed an `ActivityIndicator`. **Recommendation:** the shell keeps a spinner gated on `useTimetable(childId).loading` only (the timetable is the slower of the two fetches; `PackingCard` already handles the activities arriving late). Alternative: expose a `loading` flag from `PackingCard` — rejected as unnecessary API surface.

### D5 — i18n key hygiene

After D1 these keys have **no** remaining reference: `bagPrep.lessons`, `.tomorrowLessons`, `.equipmentNeeded`, `.importantItems`, `.waterBottle`, `.food`, `.phoneCharger`, `.tomorrowOff`, `.noNeedToPack`, `.bagReady`, `.bagReadyCredits`, `.readyForTomorrow`, `.checkAllItems`, `.undo`, `.undone`, `.undoneDesc`, `.itemsReady`, `.bagReadyToast`, `.bagAlreadyReady`, `.credits` (he + en). **Recommendation:** delete them in the same chunk, guarded by `npm run i18n:check`. Alternative: leave them (harmless, but they mislead the next reader into thinking the counter still exists). Q4.

---

## 4. Behavior Contract (after the package closes)

1. **One packing surface, two hosts.** The HQ dashboards (Mint + Gamer) and the ציוד tab render the same `PackingCard` for the same `childId`. Whatever appears on one appears on the other, including check-off state.
2. **Sources.** For each of today and tomorrow the card shows, in this order: school-timetable gear (one group per subject, `source: 'school'`) then activities/clubs gear (one group per activity, `source: 'activity'`). Groups with no equipment are omitted. Archived and `proposed` activities are omitted (`activeOnDate`).
3. **Dates.** "Today" is the device-local calendar date; "tomorrow" is today + 1 day, both computed via noon-anchored local parsing. Saturday has no school groups (`toSchoolWeekday` returns null) but may have activity groups. Both dates are recomputed on every render — no stale tomorrow after midnight.
4. **Day-off semantics.** The card shows `camp.empty` only when today **and** tomorrow both have zero groups from **both** sources. There is no per-day "day off" celebration; an empty day is simply not rendered as a section. *(A clubs-only tomorrow therefore shows the clubs.)*
5. **Today vs tomorrow.** Today is the prominent, always-open section. Tomorrow is a demoted, collapsible section — collapsed by default when today has content, expanded by default when today is empty. Toggling never affects check-off state.
6. **Check-off.** Per item, per day, per child, in AsyncStorage key `buff_packing_${childId}_${iso}`; tomorrow's ticks survive into tomorrow (they become today's key). No counter, no "mark all", no completion verdict. Per-section *"מוכנים!"* appears when every item in that section is ticked.
7. **Child voice.** "+ הוסף לעצמי" remains at the bottom of the card on both hosts and navigates to `ChildAddActivity` as today.
8. **Platform parity.** Pure RN + AsyncStorage; identical on Android and Web. No native module, no platform split.

---

## 5. Schema Changes

None. No Supabase table, RLS, or function is touched. Read paths are unchanged (`timetables`, `activities`).

---

## 6. API / Route Changes

- **Navigation:** none. `ChildTabs.tsx`, `ChildTabsParamList`, `RootStackParamList` unchanged. Route `ChildBagPrep` keeps its name and tab slot.
- **Hooks:** none added or changed. `useActivities` / `useTimetable` used as they are.
- **Components:** `PackingCard` gains internal collapse state and a `renderSection` variant parameter (`emphasis: 'primary' | 'secondary'`, or two small render helpers — CC's call in Plan Mode). Its props contract (`{ childId }`) is unchanged.
- **Files touched:** `src/components/PackingCard.tsx`, `src/screens/child/ChildBagPrepScreen.tsx`, `src/i18n/he.json`, `src/i18n/en.json`, tests (below). Nothing else.

---

## 7. UI Changes

### 7.1 `PackingCard` (both hosts)

```
┌──────────────────────────────────────────┐
│ נארוז יחד?                          🛍  │
│ מה לוקחים היום, בקצב שלך                 │
│                                          │
│ ▍היום                      ← 14px/800/fg │
│ ─ 📖 אמנות · 09:00                       │
│   ○ תיקיית אמנות                         │
│ ─ ✨ חוג אלקטרוניקה · 17:00              │
│   ○ ארגז כלים                            │
│ ───────────────────────── (T.border)     │
│ מחר                              ⌄       │  ← 12px/700/muted, tappable
│                                          │  (collapsed: nothing below)
│           + הוסף לעצמי                   │
└──────────────────────────────────────────┘
```

Expanded tomorrow shows the same group/row structure as today with the chevron flipped to ⌃ and item labels at 0.85 opacity. RTL: the accent bar sits on the reading-start side (use `borderStartWidth` / logical margins, not `left`).

### 7.2 ציוד tab (`ChildBagPrepScreen` shell)

```
[title — per D3]                 (22px/800, paddingTop 56 as today)
[ScrollView, paddingHorizontal 16]
  <PackingCard childId=… />
```

Removed: subject chips row, "🎒 ציוד נדרש לשיעורים" label, `n/total פריטים מוכנים`, "סמן הכל", "התיק מוכן למחר! ✨" banner, "מחר יום חופש! 🎉" branch.

### 7.3 Copy

| Key | Now | After |
|---|---|---|
| `bagPrep.title` | סידור תיק למחר / Packing bag for tomorrow | **Q2 — Adi** |
| `camp.cardSub` | מה לוקחים היום, בקצב שלך | unchanged unless Adi wants L3 fixed (Q5) |
| `camp.empty` | היום אין מה לארוז — תהנו! | unchanged unless Q5 |
| `camp.today` / `camp.tomorrow` | היום / מחר | unchanged |
| dead `bagPrep.*` (D5 list) | present | deleted (Q4) |

No new user-facing string is introduced by this package except whatever Adi picks for Q2.

---

## 8. Tests (summary — full criteria in `TESTS.md`)

**Automated (CC):**
- New `src/components/__tests__/PackingCard.test.tsx` (RTL): today header uses primary emphasis; tomorrow collapsed by default when today has groups; expanded by default when today is empty; toggling does not alter `checked`; collapsed header renders no digits; `camp.empty` only when both days empty; clubs-only tomorrow renders the activity groups.
- Existing `fromTimetable.test.ts`, `packing.test.ts`, `GamerDashboardScreen.test.tsx` stay green.
- `npm run typecheck`, `npm test`, `npm run i18n:check` clean.

**Emulator / web (Hat-3 + Adi), Reachability rule (WORKFLOW #11):**
- Seed Noa's data (timetable empty tomorrow; three recurring activities on tomorrow's weekday with gear). Cold start → tap ציוד tab → clubs listed under "מחר" once expanded → tick "נעלי ספורט" → switch to HQ tab → same item ticked. Both Mint and Gamer, he and en, Android **and** `npm run web`.
- Today-empty day: tomorrow arrives expanded.
- Saturday tomorrow with a club: club shows, no school group.

---

## 9. Capabilities & Bottlenecks

### What Claude Code will do
- All edits in §6, tests, i18n check, typecheck, jest, web bundle check, STATUS/INTEGRATION_LEARNINGS rows, commit on `claude/tomorrow-pack-inconsistency-lbm97x`.
- Hat-3 emulator pass via `buff-emulator` / `buff-testing` skills if the emulator lease is free.

### What Adi must do herself
- Answer Q1–Q5 below (copy + product calls).
- `approved, proceed` per phase; diff review per chunk.
- Final visual sign-off on a real device (Hat-4), both themes.
- Reply to Noa.

### Bottlenecks
- Q2 (tab title) blocks the copy chunk of Phase 2 only; Phases 1 and the structural part of 2 can proceed.
- Emulator lease may be held by another session (`⛔ EMULATOR BUSY`) — web verification proceeds regardless.

---

## 10. Values Check (against the *proposed* behaviour)

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this without a virtual reward?** Yes. Nothing here is rewarded; it removes a false "day off" message that would have left a child without sports shoes at ninja. Knowing what to bring is its own payoff.
2. **Does it bring the child closer to a reward they chose?** Not directly; it does not move BUFFs. Neutral — and it *removes* the never-wired "הרווחת {credits} באפים" copy that implied packing is a coin task.
3. **Does success feel like "I want to" or "I have to"?** "I want to": the list is body-double ("נארוז יחד?"), the child ticks at their pace, there is no completion gate. The deleted "סמן הכל" / "אני מוכן למחר!" button was the one "I have to finish" affordance; it goes.

### Pillar 2 — Positive Coaching
1. **Does the wording ever shame / compare / show failure?** No. Deletes `n/total` (an implicit "you're missing k"). The collapsed tomorrow header is explicitly count-free. Copy stays *"מוכנים!"*, never "you forgot".
2. **If the child fails — empathy or pressure?** There is no failure state. An unticked list is just a list; tomorrow's unticked items roll into tomorrow's key without comment.
3. **Any BUDDY suffering / loss / anger mechanic?** None. BUDDY is not involved.

### Pillar 3 — Independence-Building
1. **Does it make the child more capable *without* the app?** Yes: a single, honest, chronological picture of "what I carry today / tomorrow" is the mental model we want them to internalise; the app rehearses it rather than replacing it.
2. **Does the child have a voice?** Yes — "+ הוסף לעצמי" stays on both hosts; the child can add their own gear. Collapse/expand is theirs to control.
3. **In 6 months — still essential, or has it done its job?** Ideally the child glances at "מחר" the night before and packs alone; the card should feel optional by then. Nothing here creates dependence (no streaks, no reminders, no rewards).

**Values Check Pass:** [x] yes — re-verify at each phase exit against the implemented behaviour.

---

## 11. Open Questions (Adi — not for CC to resolve)

- **Q1 — Keep the ציוד tab?** This SPEC keeps it (hosting the card). Alternative: remove it later in a `ChildTabs` package. Default if no answer: **keep**.
- **Q2 — Tab title string** after it shows today+tomorrow: (a) reuse *"נארוז יחד?"* (one name everywhere), (b) *"הציוד שלי" / "My gear"* (matches tab label), (c) other. **Blocks the copy chunk only.**
- **Q3 — Should tomorrow's collapsed/expanded choice persist** across app launches (AsyncStorage) or reset each open? SPEC default: **reset** (less state, today-first every time).
- **Q4 — Delete the dead `bagPrep.*` keys** (D5) in this package, or leave for a later i18n sweep? Default: **delete** (guarded by `i18n:check`).
- **Q5 — Fix L3 copy now?** `camp.cardSub` / `camp.empty` still say "היום" although the card covers tomorrow too. Default: **out of scope** (separate copy decision, values-sensitive wording).

---

## 12. Non-goals / Out of Scope

- Removing or renaming the tab in `ChildTabs.tsx` (Q1 → future package).
- Any parent-side screen (`ActivitiesScreen`, `TimetableScreen`), the activities data model, or the timetable blob format.
- Rewards, BUFFs, or BUDDY reactions for packing (explicitly rejected by noaa D2 and BUFF_VALUES).
- A "day off" celebration anywhere. If Adi wants a positive empty-day message it is a separate copy decision.
- Re-introducing the subject chips ("📚 שיעורים מחר") — informational clutter the card intentionally omits; group titles already carry the subject.
- Persisted collapse state (Q3 default).
- Anything touching `DECISIONS_LOG`, `GAP_ANALYSIS`, `BUFF_VALUES` (Adi's docs — proposals only, in `SPEC_SYNC.md`).

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Old `bagPrep:` AsyncStorage ticks are orphaned | Ephemeral daily state; worst case a child re-ticks once. No migration. Note in INTEGRATION_LEARNINGS. |
| RTL accent bar drawn on the wrong side | Use logical start/end styles; verify in he **and** en on both platforms. |
| Collapsed-by-default hides tomorrow on the night-before use case | Chevron affordance + 44px tap target; today-empty auto-expands. If beta feedback says "I didn't see tomorrow", Q3 revisits (persist "expanded"). |
| `PackingCard` in a `ScrollView` inside a tab that already scrolls | The shell is the only scroll container; the card is a plain `View`. |
| Preview mode (`previewChildId`) shows the wrong child | Shell resolves `previewChildId ?? profile?.id` exactly as the old screen did; test in View-as-Child. |
| Test file for `PackingCard` needs navigation + AsyncStorage mocks | Follow `GamerDashboardScreen.test.tsx` mocking pattern; mock `useActivities`/`useTimetable` to inject fixtures. |

---

## 14. Conflicts / drift surfaced (not resolved — Adi's call)

- `docs/sessions/schedule-equipment-backpack/SPEC.md` describes `ChildBagPrepScreen` as "school source, tomorrow resolution, checklist, AsyncStorage, empty states" — that description becomes historical after this package. Proposed SPEC_SYNC row: mark as superseded, do not rewrite.
- `INTEGRATION_LEARNINGS.md:78` lists "איחוד/הפניה של טאב BagPrep" as **open**; this package closes it. Proposed: status → resolved with a pointer here.
- `camp.cardSub` / `camp.empty` copy vs the today+tomorrow behaviour (L3) — see Q5.
