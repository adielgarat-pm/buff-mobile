# V22 — Hat-4 checklist (only Adi can do these)

**Build:** v1.1.0 / versionCode 22 · cut 2026-05-30 · branch pkg/release-v22 @ `74d1403`

## 1. Get v22 onto a track + your phone
- [ ] When the EAS build finishes, download the `.aab` (CC can also pre-download it for you, like it did for vc21)
- [ ] Play Console → BUFF → **Test and release → Testing → Internal testing → Create new release**
- [ ] Upload the v22 `.aab` → Review → **Start rollout to Internal testing**
- [ ] On your phone: open the [Internal Testing link](https://play.google.com/apps/internaltest/4701243578877467187) → **Update** → confirm **About this app shows 1.1.0 (22)**

## 2. Functional smoke (Gate 2, on the real device — replaces the emulator run)
Quick happy-path tap-through; report any ❌ to CC before relying on the build:
- [ ] Sign in (Google OAuth) — lands on Parent Dashboard, greeting "Good morning, Adi" (English)
- [ ] Tasks → Leia → tasks load (no permission error / spinner-stuck)
- [ ] Manage children → 3 cards, no email/PII visible
- [ ] Enter Leia child session → dashboard + buddy render; Vibe Check appears
- [ ] Child Rewards load; switch theme Mint↔Gamer works (no blank tab bar)
- [ ] No red LogBox / dev toggle / RevenueCat error toast on the Play build

## 3. Capture the v21 Play Store screenshots (the reason for this build)
With v22 installed + clean, follow [SHOT_LIST.md](../../marketing-screenshots/v21/SHOT_LIST.md):
- [ ] Pre-flight ticked (English UI + English demo data, DND on, no dev artifacts)
- [ ] Capture 7 shots (groups A/B/C); child shots from **real Leia ChildJoin**, not View-as-Child
- [ ] Send CC the folder path → CC renders EN+HE finals automatically

## 4. Other Hat-4-only (carryover, not blocking screenshots)
- [ ] CC2 — push notification lands in tray (FCM, see project_fcm_hat4_pending)
- [ ] CC4 — Sentry capture + no PII in body
- [ ] F3.H2 — native date picker on real device

## 5. After v22 is confirmed live on internal
- [ ] Tell CC **"verified, tag it"** → CC proposes `git tag v1.1.0-22 74d1403` (anchor for the next release's Gate 0)
- [ ] (Later) promote internal → **Open Testing** once the store listing + screenshots are complete
