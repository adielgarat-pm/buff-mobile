# V26 (v1.2.0, versionCode 28) — Hat-4 Checklist (Adi only)

Build: caf7aab7-4508-409b-b4e0-b47464f1654d · https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/caf7aab7-4508-409b-b4e0-b47464f1654d

- [ ] Download AAB from EAS, upload to Play Console internal track
- [ ] Promote to internal testers / verify install link
- [ ] CC1 — Google OAuth on the installed AAB (emulator unreliable)
- [ ] CC2 — push notification lands in system tray (FCM — still 0 tokens registered, project_fcm_hat4_pending)
- [ ] CC4 — Sentry capture + no PII in body
- [ ] F3.H2 — native date picker on real device
- [ ] Spot-check the 3 V26 features on a real touch device:
      - [ ] Parent: tap a task row → edit → save; tap → delete → confirm
      - [ ] Parent: send a sticker → child sees it on dashboard
      - [ ] Settings → View as Child shows real child data (not empty)
- [ ] After confirmed live on internal track: tell CC "verified, tag it" → CC proposes `git tag v26 <built-commit>`
