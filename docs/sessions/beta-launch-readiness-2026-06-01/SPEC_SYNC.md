# SPEC_SYNC — pkg/beta-launch-readiness-2026-06-01

> Which canonical docs to update, in which phase.

## What this package touches in canonical docs

Most of this is a verification + docs package — minimal canonical impact. The single canonical edit is INTEGRATION_LEARNINGS for the surprises.

| Canonical doc | Phase | What changes |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | Phase 4 | New entry: **IN-2026-05-26-02** — Egg-stage drift confirmed live in `ChildDashboardScreen` (Pastel theme via PetDisplay); workaround applied in pkg/beta-launch-readiness; full retirement still queued as pkg/drop-egg-evolution-stage. Reference IN-2026-05-16-01 as origin. |
| `docs/INTEGRATION_LEARNINGS.md` | Phase 4 | New entry: **IN-2026-05-26-03** — v16 AAB / preview APK divergence (production at `3d1f20a`, preview at `91e3f49`). Decision deferred to PR merge whether to rebuild v17 AAB. |
| `docs/MASTER_TEST_PLAYBOOK.md` | Phase 4 | Update F14.H4 verdict: was ✅ (egg, sleeping verified 2026-05-20) → now ❌-was-bug, ✅-as-of-91e3f49 (no egg on Pastel dashboard for fresh ChildJoin). |
| `docs/MASTER_TEST_PLAYBOOK.md` | Phase 4 | Add row in Sign-off section for beta-launch-readiness run, link to this session's SMOKE_TEST_CHECKLIST.md. |

## What this package does **not** touch

| Canonical doc | Why not |
|---|---|
| `docs/BUFF_PRD.md` | No PRD-level change. Egg removal is implementation detail. |
| `docs/BUFF_BUDDY_SYSTEM.md` | BUDDY_SYSTEM.md still describes Children Mode with egg/hatchling/scout/guardian in §92-§101 — that's target-spec drift but in the OPPOSITE direction (spec retains egg, code removes it). Don't unilaterally update Adi's canonical docs. Flag for Spec Sync after pkg/drop-egg-evolution-stage closes. |
| `docs/BUFF_VALUES.md` | Adi-owned, no change without explicit approval. |
| `docs/BUFF_DECISIONS_LOG.md` | Adi-owned. CC proposes a draft entry for D-2026-05-26-… (egg workaround acceptance) — Adi copies/edits to LOG. |
| `docs/BUFF_GAP_ANALYSIS.md` | Adi-owned, no change without explicit approval. |

## Decision draft for `BUFF_DECISIONS_LOG.md`

> CC proposes. **Adi alone copies/edits to `docs/BUFF_DECISIONS_LOG.md`.**

---

**D-2026-05-26-XX — Egg-stage visual workaround applied in beta-launch-readiness; full retirement still queued**

**Context:**
WhatsApp beta launch on 2026-05-30/06-01 to the Lovable-migrant cohort. Pre-flight smoke test in pkg/beta-launch-readiness surfaced that `ChildDashboardScreen` (Pastel theme via PetDisplay) still renders 🥚 + egg-crack mechanic at `DEFAULT_PET_STATE.evolution_stage='egg'` (day 0). IN-2026-05-16-01 had documented this as Pillar 1/2/3 violation and queued `pkg/drop-egg-evolution-stage`, which never ran.

**Decisions:**

1. **Apply minimal workaround in pkg/beta-launch-readiness (this package).** 4 lines: `getEvolutionStage()` returns `'hatchling'` instead of `'egg'` for days<3; `DEFAULT_PET_STATE.evolution_stage='hatchling'`; `EmojiPet` default param `'hatchling'`; `EmojiPet` always shows `skin.emoji` (not 🥚).
2. **`EvolutionStage` type still includes `'egg'`** — full type retirement is `pkg/drop-egg-evolution-stage` scope. The workaround makes the egg state unreachable at runtime.
3. **`BUFF_BUDDY_SYSTEM.md` not yet updated** — it still describes "egg/hatchling/scout/guardian" for Children Mode. Spec Sync deferred to post-`pkg/drop-egg-evolution-stage`.

**Implications:**
- WhatsApp cohort sees their skin emoji from day 0 (puppy 🐶 default for Pastel)
- Stage badge still reads "Hatchling 🐣" — workaround compromise; full retirement removes the badge
- No DB migration needed (DEFAULT_PET_STATE is client-side; pet state stored in AsyncStorage, not Supabase)
- Existing v8 AAB installs (if any in cohort) will see their stale stored stage; but the cohort is fresh-install on the new APK

**Sources:**
- `docs/sessions/beta-launch-readiness-2026-06-01/SPEC.md` Values Check
- `docs/INTEGRATION_LEARNINGS.md` IN-2026-05-16-01 (origin) + IN-2026-05-26-02 (workaround application)
- `src/types/pet.ts`, `src/components/EmojiPet.tsx` (commit `91e3f49`)
