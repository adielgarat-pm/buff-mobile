# tomorrow-pack-inconsistency — SPEC

> Target state for this package. Authoritative until superseded by a later session.
> Wins over canonical docs during the package; canonical docs are updated at exit per `SPEC_SYNC.md`.
>
> **Origin:** beta tester Noa, WhatsApp 2026-09-02 07:22–07:23 (two screenshots).
> **Investigation:** this session (read-only) + architect review + independent adversarial SPEC review (rev 2) + ADHD-focused UI/UX review (rev 3), both 2026-09-02. No code has been changed yet.
> **Successor of:** `docs/sessions/noaa-behavior-spec/` — closes the half of D1 that session deferred.

---

## 0. TL;DR

Two child-facing "what to pack" surfaces disagree about the same tomorrow, and neither makes today vs tomorrow visually distinct. Root cause: the **ציוד tab** (`ChildBagPrepScreen`) is the pre-consolidation fork that never received the noaa-behavior-spec bridge — it reads the school timetable only, computes tomorrow with a different date engine, keeps its own check-off storage, and still carries the `n/total` counter the values rule forbids. **Fix: make the ציוד tab host the already-canonical `PackingCard` (one source of truth, one date engine, one storage), and inside `PackingCard` make "today" the visually dominant section with "tomorrow" demoted and collapsible (default open/closed = Adi's call, Q6).** No schema, no new dependency, no navigation change.

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
- **L2 — Stale tomorrow on the tab.** `tomorrowDate` is memoised `[]`; a tab left mounted across midnight keeps yesterday's "tomorrow". `PackingCard` recomputes on every *render*, but nothing forces a render at midnight either — an idle mounted card also goes stale until the next state change. The focus-reload required by D1 (below) makes both hosts refresh on every tab switch, which is the realistic fix. *(in scope — reduced by D1, not eliminated)*
- **L5 — `camp.empty` flashes before data.** `PackingCard.tsx:102-158` has no loading gate: with the hooks' initial `activities=[]` / `timetable={}` (`useActivities.ts:77`, `useTimetable.ts:35`) it renders *"היום אין מה לארוז — תהנו!"* for a frame or more, then pops the groups in. Pre-existing on both dashboards today. *(in scope — D4)*
- **L6 — Two live cards would not share check-off state.** `PackingCard` loads `checked` once per mount (`:70-86`, deps `[childId, today, tomorrow]`) with no focus-effect and no cross-instance sync. Bottom tabs keep screens mounted, so after D1 the HQ card and the ציוד card are two instances writing the same AsyncStorage key but never re-reading it. *(in scope — D1 requirement)*
- **L3 — Card copy says "today" but card shows tomorrow too.** `camp.cardSub` = *"מה לוקחים היום, בקצב שלך"*, `camp.empty` = *"היום אין מה לארוז — תהנו!"* — both pre-date the today+tomorrow split. *(copy decision for Adi — see Open Questions)*
- **L4 — Dead / never-used bagPrep keys.** `bagPrep.bagReadyCredits`, `.undo`, `.undone`, `.undoneDesc`, `.bagReadyToast`, `.bagAlreadyReady`, `.credits`, `.waterBottle`, `.food`, `.phoneCharger`, `.importantItems`, `.lessons` are not referenced by the current screen. *(cleanup — see D5)*

---

## 3. Decisions

> D1–D2 are the package. D3–D5 are consequences that need an explicit call. Recommendation first, alternatives after. **Adi decides; CC does not self-approve.**

### D1 — Consolidate onto `PackingCard`: the ציוד tab hosts the card *(core)*

**Recommendation:** `ChildBagPrepScreen` becomes a thin screen shell (title + `T.background` + `ScrollView` + loading spinner) that renders `<PackingCard childId={previewChildId ?? profile?.id ?? null} />`. All bespoke timetable-only logic in the file is deleted (`WEEKDAY_BY_JS`, `PackItem`/`PackSource`, `splitEquipment`, `buildSchoolSource`, `ymd`, the `bagPrep:` storage, the counter/markAll/bagReady footer, the day-off branch). The tab entry in `ChildTabs.tsx` is **not touched**.

**Hard requirement (L6):** because two `PackingCard` instances will now be mounted at once, the card must re-read its check-off state whenever its host gains focus — `useFocusEffect` from `@react-navigation/native` re-running the AsyncStorage `multiGet` (the same hook `GamerDashboardScreen` already uses). Without this, a tick on the ציוד tab is invisible on HQ until relaunch and §4.1 is false. Alternative (heavier, not recommended for this package): lift `checked` into a small shared context. CC chooses the focus-effect unless a reason surfaces in Plan Mode.

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

**Design principle (UX review):** a 7-year-old separates blocks by *containment and shape* (a chip, a rail, a region), not by font-weight deltas. So the distinction is carried by a **filled pill + a rail down the whole today block**, reusing the app's existing chip vocabulary (`OffRoutineCard.tsx` `pillActive`, `PhaseTaskCard.tsx` `categoryPill`) and the existing child "tomorrow" header convention (`TomorrowPreview.tsx:28-32` → `childTasks.tomorrow` = *"מחר · יום {{day}}"* + `weekday.{n}`, `he.json:499-506`). No new strings.

| | Today (`camp.today`) | Tomorrow |
|---|---|---|
| Header | **filled pill**: `T.primary` bg / `T.primaryForeground` text, 12px/700, `paddingH 10, paddingV 4, borderRadius 999` (Mint ≈5.9:1, Gamer ≈11:1). Section header must **not** outrank the card title (15/700) — the old 14/800 proposal inverted hierarchy | **muted pill**: `T.muted` bg / `T.mutedForeground` text, same shape, label = `t('childTasks.tomorrow', { day: t(\`weekday.${getDay}\`) })` → *"מחר · יום שלישי"* (attacks time-blindness: a weekday is picturable, "tomorrow" is abstract). Row = `[pill] [hint, flex 1, numberOfLines 1] [Ionicons chevron-down/up 18, T.mutedForeground]`, whole row a `TouchableOpacity`, min-height 44, `hitSlop 6` |
| Block | `borderStartWidth: 3, borderStartColor: T.accent` on the **whole today block container** (the `parent/CapturedItemRow.tsx:61` pattern) — a rail says *which rows* are today; a 16px bar next to a label does not. `T.accent` = Mint `#C084FC` / Gamer `#A855F7`; never `T.primary` (Mint `#E9D5FF` on white ≈1.2:1) | no rail |
| Hint (collapsed only) | — | the **first tomorrow group's title** (e.g. *"חוג נינג'ה · 16:15"*) in `T.mutedForeground` 12px. Content, not a count; disappears when expanded. Not an icon row (three ✨ *is* an implicit count) |
| Separator | — | `borderTopWidth: 1, borderTopColor: T.border` above the header, `marginTop: 12` |
| Body | rows unchanged (`T.foreground`, 13/600 group title, 14px items, minHeight 44) | **same rows at full contrast — no opacity.** The card already dims a label to mean "done" (`:135`); a second grey meaning "later" reads as "disabled / not mine" to ADHD kids |
| Default state | always expanded (not collapsible) | **Q6 — Adi decides.** UX recommendation: **per host** — ציוד tab **expanded** (the child declared intent to pack), HQ dashboard **collapsed** with auto-expand when `todayGroups.length === 0` (the card sits *above* the next-task block on both dashboards; 9 tomorrow rows every morning push "what do I do now" below the fold). The collapsed HQ header is a *signpost* (weekday + first-group hint), so nothing is out of sight. Time-of-day defaults rejected: an ADHD UI must look the same every time it opens. Implemented as a prop `defaultTomorrowExpanded` (see §6). If Adi prefers one global default: **expanded**. |
| State | — | ephemeral `useState`, per card instance (HQ and ציוד may differ); **not** persisted (Q3) |
| Accessibility | — | header: `accessibilityRole="button"`, `accessibilityState={{ expanded }}`, `accessibilityLabel` = weekday string + hint ("מחר · יום שלישי, חוג נינג'ה") — needed for web keyboard/screen-reader parity. Plain mount/unmount, no `LayoutAnimation` |
| Section complete | when every item in the section is ticked: pill switches to `T.success + '22'` bg / `T.success` border, `checkmark-circle` 16 in `T.success`, text `T.foreground`; the *"מוכנים!"* line becomes 14/700 `T.foreground` + `checkmark-circle` in `T.success` (today's 13/600 `T.success` text is ≈2.1:1 on Mint white). Optional: `Haptics.notificationAsync(Success)` on the completing tick, gated exactly as `PhaseTaskCard.tsx:92`. No confetti, no BUFFs, no auto-collapse — the ticks are the evidence of "done, I can relax" | same |
| Counts | none | none — the collapsed header is **label + chevron only**; never "3 פריטים" (values guard, Pillar 2) |
| "מוכנים!" | unchanged (`camp.allPacked` when every id in the section is checked) | unchanged; shows only when expanded |

**Why not a segmented today/tomorrow toggle:** it hides today whenever the child looks at tomorrow and adds a mode to manage — the opposite of "today is zero-tap". **Why collapsible but not (by default) collapsed:** Noa asked for *"להבליט את ההבדל **או** … לצמצם ולהרחיב"* — a control, not a hidden section. The ציוד tab exists for the night-before case; a child opening it at 20:00 should not find tomorrow behind a chevron ("out of sight" is the ADHD failure mode). Emphasis + divider already answer the distinguishability complaint; the chevron gives the child control over length. The reviewer and the architect disagreed on this point — hence Q6.

All tokens used (`primary`, `primaryForeground`, `muted`, `mutedForeground`, `accent`, `border`, `success`, `foreground`, `card`) exist in both Mint (`ThemeContext.tsx:81-119`) and Gamer (`:124-160`) palettes. No new colours. Pills use `borderRadius 999`; do not introduce a fifth radius value (card 16 vs brand 12 is pre-existing drift, not fixed here).

### D3 — Tab title copy

The tab screen title is `bagPrep.title` = *"סידור תיק למחר"* / *"Packing bag for tomorrow"*. After D1 the tab shows today **and** tomorrow. **Recommendation:** re-point the shell title to a scope-neutral string. Proposed: reuse `camp.cardTitle` (*"נארוז יחד?"*) so tab and card share one name, **or** a new `bagPrep.title` value *"הציוד שלי"* / *"My gear"* (matches the tab label `tabs.child.gear`). **Adi picks the string** (Open Question Q2). CC must not invent copy. **Interim (chunk 2a, before Q2 is answered):** the shell uses the existing tab label `tabs.child.gear` (*"ציוד"*) — never *"סידור תיק למחר"* over a card whose subtitle says *"היום"* (two contradicting scope words on one screen). Q5 (the card's own "היום" copy) is bundled with Q2 so Adi answers both together.

### D4 — Loading state lives inside `PackingCard` (fixes L5 on all hosts)

`PackingCard` does **not** wait for data today: its only early return is `!childId`, so it paints `camp.empty` from the hooks' empty initial state and then pops the groups in (L5). **Recommendation:** `PackingCard` reads `loading` from **both** `useActivities` and `useTimetable` and, while either is loading, renders the card header with a small `ActivityIndicator` (colour `T.primary`) in place of the body — never `camp.empty`. The ציוד shell adds **no** hook of its own. This fixes the pre-existing flash on both dashboards as well.

**Rejected:** a shell-side spinner gated on a *second* `useTimetable(childId)` instance. It cannot stop the flash (the card's own hooks still start empty; `useActivities` — the source that carries Noa's clubs — would not be gated at all) and it doubles the work: two `useTimetable` instances = up to four queries + two realtime channels on `timetables` for one screen (`useTimetable.ts:56-81,105-123`).

### D5 — i18n key hygiene

After D1 these keys have **no** remaining reference: `bagPrep.lessons`, `.tomorrowLessons`, `.equipmentNeeded`, `.importantItems`, `.waterBottle`, `.food`, `.phoneCharger`, `.tomorrowOff`, `.noNeedToPack`, `.bagReady`, `.bagReadyCredits`, `.readyForTomorrow`, `.checkAllItems`, `.undo`, `.undone`, `.undoneDesc`, `.itemsReady`, `.bagReadyToast`, `.bagAlreadyReady`, `.credits`, plus **`gear.noSpecialEquipment`** (sole reference is `ChildBagPrepScreen.tsx:195`) (he + en). Pre-existing orphans `gear.noBagPrep` / `prep.noBagPrep` (`he.json:677,779`) are noted, not touched. **Recommendation:** delete them in the same chunk, guarded by `npm run i18n:check`. Alternative: leave them (harmless, but they mislead the next reader into thinking the counter still exists). Q4.

---

## 4. Behavior Contract (after the package closes)

1. **One packing surface, two hosts.** The HQ dashboards (Mint + Gamer) and the ציוד tab render the same `PackingCard` for the same `childId`. Whatever appears on one appears on the other; check-off state converges on the next tab focus (focus-reload, D1).
2. **Sources.** For each of today and tomorrow the card shows, in this order: school-timetable gear (one group per subject, `source: 'school'`) then activities/clubs gear (one group per activity, `source: 'activity'`). Groups with no equipment are omitted. Archived and `proposed` activities are omitted (`activeOnDate`).
3. **Dates.** "Today" is the device-local calendar date; "tomorrow" is today + 1 day, both computed via noon-anchored local parsing. Saturday has no school groups (`toSchoolWeekday` returns null) but may have activity groups. Both dates are recomputed on every render and on every host focus; a card left idle across midnight refreshes on the next tab switch (there is no midnight timer — see L2).
4. **Day-off semantics.** The card shows `camp.empty` only when today **and** tomorrow both have zero groups from **both** sources. There is no per-day "day off" celebration; an empty day is simply not rendered as a section. *(A clubs-only tomorrow therefore shows the clubs.)*
5. **Today vs tomorrow.** Today is the prominent, always-open section. Tomorrow is a demoted section with a collapse/expand control; its default state is per Q6 (SPEC default: expanded). Toggling never affects check-off state. Collapse state is per card instance and not persisted.
6. **Check-off.** Per item, per day, per child, in AsyncStorage key `buff_packing_${childId}_${iso}`; re-read on host focus; tomorrow's ticks survive into tomorrow (they become today's key). No counter, no "mark all", no completion verdict. Per-section *"מוכנים!"* appears when every item in that section is ticked.
7. **Child voice.** "+ הוסף לעצמי" remains at the bottom of the card on both hosts and navigates to `ChildAddActivity` as today.
8. **Platform parity.** Pure RN + AsyncStorage; identical on Android and Web. No native module, no platform split. The collapsible header is keyboard/screen-reader operable on web (D2 accessibility row).
9. **Loading.** While either source is loading the card shows a spinner in its body; `camp.empty` is only ever painted after both sources have settled.

---

## 5. Schema Changes

None. No Supabase table, RLS, or function is touched. Read paths are unchanged (`timetables`, `activities`).

---

## 6. API / Route Changes

- **Navigation:** none. `ChildTabs.tsx`, `ChildTabsParamList`, `RootStackParamList` unchanged. Route `ChildBagPrep` keeps its name and tab slot.
- **Hooks:** none added or changed. `useActivities` / `useTimetable` used as they are.
- **Components:** `PackingCard` gains (a) internal collapse state and a `renderSection` variant parameter (`emphasis: 'primary' | 'secondary'`, or two small render helpers — CC's call in Plan Mode), (b) a `useFocusEffect` that re-reads check-off state, (c) a loading gate over both hooks (D4). Props contract gains one optional prop: `defaultTomorrowExpanded?: boolean` (default `false`; the ציוד shell passes `true`). Q6 may collapse this back to no prop.
- **Files touched:** `src/components/PackingCard.tsx`, `src/screens/child/ChildBagPrepScreen.tsx`, `src/i18n/he.json`, `src/i18n/en.json`, tests (below). Nothing else.

---

## 7. UI Changes

### 7.1 `PackingCard` (both hosts)

```
┌──────────────────────────────────────────┐
│ נארוז יחד?                          🛍  │
│ מה לוקחים היום, בקצב שלך                 │
│                                          │
│ ┃                              [ היום ]  │▐ filled pill (primary/primaryFg); rail = T.accent, whole block
│ ┃  ▫ אמנות · 09:00              (school) │▐ ▫ = Ionicons book-outline
│ ┃  ○ תיקיית אמנות                        │▐
│ ┃  ✦ חוג אלקטרוניקה · 17:00  (activity)  │▐ ✦ = Ionicons sparkles-outline
│ ┃  ○ ארגז כלים                           │▐
│ ───────────────────────── (T.border)     │
│ ⌃                     [ מחר · יום שלישי ]│  muted pill; expanded → no hint
│    ✦ חוג נינג'ה · 16:15                  │  rows at full contrast
│    ○ בגדי ספורט    ● נעלי ספורט          │
│    …                                     │
│                      ✓ מוכנים!           │  only when the whole section is ticked
│           + הוסף לעצמי                   │
└──────────────────────────────────────────┘
HQ, collapsed (recommended default there):
│ ───────────────────────── (T.border)     │
│ ⌄   חוג נינג'ה · 16:15  [ מחר · יום שלישי ]│  ← one 44px row: pill + hint + chevron
│           + הוסף לעצמי                   │
└──────────────────────────────────────────┘
```

The glyphs above (▫ ✦ ○ ● ✓ ⌃ ⌄ ┃) are **diagram stand-ins** for Ionicons `book-outline` / `sparkles-outline` / `ellipse-outline` / `checkmark-circle` / `chevron-up` / `chevron-down` and a `borderStartWidth` rail — **not** emoji (BUFF_BRAND §7.8). RTL: pills sit at reading start inside `flexDirection: 'row'` (RN flips rows under `forceRTL`); the rail uses logical `borderStartWidth` (in-repo pattern `src/components/parent/CapturedItemRow.tsx:61`; RN 0.81.5 + RNW 0.21). In Noa's screenshot the sparkles icon on "חוג אלקטרוניקה" marks it as an **activity**, not a timetable subject.

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
| `camp.cardSub` | מה לוקחים היום, בקצב שלך | Q5 (bundled with Q2) |
| `camp.empty` | היום אין מה לארוז — תהנו! | Q5 (bundled with Q2) |
| shell title during chunk 2a | — | `tabs.child.gear` ("ציוד") — existing key, interim only |
| tomorrow header | מחר | `childTasks.tomorrow` + `weekday.{n}` → "מחר · יום שלישי" / "Tomorrow · Tuesday" — existing keys, but a visible copy change: **Adi nods (Q8)** |

**UX-proposed strings for Q2 / Q5 (proposals, not decisions):**

| Key | HE | EN | Note |
|---|---|---|---|
| `bagPrep.title` — recommended | הציוד שלי | My gear | matches the tab label the child just tapped (nav orientation); "שלי" = ownership (Pillar 3). Reusing *"נארוז יחד?"* would show the same string twice ~40px apart |
| alt | התיק שלי | My bag | more concrete for 6–9 |
| `camp.cardSub` | מה לוקחים היום ומחר, בקצב שלך | What to bring today and tomorrow, at your pace | minimal L3 fix |
| alt | מה לוקחים, בקצב שלך | What to bring, at your pace | scope-free |
| `camp.empty` | אין מה לארוז היום ומחר — תהנו! | Nothing to pack today or tomorrow — have fun! | L3 |

Tone flags for Adi: `camp.cardSub` is singular ("שלך") while `camp.empty` is plural ("תהנו") — pick one. `camp.addMine` contains a literal "+" **and** the button renders an `add` icon (`PackingCard.tsx:167-168`) — a double plus, pre-existing; cheap to drop from the string in chunk 2b.
| `camp.today` / `camp.tomorrow` | היום / מחר | unchanged |
| dead `bagPrep.*` (D5 list) | present | deleted (Q4) |

No new user-facing string is introduced by this package except whatever Adi picks for Q2.

---

## 8. Tests (summary — full criteria in `TESTS.md`)

**Automated (CC):**
- New `src/components/__tests__/PackingCard.test.tsx` (RNTL): today header uses primary emphasis; tomorrow header is a button with `accessibilityState.expanded`; collapsing removes every tomorrow row from the tree and expanding restores them; default state per Q6; toggling does not alter `checked` nor call `setItem`; nothing renders between the tomorrow header and `camp.addMine` while collapsed; `camp.empty` only after both hooks settled **and** both days empty (never while `loading`); clubs-only tomorrow renders the activity groups; focus-effect re-reads storage. Mock `ThemeContext` as `PetDisplay.test.tsx` / `PhaseTaskCard.test.tsx` do (bare `useChildTheme` throws), keep the global AsyncStorage mock from `jest-setup.ts` (it has `multiGet`; the `GamerDashboardScreen` test's local override does not).
- Existing `fromTimetable.test.ts`, `packing.test.ts`, `GamerDashboardScreen.test.tsx` stay green.
- `npm run typecheck`, `npm test`, `npm run i18n:check` clean.

**Emulator / web (Hat-3 + Adi), Reachability rule (WORKFLOW #11):**
- Seed Noa's data (timetable empty tomorrow; three recurring activities on tomorrow's weekday with gear). Cold start → tap ציוד tab → clubs listed under "מחר" → tick "נעלי ספורט" → switch to HQ tab → same item ticked (focus-reload) — no relaunch needed. Both Mint and Gamer, he and en, Android **and** `npm run web`.
- Accent bar visible on Mint (white card) and Gamer; no `camp.empty` flash on a slow network.
- Saturday tomorrow with a club: club shows, no school group.

---

## 9. Capabilities & Bottlenecks

### What Claude.ai can do
- Review CC's Plan-Mode plans and diffs against this SPEC; draft the DECISIONS_LOG / GAP_ANALYSIS proposals for Adi; answer Values questions.
- Cannot run the app or read the emulator — relies on CC's Hat-3 evidence and Adi's Hat-4.

### What Claude Code will do
- All edits in §6, tests, i18n check, typecheck, jest, web bundle check, STATUS/INTEGRATION_LEARNINGS rows, commit on `claude/tomorrow-pack-inconsistency-lbm97x` (the harness-assigned branch; CLAUDE.md's `pkg/{slug}` is a suggestion, not a rule).
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

- ~~**Q1 — Keep the ציוד tab?**~~ **DECIDED 2026-09-02 (Adi): keep.** The tab hosts the card. Removal, if ever, is a separate `ChildTabs` package after beta data.
- **Q2 — Tab title string** after it shows today+tomorrow: (a) reuse *"נארוז יחד?"* (one name everywhere), (b) *"הציוד שלי" / "My gear"* (matches tab label), (c) other. **Blocks the copy chunk only.**
- ~~**Q3 — Persist collapse state?**~~ **DECIDED 2026-09-02 (Adi): no.** Ephemeral `useState`; the card opens the same way every time (per-host default, Q6).
- ~~**Q4 — Delete the dead `bagPrep.*` keys?**~~ **DECIDED 2026-09-02 (Adi): delete**, in Phase 3 only (after Phase 2 removed the usages), guarded by `npm run i18n:check`.
- **Q5 — Fix L3 copy now?** `camp.cardSub` / `camp.empty` still say "היום" although the card covers tomorrow too. **Bundled with Q2** — once the card is the only surface, its subtitle is the tab's subtitle. Default if unanswered: unchanged strings.
- **Q6 — Tomorrow's default state:** (a) **expanded**, collapsible as a control (SPEC default; reviewer's position — protects the night-before use case), (b) time-of-day: expanded after ~16:00, collapsed before, (c) **collapsed**, auto-expanded when today is empty (architect's position — shortest dashboard). Values-neutral either way; this is a UX call.
- **Q8 — Weekday in the tomorrow header** ("מחר · יום שלישי" via existing keys) and **first-group hint on the collapsed header** — both count-free; approve as compliant with the no-counter rule.
- ~~**Q9 — Closure styling**~~ **DECIDED 2026-09-02 (Adi): fix now**, in Phase 1 (same file/function). Success pill + foreground "מוכנים!" + `checkmark-circle`; haptic gated as `PhaseTaskCard.tsx:92`.
- **Q7 — Paywall boundary for packing.** D-2026-06-19-01 lists *"הכנת תיק"*, *"מערכת שעות"* and *"פעילויות"* as **paid** features (`BUFF_DECISIONS_LOG.md:52`), yet neither `PackingCard`, `ChildBagPrepScreen` nor `ChildTabs` has any entitlement gate today. Consolidation makes "the tab" and "the card" the same thing, so a future gate can no longer distinguish them. This SPEC does **not** add gating (out of scope, and children never see paywall CTAs per `pkg/hide-paywall-from-child`); Adi decides whether a gate belongs to a later monetization package and at which level (data entry on the parent side vs child display).

---

## 12. Non-goals / Out of Scope

- Removing or renaming the tab in `ChildTabs.tsx` (Q1 → future package).
- Any parent-side screen (`ActivitiesScreen`, `TimetableScreen`), the activities data model, or the timetable blob format.
- Rewards, BUFFs, or BUDDY reactions for packing (explicitly rejected by noaa D2 and BUFF_VALUES).
- A "day off" celebration anywhere. If Adi wants a positive empty-day message it is a separate copy decision.
- Re-introducing the subject chips ("📚 שיעורים מחר") — informational clutter the card intentionally omits; group titles already carry the subject.
- Persisted collapse state (Q3 default).
- Entitlement / paywall gating of packing (Q7 — monetization package, parent side).
- Anything touching `DECISIONS_LOG`, `GAP_ANALYSIS`, `BUFF_VALUES` (Adi's docs — proposals only, in `SPEC_SYNC.md`).

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Old `bagPrep:` AsyncStorage ticks are orphaned | Ephemeral daily state; worst case a child re-ticks once. No migration. Note in INTEGRATION_LEARNINGS. |
| RTL accent bar drawn on the wrong side | Use logical start/end styles; verify in he **and** en on both platforms. |
| A collapsed tomorrow hides the night-before list | SPEC default is expanded (Q6). If Adi picks collapsed: chevron + 44px target + today-empty auto-expand, and beta feedback decides whether to persist "expanded" (Q3). |
| Per-host defaults feel inconsistent | Same card, order, labels, header; only the initial chevron state differs, and collapse state is already per-instance. If beta feedback flags it, Q6 fallback is "expanded everywhere". |
| Two mounted cards disagree on ticks | Focus-reload in `PackingCard` (D1 hard requirement); tested in TESTS Phase 2 without relaunch. |
| Spinner never resolves if one hook errors | Both hooks set `loading=false` in `finally`; error state falls through to the normal render (empty groups) — same as today. |
| `PackingCard` in a `ScrollView` inside a tab that already scrolls | The shell is the only scroll container; the card is a plain `View`. |
| Preview mode (`previewChildId`) shows the wrong child | Shell resolves `previewChildId ?? profile?.id` exactly as the old screen did; test in View-as-Child. |
| Test file for `PackingCard` needs navigation, theme and AsyncStorage mocks | Navigation: mock `useNavigation` + `useFocusEffect` as `GamerDashboardScreen.test.tsx:31` does. Theme: mock `ThemeContext` as `PetDisplay.test.tsx` does. AsyncStorage: keep the global `jest-setup.ts` mock (has `multiGet`). Data: mock `useActivities`/`useTimetable` to inject fixtures and a controllable `loading`. |

---

## 14. Conflicts / drift surfaced (not resolved — Adi's call)

- `docs/sessions/schedule-equipment-backpack/SPEC.md` describes `ChildBagPrepScreen` as "school source, tomorrow resolution, checklist, AsyncStorage, empty states" — that description becomes historical after this package. Proposed SPEC_SYNC row: mark as superseded, do not rewrite.
- `INTEGRATION_LEARNINGS.md:78` lists "איחוד/הפניה של טאב BagPrep" as **open**; this package closes it. Proposed: status → resolved with a pointer here.
- `camp.cardSub` / `camp.empty` copy vs the today+tomorrow behaviour (L3) — see Q5.
- D-2026-06-19-01 (*"הכנת תיק"* is a paid feature) vs the code (no gate anywhere on the child packing surfaces) — see Q7. Not resolved here.
- Architect vs reviewer on tomorrow's default state — UX review proposes per-host defaults; surfaced as Q6, not resolved here.
- **Pre-existing brand drift, out of scope, to log:** PackingCard radius 16 vs BRAND §7.4 12; Gamer card shadow vs BRAND §7.5 "tonal layers, no drop shadow"; Gamer HQ chips use `COLORS.lime/violet` while the card uses `T.primary` cyan (BRAND §7.9); double "+" in `camp.addMine`; "מוכנים!" `T.success` text ≈2.1:1 on Mint.
