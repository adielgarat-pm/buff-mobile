# SPEC_SYNC — pkg/child-suggest

Which canonical docs are touched, and when.

| Doc | Action | Phase |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | IN-2026-05-29-01 flipped `open → resolved` + resolution note — **edit left in the working tree, deliberately NOT in this PR's commit** (see note). | Phase 4 |
| `docs/sessions/child-suggest/*` | Create session folder (this package). | Phase 4 |
| `docs/sessions/child-suggest/STATUS.md` | Phase rows. | Phases 1–4 |

## ⚠️ INTEGRATION_LEARNINGS.md not committed in this PR — why
At branch-cut, `docs/INTEGRATION_LEARNINGS.md` already had a large **uncommitted** batch of
unrelated open FLAGs (IN-2026-05-29-**02 … 09**, post-V19 review notes from another/parallel
session) — none of them in HEAD, all in one inseparable diff hunk together with IN-2026-05-29-01.
Committing the file would drag those 7 unrelated entries into this child-suggest PR (bad hygiene,
collision risk with the session that owns them). So this PR **excludes** the file. The
IN-2026-05-29-01 `resolved` edit remains in the working tree and will land when that batch is
committed. The full resolution text is preserved here in `SPEC.md` regardless. **Action for Adi:**
commit the IN-2026-05-29 batch separately (it carries the -01 resolution).

## Not updated (and why)
- `BUFF_GAP_ANALYSIS.md`, `BUFF_DECISIONS_LOG.md`, `BUFF_VALUES.md` — Adi's docs; not edited
  unilaterally (CLAUDE.md). **Proposed for Adi:** a GAP_ANALYSIS row for "child-proposed
  tasks/rewards" (PRD §165/§227 "deal-making") moving ❌→✅, and a DECISION recording the
  "no-decline / Let's-talk-about-it" model. Surface separately.
- `BUFF_PRD.md` — no product-contract change; this implements the existing §165/§227
  "deal-making" / "child is a stakeholder" requirement. The PRD already lists
  `proposed_by_child` (§290) — this package wires it for the first time.
- `BUFF_BUDDY_SYSTEM.md` — untouched; BUDDY is not involved in the suggest flow.
