# Beta Polish — 4 Parallel Package Prompts

> Created 2026-05-28. Backup of the 4 kickoff prompts launched as parallel background agents.
> If an agent fails or you want to re-run in a fresh CC session, copy the relevant block.
> All 4 are independent, each on its own branch off main, each opens a PR.

---

## 1. pkg/settings-language

In-app language switcher (he/en) in Parent + Child settings. Infra already exists (LanguagePicker.tsx + LanguageContext.setLanguage with AsyncStorage + RTL restart). Add a "Language" row to ParentSettingsScreen + ChildSettingsScreen, reuse the modal, add i18n keys settings.rowLanguage. Decision (locked): BOTH parent + child settings.

## 2. pkg/vibe-check-battery

Teen Gamer mode Vibe Check should show a recharging-battery selector instead of energy bars. Young Mint mode already shows smileys (VibeFaces.tsx) — keep. Create VibeBattery.tsx, swap VibeBars→VibeBattery in VibeCheckScreen GamerCheckContent. Keep theme-based split ('mint'/'gamer'). Battery must NOT imply "empty=failure" — body-doubling voice.

## 3. pkg/empty-state-onboarding

Parent's empty task state (ParentTasksScreen ~L72-76) gets a CTA "Set up tasks for {child}" → onboarding challenge-selection step for the EXISTING child (route param existingChildId so UStep5 attaches tasks to that child_id, NOT a duplicate profile). Land on mainChallenge step. Watch the known duplicate-profile bug.

## 4. pkg/color-consolidation

Fix light↔dark↔light journey. Light = default everywhere (parent, onboarding, auth, young kid). Dark = teen Gamer only. Create src/theme/palette.ts + modes.ts (BUFF_BRAND §7). Migrate auth screens dark→light. ALSO fix ParentDashboardScreen ~L350 hardcoded-Hebrew "join family" banner → t(). Decision: ChildJoin light. Full plan: docs/sessions/color-consolidation/COLOR_PLAN.md.

---

**Note:** Supabase MCP = mobile project + Lovable DATA copy (283 profiles). Migrations here do NOT touch real Lovable users (separate project). Verified 2026-05-28.
