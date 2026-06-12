# Hat-4 Checklist — v1.4.3 (versionCode 41)

> Only-Adi items (real device / Play Console / OAuth / Sentry). Build:
> https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/0bbd6332-048a-4840-96a8-619d38799dc1

## Upload + promote
- [ ] Download AAB from EAS, upload to Play Console internal/Alpha track
- [ ] Promote to testers / verify install link
- [ ] ⚠️ **After 41 is promoted:** deploy the `push-notification-fanout` Edge Function (Phase-3b pref enforcement + #211 push path). Tell CC "deploy the notif edge fn" — bell rows already work; pushes stay silent until this.

## Delta verification (this is the Gate-2 that couldn't run on the shared emulator)
- [ ] **Banner safe-area fix (#215):** put a parent in `permission=denied` (deny the OS notif prompt, or revoke in system settings), open the app → the "notifications off → enable in settings" banner must sit **above** the Android nav bar; tap **"Enable in Settings"** (opens system settings) and **✕** (dismisses) — both must be reachable. *(This is the exact bug from the 1.4.1 screenshot.)*
- [ ] **#211 kid vibe-share:** view-as-child → Vibe Check, pick a **non-low** mood (≥3) → "share this feeling?" step appears → opt in → parent gets an **INFO bell row** (and a push once the Edge Function is deployed + "Alerts to me" on). Opt-out → nothing sent. Confirm the **draft copy** reads right (kid + push) — Adi/Itay gate.

## Standard real-device checks
- [ ] CC1 — Google OAuth on the installed AAB
- [ ] CC2 — push notification lands in system tray (FCM)
- [ ] CC4 — Sentry capture + no PII in body
- [ ] F3.H2 — native date picker
- [ ] App-launch + 2-3 real-touch screens

## After confirmed live
- [ ] Tell CC **"verified, tag it"** → CC proposes `git tag v41 <commit>` (anchor for the next release's Gate 0).
