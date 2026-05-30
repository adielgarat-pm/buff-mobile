# Session F — `pkg/per-child-language` (Phase 1)

> Open a fresh CC session and paste the block below.
> **Full design + locked decisions:** `docs/sessions/per-child-language/SPEC.md` (read it first).
> **Base branch:** branch from `pkg/onboarding-starter-tasks` (PR #120 — F extends its language
> work and touches the same UStep5 onboarding code). If #120 merges to main first, rebase onto main.
> `pkg/settings-language` is already in main (LanguageContext exists) — build on it, don't rebuild.

```
Package: pkg/per-child-language (Phase 1). Start in Plan Mode.
Branch from pkg/onboarding-starter-tasks (you EXTEND PR #120's language work; same UStep5 code).

Read FIRST, in full: docs/sessions/per-child-language/SPEC.md (decisions are LOCKED in §10),
and IN-2026-05-29-04. Central constraint (§2, §6.1): LanguageContext is DEVICE-level and a
he↔en flip changes RTL layout which the native engine only reads at startup — so it restarts
the app. A single device cannot show RTL + LTR at once. Design around this.

Build (Phase 1 only — §7):
1. Add pro_settings.language ('he'|'en') per child (JSON field, no migration). Add helper
   resolveChildLang(child) = pro_settings.language ?? detectLangFromName(display_name) ?? deviceLang.
   Unit-test it.
2. Onboarding (UStep5): write pro_settings.language at profile insert (default via
   detectLangFromName(childName)) and bake task titles from resolveChildLang — i.e. source the
   task language from the stored field, not inline i18n.language. (This evolves PR #120's line.)
3. EditChild screen: one language toggle (עברית / English) writing pro_settings.language.
   Include a one-line note: changing it flips the UI + future tasks; existing task names keep
   their original language (Phase-1 limitation, §6.4). Copy must be neutral (Pillar 2).
4. Child's OWN device (role==='child'): LanguageContext hydrates from resolveChildLang(profile),
   overriding the AsyncStorage default; one-time restart if RTL direction differs (§6.2). Do NOT
   break the existing parent/device hydration path.
5. View-as-Child (ModeContext enterChildPreview/exitChildPreview): switch i18n strings to the
   previewed child's language on enter (strings-only, NO forceRTL, NO restart per LOCKED OQ-1),
   restore device language on exit with no flicker (OQ-4 — must verify).
6. Child mode: hide/disable the ChildSettings language picker (LOCKED OQ-2 — parent owns it).
7. Backfill existing children: set pro_settings.language by inferring from each child's existing
   task-title language; default 'he' if undetectable (LOCKED OQ-3). Via Supabase MCP (mobile DB
   gfrongfnyigxsexuofrg, no prod users) — show Adi before/after before writing.

Out of scope: Phase 2 bilingual tasks (separate pkg/bilingual-tasks); changing device-level
settings UX (that's pkg/settings-language, already merged).

WARNING — this touches core contexts (LanguageContext, ModeContext) that affect the whole app.
Be surgical; run the existing LanguageContext/ModeContext/EditChild/ChildSettings tests; add tests.
Values Check before finalizing. Verify: tsc + jest + i18n:check + i18n-access. Emulator onboarding
E2E was flaky on 2026-05-29 (dashboard refetch churn) — budget for it / get exclusive emulator.
Hat-4 for Adi: the RTL restart on a real child's own device (ChildJoin) — emulator can't fully test it.
Branch + PR, no direct main commits.
```
