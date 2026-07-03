# SPEC — Web-to-Native install CTA (convert Android mobile-web signups to the Play Store app)

## 1. Problem & Goal (with the single success metric + guardrail)

### 1.1 Problem (established by data — not re-litigated here)
New signups have tilted web-majority (12 of ~20 recent real families). **Web does not retain**: web parents invest ~2.3h on day 1, then 0 of 12 returned after day 1. The native Android app retains on the *same codebase* (5/6 return, avg 21 engaged days, 4/6 activate). The delta is platform re-entry hooks — home-screen presence + FCM push. Web→native conversion is **0%** (0 of 13 web families ever produced an `fcm-android` token), even though the web audience is Android-mobile-majority (289 android-mobile vs 104 ios-mobile vs 84 desktop). The only install nudge today is `InstallNudge.web.tsx`, which (a) offers the *PWA*, not the retaining native app; (b) renders **only on the parent dashboard after onboarding**, so the ~58% who abandon onboarding never see it; and (c) leaves web with no working push (all 22 push tokens are `fcm-android`). Its Android eligibility is even gated on `getDeferredInstallPrompt() !== null` (`InstallNudge.web.tsx:99-121`), so it can fail to show at all.

### 1.2 Goal
Route **Android mobile-web** visitors to the **native Google Play app** (the surface that retains and has FCM), **early** in the web journey — at web entry *and* immediately after web signup, **before/independent of onboarding completion** — with full funnel measurement and seamless same-account data continuity. Keep the PWA "add to home screen" path as the fallback only where no native app exists (iOS today; desktop).

### 1.3 The ONE success metric
> **% of Android mobile-web signups that acquire an `fcm-android` device token AND produce ≥1 `daily_progress` row in week 1.**

Baseline ≈ 0%. CTA impression→click→install are *intermediate* funnel steps, not the goal.

**Denominator correction (folds critic P0-3 + P0-2).** `families.platform` (migration 021) is written **once, per-family, at creation** (`AuthContext.tsx:509`, `AuthCallbackScreen.tsx:41`) and stores only coarse `Platform.OS` (`'web'` — it *cannot* distinguish android-web from ios-web from desktop-web). Therefore:
- The **denominator** = families whose signup produced an `install_cta_events` row with `target ∈ {android-play, native-installed, android-inapp-webview}` **within the signup session** (the CTA telemetry `target`/`user_agent` is the *only* android-web signal in the data; `families.platform='web'` alone is insufficient and a co-parent joining an android-created family is invisible to it).
- The **numerator join must survive `switch_user_family`**, which `DELETE`s `push_subscriptions` for the old family (`migrations/020_switch_user_family.sql:91`). Join on a **token-ever-existed** signal, not current rows: either add an append-only `push_token_audit` insert (Phase 2, below) or, until that ships, **exclude switch-family families** from the funnel and label the metric "excludes co-parent-switch families." Do **not** join on live `push_subscriptions` rows alone — it undercounts.

### 1.4 Guardrail metrics (must NOT regress)
1. **Web onboarding completion rate** — the CTA converts early but must never gate, reorder, or block onboarding. **Testable guardrail:** CTA eligibility MUST NOT read `profile.pro_settings.onboarding_step`/`onboarding_complete` as a render gate (asserted in Hat 1 §6.1.3 and E2E §6.2).
2. **Web day-1 activation** for families who stay on web — CTA is additive; web must keep working for non-installers.
3. **Nag rate** — dismiss rate > 60% on any surface flags placement-as-annoyance.
4. **iOS / desktop web signup completion** — unchanged (they get PWA/QR paths, never a broken Play link).

---

## 2. Solution Overview

A **web-only, additive** CTA surface — `GetTheAppCta` — that:
- Classifies each web visitor into one `InstallTarget` via one web-split helper (`installTarget.web.ts`), reusing the UA predicates already in `useInstallPrompt.web.ts`.
- Renders an **early** "Get the app on Google Play" CTA at two new mount points — **web entry** (`RoleSelectionScreen`) and **immediately post-signup, before onboarding** (`WelcomeScreen` + `AuthCallbackScreen` role branch) — plus repoints the existing **dashboard nudge** slot to native on Android.
- Routes to the Play Store with an attribution referrer; **opens the app instead** when already installed (progressive enhancement via `getInstalledRelatedApps()` + Android App Links).
- Handles every visitor class explicitly: iOS → PWA add-to-home only (no Play CTA); desktop → QR-to-phone; in-app webviews (FB/IG/TikTok) → `intent://` breakout; already-standalone → hidden.
- Logs impression/click/dismiss/open to a **new** `install_cta_events` table (cloning the shipped `referral_clicks` + `track-referral-click` pattern — **not** the non-existent `pwa_events` table), feeding one admin funnel view that computes the success metric.
- Guarantees **data continuity**: native uses the same Supabase account; same-credential login resumes the existing family/children/tasks and in-progress onboarding at `pro_settings.onboarding_step`. Copy reassures "your setup is saved."

**Telemetry substrate decision (folds critic P0-1).** `pwa_events` **does not exist** in `migrations/` or `src/` (grep → zero hits; docs-only). The Product/QA drafts that referenced a `pwa_events` client writer with a `meta` JSONB column are **superseded**. All telemetry below targets the new typed-column `install_cta_events` table (§4.4).

Each of the three build phases (§4.9) is independently shippable and independently valuable: **Phase 1** alone moves the metric, **Phase 2** measures it, **Phase 3** sharpens open-if-installed + attribution.

---

## 3. Product & UX (per-visitor-class journeys + copy)

