# Release v1.3.0 (versionCode 29)

## A. Technical (STATUS + Play Console internal notes)

- **versionCode** 29, **versionName** 1.3.0
- **Track:** internal
- **Anchor:** 1.2.0 (28), cut 2026-06-03
- **Branch / built-from commit:** `release/train-2026-06-05` @ `8309250`
- **EAS build:** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/4630e765-4849-4ba8-b786-f83fc1e590b4
- **Contents:**
  - #157 `62e31bd` — fix: parent notification bell RTL position (Hebrew)
  - #159 `878ea96` — feat: child-login pick-from-list on immutable profile id (migration 018: `list_family_children`, `link_child_profile`)
  - #161 `df0719b` — feat: parent notification "show-new" feed (unread-only, INFO recency, no auto-mark-read)
- **Schema:** migration 018 (applied to mobile project `gfrongfnyigxsexuofrg`; no prod users there)
- **Gates:** Gate 1 ✅ (tsc · jest 314/314 · expo-doctor 18/18 · i18n · Values Check) · Gate 2 partial (#157 ✅, #159 ✅ Hat-3, #161 ⏳ Hat-4) · Hat-4 pending

## B. User-facing (Hebrew) — ⚠️ DRAFT, needs Adi approval before any user-visible surface

> Per BUFF copy rule: outcomes & autonomy, not mechanics. No "BUFFs / tasks / count".
> There is no in-app "What's New" surface yet (FLAG F-2026-05-30-01) — staged for later.

- ההתחברות של הילד נשארת יציבה — גם כשעוברים למכשיר חדש, ההתקדמות שלו ממשיכה איתו.
- ההורה רואה במבט אחד מה חדש, בלי רעש של דברים שכבר ראה.

## C. Known-pending (rides to Hat-4)
- #159 child-login: real-device verification (emulator-only so far).
- #161 notif feed: never smoke-tested in a build — verify on device (unread shows; opening does NOT mark read).
