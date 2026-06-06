# Hat-4 checklist — v1.3.0 (versionCode 29)

Only Adi can do these (real device / Play Console / OAuth / Sentry).

## Distribution
- [ ] Download AAB from EAS build `4630e765-4849-4ba8-b786-f83fc1e590b4` once it finishes
- [ ] Upload to Play Console **internal** track
- [ ] Promote to internal testers / verify the install link works
- [ ] Confirm Play Console shows **versionCode 29 / versionName 1.3.0**

## Functional on the installed AAB
- [ ] **#159 child-login (F1)** — child entry resolves by pick-from-list; on a *second* device the same child keeps progress, NO duplicate account
- [ ] **#161 notif feed (F8)** — parent bell shows only unread/new; **opening the feed does NOT mark items read**; explicit clear works
- [ ] **#157 RTL** — parent notification bell sits clear of the screen title in Hebrew
- [ ] CC1 — Google OAuth sign-in works on the installed build (emulator unreliable)
- [ ] CC2 — push notification lands in system tray (FCM — see `project_fcm_hat4_pending`)
- [ ] CC4 — Sentry captures a test event, no PII in body
- [ ] App-launch + 2-3 real-touch screens; capture store screenshots (versionName bumped → may want fresh shots)

## After confirmed live
- [ ] Tell CC **"verified, tag it"** → CC proposes `git tag v29 8309250` and drains the queue rows to Shipped
