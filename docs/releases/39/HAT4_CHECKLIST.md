# Hat-4 checklist — 1.4.1 (versionCode 39)

Only-Adi items (real device / Play Console / OAuth). Build: `37f1c9ee`.

## Pickup + promote
- [ ] Download AAB from EAS build `37f1c9ee` → upload to Play Console (internal → Alpha)
- [ ] Verify Play shows **1.4.1 (39)**
- [ ] Promote to Alpha closed-testing / confirm tester install link

## Coordinated server step (tell CC when promoted)
- [ ] After 39 is promoted: tell CC **"deploy the edge function"** → CC deploys `push-notification-fanout` (Phase 3b enforcement). Do NOT deploy before promotion (kid reminders default off).

## Notifications (the new feature — real-device only; emulator/web can't test FCM)
- [ ] Settings → **Notifications**: screen renders, two toggles ("Alerts to me" / "Reminders for my child")
- [ ] Toggle each → reopen the screen → state persisted (writes to `app_settings`)
- [ ] Permission status row reflects the real OS state
- [ ] **Deny** the OS prompt (or pre-deny in system settings) → relaunch → **denial-recovery banner** appears → "Turn on in Settings" deep-links to the system settings page
- [ ] Grant permission → a real push (e.g. a child_suggestion) lands in the tray (first device token registers)

## Date-sensitive checks (this build)
- [ ] **#198 Pause** — "Just today" at ~14:00 → resume is next calendar midnight (not +24h)
- [ ] **#199/#201 Off-Routine** — set off-routine → light anchor bank; "3 days" ends end-of-3rd-day; Pause supersedes off-routine
- [ ] **#194** — Dev-Simulate-Subscribed toggle gone from parent settings

## Standard
- [ ] App launches; tap through parent dashboard, a child view, Settings
- [ ] CC1 — Google OAuth on the installed AAB

## After confirmed live
- [ ] Tell CC **"verified, tag it"** → CC tags `v39` on the build commit + moves the queue rows to Shipped.
