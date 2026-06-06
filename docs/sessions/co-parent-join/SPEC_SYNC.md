# co-parent-join — SPEC_SYNC

> אילו canonical docs מתעדכנים, באיזו פאזה. מתעדכנים באותו commit כמו הקוד.

| Canonical doc | Phase | What updates |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | 1 | New entry: multi-parent is now a supported flow; RLS was already family-scoped (no schema gate). Note the security watch-item (code-reuse escalation) + empty-family orphan behavior. |
| `docs/BUFF_GAP_ANALYSIS.md` | 3 | Propose row: "co-parent / second parent" moves from gap → shipped. **Adi's doc — propose, do not edit unilaterally.** |
| `docs/BUFF_PRD.md` | 3 | Propose: family model supports N parents (equal), premium is family-wide. **Propose to Adi.** |
| `docs/BUFF_DECISIONS_LOG.md` | 3 | Propose D-2026-06-06 entries: (1) reuse family code for parent join, (2) equal co-parent permissions, (3) family-wide premium. **Adi appends — do not edit unilaterally.** |
| `docs/RELEASE_QUEUE.md` | Exit | Add Queued row for the next train (per release-tracking-in-files). |
| `STATUS.md` (this folder) | every | CC updates the phase row on each phase exit. |

**Note:** `CLAUDE.md` § Open FLAGs references Invite Link Option B (parent deep link, post-RevenueCat) — this package does NOT implement that; it reuses the existing code. Leave that FLAG as-is unless Adi says otherwise.
