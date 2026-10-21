# STATUS — anchor-routine-onboarding

| State | Date | Commit | Tests | Notes |
|---|---|---|---|---|
| SPEC draft | 2026-10-20 | — | — | REVIEW.md cut it down to an MVP of M1–M3 |
| MVP approved | 2026-10-21 | — | — | Adi: "Approved, proceed with the MVP. Start with M1" |
| M1 done (migration 065 applied to prod) | 2026-10-21 | see PR | Trigger tested in a rolled-back transaction (link → 1 kid_joined event, relink → still 1) · RPC returns 14 weeks of data under an admin JWT · admin-web `npm run build` green | Recipient deviates from REVIEW ("every parent"): the bell is family-wide, so it stays one row with the best parent. See IN-2026-10-21-01. Visual check of the admin tab needs Adi (magic-link login). |
| M2 / M3 | — | — | — | Next: routine-shaped generator + editing in the preview (JS, OTA) |

**Values Check (M1, against what was implemented):** measurement and notification routing only. No change to anything the child sees or to copy. Pillar 1/2/3: no impact. ✅

**Platform parity:** server-side (trigger/RPC) + admin-web only. No change to the mobile app on either platform, so there's nothing to verify on Android/Web and no OTA.
