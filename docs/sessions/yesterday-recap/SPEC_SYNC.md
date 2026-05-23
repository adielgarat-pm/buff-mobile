# Yesterday Recap — Spec Sync

> Which canonical docs the package modifies, mapped to the phase that touches each.
> CC must update every doc listed below as part of the named phase's exit deliverable.

## Docs that are modified

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/BUFF_PRD.md` | 3 | §7 (Features) — add "Yesterday Recap" line item under Parent surface |
| `docs/INTEGRATION_LEARNINGS.md` | 3 | F-2026-05-21-01 status transition: `open` → `resolved` |
| `docs/sessions/yesterday-recap/STATUS.md` | 1, 2, 3 | Phase row added at end of each phase |

## Docs proposed-not-edited (Adi-owned)

Per CLAUDE.md, CC does not unilaterally edit these. CC proposes language; Adi merges:

| Doc | פאזה | מה לעשות |
|---|---|---|
| `docs/BUFF_GAP_ANALYSIS.md` | 3 | Propose new row: "Yesterday Recap — parent-side read-only daily summary." CC drafts row text; Adi pastes. |
| `docs/BUFF_DECISIONS_LOG.md` | — | No D-row needed (this is a beta-driven enhancement, not a strategic decision). If Adi wants to record decisions §1–§8 of SPEC, that's optional. |

## Out of Scope (explicit non-edits)

- `docs/BUFF_VALUES.md` — Pillar 2 anti-pattern is already documented (L82). No change needed.
- `docs/BUFF_BUDDY_SYSTEM.md` — BUDDY not involved.
- `docs/WORKFLOW.md` — no workflow change.
- `CLAUDE.md` — no rules change.
- `docs/teen-ui-design/` — Teen UI not affected.
- `docs/BUFF_USER_STORIES.md` — could add a user story for Shani's scenario; **deferred** unless Adi specifies (Adi-owned doc).
- `docs/BUFF_FEATURE_AUDIT.md` — could add row; **deferred** unless Adi specifies (Adi-owned doc).

## Verification

- [ ] Each phase in ROADMAP.md includes its canonical-doc updates as a phase deliverable
- [ ] TESTS.md includes "doc updated per SPEC_SYNC" check for each relevant phase
- [ ] After all phases — no drift between BUFF_PRD §7 and the live feature
- [ ] After all phases — F-2026-05-21-01 marked `resolved` with the resolving commit hash
