# Launch-readiness QA — 2026-10-15 → weekend launch

Goal (Adi, 2026-10-15): full bug pass before a wide free launch Sat night/Sun.
Decisions: paywall STAYS; CC fixes P0s (PR per fix), reports P1/P2; launch Sat night/Sun.
Resume rule: any session picks up from the checklist below. Test accounts = `adi.elgarat+qa1015*` (creds in CC scratchpad only), child names `ZTest*`. Clean up at end.

## Done
- [x] Hat 1: tsc ✅ · jest 160 suites / 1292 tests ✅ · i18n/access/no-raw-alert ✅
- [x] Web smoke (mocked backend, auth+onboarding+join): **174/174** across m360/m390/desk × EN/HE
- [x] Backend health (read-only): no P0; see BUGS.md B-01..B-04
- [x] Screen inventory → SCREENS.md
- [x] Android EN parent signup (email) → Welcome → Steps 1–6 → access=own phone → Complete (family code AUG39H)

## In progress / next
- [ ] Android parent app: every tab + modal (SCREENS.md §4)
- [ ] Child join on Android via link + code; child app all tabs (Mint + Gamer, junior + teen)
- [ ] View-as-Child on shared device
- [ ] Hebrew/RTL pass on Android
- [ ] Web against real backend (local web dev): parent + child, 360/390/desktop
- [ ] Release-like APK (EAS preview build 2b73b4dd) — install + smoke + https join link
- [ ] Fix P0s → PRs
- [ ] Cleanup test data
- [ ] Go/no-go report + Adi device checklist
