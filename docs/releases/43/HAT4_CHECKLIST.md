# Hat-4 Checklist — v1.5.0 (versionCode 43)

Only Adi can do these (real device / Play Console / billing / OAuth). CC built + tracked the AAB; pickup + upload is yours.

## Upload
- [ ] Download the AAB from the EAS build page (link in MANIFEST.md once the build finishes)
- [ ] Confirm the EAS build page shows **versionCode 43**, versionName **1.5.0**
- [ ] Upload to Play Console → **internal / Alpha** track
- [ ] Verify install link / promote to testers

## After promotion — deploy the gated Edge Function
- [ ] Deploy `push-notification-fanout` Edge Function (carried from 39/41/42 notes — kid reminders default off; deploy only once this build is live)

## Real-device verification (the deep flows the emulator couldn't drive)
The emulator returns an empty uiautomator tree + a dev-only RevenueCat LogBox, so these need your real touch:
- [ ] **#226 account deletion** — Settings → Danger Zone → Delete account. Sole parent → deletes family; co-parent/child → deletes self only. (Destructive — use a throwaway account, not your real family.)
- [ ] **#226 remove child** — Manage Children → remove one child of N; on the last child, the family-delete offer appears
- [ ] **#227 View-as-Child must NOT consume a sticker** — enter View-as-Child for an own-device kid who has a pending sticker, exit; confirm the sticker is still there (not consumed)
- [ ] **#228 equipment backpack** — parent sets equipment on a timetable lesson → child's packing tab shows it
- [ ] **#229 activities + seasonal lists** — parent adds an activity; child proposes one (Children mode) / adds directly (Teen); apply a seasonal packing template
- [ ] **#225 i18n** — flip language EN↔HE on a couple of swept screens; confirm no stray wrong-language copy
- [ ] **F5 child dashboard** — open a child's view (Mint + Gamer); tasks/rewards render
- [ ] CC1 — Google OAuth on the installed AAB (emulator unreliable)
- [ ] CC2 — push notification lands in the system tray (after Edge Function deployed)
- [ ] CC4 — Sentry capture works + no PII in the event body
- [ ] F3.H2 — native date picker on a real device

## After confirmed live
- [ ] Tell CC **"verified, tag it"** → CC proposes `git tag v43 <build commit>` and drains the queue rows to Shipped
- [ ] **Tamar** — message her that co-parent join (#179) is live (it rode the un-promoted 31/34 stack and is in this build): partner signs in with Google → Settings → Join Family → family code
