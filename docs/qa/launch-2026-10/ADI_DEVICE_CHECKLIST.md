# Adi — 15-minute real-device checklist (before posting)

Things CC cannot do from the emulator/browser. Do them on your own phone with the **Play Store** build, after the fix PRs are merged and the OTA has landed (CI publishes OTA on merge — reopen the app twice to pick it up).

1. **Child join link on a phone WITH BUFF installed (most important).**
   Open Play Console → *Grow users → Deep links* (or *Setup → App integrity → App signing*). Check `buffadhd.com` shows **verified**, and that the **App signing key SHA-256** matches the one in `https://buffadhd.com/.well-known/assetlinks.json` (starts `95:5A:BE:F9…`). If it doesn't match, the invite link opens the browser → Play Store "Open" → app WITHOUT the code (kid must type it). Fix = add the Play signing SHA-256 to assetlinks.json (landing-web, 1-line deploy).
   Then: send yourself a fresh invite link from the app on WhatsApp → tap it on a second phone with BUFF → should open BUFF straight to "Who's this?" / code pre-filled.
2. **Child join link on a phone WITHOUT BUFF** → should go to Play Store; after install + open, the code should be pre-filled.
3. **Google sign-in** (new Google account or a +alias): parent → onboarding → dashboard.
4. **Push**: allow notifications on first launch; have the kid complete a task → parent gets a push. Tap it (note: tapping currently just opens the app, it doesn't deep-link — known B-06).
5. **Paywall on the real device**: open "Get BUFF Coach" → yearly + monthly prices show in ILS/USD (emulator has no billing). Don't buy.
6. **Glance at icons** (tab bar, bell, gear) — on the emulator they vanished after a dev-server hiccup; should be fine on the store build.
