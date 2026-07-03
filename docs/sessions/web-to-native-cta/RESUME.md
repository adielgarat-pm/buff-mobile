# RESUME — web-to-native install CTA

Pick-up doc for the next session. Full design = `SPEC.md` (same folder).

**Goal:** convert Android mobile-web signups to the native Play Store app (web
retains ~0%, native 5/6). WEB-ONLY + additive; native bundle unaffected.

**Branch:** `pkg/ai-trial-and-referral` — NOT pushed. A parallel CC session also
commits `ai-trial` work here; histories interleave cleanly (different files).

---

## Done (committed, verified)

| Commit | Phase | What |
|---|---|---|
| `e4206a0` | 1a–1d | installTarget split (native stub = inert), GetTheAppCta split (native = null), i18n `install.getApp.*`, mounted at RoleSelection (entry) + WelcomeScreen (post-signup), eligibility (7-day global cooldown + cap 3 + once-ever post-signup), 32 tests + `platformSplit.test` leak guard |
| `ac3711c` | 1e | AuthCallback duplicate-family guard (fail-safe server re-read of `family_id` before create — IN-2026-05-14-03) + CTA on Google role-picker |
| `dc8a563` | 2a–2c | migration 038 `install_cta_events` (APPLIED), `track-install-cta` edge fn (DEPLOYED, verify_jwt off), `installCtaTelemetry.web` POST wired (verified e2e: POST → row → cleaned) |
| `2a0f463` | 2d | migration 039 `admin_install_cta_funnel` RPC (APPLIED), admin-web `useInstallCtaFunnel` + `InstallCtaBoard` + "📲 Install CTA" tab |

**Production changes already applied** (all NEW objects — zero impact on existing
tables/users): table `install_cta_events`, RPC `admin_install_cta_funnel`, edge
function `track-install-cta`.

**Verification state:** `npx tsc --noEmit` clean (main + admin-web); install unit
suite 32 green + `platformSplit` leak guard green; edge-function beacon confirmed
end-to-end. NOT yet verified: real Android CTA banner (needs android UA / Hat-4).

---

## Next, in order

### 2e — `profiles.last_platform` (Adi explicitly wants; show her the ALTER first)
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_platform text,
  ADD COLUMN IF NOT EXISTS last_platform_at timestamptz;
```
Additive-nullable = safe (instant, no lock/rewrite). Then write on app-open:
- **Parent**: self-update own profile — straightforward (RLS allows own-row update).
- **Child (parent-managed, user_id NULL)**: writing the child's `last_platform`
  from the parent session may be blocked by the same RLS that blocks EditChild for
  own-device kids — handle carefully; own-device child self-updates instead.
- Value: measure web→android conversion per-user; surface own-device-web kids
  (currently a blind spot — only 3/43 own-account kids on native).

### Phase 2 refinement (makes the funnel show install→activation)
Events currently carry NULL `family_id`, so the funnel is engagement-only.
- **cta_id→family bridge** (SPEC §4.3): persist `cta_id` in sessionStorage (already
  done in `GetTheAppCta.getOrCreateCtaId`); at signup fire one authenticated event
  stamping `family_id`/`user_id` with the same `cta_id`.
- **push_token_audit** (SPEC §1.3): append-only so the install numerator survives
  `switch_user_family`'s DELETE of push_subscriptions.

### Phase 3
- Dashboard nudge: register `install-native` in nudgeManager; PWA `install` nudge
  yields to native on android.
- Android App Links: `assetlinks.json` + `autoVerify` (needs Play signing cert =
  Adi/Play-Console) → enables "Open BUFF" when installed.
- `manifest.json` `related_applications` → enables `getInstalledRelatedApps()` →
  `native-installed` detection (until then it degrades to `android-play`).
- landing-web (buffadhd.com) Google Play badge for android visitors.
- Cleanup: remove the duplicated UA block in `InstallNudge.web.tsx`.

### Hat-4 (Adi, real Android build — nothing shows the banner in desktop preview)
- Real android UA → the "Get it on Google Play" banner is visible at RoleSelection
  + WelcomeScreen + AuthCallback role-picker.
- web → Play install → sign in same Google account → same family/tasks; onboarding
  resumes; **no duplicate family** (H4-3, tests the 1e guard).
- After install, an `fcm-android` token row appears (success-metric numerator).

---

## Gotchas
- Migrations 037 is taken (completed_at backfill); this package used 038 + 039.
- Everything web-only: never import a `*.web` install module from a shared/native
  file — `platformSplit.test` enforces this (add new web modules to its `WEB_ONLY`).
- Telemetry must never throw/await-block the UX (fire-and-forget, swallow errors).
- Play package = `com.buffapp.mobile` (`buffConfig.BUFF_URLS.playStoreInstall`).
