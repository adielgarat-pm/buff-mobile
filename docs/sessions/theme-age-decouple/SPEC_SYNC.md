# theme-age-decouple — SPEC_SYNC

> Which canonical docs to update at each phase's close (same commit as code).

## Phase 1 — junior gating (Gamer HQ list + Stats tab hidden for 6–11)
- `docs/BUFF_PRD.md` — reconcile §4.2 + §4-feature-lists per **Q1 ruling**: state
  explicitly that skin (Mint/Gamer look) is a free per-child choice at any age, while
  task-presentation depth (inline HQ list, Stats tab) follows the `age_group` band.
  *(Adi's edit — CC proposes wording, does not self-apply. Pillar/§4.2 is Adi's doc.)*
- `docs/BUFF_DECISIONS_LOG.md` — append `D-2026-08-DD` recording the skin↔depth
  decoupling decision + Itay sign-off (Q2). *(Adi appends.)*
- `docs/INTEGRATION_LEARNINGS.md` — new IN entry: skin no longer changes IA; Stats tab
  now age-gated (safer than the old skin-gate re: runtime switch). CC drafts.
- `STATUS.md` (this folder) — state, date, commit, tests, learnings link.
- `docs/MASTER_TEST_PLAYBOOK.md:1083` — update "bonus Stats tab Gamer-exclusive" to
  "Stats tab teen-band-exclusive (both skins)".

## Phase 2 — teen parity on Mint skin (inline list + chips + Stats in Mint)
- `docs/BUFF_PRD.md` — Pastel/Gamer feature lists reflect that a teen on either skin
  gets the dashboard depth. *(Adi.)*
- `docs/teen-ui-design/README.md` — note the Mint-skin teen variant of the dashboard list.
- `STATUS.md` + `docs/INTEGRATION_LEARNINGS.md` as above.

## Values re-verification at each exit
Re-run the 9 questions against the *implemented* behavior (not just this SPEC text),
per CLAUDE.md Exit Deliverables. Confirm the junior HQ is genuinely lighter and no new
failure/overwhelm framing slipped in.
