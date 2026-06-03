# V26 (1.2.0) — Hat-4 Checklist (Adi, real device)

Build: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/b86ccd1b-20b2-420a-b2c5-6c1d47c69dbd

## Ship
- [ ] Download AAB from EAS when the build finishes
- [ ] Upload to Play Console **internal** track
- [ ] Confirm versionCode **26** / versionName **1.2.0** shows in Play Console
- [ ] Verify the internal-test install link updates

## Verify on a real device (the new sticker feature — Shani's bug)
- [ ] **Parent:** dashboard → child card → "Send Sticker" → pick a sticker (+ optional note) → "Sticker sent!"
- [ ] **Child:** open the child's view → the sticker reveal appears (emoji + message) → tap to dismiss → does not reappear
- [ ] **Pastel (Mint) theme** reveal specifically (E2E only covered Gamer) — switch a child to Mint and confirm the reveal renders
- [ ] **Custom note** text shows on the child reveal (E2E used the default message)
- [ ] Tell Shani it's fixed; ideally have her re-try sending to Mattan on the new build

## Standing real-device items
- [ ] CC1 — Google OAuth on the installed AAB
- [ ] CC2 — push notification lands in the system tray (FCM — `project_fcm_hat4_pending`)
- [ ] CC4 — Sentry capture + no PII in body

## After confirmed live
- [ ] Tell CC "verified, tag it" → CC proposes `git tag v26 <build commit>`
