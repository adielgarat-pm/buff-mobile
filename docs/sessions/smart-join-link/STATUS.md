# Smart Join Link — STATUS

| Phase / Chunk | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| v1 (PR #301, `pkg/smart-join-link`) | superseded | 2026-06-30 | 487ada7 | tsc 0 · buffConfig 10/10 | Draft went stale (~140 commits behind; UStep7 replaced by ChildAccessStep in #441). Code re-applied fresh — see v2 below. Close #301 without merge. |
| v2 — full re-apply on main (`pkg/smart-join-link-v2`) | done · web-E2E verified | 2026-08-06 | (this PR) | tsc 0 · jest 108/108 (946) · i18n-key ✓ · no-raw-alert ✓ · vite build ✓ | All of #301 ported to today's main. Invite surfaces updated to the current trio: ChildAccessStep + InviteChildCard + ResumeHandoffBanner (UStep7 no longer exists). Landing keeps `/join?ref=` (parent referral) alongside new `/join/:code` (child). |

## What shipped (v2)
- **landing-web:** `/join/:code` → `JoinRedirect` (UA-aware: Android→Play Store + `referrer=join_CODE`; else→`www.buffadhd.com/join/:code`). `assetlinks.json` under `public/.well-known/`. Existing `/join?ref=` referral route + `/summer` preserved.
- **app:** `buildJoinUrl` (https smart link) + `parseJoinCode`; linking https prefixes + `getInitialURL` install-referrer fallback; `app.json` App Link intentFilter (autoVerify, apex host); platform-split `installReferrer` (lazy import, 2.5s time-box, consume-once, web/iOS no-op); dep `react-native-play-install-referrer@^1.1.9` (Adi-approved).
- **Invite copy (en+he):** all three share messages now lead with the smart link, install URL + code demoted to fallback line.

## Verification (2026-08-06)
- Full Jest suite 108/108 (946 tests), including ported `buffConfig.test.ts` + `linking.test.ts` (asserts web `/join/:code` → ChildJoin) + updated `InviteChildCard.test.tsx`.
- **Live web E2E (Chrome):** built landing dist served locally → `/join/ABC123` → JoinRedirect → `www.buffadhd.com/join/ABC123` (production PWA) → **ChildJoin rendered with code pre-filled** (`input value = ABC123`). The live PWA already maps `join/:code`; the landing route was the only broken link in the chain.
- Pre-existing `check:i18n-access` failures confirmed present on clean main (starterTasks tests / UStep5 / ParentRewards) — not from this package.

## Open / Hat-4 (real device, post-merge)
- Landing-web Vercel deploy must publish `/.well-known/assetlinks.json` (verified locally that Vercel's filesystem-first serving beats the SPA rewrite).
- App Link autoVerify + install-referrer auto-fill need a real Play-track install (App Links don't verify on direct-install APKs). New **store build required** (app.json intentFilters + native dep are not OTA-able).
- Follow-up (Chunk C): upgrade child-access-paths `home_device` card from code-only to the smart link.

## Values Check
Passes as SPEC'd (docs/sessions/smart-join-link/SPEC.md): removes friction from the child's own path in (Independence-Building), no reward/pressure language in invites (Intrinsic Motivation), invite copy stays warm and non-coercive (Positive Coaching). Verified against implemented copy in en/he.
