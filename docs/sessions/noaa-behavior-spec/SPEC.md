# SPEC — Noa's "illogical packing behaviour" (diagnosis + proposal)

**Slug:** `noaa-behavior-spec` · **Branch:** `claude/noaa-behavior-spec-rlymvx`
**Status:** SPEC — **awaiting `approved, proceed`** (and decisions D1–D6 below)
**Author:** CC · **Date:** 2026-07-07 · **App version reported:** 1.7.8 (vc64)
**Source:** Noa (מורג שגיא), external tester, 4 WhatsApp screenshots (2026-07-07 09:03–09:06)

> This is a **diagnostic + proposal** spec. It contains **no code changes**. Every code
> claim is anchored `file.ts:line`. Product forks are surfaced as **OPEN DECISIONS
> (D1–D6)** for Adi to lock — CC does not resolve them.

---

## 0. TL;DR — one sentence

BUFF now has **two unconnected "what to pack" systems** — the timetable-fed
**BagPrep** tab (shows *tomorrow*) and the activities-fed **PackingCard** on the HQ
dashboard (shows *today*) — plus a **child→parent approval flow for packing that has no
discoverable parent entry point**; Noa, testing in View-as-Child, tripped over all
three seams at once, which reads as "illogical."

Nothing is *broken* in the crash/500 sense — every write succeeds. The problem is
**architecture + surfacing**: two sources, two day-scopes, two child tabs, one invisible
approval, and no parent mirror of the child's HQ.

---

## 1. What Noa reported (anchored to the screenshots)

Noa was in **View-as-Child preview** of her daughter **Lia** — the purple banner
"👁 תצוגת הורה — הקש/י …יציאה" is the parent-preview banner
(`ChildDashboardScreen.tsx:152-161`). Her complaints, verbatim:

| # | Noa's words | Screen she was on |
|---|---|---|
| R1 | *"שלחתי מ[ליה] הצעה למה נארוז היום — לא מופיע לי כהורה לאשר את זה… אני לא מבינה איפה אצל ההורה עושים את זה"* | Added a packing suggestion via Lia; can't find parent approval |
| R2 | *"אצל ליה מופיע פה סימון [2 🔥] אבל אצלי לא מופיע"* | The streak pill on Lia's **מפקדה** (HQ) dashboard |
| R3 | *"למרות שזה במערכת ומופיע בציוד, זה לא מופיע במפקדה"* | Camp gear shows in **ציוד** (BagPrep) but not in **מפקדה** (HQ / PackingCard) |
| R4 | *"בציוד זה מה צריך לסדר למחר, במפקדה הנחתי שיהיה מה שיש לקחת היום… או לאפשר בציוד אופציה של היום ומחר"* | Day-scope mismatch: BagPrep = tomorrow, she expected HQ = today |

Adi's live replies (also in-thread): *"לא ידעתי שיש הצעה מהילד לזה.. לא נרא הלי צריך"*
(didn't know child-propose-packing existed; doesn't seem needed) and *"אבדוק בערב"*.

Terminology (app strings): **מפקדה** = `tabs.child.hq` (`he.json:1573`, the child HQ
dashboard). **ציוד** = the BagPrep tab. Both are **child** tabs; Noa was hopping between
them inside Lia's previewed view.

---

## 2. Root-cause diagnosis (code-anchored)

### F1 — Two disconnected packing systems (root of R3 + R4)

| | **BagPrep** ("ציוד" / "סידור תיק למחר") | **PackingCard** ("נארוז יחד?" on מפקדה) |
|---|---|---|
| Component | `src/screens/child/ChildBagPrepScreen.tsx` | `src/components/PackingCard.tsx` |
| Tab | own child tab (`ChildTabs.tsx`) | inside HQ dashboard (`ChildDashboardScreen.tsx:202`, `GamerDashboardScreen.tsx:382`) |
| Data source | `useTimetable` → **`timetables`** table | `useActivities` → **`activities`** table |
| Data unit | `PeriodInfo` (subject + **comma-string** `equipment`) `types/timetable.ts:12` | `Activity` (`equipment: string[]`) |
| Day scope | **TOMORROW**, hard-coded `ChildBagPrepScreen.tsx:34-38,82-84` | **TODAY**, hard-coded `PackingCard.tsx:16-21,33` |
| Builder | `buildSchoolSource` (in-file) | `buildPackingGroups` `lib/activities/packing.ts:60-76` |