All copy is English-first behind i18next `t()` keys under `install.getApp.*` (Hebrew secondary). Detection is web-only; native bundles never import `installTarget.web`, so the whole surface is inert on native — parity preserved.

### 3.1 Visitor classification (decision table)

| Class | `InstallTarget` | Detection | CTA behavior |
|---|---|---|---|
| Android mobile, real browser (Chrome/Samsung) | `android-play` | `isAndroid && !isStandalone && !inAppWebView` | **"Get it on Google Play"** → `playStoreInstall` + referrer |
| Android, native app already installed | `native-installed` | `getInstalledRelatedApps()` returns `com.buffapp.mobile` | **"Open BUFF"** → Android App Link (opens app) |
| Android, FB/IG/TikTok in-app webview | `android-inapp-webview` | Android UA + `FBAN\|FBAV\|FB_IAB\|Instagram\|TikTok\|musical_ly\|BytedanceWebview\|Line\|Twitter` or `; wv)` | **"Open in Chrome to install"** → `intent://` breakout + copy-link fallback |
| iOS, real browser | `ios-pwa` | `isIos && !inAppWebView` | **No Play CTA.** Existing PWA add-to-home (`ios-safari`/`ios-other`) |
| iOS, in-app webview (FB/IG on iPhone) | `ios-inapp-webview` | `isIos && inAppWebView` | **"Open in Safari to add to Home Screen"** (add-to-home is impossible inside iOS webviews — see 3.4) |
| Desktop | `desktop` | `!isMobile` | QR code → `download.html`; never a dead Play button |
| Already standalone (installed PWA/native) | `standalone` | `matchMedia('(display-mode: standalone)').matches` | Hidden |

`standalone` short-circuits **before** all UA checks (mirrors `detectMode()` precedence, `useInstallPrompt.web.ts:50-55`). iOS is **never** `android-play`/`native-installed` regardless of any other signal.

### 3.2 Android mobile-web (Chrome) — the primary target

**Post-signup card (the hero moment — highest intent, fires *before* the ~58% onboarding drop-off):**
- Title: **"Get the BUFF app — your setup is saved"**
- Body: **"Install BUFF from Google Play for reminders that actually reach your kid, and pick up exactly where you left off. Same login, same family — nothing to redo."**
- Primary: **"Get it on Google Play"** · Secondary link: **"Keep going in the browser"** (proceeds to onboarding; never blocks).

**Entry banner (lighter touch, on `RoleSelection`):**
- Text: **"BUFF works best as an app — reminders, offline, one tap from your home screen."**
- Button: **"Get the app"** · Dismiss: **×**

On tap: open `BUFF_URLS.playStoreInstall` (`buffConfig.ts:8-12`) with referrer (§4.3); log a `click` event.

### 3.3 Android in-app webview (from FB/IG/TikTok ad)
`beforeinstallprompt` never fires here and Play links may be swallowed:
- Primary: an Android **`intent://` breakout** to the Play Store app (the *correct* string is in §4.3 — `package=com.android.vending`, **not** `com.buffapp.mobile`).
- Fallback: **"Tap ⋯ then 'Open in Chrome' to install"** + a copy-link button (copies `playStoreInstall`).
- Copy: **"Open BUFF in Google Play — your account is saved."** Logs `target='android-inapp-webview'` so we can size this leaky segment.

### 3.4 iOS
- `ios-pwa` (real browser): **no Play CTA.** Keep the existing `InstallNudge` add-to-home (`ios-safari` 3-step Share→Add card; `ios-other` "Open in Safari…"). `GetTheAppCta` renders nothing.
- `ios-inapp-webview` (folds critic P1-7): inside FB/IG on iPhone, **add-to-home is impossible** (only Safari can). Show **"Open in Safari to add BUFF to your Home Screen"** — the iOS parallel of the Android "Open in Chrome" case. Never show the dead "Add to Home Screen" 3-step card inside an iOS webview.

### 3.5 Desktop
No mobile app installs on this device. Render a **QR code → `buffadhd.com/download.html`** (the existing static Play/iOS chooser page) so the user hops to their phone; if space-constrained, render nothing. Never a Play button that no-ops on desktop. **Attribution caveat (folds critic P2-12):** a QR scanned on a *different* phone is a fresh session with no anonymous-id/referrer bridge → desktop→phone installs are **not attributable** and are excluded from the CTA conversion denominator. (Desktop ≈ 84 of the audience; acceptable.)

### 3.6 Native already installed
`getInstalledRelatedApps()` returns `com.buffapp.mobile` → **"Open BUFF"** via Android App Link (§4.2), not the store. **Hard dependency (folds critic P1-5):** this class is **dead until `assetlinks.json` + `related_applications` ship** — without them `getInstalledRelatedApps()` returns `[]` even when installed, so v1 falls back to the store (Play shows "Open" — acceptable, no dead-end), and the "open at same screen" promise is a Phase-3 capability, not a v1 guarantee.

### 3.7 Timing, placement & suppression (guardrail-critical)
- **SHOW** — entry banner: first load of `RoleSelection` for eligible classes, once/session, dismissible. Post-signup card: **once ever per account**, on `WelcomeScreen`/`AuthCallbackScreen` **before** any `UStep`.
- **SUPPRESS (hard rules)** — never on any `UStepN` onboarding screen; never on native, own-device children, or separate-device parents; switch to "Open BUFF" when already installed; never a Play button on iOS/desktop.
- **`Login` screen (folds critic P1-8):** **v1 = NO CTA on `Login`.** Returning-user login is out of scope for v1 to avoid nagging every web re-entry; revisit as fast-follow (Open Decision D6).
- **Dismiss/cooldown** — see the unified cooldown rule in §4.5 (folds critic P2-9). A11y: ≥44pt tap targets, `accessibilityRole="button"`, labeled dismiss (the current PWA `×` at `InstallNudge.web.tsx:45` has only `hitSlop`, **no label** — the new CTA MUST add `accessibilityLabel`), `useSafeAreaInsets()` bottom padding, `prefers-reduced-motion` respected.

