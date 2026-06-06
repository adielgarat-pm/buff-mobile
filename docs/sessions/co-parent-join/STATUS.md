# co-parent-join — STATUS

> מעקב סטטוס פאזות — CC מעדכן בכל phase exit.

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| SPEC | drafted + approved | 2026-06-06 | d3d34bf | — | — |
| 1 — RPC + premium | ✅ complete | 2026-06-06 | (this commit) | tsc clean · Jest 334/334 · RPC live | IN-2026-06-06-01 |
| 2 — Join UI + i18n | not started | — | — | — | — |

**Decisions locked (Adi, 2026-06-06):** reuse existing family code · equal co-parent · family-wide premium — all satisfied by porting Lovable's `switch_user_family` model.

**Design source:** Lovable (`buff-lovable`, repo `adielgarat-pm/buff`) — `switch_user_family` RPC + `JoinFamilySection`.

**Security:** switch preserves role + join UI is parent-only → no escalation (prior AuthCallback-draft watch-item closed).

**Open edge:** a parent who still owns children switching away leaves them parent-less (Lovable doesn't guard; default = match Lovable, note in learnings).
