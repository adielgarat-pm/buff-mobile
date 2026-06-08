# Release v1.3.1 (versionCode 33) — Manifest

**Cut date:** 2026-06-08
**Anchor:** 1.2.0 (28) internal track (queue baseline). EAS codes 29/30/31/32 were prior build attempts not promoted as the live release.
**Branch:** release/train-2026-06-08 (off `origin/main` @ `77bc2b9`)
**Track:** internal
**versionName:** `1.3.1` (set in app.json @ `d61fa6d`) — per Adi 2026-06-08
**versionCode:** **33** (EAS remote auto-increment; counter was at 32 → bumped to 33. Adi asked for 32 but 32 was already consumed remotely, so 33 is the next free code.)
**EAS build:** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/3db38189-0c82-43d7-a425-f0812f6884c4 (queued 2026-06-08)

> Source of truth: `docs/RELEASE_QUEUE.md` Queued rows (13, all merged to main), drained into this manifest at cut.

## What's in this release — 13 items (4 feat / 9 fix)

| # | PR | Type | Change | Flow Suite | Gate-2 verdict |
|---|---|---|---|---|---|
| 1 | #159 | feat | Child login by pick-from-list keyed on immutable profile id — no dup accounts / lost progress on a new device (migration 018) | F1 | ✅ Hat-3 verified in-package (2026-06-05) |
| 2 | #161 | feat | Parent notification "show-new" feed, INFO-recency order, no auto-mark-read on open | F8 | ✅ Hat-3 this cut: feed renders grouped; open did NOT auto-mark-read (badge stayed "2 unread") |
| 3 | #165 | feat | Kids redeem rewards with parent approval; BUFFs deducted atomically on approval | Rewards/Redemption | ✅ Hat-3 verified in-package |
| 4 | #179 | feat | Second parent joins family via code in Settings; premium family-wide (migration 020) | Auth + Settings | ⏳ Hat-4 (real 2nd Google account) |
| 5 | #157 | fix | Notification bell clear of the title in Hebrew (RTL position) | F18 | ✅ verified at merge; RTL ⏳ Hat-4 |
| 6 | #170 | fix | Cash-reward currency follows language: Hebrew → ₪ | Rewards/cash modal | ⏳ Hat-4 (needs Hebrew locale) |
| 7 | #173 | fix | Notification bell inline header element + compact "+" — no overlap on Tasks/Rewards/Timetable | F18 | ✅ Hat-3 this cut (EN, inline, badge, no overlap); RTL ⏳ Hat-4 |
| 8 | #174 | fix | English parent claiming a child sees the link-child sheet in English (6 strings) | F18 | ✅ verified in-package |
| 9 | #177 | fix | Own-device kids' BUFFs persist — surface credit_vault write errors (server RLS already live) | Rewards/balance | ✅ server-side live; code guard in build |
| 10 | #178 | fix | Sticker/Bonus sheet doesn't scatter when the note field is focused (KAV padding) | Parent sheets | ✅ Hat-3 verified in-package |
| 11 | #181 | fix | Duplicate-child guard dialog + fixed delete_child_profile (migration 021) | F1 / Add-child | ✅ Hat-3 verified in-package |
| 12 | #189 | fix | Parents can edit own-device kids (RLS migration 022); EditChild errors on 0-row save; child menu shows real buddy from pet_state | EditChild / child menu | ✅ Hat-3 this cut: menu profile shows real skin (puppy, not 🐉), grid theme-filtered. Own-device edit-save ⏳ Hat-4; RLS verified live |
| 13 | #191 | fix | View-as-Child mint dashboard shows child's name, not "Preview" | P-08 | ✅ Hat-3 this cut: mint header = "Hey, Itay", not "Preview" |

## Schema changes (all already applied to mobile project gfrongfnyigxsexuofrg — no prod users, F-2026-05-20-01)
- migration 018 — list_family_children + link_child_profile (#159)
- migration 020 — switch_user_family (#179)
- migration 021 — duplicate_child_guard + delete_child_profile fix (#181); 021_credit_vault_atomic_adjust
- migration 022 — parents_update_owndevice_children RLS (#189)
- RLS — "Children can manage own vault" (#177)
- The build carries only the **client** side of these.

## Static gate (Gate 1) — 2026-06-08
| Check | Result |
|---|---|
| tsc --noEmit | ✅ 0 errors |
| jest | ✅ 347/348 — the 1 fail (`stubParser › image input`) is a pre-existing main failure (IN-2026-06-07-01), parentCapture untouched by this train. NOT a regression |
| expo-doctor | ✅ 18/18 |
| i18n parity (en↔he) | ✅ 0 missing either side |
| Values Check (4 feats) | ✅ all pass, no "no" |

## Functional gate (Gate 2) — 2026-06-08, emulator-5554, release JS
- ✅ App boot + parent dashboard; tasks render
- ✅ #191 mint View-as-Child header = child name (not "Preview")
- ✅ #189 child menu shows real skin (puppy, not hardcoded 🐉) + theme-filtered skin grid
- ✅ #161 notification feed renders grouped; open does NOT auto-mark-read
- ✅ #173/#157 bell inline (EN), no overlap; mint↔gamer theme switch keeps tab bar intact
- No ❌ / no beta-blocker → build cleared.

## Notable risk / watch-items
- **versionCode drift:** EAS landed on 33, not the requested 32 (32 consumed). Confirm in Play Console which prior code is live before promoting 33.
- **Hat-4 outstanding:** #179 co-parent (2nd Google acct), #170 + RTL bell (Hebrew locale), #189 own-device edit-save on a real own-device child, Google OAuth / push / Sentry.
