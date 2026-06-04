# V26 → versionCode 27 (1.2.0) — Hat-4 Checklist (only Adi can do)

> ⚠️ Built as **versionCode 27** (EAS remote had already consumed 26). versionName 1.2.0.

> Hat 4 = real device / Play Console / OAuth / Sentry — things the emulator + CC can't reliably do.
> Gate 2 (emulator functional) was NOT completed this cut due to 19-session machine contention,
> so the functional verification below is more important than usual — it's the primary functional gate for V26.

## Build pickup
- [ ] Download the AAB from the EAS build page (build URL in RELEASE_NOTES.md §A)
- [ ] Confirm the EAS build page shows **versionCode 26** and **versionName 1.2.0**
- [ ] Upload to Play Console **internal** track
- [ ] Promote to internal testers / verify the install link

## Functional verification on the installed V26 build (carries Gate 2)
- [ ] **#147/#148 — child sees rewards shop, NO "LOCKED ZONE":** open as a child (or View-as-Child) whose parent is premium → Shop tab shows the rewards, not the gift-box lock
- [ ] **#148 — Buddy/Skins unlocked** for a child of a premium parent (not gated)
- [ ] **#149 — stickers:** parent taps "שליחת מדבקה", picks a sticker, sends to a child → child sees the IncomingStickerModal with affirmation copy
- [ ] **#151 — view-as-child from Settings** shows the child's real data (not empty screens)
- [ ] **#151 — credit exploit:** toggling a task done↔undone repeatedly does NOT inflate the BUFF balance
- [ ] **#146 — FCM:** push notification lands in the system tray (real device only — 0 tokens registered historically, see project_fcm_hat4_pending)

## Standard Hat-4
- [ ] CC1 — Google OAuth sign-in on the installed AAB (emulator unreliable)
- [ ] CC4 — Sentry capture works + no PII in event body
- [ ] App-launch + 2-3 real-touch screens feel right
- [ ] versionName bumped (1.1.1→1.2.0) → refresh store screenshots if the listing shows them

## After confirmed live on internal track
- [ ] Tell CC **"verified, tag it"** → CC proposes `git tag v26 <build commit>` (anchor for V27's Gate 0)
