# Hat-4 Checklist — v1.4.4 (versionCode 42)

> Only-Adi items (real device / Play Console / OAuth / Sentry). Build:
> https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/0e62b1b4-03eb-4615-9728-24e5659d74f6

## Upload + promote
- [ ] Download AAB from EAS, upload to Play Console internal/Alpha track
- [ ] Promote to testers / verify install link
- [ ] **Build 41 (1.4.3) is superseded** — if it was never promoted, skip it entirely; 42 carries everything it had
- [ ] ⚠️ **After 42 is promoted:** deploy the `push-notification-fanout` Edge Function (inherited gate from 39/40/41). Tell CC "deploy the notif edge fn" — bell rows already work; pushes stay silent until this.

## Delta spot-checks on real device (emulator already verified all three — these are confirmation only)
- [ ] **#221 safe-area top:** open the notification bell feed — "Mark all as read" sits clear of the clock/cutout and taps. Glance at one onboarding screen + paywall top bar.
- [ ] **#220 rewards focus:** approve a redemption from your phone while the child screen is open on the rewards tab → switch tab and back on the child device → balance + badge update.
- [ ] **#219:** nothing to do — silent; the Tester Board platform column fills as testers open 42.

## Inherited from 41 (never Hat-4'd — still open)
- [ ] **#215 banner safe-area:** parent with notifications denied → banner sits above nav bar; "Enable in Settings" + ✕ both tappable
- [ ] **#211 kid vibe-share:** non-low Vibe Check (≥3) → share step → opt-in → parent INFO bell row; **copy is DRAFT — Adi/Itay wording gate**

## Standard real-device checks
- [ ] CC1 — Google OAuth on the installed AAB
- [ ] CC2 — push notification lands in system tray (FCM)
- [ ] CC4 — Sentry capture + no PII in body
- [ ] F3.H2 — native date picker
- [ ] App-launch + 2-3 real-touch screens

## After confirmed live
- [ ] Tell CC **"verified, tag it"** → CC proposes `git tag v42 892c564` (anchor for the next release's Gate 0)
