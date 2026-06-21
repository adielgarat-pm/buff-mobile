# SPEC_SYNC — in-app-updates

Which canonical docs update, and in which phase. Updated in the **same commit** as the code.

| Canonical doc | Phase | What changes |
|---|---|---|
| `docs/sessions/in-app-updates/STATUS.md` | every phase | Phase row: state, date, commit, tests, learnings link. |
| `package.json` | 1 | New dependency added (recorded as an Improvement Package dep, not a silent add). |
| `app.json` | 1 | Config plugin entry in `plugins` array. |
| `docs/INTEGRATION_LEARNINGS.md` | 1–2 | New learning: in-app updates require Play-installed builds; sideload no-ops; internal-track behaviour. Any DEFERRED scope (e.g. iOS, Immediate flow) logged as a 🚩 FLAG (Iron Rule 12). |
| `docs/RELEASE_QUEUE.md` | 2 | Add a Queued row for the build that first carries in-app updates (memory `release_tracking_in_files`). |
| `CLAUDE.md` (Open FLAGs) | closeout | If iOS in-app update is deferred, add/adjust a FLAG line. Propose to Adi — do **not** edit unilaterally (CLAUDE.md is Adi's doc). |
| `docs/BUFF_GAP_ANALYSIS.md` | closeout | Propose a row if this closes a known "testers stuck on old build" gap. Propose only — Adi's doc. |

**Not touched:** PRD, BUFF_VALUES, BUDDY_SYSTEM (no product-behaviour or values change).
