# `pkg/per-child-language` — Acceptance Criteria Matrix

Hat-3 emulator run: 2026-05-30, `emulator-5554`, worktree bundle on Metro :8097 (confirmed loading `pkg/per-child-language` code — 2041 modules). Device language = English (parent device), account = Adi (children Itay/Emi/Leia).

| # | AC | SPEC anchor | Hat | Verdict | Evidence |
|---|---|---|---|---|---|
| 1 | App boots on the branch bundle | — | 3 | ✅ | Metro :8097 "Bundled index.ts (2041 modules)"; parent Dashboard rendered (s01) |
| 2 | EditChild shows a LANGUAGE section (עברית / English + note) | §7.3 | 3 | ✅ | s07 — pills + neutral note render |
| 3 | Toggle seeds from resolved language (English for Latin-named Itay, no stored value) | §3, §7.3 | 3 | ✅ | s07 — English pill pre-selected (purple) for "Itay" |
| 4 | Tapping עברית flips the selection | §7.3 | 3 | ✅ | s09 — עברית selected (purple), English deselected |
| 5 | Note copy is neutral (Pillar 2) | §6.4, §9 | 3 | ✅ | "Sets the language your child sees… Existing task names stay in their original language." |
| 6 | Save persists `pro_settings.language` to the DB | §7.3 | 3 | ✅ | A save landed on Emi → `pro_settings.language='en'` (seeded Latin default), `updated_at=2026-05-30`, confirmed via Supabase MCP; reverted to null afterward |
| 7 | Onboarding writes task lang + `pro_settings.language` for he-named & en-named child | §7.1, §7.2 | 3 | ⏭️ | Not run — Hebrew name entry via `adb input text` is unreliable + onboarding modal churn; covered by unit tests (`resolveChildLang`, UStep5 path) |
| 8 | View-as-Child switches strings to the child's language, no restart; exit restores | §7.5, OQ-1/OQ-4 | 3 | ⚠️ | Blocked — could not reach a he-resolved child preview reliably (see churn note) |
| 9 | ChildSettings language row hidden in child mode | §7.6, OQ-2a | 3 | ⚠️ | Blocked on emulator (couldn't reach child preview reliably); **covered by unit test** `ChildSettingsScreen.test.tsx` "hides the language row for a child viewer" |
| — | Hat-1 statics | §11 | 1 | ✅ | tsc clean · jest 271/271 · i18n:check clean · check:i18n-access clean |

## Environment note (not a feature bug)

The parent **Dashboard refetch churn** logged `'[Dashboard] profiles rows'` ~2×/second continuously and repeatedly **popped the EditChild screen / reset the Settings scroll** mid-interaction, defeating several parent-flow navigation and save attempts. This matches the 2026-05-29 flakiness recorded in the SPEC §11 and IN-2026-05-29 family. It is pre-existing (unrelated to this package) but made AC-8/AC-9 unreproducible in this session. A separate look at the Dashboard refetch loop may be warranted.

## Cleanup

No residual test data: all save attempts that landed wrote to existing children only; the single persisted change (Emi → `en`) was reverted to `null`. No ZTest profiles created. Itay/Emi/Leia all back to `pro_settings.language = null` (the deliberate not-backfilled state).

## Hat-4 (Adi, real device)

- RTL restart on a child's OWN ChildJoin device (persistent child session) — emulator can't exercise this.
- AC-8 (View-as-Child cross-direction strings-only switch) and AC-9 (child-mode picker hidden) — worth a real-device confirm given the emulator churn blocked them here, though AC-9 is unit-covered.
