# Hat-4 Checklist — v1.4.0 (versionCode 34)

Only-Adi items (real device / Play Console / OAuth / Sentry). The build itself is done.

## Upload
- [ ] Download AAB: https://expo.dev/artifacts/eas/m48Y8qGvb1xCHnaNssqu47.aab
- [ ] Upload to Play Console **internal** track (versionName 1.4.0, versionCode 34)
- [ ] Confirm no competing upload from a parallel session (versionCode 33 was consumed elsewhere — see MANIFEST watch-items)
- [ ] Promote to internal testers / verify install link

## Functional smoke on the installed AAB (Gate 2 deferred here)
- [ ] **Signup** (new parent) — completes; then confirm `families.platform` = 'android' for the new family (SQL: `select platform from families order by created_at desc limit 3;`) ← verifies the funnel field end-to-end
- [ ] CC1 — Google OAuth on the installed AAB (emulator unreliable)
- [ ] Child entry (F1) — pick-from-list, duplicate-name guard dialog + Cancel returns to parent app
- [ ] Own-device child edit (F-editchild #189) — parent edits an own-device kid's name/avatar; saves
- [ ] Rewards / BUFFs balance (#185) — complete + approve; balance correct (no lost update)
- [ ] Task day-filtering (#182) — child HQ vs Quests show same day's tasks
- [ ] View-as-Child shows the child's real name on mint dashboard (#191)

## Hat-4-only platform checks
- [ ] CC2 — push notification lands in system tray (FCM — see `project_fcm_hat4_pending`)
- [ ] CC4 — Sentry capture + no PII in body
- [ ] F3.H2 — native date picker on real device
- [ ] App-launch + 2-3 real-touch screens

## After confirmed live
- [ ] Tell CC "verified, tag it" → CC proposes `git tag v34 c9eb5fa`
