# Release v1.1.0 (versionCode 24) — Manifest

**Cut date:** 2026-05-30
**Anchor:** vc19 (`f10ef98`, last build promoted to internal track 2026-05-29)
**Interim:** vc21 (`d84ed83`, built today, already consumed on Play — reason for re-cut)
**Branch:** pkg/release-v22 (off origin/main `74d1403`)
**versionName:** 1.1.0 (unchanged) · **versionCode:** 24 (EAS remote auto-increment; attempts 22 & 23 errored, see Notes)
**Track:** internal

## What's in this release (since vc19)

| # | Commit | Type | Feature / Bug | Flow Suite | Targeted test |
|---|---|---|---|---|---|
| 1 | f76f6a2 | feat | dashboard-insight-declutter — parent dashboard insight area | F-parent-dashboard | happy + edge |
| 2 | e7da908 | feat | money-conversion-reward — BUFFs→cash, parent-confirmed, any age | F-rewards | happy + edge |
| 3 | 755100b | feat | per-child-language — explicit per-child language + parent control | F-childsettings / F-i18n | happy + edge |
| 4 | 16d3871 | feat | child-suggest — child proposes tasks/rewards, parent deal-making | F-child-suggest | happy + edge |
| 5 | 53ab1cb | feat | onboarding-starter-tasks — age-aware starter tasks | F-onboarding | happy + edge |
| 6 | 65f4511 / e2e18ed | feat | school-free-day-parity — Israel weekend + Friday toggle | F-tasks | happy + edge |
| 7 | 6aea662 | fix | child-dashboard-refresh — refetch tasks/balance on focus | F-child-dashboard | re-test |
| 8 | b257574 | fix | bell-rtl-overlap — parent notification bell RTL-aware | F-parent-notify | re-test |
| 9 | 3f1efd4 | fix | mint-gamer-parity — retire cached 'egg' evolution_stage | F-pet | re-test |
| 10 | 21952ba | fix | gamer-parent-polish — status glyph + view-as-child real name | F-parent-tasks | re-test |
| 11 | 8dca8cc | fix | onboarding idempotent save + return to Tasks | F-onboarding | re-test |
| 12 | 5128106 | fix | hq-tasks-tappable — mark tasks from Gamer HQ | F-gamer-tasks | re-test |

## Schema changes in this release?
- [ ] none confirmed in diff (no `supabase/migrations` changes in `f10ef98..HEAD`) — verify during static gate.

## Notable risk / watch-items
- `package.json` changed (10 lines) + large `package-lock.json` churn (-1784) → expo-doctor must be clean (no regressed deps).
- `src/i18n/en.json` and `he.json` each -1 key → confirm i18n parity holds.
- Many child/parent screen files touched → critical-path smoke matters.

## Notes
- This is a re-cut of essentially vc21's code plus the latest UI fixes (#130–#134). vc21 was never the intended consumed artifact; v22 supersedes it.
- versionName stays 1.1.0 (app.json already 1.1.0); EAS owns versionCode → **24**.
- **Why 24 and not 22:** the first two EAS attempts (versionCode 22 = `9502948`, 23 = `9502948`) errored on a broken `react-test-renderer` dependency. Commit `22d7f24` pinned `react-test-renderer@19.1.0` to unblock the build; the finished AAB (versionCode **24**, commit `2516ed9`, finished 2026-05-31 02:00) carries that fix. Build id `fb1fae19-cb33-4b8a-97c6-d805ed1fd8c3`. The "v22" codename / folder / branch name is unchanged — only the EAS versionCode advanced.
