# Activities & Seasonal Packing — Spec Sync

> Canonical docs this package touches, mapped to the phase that touches each.
> Adi-owned docs (GAP_ANALYSIS, DECISIONS_LOG, VALUES) are **proposed**, never edited unilaterally.

## Docs touched

| Doc | Phase(s) | Nature of change |
|---|---|---|
| `docs/sessions/activities-and-camp-lists/SPEC.md` | 0 | This package's target state (D1/D2/D6/D7 locked). |
| `docs/sessions/activities-and-camp-lists/STATUS.md` | all | Phase status rows. |
| `docs/BUFF_GAP_ANALYSIS.md` | exit | **PROPOSE to Adi:** add "Activities (out-of-school lessons + seasonal packing) + child-authored one-offs" as a now-closed gap vs the Lovable model. Do not edit unilaterally. |
| `docs/INTEGRATION_LEARNINGS.md` | exit | Append only if something surprised us (see STATUS). |
| `docs/RELEASE_QUEUE.md` | **at merge** | Add one Queued row (feat) when this branch merges to `main`. Not done pre-merge. |

## Not touched (deliberately)
- `src/types/timetable.ts`, `src/hooks/useTimetable.ts`, `src/screens/parent/TimetableScreen.tsx`, `src/navigation/ChildTabs.tsx` — sibling session owns these. This package is additive.
- `BUFF_VALUES.md` — values applied, not changed.