They **never cross-read**. `activities/packing.ts:60-76` reads only `activities`;
`ChildBagPrepScreen` reads only `useTimetable`. `types/activities.ts:8-12` states the
non-import **by design** ("this feature deliberately does NOT import [the timetable]").
`ChildBagPrepScreen.tsx:46-48` reserves a future `'activity' | 'camp'` `PackSource` key
but comments "Only the school-timetable source is implemented here."

**So:** Noa entered קייטנה gear as a **timetable subject** (parent typed "קייטנה" +
a comma equipment string in `TimetableScreen.tsx:856/895/1026/1039`). It therefore renders
**only** on BagPrep (tomorrow) and is **structurally invisible** to the HQ PackingCard,
which shows `camp.empty` = *"היום אין מה לארוז — תהנו!"* (`he.json:81`, `PackingCard.tsx:82`).
Exactly R3.

**Aggravating copy:** `TimetableScreen`'s clear-schedule message literally nudges parents
to *"enter a new one (e.g. camp) any time"* (`en.json:1822`) — i.e. it *invites* putting
camp into the timetable, the branch that never reaches the dashboard.

### F2 — Day-scope is split with no toggle (root of R4)

BagPrep is `getDate()+1` (tomorrow) `ChildBagPrepScreen.tsx:82-84`; PackingCard is
`todayISO()` (today) `PackingCard.tsx:16-21`. There is **no** today/tomorrow switch on
either surface. Noa's own fix suggestion ("allow a today **and** tomorrow option") is
the correct instinct.

### F3 — Parent approval for child-proposed activities is undiscoverable (root of R1)

- Child adds via `ChildAddActivityScreen.tsx`; mode split in `lib/activities/childMode.ts:8-18`:
  young child (`6-8`/`9-11`) → `status='proposed'`; teen (`12-14`/`15-18`) → `active`.
  Lia (young) correctly produces a **`proposed`** row. The write **succeeds** — parent
  `FOR ALL` RLS covers the shared-device insert (`migrations/026_activities.sql:92-101`);
  the row is query-able.
- The **only** parent approval UI is the strip in `ActivitiesScreen.tsx:81,215-234`
  (`approveActivity` → `useActivities.ts:228-250`). That screen is reached from **one
  buried row**: Settings → "חוגים ופעילויות" (`ParentSettingsScreen.tsx:136`). **No badge,
  no count, no parent-home surface, no notification.** The strip is also **per-selected-child**
  and the child-chip row only shows when `children.length > 1` (`ActivitiesScreen.tsx:198`),
  so it's invisible until the parent lands on the right child.
- **Worse — it contradicts the pattern the app already taught.** The *other*, older
  suggestion system (`child_suggestions`) surfaces child task/reward suggestions **inline
  on the Tasks and Rewards tabs** via `PendingSuggestions.tsx`
  (`ParentTasksScreen.tsx:331`, `ParentRewardsScreen.tsx:530`). A parent is trained that
  "my kid suggested something" appears there. Activity/packing proposals **deliberately do
  not** (`SPEC activities-and-camp-lists §185`), so Noa's mental model points her at the
  wrong, more-visible surface. **This is the #1 pain and the clearest fix.**

### F4 — No parent mirror of the child's HQ streak (root of R2)

The "2 🔥" pill is the per-child streak (`useChildStreak` → RPC `child_task_streak`,
migration 029), rendered **only** on the child dashboards (`ChildDashboardScreen.tsx:177-182`,
`GamerDashboardScreen.tsx:325`). **No parent screen displays it.** The only way a parent
sees it is View-as-Child — which is exactly where Noa was. So "at Lia's it shows, at mine
it doesn't" is *expected* (there is no parent HQ), but the asymmetry surprised her.

### F5 — Latent issues found in passing (not Noa's, but real)

- **Age-band drift vs SPEC / open FLAG F-2026-05-03-03.** `childMode.ts:8-10` treats the
  **`12-14`** band as teen → a 12-year-old **bypasses approval** and posts `active`. The
  activities SPEC prose says teen = **13+**. Product-number decision (D5).
- **Own-device child RLS silent-fail.** If Lia ever logs in on *her own* device, the child
  INSERT policy (`migrations/027:28-34`) needs her profile to have a matching `user_id`;
  BUFF has children without an auth user, so the insert is **rejected silently** and the
  child never gets the "sent" confirmation. Not Noa's shared-device path, but a real gap
  if approval is kept.
