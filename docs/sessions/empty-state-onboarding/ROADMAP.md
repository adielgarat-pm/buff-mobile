# ROADMAP — pkg/empty-state-onboarding

Single phase (contained, reversible). Shipped chunk-by-chunk under one branch.

## Phase 1 — Empty-state CTA → existing-child task setup
**Chunks**
- A — `existingChildId` on `UBase` + `UStep1` params; i18n keys (en + he).
- B — UStep5_Preview gate (skip profile insert) + exit to ParentApp + CTA/Skip conditional.
- C — UStep1 prefill + thread `existingChildId` (age-less fallback).
- D — ParentTasksScreen CTA + `useFocusEffect` refetch + handler (fetch pro_settings, route).
- E — session docs + INTEGRATION_LEARNINGS + verification.

**Stop conditions (all met in CC env):**
- `npm run typecheck` clean.
- `npm test` green.
- `npm run i18n:check` green.
- Supabase read-only validation: schema (`tasks.assigned_to`, `pro_settings.age_group`)
  confirmed; 0-task children identified.

**Remaining (Adi, Hat-4):** device/emulator run of the flow → tasks appear, no duplicate
profile (TESTS.md queries) → then PR + merge.
