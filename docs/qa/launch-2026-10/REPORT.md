# Launch readiness — go/no-go (2026-10-15)

## Verdict: **GO for Sat night / Sun**, once these two things are done

1. **Merge the 5 fix PRs** (all CI green; all five verified together on the Android emulator):
   - #511 day-0 false "struggling" insight on the dashboard (P0, Pillar 2)
   - #512 Android keyboard hid the reward title (+ child suggest, timetable sheets)
   - #513 Mint child screens: name/titles/progress text near-invisible
   - #514 "Add my own" did nothing on a kid's own login
   - #515 teen My Stats always showed 0 tasks
   Delivery: JS-only → **web** on deploy, **Android via OTA** (CI publishes on merge; store vc76 runtime = OTA runtime, confirmed). No store build needed.
2. **Adi's 15-minute device check** (`ADI_DEVICE_CHECKLIST.md`) — item 1 (child invite link on a phone with BUFF installed / Play signing SHA-256 in assetlinks.json) is the one real unknown for "child link works smoothly".

## What was tested
- Static: typecheck, 1,292 unit tests, i18n/alert lint — green.
- Web auth/onboarding/child-join matrix (mocked backend): 174/174 (360/390/desktop × EN/HE).
- Web logged-in layout crawl, real backend: 160 states × automated overflow/clip/error checks + visual review → no overflow, no console/HTTP errors; 7 polish issues (W-01…W-07).
- Android emulator, real backend, 3 fresh families:
  - EN parent → onboarding (9-11, own phone) → every parent tab, add/edit/delete task, add reward, schedule paste-import, settings rows, paywall, View-as-Child (Mint + Gamer), task completion → sign-out → child join by code (wrong code + lowercase) → real child app.
  - HE parent → onboarding (12-14 teen, shared device) → kill & resume mid-onboarding (no duplicate rows) → teen Gamer view, task completion, Stats.
  - Web EN parent → onboarding (6-8, home computer) → join link opened with parent signed in (guard) → switch → pick name → child app.
- Backend (read-only): auth, edge functions, cron, migrations, funnel counts.

## Open, not blocking launch (details in BUGS.md)
- **B-02 / B-03 (P1, backend):** two pg_cron jobs fail every run — `scan_disengaged_users_daily` (since Aug 1: no disengaged nudges) and `refresh-basic-insights-friday` (never ran). Both are 1-line SQL function fixes but are DB changes → need Adi's OK.
- **B-06 (P1):** tapping a push notification only opens the app (no deep link).
- **B-08 / B-30 (activation):** invite-a-child card sits below the fold on a new parent's dashboard; join link still needs "Continue" + name pick (2 taps).
- **B-20:** App Links verification for Play-installed apps — see checklist item 1.
- Hebrew-web RTL polish (W-01, W-03), wide-screen sheets (W-02), small tap targets (W-04), copy nits (B-24, B-28, B-29), mixed-language edge cases (B-23, B-25, B-31).
- Not tested here: Google sign-in, real push delivery, real purchases, iOS, release APK on the emulator (would have replaced the shared dev client).

## Test data to clean up (after Adi's device check)
3 families: AUG39H, G9787N, VUEHQ7 — parents `adi.elgarat+qa1015{en,he,web}@gmail.com`, children ZTestMia / ZTestNoa / ZTestLeo.