---

## 4. Architecture & Implementation

> All file/line anchors verified against the working tree on `pkg/referral-share-and-tracking`.

### 4.1 Detection helper — one module, web-split

New `src/lib/installTarget.ts` (native stub) + `src/lib/installTarget.web.ts` (real impl), following the established split convention (`setupPwa.web.ts`, `crossAlert.web.tsx`). **Single canonical module name = `installTarget` (folds critic P3-15** — resolves the arch/QA naming clash; there is no `getInstallTarget.native.ts`).

```ts
// src/lib/installTarget.ts  — native stub; CTA never renders on native
export type InstallTarget =
  | 'android-play' | 'native-installed' | 'android-inapp-webview'
  | 'ios-pwa' | 'ios-inapp-webview' | 'desktop' | 'standalone';

export interface InstallTargetInfo {
  target: InstallTarget;
  isMobile: boolean;
  isInAppWebView: boolean;
  resolveInstalledState: () => Promise<InstallTarget>; // async upgrade android-play → native-installed
}
export function classifyInstallTarget(): InstallTargetInfo; // native stub → { target: 'standalone', isMobile:false, ... }
```

`installTarget.web.ts` **imports** the UA predicates from `useInstallPrompt.web.ts` (export `isIos`, `isIosSafari`, `isAndroid`, `isStandalone` there; **delete** the duplicated inline copy at `InstallNudge.web.tsx:99-111`). It adds in-app-webview detection (§3.1 tokens) and `getInstalledRelatedApps()`.

