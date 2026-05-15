# buddy-v05-backend — Spec Sync

## Docs touched (this PR)

| Doc | Change |
|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | Mark F-2026-05-03-05 (BUDDY_SYSTEM.md spec-only) as RESOLVED — schema + EOD trigger now match the V0.5 spec for L1-L3. The full L4-L5 + the UI consumer screens are next packages. |

## Adi-owned docs (CC proposes; Adi applies in a separate edit if she chooses)

| Doc | Proposed edit |
|---|---|
| `docs/BUFF_GAP_ANALYSIS.md` חלק ה' "Buddy System V0.5" table | Mark these rows as ✅ EXISTS: `Friendship Levels (5 רמות)` (schema in place, L1-L3 logic), `Boosters (6 סוגים)` schema only (use mechanics still pending), `buddy_relationships table`, `buddy_gifts_history table`, `buddy_daily_check table`, `EOD trigger`. The "מה שופח" table at the bottom of GAP_ANALYSIS gets a new row: pkg/buddy-v05-backend → PR #__. |
| `CLAUDE.md` "Open FLAGs" section | Remove the F-2026-05-03-05 line ("BUFF_BUDDY_SYSTEM.md is target-spec V0.5..."). Move it to "Resolved since last update" subsection with a note that Phase 1 (L1-L3) is live; Phase 2 (L4-L5 + boosters use) and code consumers are queued. |

These are also written into the next EOD doc commit when Adi triggers one — no need to do them in this PR.

## Out of scope

- `docs/BUFF_PRD.md` — no PRD-level capability change (this is infrastructure; the user-visible surface comes with `pkg/teen-ui-with-buddy-bundle`)
- `docs/BUFF_BUDDY_SYSTEM.md` — the spec stays authoritative; this package implements the spec, doesn't change it
- `docs/BUFF_DECISIONS_LOG.md` — Adi-only; no DECISION-worthy product call here, all decisions were technical-architectural
- `docs/BUFF_VALUES.md` — no change

## Verification
- [x] STATUS.md row added
- [x] INTEGRATION_LEARNINGS.md updated in this PR
- [ ] GAP_ANALYSIS + CLAUDE.md updates queued for next EOD doc commit
