# Hat-4 checklist — 1.4.1 (versionCode 38)

Only-Adi items (real device / Play Console / OAuth / Sentry). Build: `a1798c89`.

## Pickup + promote
- [ ] Download AAB from EAS build `a1798c89` → upload to Play Console (internal, then Alpha)
- [ ] Verify Play shows **1.4.1 (38)**
- [ ] Promote to Alpha closed-testing / confirm tester install link

## Targeted device checks (this release is date-sensitive — worth a real pass)
- [ ] **#198 Pause** — set Pause "Just today" at e.g. 14:00 → confirm resume is **next calendar midnight**, not +24h. Child empty-state shows a clean "back on <date>".
- [ ] **#199 Off-Routine Day** — set a child to Off-Routine today → child sees the light anchor bank, app still active, still earns. 
- [ ] **#201 Off-Routine "3 days"** — confirm it ends at end of the 3rd calendar day (today+2), not mid-day.
- [ ] **Pause vs Off-Routine** — with a child off-routine, set Pause → Pause supersedes.
- [ ] **#194** — confirm the "Dev Simulate Subscribed" toggle is gone from parent settings.

## Standard real-device gate
- [ ] App launches; tap through 2–3 core screens (parent dashboard, a child view, Settings)
- [ ] CC1 — Google OAuth on the installed AAB
- [ ] CC4 — Sentry capture works, no PII in body

## After confirmed live
- [ ] Tell CC **"verified, tag it"** → CC tags `v38` on commit `722c9d4` (anchor for the next release)
