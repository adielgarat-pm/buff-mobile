# TEST_PLAN — pkg/starter-task-engine

Test strategy for the age + clinical-presentation starter-task engine that
replaces the positional task selection in `UStep5_Preview.tsx`.

Engine source: `src/screens/onboarding/unified/starterTasks/`
Research basis: `docs/sessions/onboarding-starter-tasks/DOMAIN_RESEARCH.md`

---

## 1. Automated — Jest (CC-owned, runs in CI)

`src/screens/onboarding/unified/starterTasks/__tests__/`

### `taskLibrary.test.ts` — DATA layer (guards the file that changes most)

| # | Test | Why |
|---|------|-----|
| 1 | library is non-empty | sanity |
| 2 | ids are unique | dedupe + learning keys depend on it |
| 3 | `TASK_BY_ID` indexes every task | lookup integrity |
| 4 | every record well-formed (domain 1-7, valid sexLean/timeOfDay, both titles non-empty, ≥1 age band, baseWeight > 0, evidenceTag + rationale present) | malformed edit can't reach onboarding |
| 5 | **every domain has ≥1 enabled task in every age band** | guarantees no child sees an empty domain |
| 6 | every mapped challenge → a domain that has tasks | challengeMap can't point nowhere |

### `generateStarterTasks.test.ts` — LOGIC + POLICY layer

| # | Test | Decision covered |
|---|------|------------------|
| 1 | `leanForSelection`: boy→boys, girl→girls, other/undef→null | sexLean mapping |
| 2 | `leanForSelection`: 6-8 stays null unless `tune6to8` | §8.3 |
| 3 | `scoreTask`: +bonus on match, penalty (still eligible) on opposite, neutral for `both`, folds learned scores | §0.3 guardrail + scoring |
| 4 | output never exceeds cap (5), never empty | UStep5 contract |
| 5 | every task carries id/title{en,he}/buff_value=20/time/category | preview + DB insert shape |
| 6 | main challenge first, correct domain | parity with old flow |
| 7 | **deterministic** — same input ⇒ identical output | testability + learning |
| 8 | unique ids when two challenges share a domain | §8.4 dedupe |
| 9 | **time bug fix** — `d4_screens_off` ⇒ `20:00`; ∀ tasks `time === hhmmFor(timeOfDay)` | the positional `TASK_TIMES[index]` bug |
| 10 | girl gets ≥1 `girls` task (domain 5); boy gets ≥1 `boys` task | §8.1 guarantee |
| 11 | 6-8 stays all-`both` | §8.3 |
| 12 | never returns an off-band task | age gating |
| 13 | unknown challenge ⇒ non-empty `fallback` | unbreakable onboarding |
| 14 | no additional challenges ⇒ ≤ mainCount | edge |
| 15 | additional == main ⇒ no dup | edge |

**Status:** 27/27 pass · `npx jest src/screens/onboarding/unified/starterTasks` · 2026-06-01

### Project-wide gates (must stay green)
- `npx tsc --noEmit` — **0 errors** (whole project), confirms the UStep5 swap typechecks.
- Existing `i18nString` / i18n key suites — untouched by this package.

---

## 2. Manual — Hat-4 (Adi, Android emulator / device)

The engine is deterministic and unit-covered, so manual checks focus on the
*integration seam* (params → engine → DB → child app) and the clinical feel.

1. **Time-of-day correctness (the bug this package exists to kill).**
   Onboard a child with **Screen time** as main challenge. In the child's plan,
   confirm "Screens off half an hour before bed" sits in the **evening (20:00)**,
   not afternoon. Spot-check homework = afternoon, morning routine = morning.

2. **Age-appropriateness.** Onboard a **6-8** child and a **15-18** child with the
   same challenge (e.g. Independence). Confirm the young child gets simple tasks
   (get dressed, make bed) and the teen gets older ones (own alarm, make
   breakfast, allowance) — never the reverse.

3. **Clinical-presentation lean (not stereotype).** Onboard a **girl, 12-14,
   Confidence** → at least one internalizing-support task appears (e.g. "I made a
   mistake, and that's okay" / power word). Onboard a **boy, 9-11, Homework** →
   at least one short-burst/movement task appears. Confirm opposite-lean tasks are
   never *blocked* — a girl can still receive a movement task if it ranks.

4. **6-8 stays unified.** Onboard a **boy, 6-8** and a **girl, 6-8** with the same
   challenge → both get the same (gender-neutral) set.

5. **Name-script language (regression).** Hebrew-named child → Hebrew titles;
   Latin-named child → English titles (carried over from the prior package).

6. **Empty-state re-entry (regression).** The "Set up tasks" re-entry still
   attaches generated tasks to the existing child without duplicating
   (idempotency guard in `saveAll`, IN-2026-05-29-08).

7. **Cap + no-crash.** Onboard with a main + 2 additional challenges → ≤5 tasks,
   no duplicates, no crash, cards animate in.

---

## 3. What is NOT tested here (deferred)
- **Learning layer (Phase 3):** `LearnedScores` is plumbed and unit-covered in
  `scoreTask`, but the aggregation pipeline (anonymous kept/completed counts →
  scores) is not built. No test until that package.
- **Remote config (Phase 2):** `GeneratorConfig` override path is unit-covered
  (`tune6to8`), but sourcing the library/config from Supabase is future work.
- **A/B wording experiments:** `variantOf` field exists, unused.
