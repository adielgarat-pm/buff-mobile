# Sentry Crash Monitoring — SPEC

> מצב היעד לחבילה זו. סמכותי עד שמוחלף בסשן מאוחר יותר.

**נוצר:** 2026-05-16
**מקור:** [Plan draft](../beta-2026-06-01/PLAN_sentry-crash-monitoring.md), questions resolved by Adi 2026-05-16.

---

## Why this exists

`pkg/expo-health-and-eas-android` shipped v8 to Play Console Internal Testing today (2026-05-16). The AAB has no R8 mapping file, so any crashes captured by Play Console Android Vitals show obfuscated stack traces. Rather than chase the mapping.txt rebuild path, Adi chose Sentry — which provides real-time crash + breadcrumb capture, symbolicated stack traces via JS source maps, and email alerts. Strictly better signal than the Play Console route, and doesn't require Play Console mapping at all.

---

## Capabilities & Bottlenecks

### What CC does
- Install `@sentry/react-native` via `npx expo install`
- Add Sentry config plugin to `app.json`
- Edit `App.tsx`: `Sentry.init` with PII-scrubbing `beforeSend` + `beforeBreadcrumb` hooks; `Sentry.wrap()` HOC on default export
- Wire `EXPO_PUBLIC_SENTRY_DSN` into `eas.json` per-profile (production + preview, NOT development)
- Set EAS secret `SENTRY_AUTH_TOKEN` for source-map upload
- Trigger v9 build, verify source-map upload in build logs
- Update canonical docs at phase exits

### What Adi does (account-bound, CC cannot)
- Create Sentry account at sentry.io with `adi@buffadhd.com` (Phase 2)
- Create Sentry project: type "React Native", name "buff-mobile" — copy DSN
- Generate Sentry auth token with scopes `project:releases` + `project:write` + `org:read` (Phase 3)
- Provide DSN + auth token to CC via paste
- Install v9 from Play Console Internal Testing (Phase 5) + trigger test crash + verify Sentry receives it

### Bottlenecks
- **Sentry account creation** (5 min Adi work, blocks Phase 2 onwards)
- **Auth token generation** (Adi UI work, blocks Phase 3)
- **First crash to verify** — CC adds a hidden dev-only "force crash" button OR uses `Sentry.captureException(new Error("test"))` at app launch behind a temporary flag; removed before package close

### Resolved decisions (Adi 2026-05-16)
| Question | Answer |
|---|---|
| Sentry account | Create new with `adi@buffadhd.com` |
| Alert recipients | `adi@buffadhd.com` only |
| PII scrubbing | Aggressive — strip emails, display names, child names, IP. Children's-app default. |
| Timing | Start now in parallel with v8 testing |

---

## Values Check

> 9 questions from [BUFF_VALUES.md](../../BUFF_VALUES.md). Developer-side tool; user-facing surface unchanged.

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this without virtual reward?** N/A — invisible to child.
2. **Does it bring the child closer to a chosen reward?** N/A.
3. **Felt as "I want to" or "I have to"?** N/A.

### Pillar 2 — Positive Coaching
1. **Does copy shame / compare / display failure?** No copy changes.
2. **If child fails, is response empathy or pressure?** N/A — no user-facing failure path created.
3. **Sad/lost/angry BUDDY or app state?** No BUDDY change.

**Privacy concern (Pillar 2 indirect):** Sentry captures device info + breadcrumbs by default. BUFF is a children's app — we override defaults to scrub PII before any event leaves the device. `beforeSend` strips `event.user.email`, `event.user.username`, `event.user.ip_address`. `beforeBreadcrumb` regex-redacts emails from breadcrumb messages. Verified in Phase 4 by inspecting a real captured event.

### Pillar 3 — Independence-Building
1. **Make child more capable without app?** Neutral. Sentry is dev infrastructure.
2. **Does child have a voice?** N/A — not child-facing.
3. **Still necessary in 6 months?** **Yes.** Observability is permanent infrastructure. Sentry is one vendor; swap to Crashlytics or self-hosted GlitchTip is a 1-day project if we ever want to switch. Not lock-in.

**Result:** No question fails. Proceed.

---

## Goals

1. Any unhandled error / crash in BUFF on a tester device produces a Sentry event within 60s.
2. The event's stack trace is symbolicated to original TypeScript source line numbers.
3. Breadcrumbs leading to the crash are visible — navigation events, console.error, last few user-visible actions.
4. No PII (emails, child names, IP addresses) appears in any event field — verified manually by inspecting a real captured event.
5. Email alert to `adi@buffadhd.com` fires on the first occurrence of any new crash signature.

## Non-goals (out of scope)

- iOS Sentry config (no iOS profile yet)
- Sentry Session Replay (paid feature, not relevant)
- Performance monitoring tuning (defaults are fine for now)
- Migrating existing `console.error` paths to explicit `Sentry.captureException` (per-feature work, not this package)
- Server-side Sentry for Supabase Edge Functions (separate concern)
- Replacing Play Console Android Vitals (Sentry sits alongside; no need to disable Vitals)
- Adding Sentry to dev builds (intentionally DSN-less in dev to keep quota for production crashes only)

---

## Behavior Contract

After this package closes:

- v9 (or higher) AAB is live in Play Console Internal Testing for `com.buffapp.mobile`
- The Sentry React Native SDK is initialized at app startup in production builds; init is a no-op in dev (no DSN set)
- Source maps for the build are uploaded to Sentry as part of the EAS Build flow
- `App.tsx` is wrapped with `Sentry.wrap()` for component error boundary
- `beforeSend` and `beforeBreadcrumb` hooks scrub PII before any event leaves the device
- `eas.json` has `EXPO_PUBLIC_SENTRY_DSN` set for `preview` + `production` profiles
- EAS project secret `SENTRY_AUTH_TOKEN` is set for source-map upload
- A test crash triggered manually by Adi on her installed v9 appears in the Sentry dashboard within 60s with readable stack trace

## Schema Changes

None.

## Prompts Changes

None.

## API / Route Changes

None.

## UI Changes

None visible to users. The only addition is a hidden dev-only "force crash" affordance, removed before package close (Phase 4.3 → Phase 4.4 cleanup).

---

## Open Questions

> CC will surface these at chunk time; none are blocking SPEC approval.

1. **Sentry plan tier** — default Developer (free, 5K errors/month) is plenty for internal testing. Upgrade only if we hit the cap.
2. **Native crash handler (Android)** — `@sentry/react-native` auto-installs the native handler via the Expo plugin; verify in Phase 4 by triggering a native-level crash if testable.
3. **Navigation breadcrumbs** — `@sentry/react-native` has a React Navigation integration. Default on; small bundle-size cost. Confirm at chunk time.

## Out of Scope

- iOS Sentry config
- Sentry Replay
- Performance monitoring tuning
- Per-feature `captureException` instrumentation
- Server-side Sentry
- Disabling Play Console Android Vitals
- Sentry in dev builds
