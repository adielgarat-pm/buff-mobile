# pkg/child-suggest

**Status:** Code complete; awaiting Hat-4 device verification + PR merge.
**Branch:** `pkg/child-suggest`
**Closes:** IN-2026-05-29-01 (child "Suggest a task/reward" CTAs were dead stubs).

Child proposes a task/reward → parent does a **deal**: "Yes, let's do it" or
"Let's talk about it". No decline (BUFF_VALUES Pillar 2). Gamer + Mint.

## Files
- `SPEC.md` — target state, behaviour contract, decisions, Values Check.
- `ROADMAP.md` — phases.
- `TESTS.md` — pass/fail criteria (incl. Hat-4 device checks).
- `SPEC_SYNC.md` — canonical docs touched.
- `STATUS.md` — phase tracker.

## Key implementation
- DB: `public.child_suggestions` (+ RLS + `trg_notify_parent_on_child_suggestion`).
- Hooks: `src/hooks/useChildSuggestions.ts` (`useChildSuggestions`, `usePendingSuggestions`).
- Child UI: `src/components/child/ChildSuggest.tsx` (SuggestModal + SuggestionStatusList).
- Parent UI: `src/components/parent/PendingSuggestions.tsx`.
- Wired: GamerTasks/GamerRewards/ChildTasks(mint)/ChildRewards(mint) + ParentTasks/ParentRewards.
- Notifications: new `child_suggestion` type (router + row).
