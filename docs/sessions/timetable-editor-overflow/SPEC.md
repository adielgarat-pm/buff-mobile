# timetable-editor-overflow — SPEC

> Branch: `pkg/timetable-editor-overflow`
> Priority: **P0 — a real user is physically unable to save (Noa, 2026-07-06, WhatsApp 19:08)**
> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.

---

## Problem (user evidence)

> "אני לא יכולה לעדכן מערכת כי הסימון חורג מגבולות המסך שלי — זה מוריד לי את התפריט במקום ללחוץ על זה" — Noa, 2026-07-06 19:08

Her equipment text is long ("בקבוק מים, כובע, נעלים סגורות, קרם הגנה, אלתוש, בגד ים, כובע ים, משקפת, מגבת, בגדים להחלפה, חיוך גדול…"). The row grows tall, the confirm control ends up at/behind the Android system nav bar, and taps open the system menu instead. **She cannot complete schedule entry at all.** Screenshot shows a mostly-blank screen with content clipped at top.

### Code-verified root causes (`src/screens/parent/TimetableScreen.tsx`)
1. **No `KeyboardAvoidingView`** — root is a plain `View` (`:918` manual / `:669` review). With the soft keyboard open while typing equipment, the fixed footer is not repositioned and the tappable area collides with the system nav bar.
2. **Fixed footer outside the ScrollView** (`:980-996` manual / `:883-904` review) with `contentContainerStyle` `paddingBottom: 24` only (`:1029`) — insufficient once a row grows tall; last rows hide behind the footer.
3. **No `useSafeAreaInsets()`** anywhere on the screen — header uses hard-coded `Platform.OS === 'ios' ? 56 : 16` (`:1011`), footer has zero bottom inset. This violates the standing safe-zone rule (all interactive elements ≥20pt above screen bottom + insets — `feedback_safe_zone_margins`).
4. Equipment `TextInput` (`:958-965` manual / `:817-824` review) grows unbounded with long text.

Both **manual mode** (`:911-998`) and **review mode** (`:660-906`) share the broken structure.

---

## Goals
- The save/confirm footer is **always visible and tappable** on TimetableScreen — regardless of lesson count, equipment text length, keyboard state, or device nav-bar style.
- The lesson being edited stays visible above the keyboard while typing.

## Non-goals
- No visual redesign of the timetable editor; no new features (time picker and copy-day are their own packages: `pkg/timetable-time-picker`, `pkg/timetable-copy-day`).
- No change to the equipment data format or the child `ChildBagPrepScreen` flow.

## Behavior Contract
1. With 10 lessons each holding 200-char equipment text: footer button reachable and functional; every row reachable by scroll; last row not hidden behind the footer.
2. Keyboard open on the last row's equipment field → the field scrolls into view above the keyboard; footer either avoids the keyboard or is reachable after dismiss — **never overlapped by the system nav bar**.
3. Applies to BOTH manual and review modes.
4. Web (`npm run web`): no regression; page scrolls normally, footer visible (web has no soft-keyboard overlay problem, but flex changes must not break the DOM layout).

## Schema Changes
None.

## API / Route Changes
None.

## UI Changes (implementation sketch — CC refines in Plan Mode)
- Wrap content in `KeyboardAvoidingView` (`behavior="padding"` iOS / height-adjust Android per app convention — check how other screens with fixed footers do it, e.g. onboarding USteps).
- `useSafeAreaInsets()`: footer `paddingBottom: Math.max(insets.bottom, 20)`; replace the hard-coded header padding while touching the file.
- ScrollView `contentContainerStyle.paddingBottom` ≥ footer height + inset so the last card scrolls clear of the footer; add `keyboardShouldPersistTaps="handled"`.
- Equipment input: `multiline` with a bounded `maxHeight` (~3 lines) + internal scroll, so one field can't consume the viewport. (Recommend; confirm vs. `numberOfLines` behavior on Android.)
- Same treatment in both modes; extract a shared footer/scroll wrapper if it keeps the diff smaller, not larger.

## Values Check (9/9 — Pass)
This is a parent-tool bug fix; child-facing behavior unchanged.
**Pillar 1:** 1. N/A (parent screen) / 2. N/A / 3. N/A — no motivation mechanics touched.
**Pillar 2:** 1. **No** demeaning copy — no copy changes. 2. N/A. 3. **No** BUDDY mechanics.
**Pillar 3:** 1. **Yes** — an unusable schedule editor blocks the whole bag-prep independence loop for the child; fixing it re-enables it. 2. Unchanged. 3. Permanent correctness fix.
**Pass:** ✔ (no child-facing surface changes; the enabling loop is values-positive).

## Plan of work (chunks)
1. **Chunk 1:** Manual mode — KAV + insets + scroll padding + bounded equipment input. Diff → approval.
2. **Chunk 2:** Review mode — same treatment. Diff → approval.
3. **Chunk 3:** Verification both platforms + exit deliverables.

## Tests
- **Hat 1:** `tsc --noEmit`; existing Jest suite green (no logic change expected — layout only).
- **Hat 3 (emulator):** seed a day with 8+ lessons, one with very long equipment text (copy Noa's list verbatim); verify contract items 1-3 in both modes; rotate through keyboard open/closed; gesture-nav AND 3-button-nav emulator settings if feasible.
- **Web:** `npm run web` + preview tools — snapshot of the screen, footer visible, save works.
- **Hat 4 (Adi):** real device with 3-button nav — the exact failure Noa hit.

## Open Questions (resolve in Plan Mode)
1. Is there an app-standard KAV pattern already (onboarding screens)? Reuse it rather than inventing a new one.
2. `android:windowSoftInputMode` in `app.json` — what is it set to (`resize` vs `pan`)? Determines the right KAV behavior. Inspect before coding.
3. Should the ~15-screens hard-coded `paddingTop:52` migration (`project_safe_zone_hardcoded_padding`) pick up TimetableScreen here or stay separate? (Recommend: fix only this screen's insets here; don't pull the thread.)

## Out of Scope
- Time picker (own package), copy-day (own package), any parser/OCR changes, child bag-prep screen.

## SPEC_SYNC
- `STATUS.md` row per phase.
- `docs/INTEGRATION_LEARNINGS.md`: append if the KAV/windowSoftInputMode interaction surprises (it often does on Android).
- Propose adding TimetableScreen to the safe-zone migration list if not already there.
