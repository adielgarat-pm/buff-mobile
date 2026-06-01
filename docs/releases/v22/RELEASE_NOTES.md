# Release v1.1.0 (versionCode 24)

## A. Technical (for STATUS + Play Console internal notes)

- **versionCode** 24 · **versionName** 1.1.0 (unchanged from vc21)
- **EAS build:** `fb1fae19-cb33-4b8a-97c6-d805ed1fd8c3` (finished 2026-05-31 02:00) · commit `2516ed9` · attempts 22 & 23 errored on a broken `react-test-renderer` dep, pinned in `22d7f24`; 24 is the clean post-fix build
- **Built from:** pkg/release-v22 @ origin/main `74d1403`
- **Anchor:** vc19 (`f10ef98`, last on internal track) · supersedes interim vc21 (`d84ed83`, consumed)
- **Gate 1 (static):** tsc ✅ · i18n parity ✅ · jest 271/271 in isolation (2 flaky 5s timeouts under parallel load; files unchanged since vc21) · expo-doctor 18/18 ✅
- **Gate 2 (functional):** deferred to Hat-4 real-device smoke (Adi, 2026-05-30) — emulator occupied by another session
- **Schema:** no migrations in `f10ef98..HEAD`
- **Backend env:** production profile → Supabase `gfrongfnyigxsexuofrg` (mobile project, holds Leia demo family)

## What's new since vc19 (testers' last build)

- **feat** dashboard-insight-declutter — cleaner parent dashboard
- **feat** money-conversion-reward — parent-confirmed BUFFs→cash, any age *(most Values-sensitive; vetted in its own package)*
- **feat** per-child-language — explicit per-child language with parent control
- **feat** child-suggest — child proposes tasks/rewards, parent deal-making (Yes / Let's talk)
- **feat** onboarding-starter-tasks — age-aware starter tasks
- **feat** school-free-day-parity — Israel weekend + Friday-is-a-school-day toggle
- **fix** child-dashboard-refresh, bell-rtl-overlap, mint-gamer-parity, gamer-parent-polish, onboarding idempotent save, hq-tasks-tappable

## Values Check (Gate 1)

Each `feat` shipped through its own package, which carries a Values Check at design + exit per the workflow. At release cut, no implemented-behavior violation of the three pillars (Intrinsic Motivation · Positive Coaching · Independence-Building) was observed. **money-conversion-reward** is the most Values-sensitive (extrinsic cash reward) and was vetted in its package. **Verdict: PASS (inherited).**

## B. User-facing (Hebrew — staged, NOT yet shipped)

<!-- WHY/WHAT not HOW. No BUFFs/70%/BUDDY/mechanics. Adi approves before ship.
     No in-app "What's New" surface exists yet (FLAG F-2026-05-30-01). -->

- ילד יכול עכשיו להציע בעצמו מה יעזור לו — והורה נכנס לשיחה, לא להכתבה.
- כל ילד, בשפה שלו.
- התחלה רכה יותר: משימות פתיחה שמתאימות לגיל ולקצב.

*(Staged for a future in-app update surface; not ship-approved.)*