`classifyInstallTarget()` returns synchronously (CTA renders immediately); `resolveInstalledState()` upgrades `android-play → native-installed` asynchronously — never a render gate. **`getInstalledRelatedApps()` support gaps (spec explicitly):** Chrome/Android ≥80 only; needs HTTPS + `related_applications` in the manifest (§4.6); returns `[]` on iOS/desktop/Firefox/all webviews; any throw/empty → treat as not-installed and fall through to `android-play`. (Correction folded from critic P1-5: the arch draft's claim of "try/catch tolerance in `InstallNudge.web.tsx:103-109`" is **false** — that block calls `getDeferredInstallPrompt()`, unrelated; no `getInstalledRelatedApps` exists in `src/` today.)

### 4.2 Open-if-installed (App Link)
- `native-installed` → CTA opens an **HTTPS App Link** (`https://buffadhd.com/app`) the installed app claims; if unclaimed, the browser just loads the URL (graceful). New capability (`linking.ts:22-24` registers only `buff://`):
  - Add `https://buffadhd.com` (+ `www`) to `linking.ts` prefixes.
  - Add `expo.android.intentFilters` with `autoVerify: true` for `buffadhd.com` in `app.json`.
  - Publish `/.well-known/assetlinks.json` (Play signing-cert SHA-256 + `com.buffapp.mobile`) at the apex. **Hosting + signing fingerprint = Adi/Play-Console task (Open Decision D2).**
- **Fallback:** without verified App Links, route to the store (which shows "Open" if installed). Open-if-installed is a progressive enhancement, never a gate.

### 4.3 Store routing + attribution
- Play URL = `${BUFF_URLS.playStoreInstall}&referrer=${encodeURIComponent(payload)}`, `payload = utm_source=web_cta&utm_medium=<placement>&cta_id=<uuid>`.
- **Referrer hardening (folds critic P3-14, from QA):** `cta_id` MUST be a validated UUID; the builder MUST guarantee output `startsWith('https://play.google.com/store/apps/details?id=com.buffapp.mobile')`; reject/sanitize any non-UUID or scheme-bearing id; never interpolate untrusted query params into the store URL.
- **`intent://` breakout (folds critic P3-13 — QA's string was buggy).** Canonical, tested string (the intent `package` is the **Play Store**, not our app):
  `intent://play.google.com/store/apps/details?id=com.buffapp.mobile#Intent;scheme=https;package=com.android.vending;end`
- **Anonymous-id bridge (folds critic P1-6).** Entry-placement impressions fire **before** an account exists. Generate `cta_id` (uuid) once per session and persist it in `sessionStorage` under a **distinct key** (`buff_install_cta_id`) that must **not** collide with the existing referral capture in `sessionStorage` (`linking.ts:33-40`, `captureRefFromUrl`). At signup, stamp `cta_id` onto the family via the first authenticated `install_cta_events` row (`family_id` filled once known), joining anonymous entry impressions → eventual install.
- **Play Install Referrer read (native side, Phase 3, dep-gated):** Expo has no built-in reader → needs `react-native-play-install-referrer` (**new dep = Adi approval, Open Decision D4**). On first launch, if a referrer with our `cta_id` is present, write it to `profiles.pro_settings.acquisition` (JSONB, no schema change). Degrades gracefully to the coarser telemetry join if not shipped.

### 4.4 Telemetry table + edge function (Phase 2)
Clone the shipped `referral_clicks` pattern (`migrations/033`, `034`, `supabase/functions/track-referral-click`): `verify_jwt` off, service-role insert, bot-UA filter, `204` fire-and-forget, **explicit GRANT** (MCP tables don't inherit grants). New `migrations/037_install_cta_events.sql`:

```sql
CREATE TABLE public.install_cta_events (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cta_id       uuid NOT NULL,
  event_type   text NOT NULL CHECK (event_type IN ('impression','click','dismiss','open_installed')),
  placement    text,          -- 'entry' | 'post-signup' | 'dashboard-nudge'
  target       text,          -- InstallTarget value (the ONLY android-web signup signal)
  user_id      uuid,          -- nullable: anonymous entry impressions
  family_id    uuid,          -- nullable: filled once known (post-signup+)
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  user_agent   text
);
CREATE INDEX install_cta_events_cta_idx    ON public.install_cta_events (cta_id);
CREATE INDEX install_cta_events_family_idx ON public.install_cta_events (family_id);
ALTER TABLE public.install_cta_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read install_cta_events" ON public.install_cta_events FOR SELECT USING (is_admin());
GRANT SELECT ON public.install_cta_events TO authenticated;
```

Optional append-only `push_token_audit` (id, family_id, platform, first_seen_at) written on token registration, so the numerator survives `switch_user_family`'s `DELETE` (§1.3). No PII in any payload (only `platform`, `target`, `placement`, `cta_id`, `user_agent`); events fire even when `user` is null.

### 4.5 Unified cooldown / impression cap (folds critic P2-9)
Two cooldown systems must not contradict. **Rule:** the native CTA reads the **nudge manager's global cooldown timestamp** (`GLOBAL_COOLDOWN_DAYS = 7`, `nudgeManager.ts:36-46`) as the *source of truth* for "an install ask was recently dismissed." Specifically:
- Dismissing **any** install-family nudge (dashboard PWA/native or the entry/post-signup CTA) stamps the **same** global cooldown key; within 7 days, **neither** the dashboard slot **nor** the entry/post-signup CTA renders. This closes the hole where a dismissed dashboard nudge left the entry CTA free to fire.
- **Impression cap:** `install-native:impressions` (max 3) in `AsyncStorage` for entry/post-signup, on top of the global cooldown.
- **Post-signup card:** additionally **once-ever per account** (a persisted flag), so it never re-appears on later logins even outside cooldown.

### 4.6 Manifest (folds critic P4-17 — verify injection source first)
`getInstalledRelatedApps()` requires `related_applications:[{platform:'play', id:'com.buffapp.mobile', url: playStoreInstall}]` + `prefer_related_applications:false`. **Before editing `public/manifest.json`, verify where the served manifest actually comes from:** `setupPwa.web.ts:58` is cited as injecting the manifest at runtime — if it generates/overrides the manifest dynamically, editing the static `public/manifest.json` is inert and the `related_applications` block must be added in the injection code instead. Confirm at implementation time; spec the edit in whichever path actually serves the manifest.

### 4.7 CTA component + mount points
`src/components/install/GetTheAppCta.web.tsx` (+ `GetTheAppCta.tsx` → `null`). RN primitives + `useTranslation` + `PASTEL_MODE`, mirroring `InstallNudge.web.tsx`. Props `{ placement:'entry'|'post-signup'|'dashboard-nudge'; onDismiss?:()=>void }`. Renders per §3.1.

Mount points:
1. **Web entry** — `RoleSelectionScreen.tsx` (~:51-73): `<GetTheAppCta placement="entry" />` above the role cards when `target ∈ {android-play, native-installed}`.
2. **Post-signup, pre-onboarding** — `WelcomeScreen.tsx` (~:100): dismissible banner **above** the value cards. **Placement decision (folds critic P2-10): a banner on the existing `WelcomeScreen`, NOT a dedicated interstitial route.** A new interstitial screen would sit inside the onboarding corridor and risk the completion guardrail; a banner is additive and matches the existing `RootNavigator` tree (no new route). Also mount on **`AuthCallbackScreen.tsx`** (~:101-143 role-picker branch) so Google signups who bounce at role selection still see it.
3. **Dashboard** — repoint the existing nudge slot to native on Android (§4.8).

**No new route/screen** is added anywhere.

### 4.8 Nudge-manager coexistence
- Add `NudgeId` `'install-native'` (`types.ts:12`) with `NUDGE_PRIORITY['install-native'] = 25` (> `install:20`); `rate:10` untouched. Additive one-line enum change.
- `install-native.eligible()` true only when `target ∈ {android-play, native-installed}`. The legacy PWA `install` nudge gains one guard: **return false when the native target is available** (PWA yields to native on android-mobile; iOS/desktop keep PWA). The manager's existing single-slot priority logic (`nudgeManager.ts:91-105`) then guarantees exactly one install-family nudge per visit — **no manager code change**.
- **`beforeinstallprompt` note (folds critic P4-18):** suppressing the PWA nudge on Android leaves the captured deferred prompt (`getDeferredInstallPrompt()`, `InstallNudge.web.tsx:108`) unused on android-web. This is intended — native strictly dominates PWA there. Confirm no code path strands or errors on the unconsumed prompt.
- Own-device-child sessions already `suppressed` in the manager (`nudgeManager.ts:16,83`); the new nudge inherits it. **But entry/post-signup CTAs are OUTSIDE the manager** — add an explicit render guard (folds critic P4-16): CTA renders only when web + parent-role screen + not a child/View-as-Child session (assert in Hat 1 §6.1 + a scenario row).

### 4.9 Data continuity (folds critic P0-4)
**Server-side: nothing new required.** Native uses the same Supabase project + Auth; same-credential login resolves through the identical `RootNavigator` branch logic (`:69-135`) reading the same `profiles`/`families`/`children` via RLS. Onboarding resume already works: `parentOnboarded = onboardingComplete && hasChildren` from server-side `profile.pro_settings.onboarding_complete` (`:134`); a partway web user lands on the native onboarding branch (`:295-307`) and continues at `pro_settings.onboarding_step`.

**Duplicate-family guard (critic P0-4).** `AuthCallbackScreen.tsx:33` creates a new family when `role==='parent' && !familyId`. If a web user's `profile.family_id` hasn't propagated before they install native and Google-sign-in again, this branch can create a **second** family (related to open bug IN-2026-05-14-03). **Spec + test an explicit guard:** before the create-family branch, re-read `profile.family_id` from the server; same-Google-account re-entry MUST resolve the existing `family_id` (not `null`) and skip creation. This is a required continuity precondition, not just a cross-check.

**Copy honesty:** promise "your family and progress are saved" (true at step granularity). The web-only `localStorage` reload snapshot (`onboardingPersistence.web.ts`, `RootNavigator.tsx:82-107`) does **not** cross to native and doesn't need to — native resumes at step granularity from server state. Do **not** promise pixel-exact screen resume.

### 4.10 File-by-file change list + phased build order

**Phase 1 — Detection + entry/post-signup CTA (ships value alone; no schema, no new deps)**
- `src/hooks/useInstallPrompt.web.ts` — export UA predicates.
- `src/lib/installTarget.ts` (native stub) + `installTarget.web.ts` (new) — §4.1.
- `src/components/install/GetTheAppCta.tsx` (native `null`) + `GetTheAppCta.web.tsx` (new) — §4.7, with unified cooldown/cap (§4.5).
- `src/screens/auth/RoleSelectionScreen.tsx` — mount `placement="entry"`.
- `src/screens/onboarding/WelcomeScreen.tsx` — mount `placement="post-signup"` banner.
- `src/screens/auth/AuthCallbackScreen.tsx` — mount CTA on role-picker branch; add duplicate-family guard (§4.9).
- Remove duplicated UA block at `InstallNudge.web.tsx:99-111`.
- i18n `install.getApp.*` (EN + HE).
- `public/manifest.json` **or** manifest-injection code — `related_applications` (§4.6, verify source first).
- Client telemetry beacon calls (no-op until Phase 2 endpoint exists; `fetch` failure swallowed).

**Phase 2 — Telemetry backend + success metric (independent; enables measurement)**
- `migrations/037_install_cta_events.sql` — table + optional `push_token_audit` + `admin_install_cta_funnel` view + grants (§4.4, §4.11). **Apply via `apply_migration`; existing-user impact: none (new tables).**
- `supabase/functions/track-install-cta/index.ts` — clone of `track-referral-click`.
- `admin-web/src/hooks/useInstallCtaFunnel.ts` + board wiring (mirror `useReferralFunnel.ts`).

**Phase 3 — Dashboard nudge + open-if-installed + attribution (independent enhancements)**
- `src/lib/nudges/types.ts` — `install-native` id + priority `25`.
- `src/components/install/InstallNudge.web.tsx` — register `install-native`; add "yield to native" guard on PWA nudge.
- `src/navigation/linking.ts` + `app.json` — `buffadhd.com` App Link prefixes + `intentFilters autoVerify`. **assetlinks.json hosting + signing fingerprint → Adi (D2).**
- `landing-web/src/components/Landing.tsx` — Google Play badge for android-mobile visitors (**own** UA detection + telemetry; separate Vite bundle, cannot import `src/lib/installTarget.web.ts`) — **decision D5**.
- *(Optional, dep-gated)* `src/lib/installReferrer.android.ts` + config plugin — read Play referrer (D4).

### 4.11 Success-metric view
`037` adds `admin_install_cta_funnel` (SECURITY INVOKER, `is_admin()`-gated, mirroring `034_admin_referral_funnel.sql`):
```
android-mobile-web signups (install_cta_events.target ∈ android-* within signup session)   -- denominator
  ⟕ install_cta_events (saw_cta / clicked)
  ⟕ push_token_audit (fcm-android ever) [or live push_subscriptions, excl. switch-family]   -- installed native
  ⟕ daily_progress within 7 days of signup                                                  -- activated
```
Success metric = activated ∩ installed ÷ android-mobile-web denominator. Surfaces on the existing admin funnel board alongside `useReferralFunnel.ts`.

---

## 5. Values Check (all 9)

**Pillar 1 — Intrinsic Motivation**
1. *Builds internal drive, not external pressure?* — CTA sells continuity + utility ("pick up where you left off", "reminders that reach your kid"), not a reward or nag. **Pass.**
2. *Avoids manipulative dark patterns?* — Always dismissible, capped (3), 7-day cooldown, explicit "keep going in the browser" escape, never blocks onboarding. **Pass.**
3. *Child autonomy intact?* — Parent-facing, web-only; never shown to children or on child-owned/View-as-Child sessions (§4.8 guard). **Pass.**

**Pillar 2 — Positive Coaching**
4. *Supportive, never shaming?* — "BUFF works best as an app" is invitational, not "you're missing out." **Pass.**
5. *Protects child data/privacy?* — No new PII; telemetry carries only `platform`/`target`/`placement`/`cta_id`/`user_agent`, consistent with Sentry PII-scrubbing posture. **Pass.**
6. *Reinforces parent-as-coach?* — Hands the parent the better tool (reliable reminders) to support their kid. **Pass.**

**Pillar 3 — Independence-Building**
7. *Helps the family self-sustain the habit?* — Directly moves them to the surface that demonstrably retains (native + push). **Pass.**
8. *Avoids nag-dependence?* — 7-day unified cooldown + once-ever post-signup card + hard onboarding suppression. **Pass.**
9. *Real value, not vanity?* — Success metric is real activation (`fcm-android` token + `daily_progress` wk1), not impressions. **Pass.**

**All 9 pass** against designed behavior. Re-verify at exit against implemented behavior per CLAUDE.md.

---

## 6. Test Plan & Automation

**Hats:** Hat 1 (static + Jest, blocks merge) · E2E web (Playwright vs `npm run web`, blocks merge for render regressions) · Hat 3 (Android emulator via `adb`, via **buff-emulator** skill, blocks release) · Hat 4 (real device / real webview / real Play install — Adi only, blocks GA).

### 6.1 Hat 1 — static + unit

**6.1.0 Static gates:** `npm run typecheck` (`getInstalledRelatedApps`/`BeforeInstallPromptEvent` typed via local `.d.ts`, not `any`); `npm run check:no-raw-alert`; i18n key presence for all `install.getApp.*` in EN **and** HE (extend `i18nCatalogIntegrity.test.ts`); no hardcoded copy (`i18nNoHardcodedCopy.test.ts`).

**6.1.1 `installTarget.test.ts`** (jsdom, reuse the `setUA`/`setStandalone` harness from `useInstallPrompt.test.ts:26-60`) — the UA matrix, **highest-value test**:

| UA fixture | Expected target |
|---|---|
| Android Chrome | `android-play` |
| Android Facebook IAB (`FB_IAB/FB4A;FBAV`) | `android-inapp-webview` |
| Android Instagram IAB | `android-inapp-webview` |
| Android TikTok IAB (`BytedanceWebview`/`musical_ly`) | `android-inapp-webview` |
| iOS Safari | `ios-pwa` |
| iOS Chrome (`CriOS`) | `ios-pwa` |
| iOS Facebook IAB (`FBAN/FBIOS`) | `ios-inapp-webview` |
| Desktop Chrome | `desktop` |
| Standalone (any UA) + `display-mode: standalone` | `standalone` |
| Android + `getInstalledRelatedApps → [{id:'com.buffapp.mobile'}]` | `native-installed` |

Assertions: `standalone` short-circuits before UA checks; IAB precedence (webview UA on Android → `android-inapp-webview`, not `android-play`); iOS is **never** android-*; `getInstalledRelatedApps` **absent** → `android-play` (no throw); **rejects/throws** → caught → `android-play`.

**6.1.2 In-app-webview cases:** FB/IG/TikTok → `android-inapp-webview`; `intent://` builder emits the **correct** string (`package=com.android.vending`, §4.3) — negative-assert the buggy `package=com.buffapp.mobile` form is not produced.

**6.1.3 `nativeInstallEligibility.test.ts`** (RN preset + AsyncStorage mock; reset like `nudgeManager.test.ts:23-26`):
- Dashboard-slot path: `install-native` registered; assert exactly one install-family nudge eligible on Android (native wins, PWA yields); global 7-day cooldown suppresses; `suppressed=true` (own-child) hides.
- Early-surface path: `isEligibleEarly(target, dismissCount, lastShownAt)` true only for `android-play`/`native-installed`; impression cap (3) → false; per-surface dismiss respects the **unified global** 7-day cooldown, parametrized `[0d,6d,8d] → [suppress,suppress,show]`.
- **Guardrail assertion:** `isEligibleEarly` does **NOT** read `onboarding_step`/`onboarding_complete`.
- **Child-safety assertion:** entry/post-signup CTA does not render in a child/View-as-Child session.

**6.1.4 `installTelemetry.test.ts`** (mock Supabase client): `impression` once per surface-render with `placement`+`target`; `click` with resolved Play URL **including** referrer; `dismiss`; iOS/desktop/standalone → **no** events; insert rejection caught (no throw, `__DEV__` warn only); anonymous-safe (fires with null user, no PII); `cta_id` stable across impression→click within a session.

**6.1.5 `installReferrer.test.ts`:** `buildPlayUrl(ctaId)` sources `buffConfig.ts` base (no duplicate); round-trips `referrer` → `{utm_source, cta_id}`; **security:** tampered/oversized/`javascript:` id rejected; output always `startsWith('https://play.google.com/store/apps/details?id=com.buffapp.mobile')`.

**6.1.6 `platformSplit.test.ts`** (fs static-analysis, like `i18nNoHardcodedCopy`): `GetTheAppCta.web.tsx`/`installTarget.web.ts`/`setupPwa.web.ts` imported **only** from `.web` or extension-less (Metro-resolved) files, never from a file landing in the native bundle; native stub `installTarget.ts` returns `'standalone'`.

### 6.2 E2E web (Playwright, `e2e/native-install-cta.web.spec.ts`)
Drive UA + `matchMedia` + `getInstalledRelatedApps` via `newContext({userAgent})` + `addInitScript`. Per class: Android Chrome entry → CTA visible, href → `play.google.com/...id=com.buffapp.mobile` **with** `referrer=`; Android post-signup pre-onboarding → CTA visible, **not gated on onboarding**; iOS → Play CTA hidden, add-to-home present, zero `play.google.com` links; desktop → QR present, no dead Play button; standalone → hidden; native-installed → "Open BUFF", App-Link href ≠ store; Android FB webview → "open in Chrome" variant; dismiss+reload within cooldown → absent; after 8d-seeded `lastShownAt` → present. **Telemetry:** intercept the `install_cta_events` POST (`page.route`) — `impression` on Android render, `click` on click; iOS/desktop/standalone → none. **a11y:** `@axe-core/playwright` 0 serious/critical; tap target ≥44×44 CSS px; dismiss has an accessible label.

### 6.3 Hat 3 — emulator (`adb`, buff-emulator skill first: `metro_acquire`)
| # | Step | Expected |
|---|---|---|
| H3-1 | Chrome → `https://www.buffadhd.com` | native-install CTA visible |
| H3-2 | Tap CTA; `adb logcat` | hands off to Play for `id=com.buffapp.mobile` (referrer-tagged) |
| H3-3 | Install referrer-tagged build; read stored Install Referrer | native logs `utm_source=web_cta` + `cta_id` round-trip |
| H3-4 | With app installed, re-open site → tap CTA | App Link **opens the app** (needs `assetlinks.json` + `autoVerify`; else degrades to store — no double-install) |
| H3-5 | Cold-launch native app | **no** CTA anywhere (bundle-leak regression) |

### 6.4 Hat 4 — manual (Adi; each blocks GA)
| # | Step | Pass |
|---|---|---|
| H4-1 | Real FB/IG in-app webview on real Android → tap CTA | "open in Chrome/install" actually reaches Play + installs (the exact 289-android-mobile path; unfakeable in Playwright) |
| H4-2 | Real Play install → open native → **sign in same Google account** | same family/child/tasks (continuity) |
| H4-3 | Abandon web onboarding mid-step → install native + sign in | resumes at `onboarding_step`; **no duplicate family** (IN-2026-05-14-03 not triggered) |
| H4-4 | Real iOS Safari → CTA region | add-to-home (NOT Play); 3-step card actually adds to home |
| H4-5 | Copy check | "your setup is saved" EN; HE reviewed by Adi |
| H4-6 | Post-H4-2 | `fcm-android` token row appears (success-metric numerator) |

### 6.5 Full scenario matrix (Auto: U=unit, E=E2E, H3=emulator, H4=manual)

| # | Scenario | Platform | Expected | Auto | Risk if broken |
|---|---|---|---|---|---|
| S1 | Android sees CTA | Android Chrome | Play CTA, href+referrer | U,E,H3 | Core goal fails |
| S2 | CTA post-signup, pre-onboarding | Android Chrome | Visible, not onboarding-gated | U,E | 58% abandoners miss it |
| S3 | Android FB/IG/TikTok webview | IAB UAs | `intent://` escape works | U,H4-1 | Majority social traffic can't install |
| S4 | iOS → no Play CTA | iOS Safari/Chrome | Add-to-home only | U,E,H4-4 | CTA to nonexistent iOS app |
| S4b | iOS in-app webview | iOS FB/IG | "Open in Safari" (not dead add-to-home) | U | Dead instruction inside iOS webview |
| S5 | Desktop graceful | Desktop | QR / defer, no dead button | U,E | Dead CTA on desktop |
| S6 | Standalone hidden | Standalone | CTA absent | U,E | Nags already-installed |
| S7 | Native installed → OPEN | Android + related-apps | App Link opens app | U,E,H3-4 | Double-install / dead-end |
| S8 | Continuity web→native | real device | Same family/tasks | H4-2 | "Setup lost" churn |
| S9 | Onboarding resume + no dup family | real device | Resume at step; guard blocks 2nd family | H4-3,U(guard) | Restart churn / dup-family bug |
| S10 | Onboarding guardrail | Android Chrome | No mid-onboarding CTA; existing dashboard nudge intact | U,E | Regresses PWA nudge |
| S11 | Telemetry + join survives switch-family | Android | events → token-ever join (§1.3) | U,E,H3-3+H4-6 | Can't measure; undercount |
| S12 | Native users → no CTA | native | absent | U(split),H3-5 | Bundle-leak launch crash |
| S13 | Own-device child unchanged | Android child | no CTA | U(guard),H4 | Child sees install ask (Pillar 2) |
| S14 | Separate-device parent unchanged | native parent | no CTA | U,H3-5 | Nags installed parent |
| S15 | Dismiss + unified cooldown | Android Chrome | Hidden 7d across ALL surfaces | U,E | Nag loop / cross-surface leak |
| S16 | Impression cap | Android Chrome | Suppressed after 3 | U | Over-nagging |
| S17 | Offline | Android offline | CTA renders; telemetry fails silently | U,E | White-screen on flaky ad networks |
| S18 | a11y | Android | Labeled CTA+dismiss, ≥44px, AA | E(axe),H4 | Excludes AT users |
| S19 | Tampered referrer | — | Sanitized; origin always play.google.com | U | Open-redirect via referrer |
| S20 | No web leak into native bundle | native build | `.web`/`getInstalledRelatedApps` absent from AAB | U(split),H3-5 | Launch crash (native-import blind spot) |
| S21 | `getInstalledRelatedApps` unsupported/throws | Firefox/old Chrome | Falls to `android-play`, no crash | U | CTA disappears |
| S22 | One install ask on Android | Android + deferred prompt | Exactly ONE (native wins) | U,E | Stacked prompts |
| S23 | `Login` screen = no CTA (v1) | Android Chrome | No CTA on Login | U,E | Nags every web re-entry |

### 6.6 CI
Add `installTarget/installTelemetry/installReferrer/nativeInstallEligibility/platformSplit` unit tests + extended `i18nCatalogIntegrity` + `native-install-cta.web.spec.ts` to the existing onboarding CI job (commit `c1050b8`). Hat 3 (S1/S7/S11/S12) gates release; Hat 4 (S3-real, S8, S9, S4-real, S11-join) is Adi's pre-GA gate. Add a **funnel SQL regression** asserting `click → fcm-android(ever) → daily_progress(wk1)` returns rows for a seeded fixture family, so the metric can't silently break while the UI still works.

---

## 7. Open Decisions for Adi (each with a recommendation)

- **D1 — Post-signup: banner vs. blocking interstitial.** **Recommend: dismissible banner on the existing `WelcomeScreen` (+ `AuthCallbackScreen`), NOT a new interstitial route.** Confidence: high. A blocking interstitial sits inside the onboarding corridor and risks the completion guardrail; the banner captures the highest-intent moment without trapping anyone or adding a route.
- **D2 — Android App Links ("Open the app") in v1 or fast-follow?** **Recommend: defer to fast-follow.** Confidence: medium. Needs `assetlinks.json` hosting + `autoVerify` + your Play signing fingerprint. v1 degrades to store link (Play shows "Open") — no retention loss, no dead-end.
- **D3 — Desktop: QR vs. plain "continue on web".** **Recommend: ship QR → `download.html`.** Confidence: medium. Desktop ≈ 84 of the audience; QR is low-effort and catches "signing up on laptop, phone is Android." Fall back to plain continue-on-web if QR adds a dep.
- **D4 — Play Install Referrer SDK vs. same-account join.** **Recommend: v1 attributes via CTA telemetry + same-account join; skip the referrer SDK.** Confidence: high. Same-account join gives the funnel end-to-end; the SDK is a new dep (needs your approval) and only sharpens anonymous pre-signup attribution.
- **D5 — Add the CTA to buffadhd.com landing (`landing-web`) in v1?** **Recommend: fast-follow, not v1 core.** Confidence: medium. It's the other web entry and android-mobile-heavy (high leverage), but it's a separate Vite bundle needing its **own** UA detection + telemetry; land + measure in-app first.
- **D6 — CTA on the `Login` screen (returning users)?** **Recommend: NO in v1.** Confidence: medium. Returning-web-login is higher-data but risks nagging every re-entry; revisit once the entry/post-signup funnel is measured.
- **D7 — `switch_user_family` deletes `push_subscriptions`.** **Recommend: add append-only `push_token_audit` (Phase 2) so the numerator survives; until then, label the metric "excludes co-parent-switch families."** Confidence: high. Without this the funnel silently undercounts installs for co-parent-join families (`migrations/020_switch_user_family.sql:91`).

---

## 8. Out of Scope (v1)

- iOS native / App Store CTA (no iOS app yet — TestFlight pending).
- Any change to native-app users, own-device children, separate-device parents, or the onboarding flow (additive banners only).
- `Login`-screen CTA for returning users (D6).
- Android App Links "open at same screen" as a v1 guarantee (D2 — degrades to store; Phase 3).
- Play Install Referrer SDK decoding in-app (D4 — same-account join suffices for the metric).
- `landing-web` (buffadhd.com) Google Play badge (D5 — fast-follow).
- Push re-engagement content (separate FCM package).
- Desktop→phone (QR) attribution (fresh-session, unrecoverable; excluded from conversion denominator).
- Backfilling the phantom `pwa_events` table (does not exist; superseded by `install_cta_events`).

---

## 9. Instrumentation addendum — per-profile platform & child-connection signal (folds Adi's request, 2026-07-02)

**Why.** Two needs that §1.3/§4.4 telemetry does not fully cover: (a) detect a parent moving **web→android per-user** (not just family-signup), and (b) understand **how each child connects** (own device vs parent's device, on which platform) to drive future features + bug triage. Today's gaps, verified in data:
- `families.platform` = signup snapshot, family-level, coarse (`'web'` can't tell android-web from ios-web from desktop-web), never refreshed → a web→android switch is invisible.
- `profiles` has **no** platform column.
- We CAN already infer own-device vs view-as-child from `profiles.user_id`: **43 children own-account (ChildJoin) vs 78 parent-managed-only** (matches the ~65% shared-device model); but only **3 of 43** own-account kids are on their own native device — the other 40 are **dark** on platform.

**Add (small, low-risk, nullable):**
1. `profiles.last_platform text` + `profiles.last_platform_at timestamptz` — written on every app open (alongside the existing `last_seen_at` write), value = `Platform.OS` on native (`'android'`/`'ios'`) and the `installTarget` class on web (`'android-web'`/`'ios-web'`/`'desktop-web'`) so web is distinguishable. Applies to **both parent and child** profiles.
2. `families.platform` stays the **acquisition** (signup) platform — unchanged.
3. Derived child-connection signal (no new column): `own-device` when `profiles.user_id IS NOT NULL`, else `view-as-child`. (Optional Phase-2: stamp session context onto completion writes.)

**What it unlocks:** per-parent web→android conversion (sharpens the §1.3 metric with a per-user signal, not only the CTA-event join); visibility into **own-device kids stuck on web** (a churn-risk cohort we're blind to today); and a durable base for future features (e.g. routing own-device-web kids to native, the parked device-scoped Child Mode) and bug triage.

**Schema/impact:** two nullable columns on `profiles`; write path reuses the existing app-open effect that already sets `last_seen_at`; owner-writable RLS already covers it (no policy change). New-user impact: none. **Needs Adi approval (schema change).**

**Test:** web app-open sets `last_platform='android-web'|'ios-web'|'desktop-web'`; native sets `'android'|'ios'`; a child in view-as-child records the **parent-device** platform; an own-device child records **its own**; `last_platform_at` advances on each open.

**Integration (answers Adi's Q):** folded into THIS SPEC as part of Phase 2 (ships with `install_cta_events`), since the success metric benefits from the per-user platform signal. Liftable to a tiny standalone foundational package if you prefer to land it before the CTA.
