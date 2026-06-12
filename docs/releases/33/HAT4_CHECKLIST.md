# Hat-4 checklist — v1.3.1 (versionCode 33)

Only Adi can do these (real device / Play Console / accounts).

## Build pickup + promote
- [ ] Download the AAB from EAS build `3db38189` once it finishes
- [ ] **Confirm in Play Console which versionCode is currently live** (29/30/31/32?) before uploading — we landed on 33 (32 was already consumed; you asked for 32)
- [ ] Upload 33 to the internal track, promote to testers, verify the install link

## Real-device verification (couldn't be done on emulator)
- [ ] CC1 — Google OAuth sign-in on the installed AAB
- [ ] CC2 — push notification lands in the system tray (FCM)
- [ ] CC4 — Sentry capture + no PII in the event body
- [ ] #179 co-parent — a real 2nd Google account joins your family via the code (Settings → Join Family), two devices
- [ ] #189 own-device child — edit that child's name/language in Edit Child → Save → confirm it persists on the child's device (the RLS path verified live + via unit test; needs a real own-device child end-to-end)
- [ ] #170 + #157/#173 RTL — switch app to Hebrew (cold relaunch for RTL): cash reward shows ₪; notification bell sits clear of the title/Add button
- [ ] F3.H2 — native date picker (Edit Child birthday) on a real device

## Post-ship notifications
- [ ] **Tamar** — co-parent join (#179) is live: partner signs in with Google → Settings → "Join Family" → family code. (Draft ready in RELEASE_QUEUE.md.)

## After confirmed live
- [ ] Tell CC "verified, tag it" → CC proposes `git tag v33 <commit>` as the anchor for the next train.
