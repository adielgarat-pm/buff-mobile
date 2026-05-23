# Anchor Recovery — SPEC Sync Matrix

> Per WORKFLOW.md: every phase exits with canonical docs synchronized. This matrix says **what changes when**.

---

## Per-phase doc updates

| Phase | Canonical doc | What changes |
|---|---|---|
| 0 | `docs/sessions/anchor-recovery/SPEC.md` | Phase 0 close-out: schema verification addendum, OQ1-9 resolved decisions |
| 0 | `docs/sessions/anchor-recovery/STATUS.md` | Phase 0 row + verified schemas note |
| 1 | `docs/sessions/anchor-recovery/SPEC.md` | Confirmed query shape, pg_cron job specifics, any deviations from predicted schema |
| 1 | `docs/sessions/anchor-recovery/STATUS.md` | Phase 1 row |
| 1 | `docs/INTEGRATION_LEARNINGS.md` | If pg_cron has surprises (e.g., timezone of cron run) |
| 2 | `docs/sessions/anchor-recovery/STATUS.md` | Phase 2 row |
| 2 | `src/i18n/he.json` + `src/i18n/en.json` | (new keys, but not canonical doc — just code) |
| 3 | `docs/sessions/anchor-recovery/STATUS.md` | Phase 3 row |
| 3 | `docs/BUFF_BUDDY_SYSTEM.md` | Note that anchor-recovery flow exists outside BUDDY mechanics (Anchor Recovery is parent-mediated, not BUDDY-mediated) |
| 4 | `docs/sessions/anchor-recovery/STATUS.md` | Phase 4 row |
| 4 | `docs/BUFF_PRD.md §7` (Vibe Check section) | Add line: "Vibe Check awards 5 BUFFs per kid per day (cap 1/day) since pkg/anchor-recovery (date)" |
| 5 | `docs/sessions/anchor-recovery/STATUS.md` | Phase 5 row |
| 6 | `docs/BUFF_PRD.md §7` (new feature line) | Add full Anchor Recovery feature description |
| 6 | `docs/BUFF_GAP_ANALYSIS.md` | **Adi-authored row** (per CLAUDE.md: GAP_ANALYSIS is Adi's doc; CC proposes, doesn't write) |
| 6 | `docs/INTEGRATION_LEARNINGS.md` | All surprises consolidated; any open FLAGs marked |
| 6 | `docs/sessions/anchor-recovery/STATUS.md` | Phase 6 closeout checklist completed |
| 6 | Memory file `~/.claude/.../project_buff_anchor_theory.md` | Append: "Implemented in pkg/anchor-recovery, shipped {date}, commit {hash}" |

---

## Docs explicitly NOT updated by this package

- `docs/BUFF_DECISIONS_LOG.md` — Adi-only updates (per CLAUDE.md). CC may PROPOSE entries but does not write.
- `docs/BUFF_VALUES.md` — stable doc; not modified during a package.
- `docs/BUFF_PERSONAS.md`, `docs/BUFF_MESSAGING.md`, `docs/BUFF_COMPETITORS.md` — marketing docs, not feature-related.
- `docs/WORKFLOW.md` — process doc, not feature-related.

---

## Cross-package dependencies (not changed by us)

- `pkg/daily-vibe-check`'s SPEC and shipped behavior — we BUILD ON it but don't modify its SPEC retroactively
- `pkg/fcm-push-notifications` — separate; if shipped before us, we MAY use push (currently no)
- `pkg/buddy-v05-backend` — its pg_cron pattern is our template for inactivity detector

---

## Memory file updates (across the package)

| When | File | Change |
|---|---|---|
| Phase 0 close | `project_buff_anchor_theory.md` | Note: SPEC drafted as pkg/anchor-recovery |
| Phase 6 close | `project_buff_anchor_theory.md` | Note: Implemented + shipped date + commit |
| Phase 6 close | `project_buff_war_non_return.md` | Note: This finding led to pkg/anchor-recovery (link) |
| Phase 6 close | `reference_lovable_user_data_location.md` | Add: UGC library discovery query is at line N of SPEC.md Appendix |