- **Prior knowledge:** `INTEGRATION_LEARNINGS.md:1306` already flagged *"Equipment
  surfacing in UI — data flows through but isn't rendered; rolls into separate P-05 'Bag
  Prep' feature"* — i.e. the two-systems seam was foreseen but never unified. Also
  `:39` flags a View-as-Child theme bug (returns `mint` not the child's `gamer`) that can
  compound preview confusion.

---

## 3. The problem in product terms

A parent has **three mental models colliding**:
1. "What my kid needs to pack" should be **one place** — it's two (BagPrep vs PackingCard).
2. That place should show **today and tomorrow** — each shows only one, and they disagree.
3. "My kid suggested something" should appear **where the other suggestions do** — it doesn't.

Fixing the *copy* alone won't hold; the **data model is forked**. The proposal below
offers a spectrum (clarify → bridge → unify) so Adi can pick the depth.

---

## 4. Proposed remediation — OPEN DECISIONS (each: recommendation + alternatives)

> Chunked, smallest-blast-radius first. Nothing here is built until `approved, proceed`
> **and** the relevant D-decision is locked. Phases are independent — Adi can approve a
> subset (e.g. just D3) as a fast hotfix.

### D1 — Unify the two packing surfaces (the core architecture call)

- **(A) Bridge into one child surface — RECOMMENDED for v1.** Keep both data sources, but
  merge them into **one** "what to pack" card/screen the child sees. Concretely: teach
  `PackingCard` (HQ) to also read the timetable equipment via a shared `PackSource[]`
  builder, so קייטנה gear entered in the timetable **also** shows on מפקדה. Retire the
  duplicate day-scope by folding BagPrep's content in (or making BagPrep read activities
  too). Medium effort; directly kills R3.
- **(B) Full unify.** One table / one model — migrate timetable-equipment into the
  activities pipeline (or fold activities into the timetable "equipment" field). North-star,
  but a large migration touching a sibling session's `timetables` ownership. Defer.
- **(C) Clarify only.** Leave two systems; fix copy + add cross-links + relabel tabs so it's
  obvious which is which. Cheapest; does **not** satisfy Noa's "should be one place." Fallback
  if Adi wants a stopgap before A.

**CC recommendation:** **A** (bridge to one child surface), with **B** logged as the
north-star. Confirm which surface is canonical: fold BagPrep into HQ PackingCard, or keep
BagPrep as the packing home and mount it on HQ.

### D2 — Day scope: show **today + tomorrow** (Noa's ask)

- **(A) RECOMMENDED:** the unified card shows **two sections — "היום" and "מחר"** (or a
  small toggle), so "what to take today" and "what to pack for tomorrow night" both live in
  one place. Matches R4 verbatim.
- **(B)** Single scope + a clear label of *which* day. Cheaper, weaker.

**CC recommendation:** **A**, gated on D1 landing (needs the shared builder first).

### D3 — Make the child→parent packing approval discoverable **or remove it** (fastest win)

