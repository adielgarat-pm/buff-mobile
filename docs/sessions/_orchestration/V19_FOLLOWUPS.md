# V19 Follow-ups — Orchestration Hub

> **Owner session:** the current "coordinator" CC session manages this file.
> **Created:** 2026-05-29, from Adi's post-V19 review (3 rounds of observations).
> **Source of truth for findings:** `docs/INTEGRATION_LEARNINGS.md` IN-2026-05-29-01..09.
> **How to use:** open a *separate* CC session per row below and paste its kickoff prompt
> (prompts are in English on purpose — RTL clipboard safety per CLAUDE.md). Each session
> starts in Plan Mode, opens its own `pkg/…` or `fix/…` branch, and reports back here.

## Status board

| # | Session / branch | Covers (IN) | Size | Depends on | State |
|---|---|---|---|---|---|
| A | `pkg/onboarding-starter-tasks` | 02, 04, 05, 06 | L | — | ✅ **BUILT + Hat-3 VERIFIED — [PR #120](https://github.com/adielgarat-pm/buff-mobile/pull/120)** (commit 53ab1cb). Emulator E2E 2026-05-30 via empty-state flow on `ZTestDup529` (12-14, `time_management`): 3 English tasks inserted at correct `timeOfDay` clocks (`Write today's 3 priorities` @ 08:00 morning, `25-min timer for a task` @ 16:00 afternoon, `Plan tomorrow tonight` @ 20:00 evening). Detection: Latin name → `detectLangFromName` → `'en'`. **Remaining:** Adi review + Hat-4 (real-device RTL, Hebrew-name path). Built autonomously 2026-05-29; OQ defaults in STATUS.md |
| B | `fix/empty-state-duplicate-tasks` | 08 | M | — | ✅ **MERGED — PR #122** (merge `102a8a4`, feat `8dca8cc`). UStep5 idempotency (per-table count guard) + existing-child `goNext` → ParentTasks. Remote deleted 2026-05-30. **Hat-3 pending** + Itay data cleanup pending. |
| C | `pkg/child-suggest` | 01 | M | — | ✅ **MERGED — PR #123** (merge `afffe3a`, feat `16d3871`). Child suggests tasks/rewards; parent deal-making "Yes / Let's talk"; new schema `suggestions` table (migration in `docs/sessions/child-suggest/migration.sql`). Remote deleted 2026-05-30. **Hat-3 + Hat-4 pending.** |
| D | `pkg/money-conversion-reward` | 03 | M | — | 📋 standalone prompt ready: [`prompts/D-money-conversion-reward.md`](prompts/D-money-conversion-reward.md). **NOT BUILT.** Adi's call (2026-05-30): **ship in V19** → needs scope decision (a/b/c) before build. |
| E | `fix/gamer-parent-polish` | 07, 09 | S | — | ✅ **MERGED — PR #126** (merge `607c4d1`). ParentTasksScreen statusDot replaces false-affordance checkbox; preview greeting uses real `ModeContext.previewChildName` + greetingName font 28→22. Remote deleted 2026-05-30. **Hat-3 pending.** |
| F | `pkg/per-child-language` | 04 (extends) | M | A (PR #120) ✅ merged | ✅ **MERGED — PR #124** (merge `5e9ba20`, feat `755100b`). `pro_settings.language` + `resolveChildLang(child)` helper; EditChild toggle; child's-own-device hydration. SPEC: [`../per-child-language/SPEC.md`](../per-child-language/SPEC.md). Remote deleted 2026-05-30. **Hat-3 + Hat-4 (real-device RTL on child session) pending.** |

Suggested order: **B** (data bug, blocks trust) → **E** (quick wins) → **A** ✅ built → **C** / **D** (new features, any order).

**Per-session prompt files** live in [`prompts/`](prompts/) — open a fresh CC session and paste the block from the matching file. A is already built (PR #120). The full prompt text also remains inline below for reference.

---

## A — `pkg/onboarding-starter-tasks`  (IN-02, 04, 05, 06)

```
Package: pkg/onboarding-starter-tasks. Start in Plan Mode.

Goal: fix how onboarding generates each child's starter tasks. Four linked problems,
all documented in docs/INTEGRATION_LEARNINGS.md — read IN-2026-05-29-02, -04, -05, -06
in full first, plus the approved design table at
docs/sessions/onboarding-starter-tasks/STARTER_TASK_TABLE.md.

Scope:
1. (IN-05) Add a `timeOfDay: 'morning'|'afternoon'|'evening'` field to `StarterTask` in
   src/screens/onboarding/unified/onboardingData.ts, and in UStep5_Preview.tsx map it to a
   clock time INSTEAD of the positional TASK_TIMES[index] (keep a positional fallback).
2. (IN-02 + table) Rebuild STARTER_TASKS_BY_CHALLENGE from STARTER_TASK_TABLE.md so tasks
   are age-appropriate (the table is age-scoped) and time-correct.
3. (IN-04) Derive the inserted task LANGUAGE from the script of the child's name
   (params.childName), not i18n.language: add detectLangFromName(name) (Hebrew range
   /[֐-׿]/ → 'he', else 'en'; default 'he' when undetectable). Apply to the task
   INSERT only — rewards already write bilingually via bilingualForDb and need no change.
   This refines IN-2026-05-27-04 (do not revert that helper/guardrail).
4. (IN-06) Content already encoded in the table: "make breakfast alone" removed;
   "pack bag per timetable" added (static text for now).

Out of scope: the suggest-task flow (separate pkg/child-suggest), money reward (separate),
timetable INTEGRATION for the bag task (separate, only if Adi asks).

Constraints: user-facing HE strings — confirm wording matches the table. Run the Values
Check (table is Pillar-1/3 aligned; verify). Verify via npm run web + i18n:check + jest +
tsc. Auth-gated onboarding → Adi does the Android emulator Hat-4 pass. Branch pkg/…, PR,
no direct main commits.
```

## B — `fix/empty-state-duplicate-tasks`  (IN-08)

```
Branch: fix/empty-state-duplicate-tasks. Start in Plan Mode.

Bug (Adi, real): adding tasks for an EXISTING child via the parent Tasks-tab empty-state
CTA created DUPLICATE tasks/rewards for Itay (Emi unaffected), and the flow "didn't return
to the dashboard." Full code-level investigation is in docs/INTEGRATION_LEARNINGS.md
IN-2026-05-29-08 — read it first. Key proven finding: UStep5_Preview.saveAll inserts
task rows (~:225) and reward rows (~:252) UNCONDITIONALLY on every run, including the
existingChildId path — no "child already has tasks?" guard, and saveAll re-runs on remount
/ error-retry / null-childProfileId goNext. existingChildId threading is NOT the bug (it's
intact end-to-end).

Do:
1. Reproduce on the Android emulator: parent → Tasks tab → child with 0 tasks → "Set up
   tasks" → finish flow → observe (a) are tasks duplicated? (b) where does it land?
2. Add idempotency: on the existingChildId path, do NOT insert tasks/rewards the child
   already has — gate on a live count/dedupe, not just the tasks.length===0 entry condition.
3. Fix the return so it lands on the parent TASKS tab (existing-child goNext currently does
   navigation.navigate('ParentApp') → default tab; see UStep5_Preview.tsx:286 + RootNavigator
   modal group :171-180).
4. Data cleanup: via Supabase MCP (mobile DB gfrongfnyigxsexuofrg, no prod users), inspect
   tasks + store_rewards for Itay's profile, confirm the duplicate shape, and delete the
   extra set. Show Adi the before/after counts before deleting.

Verify: emulator repro now clean; tsc/jest green. Branch + PR, no direct main.
```

## C — `pkg/child-suggest`  (IN-01)

```
Package: pkg/child-suggest. Start in Plan Mode.

Goal: make the child able to suggest a TASK and a REWARD to their parent for approval.
Read docs/INTEGRATION_LEARNINGS.md IN-2026-05-29-01 first. Today both CTAs are dead stubs:
- "Suggest a task to your parent" — GamerTasksScreen.tsx:334-343, onPress is an empty TODO.
- "Suggest a reward to your parent" — GamerRewardsScreen.tsx:294, empty TODO.
Adi confirmed by tapping both: nothing happens. Gamer-mode only; Mint/young-child mode has
no equivalent.

Scope: design + build the suggest→approve flow. Child submits a suggestion → it lands in a
"pending approval" state → parent sees it on a parent surface and approves/declines →
approved items become real tasks/rewards. Cover BOTH tasks and rewards. Extend the entry
point to Mint child mode too, not just Gamer.

Schema: needs a pending-suggestions store (mobile DB, no prod users — CC owns schema per
CLAUDE.md memory). Propose the table/RLS in Plan Mode before applying.

VALUES CHECK IS MANDATORY before finalizing — Pillar 3 (child voice) is the upside; Pillar 2
risk is the decline path: a parent "No" must never shame the child. Get Adi's sign-off on the
decline copy. Branch + PR, no direct main.
```

## D — `pkg/money-conversion-reward`  (IN-03)

```
Package: pkg/money-conversion-reward. Start in Plan Mode.

Goal: let a money-motivated child of ANY age earn a "convert BUFFs → money" reward, with a
parent-controlled, deliberately-high exchange rate so it stays cheap for the parent.
Read docs/INTEGRATION_LEARNINGS.md IN-2026-05-29-03 first. Today the reward
"Convert BUFFs to money" (pr_4, onboardingData.ts:317) exists ONLY under motivator
'privileges' AND age 15-18; there is no money/earning motivator; the cost uses the generic
calcRewardCredits (no money-specific rate).

Scope (confirm which parts with Adi in Plan Mode — could be a/b/c or a subset):
a. Make the money-conversion reward reachable for money-motivated kids at any age.
b. Add a money/earning motivator (or a way to signal it) to MOTIVATORS in onboardingData.ts.
c. Add a configurable, deliberately-high BUFFs→money exchange rate (parent-set ₪ per N BUFFs)
   so the parent controls real-money exposure — distinct from the generic credit cost.

VALUES CHECK IS MANDATORY — real money is the most extrinsic reward in the app (Pillar 1):
it must be parent-configured and framed as the child's own chosen goal, never a default.
Branch + PR, no direct main.
```

## E — `fix/gamer-parent-polish`  (IN-07, IN-09)

```
Branch: fix/gamer-parent-polish. Start in Plan Mode. Two small, unrelated UI fixes.

Read docs/INTEGRATION_LEARNINGS.md IN-2026-05-29-07 and -09 first.

1. (IN-07) Parent Tasks view false-affordance: ParentTasksScreen.tsx:157-160 renders an empty
   round checkbox (styles.checkCircle :192) inside a non-pressable View — looks tappable, isn't
   (the parent can't complete tasks). Change it to a status-only glyph: show the filled ✓ only
   when task.completed, and a neutral non-checkbox indicator (or nothing) otherwise. Leave the
   live checkbox in the CHILD interface / view-as-child untouched (GamerTasksScreen check-circle
   :285 and PhaseTaskCard :81 are correctly interactive there).

2. (IN-09) View-as-child greeting reads "היי תצוגה": GamerDashboardScreen.tsx:241 shows
   gamerDashboard.previewName ("תצוגה") when isChildPreview. Adi wants the child's REAL name in
   preview too (the "Parent Preview — tap to exit" banner already signals preview) AND a smaller
   greetingName font (:439 is fontSize 28). NOTE: this reverses the intentional preview-name swap
   logged in IN-2026-05-27-01 — Adi confirmed she wants it (2026-05-29). Propose a one-line
   DECISIONS_LOG entry for her rather than flipping silently. Use the previewed child's name
   (ModeContext.previewChildId) if available, else profile.display_name.

Verify via npm run web + screenshots. Branch + PR, no direct main.
```
