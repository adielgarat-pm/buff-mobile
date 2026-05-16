# pkg/daily-vibe-check — Spec Sync

> Which canonical docs change in which phase. CC must update each listed doc as part of the named phase's exit deliverable, in the same commit. Verified during diff review.

## Docs touched in this package

| Doc | Phase(s) | Nature of change |
|---|---|---|
| `docs/sessions/daily-vibe-check/STATUS.md` | every | Phase row appended at exit |
| `docs/BUFF_GAP_ANALYSIS.md` | Phase 2, Phase 3, Phase 5 | S-07 `❌ NOT EXISTS` → `🟡 PARTIAL` (P2) → `✅` (P3) → final closeout (P5) |
| `docs/BUFF_PRD.md` | Phase 4, Phase 5 | P4: note in §8.1 that Low Power Mode = Days 1-3 retention mechanic. P5: spec-sync §7.1 line 215 (remove "Already fully implemented in current codebase" — see Decision NEW-1). |
| `docs/INTEGRATION_LEARNINGS.md` | Phase 0 (probably not), Phase 5 (definitely) | P5: discovered PRD/GAP drift (NEW-1) + UTC date convention follow-up risk. Phase 1+ append if other surprises emerge. |

## Docs intentionally NOT touched

- `CLAUDE.md` — no rule changes
- `docs/WORKFLOW.md` — no workflow changes
- `docs/BUFF_VALUES.md` — values unchanged
- `docs/BUFF_DECISIONS_LOG.md` — no DECISION entries (Adi-only doc per CLAUDE.md)
- `docs/BUFF_BUDDY_SYSTEM.md` — Vibe Check is independent of BUDDY state
- `docs/BUFF_USER_STORIES.md` — existing user stories cover this (S-07)
- `docs/BUFF_FEATURE_AUDIT.md` — S-07 row already exists
- `docs/BUFF_FEATURE_PRIORITIZATION.md` — already lists this as priority #3
- `docs/CONVERSATION_STARTER.md` — no impact
- `docs/ARCHITECTURE.md` — does not exist yet
- `docs/teen-ui-design/` — Gamer Vibe Check uses brand palette directly; no Stitch design source to track
- `docs/BUFF_BRAND.md` — uses existing palette per §7.5

## Out of Scope (explicit non-targets)

- **`docs/BUFF_DECISIONS_LOG.md`** — Adi-only per CLAUDE.md. If a Vibe-Check decision rises to formal DECISION status, Adi creates the entry; CC does not.
- **PRD §10 (success metrics)** — no new metrics defined in this package. Future analytics surface (Phase 2 of the broader product roadmap, not this package).

## Verification

- [ ] Each Phase's plan in CC includes the SPEC_SYNC row(s) for that phase as part of the chunk
- [ ] Each Phase's TESTS.md includes "doc updated per SPEC_SYNC" check
- [ ] At closeout: `grep "Vibe Check" docs/BUFF_PRD.md` returns the corrected line; `grep "S-07" docs/BUFF_GAP_ANALYSIS.md` shows ✅
- [ ] No drift between canonical docs and live system at PR open time
