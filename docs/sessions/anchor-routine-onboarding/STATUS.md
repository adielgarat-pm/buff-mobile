# STATUS — anchor-routine-onboarding

| State | Date | Commit | Tests | Notes |
|---|---|---|---|---|
| SPEC draft | 2026-10-20 | — | — | REVIEW.md cut it down to an MVP of M1–M3 |
| MVP approved | 2026-10-21 | — | — | Adi: "Approved, proceed with the MVP. Start with M1" |
| M1 merged (migration 065 applied to prod) | 2026-10-21 | #520 / `e67ed7a` | Trigger tested in a rolled-back transaction (link → 1 kid_joined event, relink → still 1) · RPC returns 14 weeks of data under an admin JWT · admin-web `npm run build` green | Recipient deviates from REVIEW ("every parent"): the bell is family-wide, so it stays one row with the best parent. See IN-2026-10-21-01. Visual check of the admin tab needs Adi (magic-link login). |
| M2 merged: onboarding seeds one routine | 2026-10-21 | #521 / `5becbe4` | routines.test.ts (every age × gender × challenge → 4–5 steps, one moment, in order, correct spacing) · tsc clean · web-smoke green | OTA auto (gated on CI). Not clicked through on a device: signup would create a prod family. Hat-4: one onboarding on Android + one on web. |
| M3 in PR: editing in the preview | 2026-10-21 | see PR | routineEdit.test.ts + moment override · 511 onboarding/lib tests · tsc · i18n guards | Edits the rows UStep5 already saved (by id + assigned_to): title, ±15 min, remove (min 4), switch moment (insert new, then delete old). Copy is a draft, waiting on Adi + humanizer. Hat-4: Android soft keyboard over the lower cards. |

**Values Check (M1, against what was implemented):** measurement and notification routing only. No change to anything the child sees or to copy. Pillar 1/2/3: no impact. ✅

**Values Check (M2+M3):** titles from the vetted library or written by the parent; no new mechanics for the child; "successful day" stays ~3. Pillar 3: the parent shapes one routine for the kid to own. ✅

**Platform parity (M1):** server-side (trigger/RPC) + admin-web only. No change to the mobile app on either platform, so there's nothing to verify on Android/Web and no OTA.
