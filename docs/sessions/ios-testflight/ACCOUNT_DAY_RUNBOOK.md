# ACCOUNT DAY RUNBOOK — Apple Developer account approved → TestFlight

> Execute top-to-bottom the day Apple approves the developer account.
> Everything code-side is already merged; this is configuration + build + upload only.
> **No Mac is needed at any step** — EAS cloud builders compile and sign on macOS workers,
> and `eas submit` uploads from Windows. Companion doc: `APP_STORE_CONNECT_METADATA.md`
> (all listing copy + privacy answers, ready to paste).

**Estimated total time:** ~1–2 hours active + ~30 min EAS build wait + (external testing only) ~1 day Apple Beta Review.

---

## Already DONE before account day (state as of 2026-06-12)

| Item | Where |
|------|-------|
| Account deletion (Guideline 5.1.1(v)) | `delete_my_account` RPC live in DB + Settings Danger-Zone row |
| Sign in with Apple code (Guideline 4.8) | `AppleSignInButton` on Login/Signup (iOS-only), `signInWithApple` in AuthContext, `usesAppleSignIn` entitlement in app.json |
| Payments fully hidden on iOS (3.1.1) | `Platform.OS === 'ios'` guards in purchaseService + useSubscription; grace-period entitlement |
| Alpha-free iOS icon | `assets/BUFF_LOGO-IOS.png` (1024×1024, no transparency) wired to `ios.icon` |
| Export compliance | `ITSAppUsesNonExemptEncryption: false` in app.json (no per-upload prompt) |
| Privacy policy | https://adielgarat-pm.github.io/buff-docs/legal/privacy-policy.html — verified 2026-06-12: loads, covers iOS/App Store + account deletion. (Optional polish: add one line naming "Sign in with Apple"; lives in buff-docs repo.) |
| Listing copy, categories, age rating, privacy-label answers | `APP_STORE_CONNECT_METADATA.md` |
| Tester list template | `IPHONE_TESTERS.md` (collect Apple-ID emails meanwhile) |

---

## Step 1 — Supabase: enable the Apple auth provider (~3 min, CC or Adi)

Native Sign in with Apple needs only the bundle ID on the Supabase side (no secret key —
that's only for web OAuth flow):

1. Supabase Dashboard → project `gfrongfnyigxsexuofrg` → **Authentication → Sign In / Up → Apple**.
2. Toggle **Enable Sign in with Apple** ON.
3. In **Authorized Client IDs** enter: `com.buff.mobile`
4. Save. (Leave Secret Key empty — not needed for the native `signInWithIdToken` flow.)

## Step 2 — First iOS build (~10 min interactive + ~20-30 min build)

From the repo root (main, after the iOS PR is merged):

```powershell
npx eas build --platform ios --profile production
```

Interactive prompts — answer:
- **"Log in to your Apple Developer account?"** → Yes → Adi's Apple ID + password + 2FA.
- **"Register bundle identifier com.buff.mobile?"** → Yes (EAS registers it on the Apple account).
- **"Generate a new Apple Distribution Certificate?"** → Yes (EAS stores it in its cloud keychain).
- **"Generate a new Apple Provisioning Profile?"** → Yes.
- **Push key (APNs)** → Yes, let EAS create/manage it (needed for expo-notifications later; free to set up now).
- Sign in with Apple capability is synced automatically from `usesAppleSignIn` in app.json.

Build runs in EAS cloud. Watch at https://expo.dev/accounts/<account>/projects/buff-mobile/builds.

> If the Apple account is an **Organization** enrollment and Adi's Apple ID has limited
> role, the EAS login needs an Apple ID with **Admin** role (or App Manager + certs perm).

## Step 3 — App Store Connect: create the app record (~15 min)

https://appstoreconnect.apple.com → My Apps → **+ → New App**:
- Platform iOS, Name `BUFF — ADHD Routine Coach`, Language English (US),
  Bundle ID `com.buff.mobile` (appears after Step 2 registered it), SKU `buff-mobile-ios`.
- Fill listing + App Privacy + age rating straight from `APP_STORE_CONNECT_METADATA.md` §2–§4.
- Note the **Apple ID of the app** (numeric, App Information page) — needed in Step 4.

## Step 4 — Upload the build (~5 min + processing)

Option A (recommended) — let EAS prompt for everything:
```powershell
npx eas submit --platform ios --latest
```
- Log in with the same Apple ID; EAS offers to create an **App Store Connect API key**
  automatically — say Yes (stored for future submits, no more 2FA per upload).

Option B — pin it in `eas.json` afterwards for repeatability:
```json
"submit": { "production": { "ios": { "ascAppId": "<numeric app id from Step 3>" } } }
```

Processing in App Store Connect takes ~5–15 min after upload; the build then appears under
**TestFlight**.

## Step 5 — TestFlight distribution (~10 min)

1. TestFlight tab → the processed build.
2. **Internal testing** (instant, NO Apple review): create group "BUFF internal", add up to
   100 App Store Connect users (Adi's + family Apple IDs). Build is installable in minutes
   via the TestFlight app.
3. **External testing** (public link, needs one-time Beta App Review ~1 day): create group,
   paste Beta App Description + "What to Test" from `APP_STORE_CONNECT_METADATA.md` §5,
   attach demo parent account (create a throwaway first), submit for review.
4. Send testers from `IPHONE_TESTERS.md` the install instructions (announcement draft ready
   in `docs/announcements/ios-testflight-launch.md`).

## Step 6 — Real-iPhone verification checklist (Hat 4, Adi or a tester)

- [ ] App installs from TestFlight, launches, splash + login render.
- [ ] **Sign in with Apple** button appears on Login + Signup; full flow works (first time
      shows name/email sheet; sign-out → sign-in again works).
- [ ] Google sign-in still works on iOS.
- [ ] Email/password sign-in works.
- [ ] No paywall / premium CTA anywhere (grace-period entitlement active).
- [ ] Settings → Danger Zone → Delete account: confirm dialog appears (CANCEL — don't delete
      a real family; full deletion was verified on Android/DB).
- [ ] Hebrew ↔ English switch renders correctly (RTL).
- [ ] Safe areas OK on notch devices; no layout clipping.
- [ ] Sentry: check a test event arrives from iOS (dashboard → buffadhd/react-native).

## Step 7 — Bookkeeping (CC)

- [ ] Record build links + versions in `docs/releases/` per release-process convention.
- [ ] Update `IPHONE_TESTERS.md` with actual invitees.
- [ ] Append learnings to `docs/INTEGRATION_LEARNINGS.md` (first iOS build surprises).
- [ ] Fill `submit.production.ios.ascAppId` in `eas.json` (commit).

---

## Troubleshooting quick refs

- **Build fails on credentials:** `npx eas credentials -p ios` → inspect/regenerate.
- **"Apple sign-in failed" with token error:** Supabase Authorized Client IDs must contain
  exactly `com.buff.mobile` (Step 1).
- **Upload rejected — icon transparency:** shouldn't happen (`BUFF_LOGO-IOS.png` is 24-bit);
  if Apple complains, re-flatten any other icon asset the same way.
- **versionCode/buildNumber collisions:** `appVersionSource: remote` + `autoIncrement: true`
  handle iOS buildNumber automatically — don't hand-edit.
