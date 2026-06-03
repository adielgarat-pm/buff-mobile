# STATUS — onboarding-starter-tasks (session)

> Two packages share this session folder. Newest first.

---

## pkg/starter-task-engine — age + clinical-presentation engine

| Field | Value |
|---|---|
| State | **code-complete — pending Adi review + Hat-4 emulator verification** |
| Date | 2026-06-01 |
| Branch | `pkg/starter-task-engine` (worktree) |
| Built | Autonomously by CC at Adi's request ("תוציא את הפיתוח כחבילה אחת כולל תכנון הבדיקות שלה וללא פגיעה באונבורדינג") |
| Tests | typecheck ✅ (0 errors, whole project) · jest ✅ **27/27** (`starterTasks`) |
| SPEC | `DOMAIN_RESEARCH.md` (Adi-reviewed 2026-06-01) + `TEST_PLAN.md` |

### What changed
1. **New engine** `src/screens/onboarding/unified/starterTasks/` — 4 layers:
   - `types.ts` — vocabulary (StarterTaskDef, GeneratorConfig, LearnedScores, GeneratedTask…)
   - `taskLibrary.ts` — **DATA**: the §1-7 research table as records (all Adi edits baked in)
   - `generateStarterTasks.ts` — **LOGIC**: deterministic, age + sexLean scoring, dedupe, guarantee, fallback
   - `generatorConfig.ts` — **POLICY**: §8 decisions as data (caps, bonuses, tune6to8…)
   - `challengeMap.ts` / `timeOfDay.ts` — challenge→domain, timeOfDay→HH:MM, domain→category
   - `index.ts` — public API barrel
   - `__tests__/` — 27 tests
2. **`UStep5_Preview.tsx`** — replaced positional selection
   (`STARTER_TASKS_BY_CHALLENGE.slice` + `TASK_TIMES[index]`) with a single
   `generateStarterTasks({ ageGroup, gender, mainChallenge, additionalChallenges })`
   call. Dead positional consts + `getCategoryForChallenge` removed. DB insert
   now maps engine output directly (`t.time`, `t.category`). **Save flow,
   idempotency guards, rewards, navigation — untouched.**
3. **`DOMAIN_RESEARCH.md`** — copied into session folder (was untracked in main).

### Key wins
- **Fixes the positional time bug** — a task's clock time now comes from its
  *meaning* (`timeOfDay`), not its list index. "Screens off before bed" = 20:00.
- **Age-aware** — never serves an off-band task.
- **Clinical-presentation lean** (not stereotype) — biases, never gender-locks;
  opposite-lean tasks stay eligible (§0.3); 6-8 stays unified (§8.3).
- **Self-learning ready** — `LearnedScores` plumbed; Phase 3 re-weights via data.

### Values Check — passes
- **Pillar 1:** real-world routines → motivator rewards; parent-initiated at onboarding (parity). ✅
- **Pillar 2:** titles plain + inviting, no shame/why; lean is invisible to the child. ✅
- **Pillar 3:** scaffolds real independence, fades with age; ⚠️ child-voice via `pkg/child-suggest` (parity, flagged).

### Not in scope / deferred
- Learning aggregation pipeline (Phase 3) · remote-config library (Phase 2) · A/B `variantOf`.
- Round-3 confirm items: (a) `d1_bag_by_door` morning vs evening-prep literature; (b) homework "go over" vs "write down" wording A/B — see DOMAIN_RESEARCH §11.

### Hat-4 (Adi) — see `TEST_PLAN.md` §2.

---

## pkg/onboarding-starter-tasks

| Field | Value |
|---|---|
| State | **code-complete — pending Adi review + Hat-4 emulator verification** |
| Date | 2026-05-29 |
| Branch | `pkg/onboarding-starter-tasks` (worktree) |
| Built | Autonomously by CC at Adi's request ("start the package without asking more questions") |
| Tests | typecheck ✅ · check:i18n-access ✅ (157 files) · i18n:check ✅ (428 keys) · jest i18nString ✅ 23/23 |
| Covers | IN-2026-05-29-02 (personalization), -04 (name-script language), -05 (time-of-day), -06 (content) |
| SPEC | `docs/sessions/onboarding-starter-tasks/STARTER_TASK_TABLE.md` (v1.1, Adi-reviewed §1-4, CC precision pass §5-8) |

