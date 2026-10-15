# Launch-readiness QA — 2026-10-15 → weekend launch (Sat night / Sun)

Goal (Adi, 2026-10-15): full bug pass before a wide free launch.
Decisions: paywall STAYS; CC fixes P0s (PR per fix), reports P1/P2.
Resume rule: any session picks up from the checklist below. Test accounts = `adi.elgarat+qa1015{en,he,web}@gmail.com` (creds in CC scratchpad only), children `ZTest*`, family codes AUG39H / G9787N / VUEHQ7. Clean up at end (needs Adi OK).

## Done
- [x] Hat 1: tsc ✅ · jest 160/1292 ✅ · i18n/access/no-raw-alert ✅
- [x] Web smoke (mocked backend; auth+onboarding+join): **174/174** (m360/m390/desk × EN/HE)
- [x] Backend health (read-only): no P0; cron failures B-02/B-03
- [x] Screen inventory (~200 controls) — see BUGS.md for dead routes found
- [x] Android EN: email signup → onboarding (9-11, own phone) → dashboard → tasks add/edit/delete → rewards add → schedule paste-import → settings → paywall view → View-as-Child (Mint + Gamer) → child task complete → sign out → child join by typed code (wrong code, lowercase) → real child app
- [x] Android HE: signup → onboarding (12-14 teen, shared device) → resume after restart (duplicate guard OK, no duplicate rows) → View-as-Child teen Gamer → task complete → Stats
- [x] Web (localhost against prod backend): EN signup → onboarding (6-8, home computer) → join link with parent signed in (guard) → switch → pick name → child app
- [x] Fix PRs #511–#515 open, CI green; all five merged locally and verified on Android (comments on each PR)
- [ ] Web layout crawl of logged-in screens (agent running)
- [ ] Release APK on emulator — SKIPPED: installing it would replace the shared dev client (other sessions depend on it); preview build 2b73b4dd is available if Adi wants it on a phone
- [ ] Cleanup test data (waiting for Adi's OK — accounts may help her device checklist)
