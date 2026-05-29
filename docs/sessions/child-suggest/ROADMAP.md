# ROADMAP — pkg/child-suggest

Single package, executed end-to-end (Adi: "run the whole package without stopping").

| Phase | Scope | Stop condition |
|---|---|---|
| 1 — Backend | `child_suggestions` table + RLS + notify trigger (migration); `useChildSuggestions` + `usePendingSuggestions` hooks; i18n (he+en). | typecheck ✓, i18n:check ✓, trigger smoke test ✓ |
| 2 — Child entry points | Shared `SuggestModal` + `SuggestionStatusList`; wire Gamer task+reward stubs; add to Mint task+reward screens. | typecheck ✓, i18n:check ✓ |
| 3 — Parent surface | `PendingSuggestions` on ParentTasks + ParentRewards; "Yes" (prefilled editor, `proposed_by_child=true`) + "Let's talk" (`discussing`); `child_suggestion` notification type. | typecheck ✓, jest ✓ (250), DB trigger end-to-end ✓ |
| 4 — Values + docs + PR | Values Check vs implemented behaviour; close IN-2026-05-29-01; session folder; STATUS/SPEC_SYNC; branch + PR. | docs committed, PR opened |
