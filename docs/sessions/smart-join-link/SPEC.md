# SPEC — pkg/smart-join-link

**Owner:** Adi (PM) · **Implementer:** CC · **Created:** 2026-06-29
**Branch:** `pkg/smart-join-link` (off `origin/main` @ c1050b8)

## Problem (anchored in data)

The biggest funnel leak is **engaged → first completion**. As of 2026-06-29, of 17 real
(non-test) cohort families, **8 sit in NOT STARTED** — child profile + tasks exist, but
**zero `daily_progress` rows ever** (the child-task screen was never reached). The 3
genuinely-old cases (אמא 21d, Jonathan D 23d, judith Galili 28d) opened once and never
returned. Root cause in the connect flow:

1. The child invite used a `buff://join/CODE` **custom-scheme deep link** that (a) only
   works if the app is already installed, (b) renders as **non-tappable plain text** in most
   messaging apps (WhatsApp), (c) does nothing on web.
2. The **dashboard invite card** shared **no link at all** — only the 6-char code, forcing
   manual entry (one wrong char ⇒ "code not found").
3. No device-awareness: an iOS/desktop/web recipient had no working path.

## Goal

One **smart HTTPS link** — `https://buffadhd.com/join/CODE` — that detects the recipient's
device and routes automatically, with the family code surviving install so the child never
types it.

### Device routing table

| Device | App installed? | Behavior |
|---|---|---|
| Android | yes | **Android App Link** opens the app directly → `ChildJoin` (code pre-filled). No web page. |
| Android | no | Landing `/join/:code` detects Android → Play Store with `&referrer=join_CODE`; code shown as visible fallback |
| iOS (app not yet released) | — | Landing detects iOS → Web PWA join `https://www.buffadhd.com/join/CODE` |
| Desktop / other | — | Landing → Web PWA join `https://www.buffadhd.com/join/CODE` |

After an Android install-from-referrer, first app launch reads the Play **Install Referrer**,
parses `join_CODE`, and routes to `ChildJoin` pre-filled — **zero manual code entry on any path**
(Adi decision 2026-06-29).

## Domain map (existing)

- `buffadhd.com` → landing (Vercel project "buff-landing", root `landing-web/`, Vite SPA)
- `www.buffadhd.com` → the app (Expo Web PWA)
- App Link host = `buffadhd.com` ⇒ `assetlinks.json` lives in `landing-web/public/.well-known/`

## Chunks

**Chunk 1 — mobile app side (no new dependency)**
- `src/lib/buffConfig.ts`: add `JOIN_LINK_HOST` + `buildJoinUrl(code)` (https). Keep
  `buildJoinDeepLink` (buff:// still valid as an in-app fallback).
- `src/navigation/linking.ts`: add https prefixes so `/join/:code` resolves to `ChildJoin`
  on **native App Links** (`https://buffadhd.com`) and **web PWA** (`https://www.buffadhd.com`).
- `app.json`: Android `intentFilters` with `autoVerify` for host `buffadhd.com`, path `/join`.
- i18n (`en.json` + `he.json`): swap `onboarding.step7.inviteMessage` deep link → `{{joinUrl}}`;
  add `{{joinUrl}}` to `inviteCard.shareMessage`.
- `UStep7_Phone.tsx` + `ParentDashboardScreen.tsx`: pass `joinUrl`.

**Chunk 2 — web / landing (no new dependency)**
- `landing-web/public/.well-known/assetlinks.json` (SHA-256 from EAS — CC fetches).
- `landing-web` `/join/:code` route: UA detection + redirect per the table (Vercel rewrite
  + client redirect).
- Web PWA join already handled by Chunk-1 `linking.ts` prefix.

**Chunk 3 — Install Referrer (NEW DEPENDENCY, Adi-approved 2026-06-29)**
- Add `react-native-play-install-referrer` (+ config plugin / prebuild).
- On first launch: read referrer, parse `join_CODE`, route to `ChildJoin`. Best-effort,
  never blocks launch (IN-2026-06-17 native-import discipline — lazy/post-init).

## Platform parity
Android (App Link + referrer) and Web (PWA `/join` route) both covered explicitly; iOS routes
to Web PWA until the iOS app ships.

## Values Check
- **Intrinsic motivation / autonomy:** removes a friction wall so the *child* can start at
  their own pace; no new pressure mechanic. ✅
- **Positive coaching:** invite copy keeps the body-double, no-pressure voice ("at your pace"). ✅
- **Independence:** one tap → the child reaches their own space without an adult re-typing codes. ✅
(Full 9-question check completed at exit against implemented behavior.)

## Out of scope
- Deferred deep link on iOS (no iOS app yet).
- Changing the ChildJoin two-step (code → pick name) itself.
- The duplicate-profile ChildJoin issue (IN-2026-05-14-03) — separate package.
