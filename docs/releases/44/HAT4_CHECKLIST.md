# Release v1.6.0 (versionCode 44) — Hat-4 Checklist (Adi only)

Only things CC cannot do on the emulator. Build is queued via EAS (background) — CC tracks it; pickup is yours.

## Ship
- [ ] Download the AAB from the EAS build page (link recorded in MANIFEST once finished)
- [ ] Upload to Play Console (internal / Alpha track), versionCode **44**, versionName **1.6.0**
- [ ] ⚠️ **After promotion only:** deploy the `push-notification-fanout` Edge Function (kid reminders default off — do NOT deploy before the build is live)
- [ ] Promote to testers / verify the install link

## Device-only verification (couldn't run on emulator)
- [ ] **CC1** — Google OAuth sign-in on the installed AAB
- [ ] **CC2** — push notification lands in the system tray (FCM)
- [ ] **CC4** — Sentry captures a test event, no PII in body
- [ ] **F3.H2** — native date picker (onboarding birthday) on a real device
- [ ] **#209** — reward-redemption discovery: child redeems an affordable reward → parent notification tap lands on Rewards tab with the right child auto-selected → approve button reachable (couldn't exercise on emulator — Maya had < cheapest reward cost)
- [ ] **#216** — Off-Routine banner/card render in the **interface** language inside View-as-Child (set Maya off-routine in an English preview → banner should be English, not device-Hebrew). jest-guarded but runtime worth a glance.
- [ ] **#239** — medication-reminder anchor on a real device (smart-default sheet → tasks created)
- [ ] App-launch + 2-3 real-touch screens; take fresh store screenshots (versionName bumped 1.4.x → 1.6.0)

## Post-promotion
- [ ] **Tamar** — co-parent join (PR #179, shipped in build 34 already) — no action unless re-confirming
- [ ] After confirmed live on the track: tell CC **"verified, tag it"** → CC proposes `git tag v44 dcadf69`
