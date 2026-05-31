# AC Matrix — `pkg/onboarding-starter-tasks` (PR #120)

> **Hat-3 verification: 2026-05-30 (CC, autonomous).** Decisive end-to-end test on Android emulator
> via the empty-state re-entry flow on profile `ZTestDup529` (id `ae0ae575-62d9-45c1-a7a2-f46062a482fc`,
> Latin name, age group `12-14`, motivator `gaming`, challenge `time_management`).
> Profile + tasks deleted after verification (clean Supabase state — see Cleanup row).

| # | Acceptance Criterion | SPEC anchor | Hat | Verdict | Evidence |
|---|---|---|---|---|---|
| 1.1 | `timeOfDay` field added to `StarterTask` interface | onboardingData.ts §types | 1 | ✅ | tsc + jest green (commit 53ab1cb) |
| 1.2 | UStep5 maps `timeOfDay` → clock time, replaces positional `TASK_TIMES[index]` | UStep5_Preview.tsx :197 / :214 | 1 + 3 | ✅ | DB rows for ZTestDup529 show 08:00 / 16:00 / 20:00 matching task `timeOfDay` (morning/afternoon/evening), not positional indices. |
| 2.1 | `STARTER_TASKS_BY_CHALLENGE` rebuilt from STARTER_TASK_TABLE.md (age-appropriate) | onboardingData.ts §STARTER_TASKS_BY_CHALLENGE | 1 + 3 | ✅ | ZTestDup529 (12-14, `time_management`) received the exact three tasks from the table: `Write today's 3 priorities` · `25-min timer for a task` · `Plan tomorrow tonight`. |
| 2.2 | All 22 challenge keys preserved (no regression) | grep keys in `STARTER_TASKS_BY_CHALLENGE` | 1 | ✅ | tsc green; manual key audit at write time. |
| 3.1 | `detectLangFromName(name)` exported from `i18nString.ts`; Hebrew range / Latin / fallback | i18nString.ts | 1 | ✅ | 7/7 unit tests pass (`i18nString.test.ts`). |
| 3.2 | Task INSERT language sourced from `detectLangFromName(params.childName)`, not `i18n.language` | UStep5_Preview.tsx :191 | 3 | ✅ | ZTestDup529 → Latin name → 3 task titles inserted in **English** (matches `detectLangFromName('ZTestDup529') === 'en'`). |
| 3.3 | Rewards remain bilingual via `bilingualForDb` (unchanged) | UStep5_Preview.tsx :244 | 1 | ✅ | No diff on rewards path; rewards table schema unchanged. |
| 4.1 | "Make your own breakfast" removed (except `life_independence` 15-18) | onboardingData.ts | 1 | ✅ | Manual audit + STARTER_TASK_TABLE §7. |
| 4.2 | "Pack bag per timetable" present for ages 6+ in `organisation` + `independence` | onboardingData.ts | 1 | ✅ | Manual audit + STARTER_TASK_TABLE §3/§7. |
| R.1 | Empty-state re-entry flow renders correctly (UStep2_Goal with `existingChildId`) | ParentTasksScreen.tsx :56 → UStep5 | 3 | ✅ | Drove the flow end-to-end: ParentTasksScreen empty-state CTA → UStep2 (`existingChildId` threaded, age 12-14 goals shown) → UStep3 → UStep4 → UStep5 ("ZTestDup529's plan is ready!"). |
| R.2 | App boots clean on `pkg/onboarding-starter-tasks` branch, no JS crashes from #120 | App boot | 3 | ✅ | Dashboard renders 3 children; only non-#120 errors observed (RevenueCat billing on emulator — environmental, see Findings). |
| C.1 | Test data cleanup | post-test | — | ✅ | `DELETE FROM tasks / store_rewards / profiles WHERE … ZTestDup529 id`. Verified after: tasks=0, rewards=0, profile=0. |

## Hat-4 (real device, still pending — Adi)

- **Hebrew-name onboarding** (e.g. typing `איתי` / `אמי`) — adb input is unreliable for Hebrew; emulator path stops here. Verify a Hebrew-named child gets Hebrew titles (`detectLangFromName` Hebrew branch).
- **RTL layout** on a real device (Hebrew interface), including child's-own-device session.

## Findings worth recording (CC, during the test session)

1. **RevenueCat dev LogBox storm** — on emulator (no Play billing), `[RevenueCat]` errors fire on a timer and re-pop the dev LogBox over the running flow. **This is the same root cause of the earlier "Dashboard refetch churn" symptom**: the LogBox re-rendering dismisses any modal. Mitigated for this test with a *temporary* `LogBox.ignoreAllLogs()` in `App.tsx` (loaded via explicit DevLauncher → `10.0.2.2:8090` reconnect). **Reverted before any commit** — `App.tsx` is back to baseline in the worktree.
2. **Git-Bash + `adb shell` `/sdcard/` path mangling** — `MSYS` was converting `/sdcard/...` to a Windows path, silently breaking `uiautomator dump` / `adb pull`. Workaround: leading `//sdcard/...` in remote args. This explains intermittent stale-dump symptoms throughout the day. Consider adding this to a testing-tooling note.
3. **Dump-then-verify** (vs. blind tap chains) is the only reliable adb driving pattern; a stray `keyevent 4` when the keyboard isn't up dismisses modals or exits the app — confirmed via reproduction.
