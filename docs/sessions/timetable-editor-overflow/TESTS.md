# timetable-editor-overflow — TESTS

## Hat 1 (2026-07-06)
- `tsc --noEmit` clean.
- New `TimetableScreen.overflow.test.tsx` (4 tests, all pass):
  1. manual footer `paddingBottom == max(insets.bottom+12, 20)` with a mocked 48px gesture inset → 60
  2. equipment input: `multiline`, `minHeight 34`, `maxHeight 76`, no fixed height
  3. save button present + pressable with Noa's actual long equipment string
  4. paste footer shares the same safe-area padding
- Full regression: all tests pass; the 5 failing-under-parallel-load suites are the same pre-existing set verified identical on origin/main (pass in isolation, 26/26; ThemeContext is the known jsdom-websocket env failure).

## Hat 3 / Web
- Consolidated on-device + web check for all three timetable packages at the release cut (same screen). Key on-device assertion: footer button bounds end above `screenHeight - insets.bottom`.

## Hat 4 (Adi)
- Real device, gesture nav + 3-button nav: long equipment → save reachable first tap; keyboard open on last row → field visible above keyboard.