Adi already said in-thread *"לא נרא הלי צריך"* (doesn't seem needed). Two clean paths:

- **(A) Remove the approval gate for packing — RECOMMENDED.** A child adding their own gear
  is a Pillar-3 self-initiation win; a forgotten swimsuit is not a risk that needs a parent
  veto. Make child-added packing/gear post **directly** (parent still *sees* it — transparency,
  not control), matching the Teen-direct philosophy already in the SPEC, extended to all
  ages **for the packing case**. Deletes the "where do I approve?" problem entirely.
- **(B) Keep approval but surface it.** Route proposed activities through the **existing**
  `PendingSuggestions` strip on Tasks/Rewards (where parents already look), **and/or** add a
  count badge on the Settings → "חוגים ופעילויות" row + parent-home. Also fixes the
  per-selected-child trap (`ActivitiesScreen.tsx:198`) and the own-device RLS silent-fail (F5).

**CC recommendation:** **A** for the packing/gear case (aligns with Adi's lean); if Adi
wants to preserve a parent gate for *scheduled activities* (חוג with a time), keep B **only**
for those. This is the single highest-value, lowest-risk chunk — shippable alone.

### D4 — Parent visibility of the child's HQ / streak (R2)

- **(A) RECOMMENDED (low-pri):** accept that View-as-Child *is* the "see what your child
  sees" path; add a one-line hint on the preview banner ("this is Lia's screen") so the
  asymmetry stops reading as a bug. Optionally show the child's streak on the parent's
  child card.
- **(B)** Build a parent-facing child-HQ summary. Larger; probably not worth it now.

**CC recommendation:** **A**. Minor.

### D5 — Age-band threshold for teen-direct vs propose (F5 + FLAG F-2026-05-03-03)

Decide the intended boundary. Today `12-14` posts directly (`childMode.ts:9`). Options:
keep band-based `12-14`+ = direct; or move the line to 13+ (SPEC prose) / 15+ (Gamer/Teen
Mode). **This is Adi's product number** — CC will not pick it. If D3-A is chosen, this
matters far less (approval largely goes away for packing).

### D6 — Copy fix on TimetableScreen (cheap, do regardless)

Change `timetable.clearAllMsg` ("e.g. camp", `en.json:1822` + he) so it stops steering
camp into the timetable branch that never reaches HQ — **only if** D1 keeps them separate.
If D1-A merges the sources, this copy becomes harmless and can stay.

---

## 5. Suggested chunking (post-approval)

| Phase | Depends on | Content | Verify |
|---|---|---|---|
| P1 | D3 | Packing approval: remove gate (A) or surface it (B). Smallest, ship-alone. | Hat-1 + emulator (child adds gear → shows; parent sees it) |
| P2 | D1 | Shared `PackSource[]` builder; HQ PackingCard also reads timetable equipment | Hat-1 (builder unit tests) + emulator both themes |
| P3 | D2 | Today + tomorrow sections in the unified card | Hat-1 + emulator across a day boundary |
| P4 | D4, D6 | Preview-banner hint + copy fix | web preview |
| P5 | D5 | Age-band alignment (+ own-device RLS fix if approval kept) | Hat-1 + DB check |
| Exit | — | STATUS row, SPEC_SYNC, INTEGRATION_LEARNINGS, RELEASE_QUEUE, re-run Values | — |

---

## 6. Scope guard / non-goals

- No change to the **timetable parser/import** pipeline (owned by the timetable sessions) —
  we only *read* its equipment.
- No new Supabase table for v1 (bridge reads existing `timetables` + `activities`).
- No calendar/month-view creep (BUFF-is-not-a-calendar guardrail stands).
- Not touching Buddy, Pause, or Off-routine day-state.

---

## 7. Values Check (against the *proposed* behaviour)

**P1 Intrinsic** — ✅ Packing serves a thing the child already wants (the pool day, camp);
no new coin/reward loop. D3-A strengthens ownership.
**P2 Positive coaching** — ✅ Unified card keeps body-double copy, empty state
("תהנו!"), **no** missed-count / progress bar (hard constraint carries over from the
activities SPEC design-critique). A forgotten item is never a verdict.
**P3 Independence** — ✅✅ One clear "pack your own bag" surface + child self-adds gear
without a parent gate (D3-A) = the strongest autonomy expression. Canonical ADHD
executive-function skill.
**Verdict:** proposal passes 9/9 *as specified*; re-verified against built behaviour at Exit.

---

## 8. Conflicts / drift surfaced (not resolved — Adi's call)

1. **Feature C (D7 in `activities-and-camp-lists/SPEC.md`) locked "mode-aware approval."**
   D3-A here *revises* that for the packing case. Flagging, not overriding.
2. **Age-band 12-14 vs "13+/15+"** — open FLAG F-2026-05-03-03; D5.
3. **`INTEGRATION_LEARNINGS.md:1306`** foresaw the BagPrep/equipment split ("P-05 Bag Prep")
   but it was never unified — D1 is that unification.

---

## 9. Reproduction (for the emulator pass, post-approval)

1. Parent → Timetable → add subject "קייטנה" on tomorrow's weekday + equipment string
   "בקבוק מים, כובע, נעלים סגורות, קרם הגנה, בגד ים".
2. Child (or View-as-Child) → **ציוד/BagPrep tab** → items appear (tomorrow). → **מפקדה/HQ**
   → PackingCard says "אין מה לארוז" (**R3 reproduced**).
3. In preview, PackingCard → "+ הוסף לעצמי" → for a young child, a `proposed` row is
   written. Parent → look for approval anywhere but Settings→"חוגים ופעילויות" → not found
   (**R1 reproduced**).
