# tomorrow-pack-inconsistency

> Make the child's two "what to pack" surfaces agree (ציוד tab hosts the canonical `PackingCard`) and make today vs tomorrow visually distinct inside the card. Beta report by Noa, 2026-09-02.

## Status
See [STATUS.md](./STATUS.md).

## Files

| File | Role |
|---|---|
| `SPEC.md` | Target state — authoritative for this package. Root cause, decisions D1–D5, behavior contract, Values Check, open questions Q1–Q5 |
| `ROADMAP.md` | Phases with stop conditions |
| `TESTS.md` | Pass/fail criteria per phase |
| `SPEC_SYNC.md` | Which canonical docs are updated, in which phase |
| `STATUS.md` | Phase tracking — updated by CC at every phase exit |

No `PRINCIPLES.md` — the package-specific rules are already in `BUFF_VALUES.md` (no counter / no miss framing) and noaa-behavior-spec D2.

## Branch
`claude/tomorrow-pack-inconsistency-lbm97x`

## Execution
1. Adi answers Q1–Q5 in `SPEC.md` (Q2 is the only one that blocks a chunk).
2. CC in Plan Mode, phase by phase, `approved, proceed` per phase, diff per chunk.
3. Every phase exit: code + `STATUS.md` row + `SPEC_SYNC.md` docs + `INTEGRATION_LEARNINGS.md` if surprised — one commit.