## What changed

1. **`onboardingData.ts`** — added `type TimeOfDay = 'morning'|'afternoon'|'evening'` and a required `timeOfDay` field on `StarterTask`. Rebuilt `STARTER_TASKS_BY_CHALLENGE` from the table: every challenge key preserved (22 keys incl. aliases), each gets 3 age-appropriate tasks with correct `timeOfDay`. `FALLBACK_TASKS` got `timeOfDay: 'morning'`. **REWARD_PICKS, OPTIONS_BY_AGE, MISSION_PICKS, MOTIVATORS, calc fns — untouched** (verified by git diff).
2. **`UStep5_Preview.tsx`** — task `time` now derives from `TIME_OF_DAY_CLOCK[t.timeOfDay]` (positional `TASK_TIMES` kept only as fallback); task `title` language now derives from the child's name script via `detectLangFromName(params.childName)` (`childLang`) instead of the app locale (`activeLang` removed). Preview now renders titles via `pickLang(...)` (was direct `.title[lang]`). Rewards unchanged (still `bilingualForDb` at INSERT, app-locale at preview).
3. **`i18nString.ts`** — added `detectLangFromName(name)` (Hebrew block `/[֐-׿]/` → 'he'; Latin → 'en'; else 'he' Israel-first default). +7 unit tests.

## Open-question defaults chosen (Adi was away; defensible defaults — change freely)

1. **Focus-area list** — kept the existing `OPTIONS_BY_AGE` challenges as-is (no add/rename).
2. **Bag-per-timetable** — shipped **static** ("לסדר תיק לבד לפי המערכת", all ages 6+). Timetable *integration* deferred to a separate package.
3. **Tasks per challenge** — kept the existing flow: up to 3 main + 2 bonus (cap 5). Table is age-scoped so each challenge yields exactly 3.
4. **Meds anchor** — kept Adi's "ארוחת בוקר לפני כדור" (assumes a medicated child). Did **not** add a separate day-0 meds task (anchor-recovery already handles meds). Non-medicated-child fallback wording is still an open product decision — **not blocking**.
5. **HE wording** — used the table's strings verbatim (Adi reviewed §1-4; CC precision pass §5-8). Yours to sign off.

## Values Check (9 questions — passes)

- **Pillar 1:** tasks are real-world routines feeding motivator-chosen rewards; not virtual-reward-dependent; parent-initiated at onboarding (parity with shipped flow). ✅✅✅
- **Pillar 2:** titles are plain, inviting actions — no shame/comparison/failure framing (per the "simple + inviting, no rationale" copy rule Adi set 2026-05-29); no BUDDY-suffering. ✅✅✅
- **Pillar 3:** tasks scaffold real-world independence (timetable bag-packing, self-management, wake-on-own); fade as routines internalize. ⚠️ Q2 (child voice) — tasks are parent-selected via challenge here, same as shipped onboarding; child-initiated tasks come via `pkg/child-suggest`. Acceptable parity, flagged.

## Not in scope / deferred

- Wiring the "suggest a task/reward" stubs → `pkg/child-suggest` (IN-01).
- Timetable *integration* for the bag task.
- A non-medicated-child fallback for the breakfast task (OQ4).
- GAP_ANALYSIS rows (Adi's doc — propose, don't edit).

## Hat-4 (Adi, on Android emulator)

- Onboard a **Hebrew-named** child → starter tasks render Hebrew; onboard a **Latin-named** child (app in either locale) → English tasks. Confirms name-script language.
- Confirm each starter task lands in the right day-phase (e.g. "screens off before bed" = evening, "pack bag" = evening, homework = afternoon).
- Confirm the empty-state "Set up tasks" re-entry still attaches the new tasks (cross-check with `fix/empty-state-duplicate-tasks`).
