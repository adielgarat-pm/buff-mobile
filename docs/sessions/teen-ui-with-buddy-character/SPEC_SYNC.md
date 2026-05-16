# teen-ui-with-buddy-character — Spec Sync

> Canonical docs this package touches, mapped to the phase that touches each.
> CC must include the doc update in the same commit as the phase's code (Workflow Rule 5).

## Docs touched

| Doc | Phase(s) | Change |
|---|---|---|
| `docs/BUFF_GAP_ANALYSIS.md` | 2, 3 | Phase 2: mark "5B MY STATS full" and "Hide Buddy in Settings" rows → ✅. Phase 3: mark "Dashboard with-Buddy variant", "5A Me & Buddy", "03 Buddy Toggle Modal" rows → ✅. |
| `docs/INTEGRATION_LEARNINGS.md` | 1-4 (as needed) | Append entries for any surprises (theme switch behavior, asset pipeline issues, Stitch design ambiguities resolved during impl). At Phase 4 close: confirm IN-2026-05-14-04 mitigation held during this package. |
| `docs/sessions/teen-ui-my-stats-full/SPEC.md` | 4 | Add a top-of-file note: "**SUPERSEDED by `pkg/teen-ui-with-buddy-character`** as of YYYY-MM-DD. Scope absorbed; this branch will not ship a PR. See [../teen-ui-with-buddy-character/SPEC.md](../teen-ui-with-buddy-character/SPEC.md) DRIFT-1 for context." |
| `CLAUDE.md` "Open FLAGs" section | 4 | Update `pkg/teen-ui-my-stats-full` mention if any (none currently); add line about pet asset pipeline if Phase 1 surfaces a reusable learning. |

## Adi-owned docs (CC proposes; Adi applies if she chooses)

| Doc | Phase | Proposed edit |
|---|---|---|
| `docs/BUFF_DECISIONS_LOG.md` | 2 (open), 4 (close) | New D-2026-05-?? entry: "DRIFT-1 resolution — absorb pkg/teen-ui-my-stats-full into pkg/teen-ui-with-buddy-character (P2)". New D-2026-05-?? entry: "DRIFT-2 resolution — 03 Buddy Toggle Modal scoped per Stitch confirmation design, not preview-both UI." Both per CLAUDE.md "❌ update BUFF_DECISIONS_LOG.md unilaterally" — Adi applies. |
| `docs/BUFF_BUDDY_SYSTEM.md` | n/a | No change — this package implements the V0.5 spec, doesn't alter it. |

## Out of scope

These canonical docs are deliberately NOT touched by this package:

- `docs/BUFF_PRD.md` — no PRD-level capability change; the V0.5 Buddy capability is already declared. This package surfaces it.
- `docs/BUFF_VALUES.md` — no values change.
- `docs/BUFF_USER_STORIES.md` — no new stories introduced.
- `docs/BUFF_FEATURE_AUDIT.md` — feature already inventoried as part of V0.5.
- `docs/BUFF_FEATURE_PRIORITIZATION.md` — priority already set by the beta-2026-06-01 umbrella.
- `docs/WORKFLOW.md` — no workflow change.
- `docs/CONVERSATION_STARTER.md` — no change.
- `docs/ARCHITECTURE.md` — to be created in a separate session per backlog.
- `docs/teen-ui-design/*` — design docs are inputs, not outputs. Not modified.

## Verification

- [ ] Each phase in [ROADMAP.md](ROADMAP.md) lists doc updates as part of its exit deliverables.
- [ ] [TESTS.md](TESTS.md) includes "doc updated per SPEC_SYNC" check per phase.
- [ ] At Phase 4 close: no drift between canonical docs and the shipped code.
