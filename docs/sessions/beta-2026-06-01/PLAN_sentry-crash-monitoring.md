# Plan Draft — `pkg/sentry-crash-monitoring`

> **Status:** Draft. Not yet approved by Adi. Drafted 2026-05-16 by Claude Code.
> Real-time crash + error visibility for internal testing onward.
> Replaces deferred Phase 5 of `pkg/expo-health-and-eas-android` (mapping.txt path abandoned in favor of Sentry).

---

## Context

**Why now.** `pkg/expo-health-and-eas-android` shipped v8 to Play Console Internal Testing on 2026-05-16. The AAB ships without an R8 mapping file, so any crash captured by Play Console Android Vitals would show obfuscated stack traces (`a.b.c()` instead of `ChildDashboardScreen.handleSubmit:42`).

Adi explicitly chose this path over the Play Console mapping route (2026-05-16):
> "אני רוצה לתת לעוד משתמשי בדיקות, ואני חושבת שאנחנו כן צריכים להיות מסוגלים לבדוק קריסות עם מקסימום לוגים במיוחד בשלב הזה"

The mapping-only path requires a rebuild (v9) for each release and only fixes stack-trace readability in Play Console — nothing else. Sentry replaces that with:

- Real-time crash alerts (email/Slack/web dashboard within seconds of the crash)
- Full symbolicated stack traces — no Play Console mapping required
- **Breadcrumbs**: the last N user actions (taps, navigation events, console.log/warn/error, network requests) leading up to the crash
- Per-user crash grouping (which crashed for whom, with what frequency)
- Performance monitoring (slow renders, slow API calls) as a bonus

This is the standard observability layer for RN/Expo production apps, deferred from `pkg/expo-health-and-eas-android` per CLAUDE.md rule that new deps are their own package.

**Outcome.** Any crash, uncaught promise, or `console.error` in the BUFF app surfaces in a Sentry dashboard within seconds, with a readable stack trace and the breadcrumbs leading to it. Adi gets email alerts for new crash signatures.

---

## What this package does NOT do

- **iOS Sentry config** — deferred to whenever iOS profile lands
- **Performance monitoring tuning** — Sentry's transaction sampling stays at defaults; perf monitoring is a bonus, not the goal
- **Replay (Sentry Session Replay)** — heavy, paid feature, not relevant for internal testing
- **Server-side Sentry (Supabase Edge Functions)** — separate concern, follow-up if needed
- **Replacing Play Console Android Vitals** — Sentry sits alongside it, doesn't replace
- **Migration of any existing console.error code paths to Sentry.captureException** — Sentry auto-captures unhandled errors; explicit instrumentation is per-feature work in future packages

---

## Default assumptions (flag if wrong)

| Decision | Default | Alternative |
|---|---|---|
| Library | **`@sentry/react-native`** (official, current standard) | `sentry-expo` (deprecated in favor of @sentry/react-native + Expo config plugin) |
| Plan tier | **Sentry Developer (free)** — 5K errors/month, 1 user, 30-day data retention | Team / Business / Enterprise — paid, more retention, multi-user |
| DSN storage | **`EXPO_PUBLIC_SENTRY_DSN` env var in `eas.json` per-profile** — DSN is non-secret (it's safe to embed in client code per Sentry docs) | Hardcode in App.tsx / different env-var name |
| PII handling | **Aggressive scrubbing** — disable IP collection, scrub user emails + child names from breadcrumbs and event metadata. BUFF is a children's app; safer to over-scrub | Default Sentry settings (captures IP, email if attached) |
| Source maps | **Auto-upload via `@sentry/react-native` EAS hook** — uploads sourcemaps for every production build to Sentry | Manual upload per build / skip (only get JS stack traces, not symbolicated original source) |
| Auto-capture scope | **Crashes + uncaught promises + `console.error`** | Add Console.warn / debug network errors / add breadcrumbs for every Supabase call (too noisy) |
| ErrorBoundary | **Yes, root-level in `App.tsx`** — catches React render errors that wouldn't otherwise reach Sentry | Skip (default `@sentry/react-native` global handler catches most) |

---

## Capabilities & Bottlenecks (preview — will become SPEC §Capability Check)

### What CC does
- `npx expo install @sentry/react-native`
- Edit `App.tsx` to init Sentry + wrap in `Sentry.wrap()` HOC (replaces ErrorBoundary need)
- Edit `app.json` to add Sentry Expo config plugin
- Update `eas.json` per-profile env vars (DSN, auth token for sourcemap upload)
- Configure sourcemap upload via the plugin's auto-setup
- Trigger v9 build to verify end-to-end
- Update canonical docs at phase exits

### What Adi does (account-bound, CC can't)
- Create Sentry account at sentry.io (or use existing one if she has one)
- Create a new project: type "React Native", name "buff-mobile"
- Copy the DSN (https://xxx@xxx.ingest.sentry.io/yyy)
- Create a Sentry auth token for CI/build use (settings → auth tokens → "scoped" with project:releases + project:write)
- Provide DSN + auth token to CC (DSN can be public; auth token is secret — store in EAS secrets, not the repo)
- Verify a deliberate crash appears in Sentry dashboard during Phase 4 test

### Bottlenecks
- Sentry account creation (5 min Adi work, blocks Phase 2 onwards)
- Source map upload depends on the auth token being set in EAS secrets
- First crash to verify the setup requires a real crash (CC adds a hidden dev-only "force crash" button OR uses Sentry's built-in test event)

---

## Values Check (preview)

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1-3 | N/A — developer-side tool, no child-facing surface |
| Positive Coaching | 1-3 | N/A — no copy changes, no BUDDY state changes |
| Independence-Building | 1 — Make child more capable without app? | Neutral. Sentry is developer infrastructure, invisible to child. |
| | 2 — Child has voice? | N/A — not a child-facing feature |
| | 3 — Still necessary in 6 months? | **Yes** — observability is permanent infrastructure. **Optional removal:** Sentry is one vendor; if we later want Crashlytics or self-hosted GlitchTip, swap is a 1-day project. Not lock-in. |

**Privacy/safety concern (Pillar 2 indirect):** Sentry captures device info + breadcrumbs by default. For a children's app, we should aggressively scrub PII via `beforeSend` hook — no emails, no child display names, no exact device IDs. This is configurable in Sentry init and will be part of Phase 1.

**Result:** No pillar fails. Adopt with PII scrubbing.

---

## Chunked phases

### Phase 0 — Session folder + SPEC

**Branch:** `pkg/sentry-crash-monitoring` (off `main`)

Create `docs/sessions/sentry-crash-monitoring/` mirroring the previous package structure. SPEC fills in Capabilities, Values Check, Goals, Non-goals, Behavior Contract, Open Questions. ROADMAP lists the 5 phases below. TESTS lists pass/fail per phase. SPEC_SYNC names canonical docs touched (CLAUDE.md Tech Stack — add Sentry; PRD §10.1 observability — likely needs a row).

**Stop condition:** Adi reviews session folder commit, confirms scope, says "approved, proceed."

### Phase 1 — Install Sentry dep + config plugin (no DSN yet)

**Chunk 1.1** — `npx expo install @sentry/react-native`
**Chunk 1.2** — Add Sentry config plugin to `app.json` `expo.plugins` array
**Chunk 1.3** — In `App.tsx`, add `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, ... })` at module top + wrap root export with `Sentry.wrap()`
**Chunk 1.4** — Configure `beforeSend` PII scrubber: drop `event.user`, scrub display name from `breadcrumbs[*].message`, disable IP via `sendDefaultPii: false`
**Chunk 1.5** — `npm start` smoke test: app boots, no Sentry-related crashes (init is no-op without DSN)

**Stop condition:** Code change reviewable; no runtime regression in dev.

### Phase 2 — Adi creates Sentry account + provides DSN

**Adi-only:**
1. Sign up at sentry.io (free tier)
2. Create project: React Native, name "buff-mobile"
3. Copy DSN — paste to CC

**CC adds DSN to:**
- `eas.json` `build.production.env.EXPO_PUBLIC_SENTRY_DSN`
- `eas.json` `build.preview.env.EXPO_PUBLIC_SENTRY_DSN` (same DSN; same project)
- **NOT to `.env.local`** for the development profile (we don't want Adi's dev crashes filling the Sentry quota; dev stays Sentry-off)

**Stop condition:** DSN set in eas.json. CC documents that dev builds intentionally have no DSN.

### Phase 3 — Source map auto-upload via Sentry Expo plugin

**Adi-only:**
1. Sentry settings → Auth Tokens → Create new with scopes `project:releases`, `project:write`, `org:read`
2. Provide token to CC

**CC:**
- Store as EAS secret: `eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value <token>`
- Configure source map upload per Sentry Expo plugin docs (typically via `app.json` plugin config)

**Stop condition:** EAS Build logs show "Uploading source maps to Sentry" on next build trigger.

### Phase 4 — Trigger v9 build + verify

**Chunk 4.1** — `npx eas build --platform android --profile production --non-interactive --no-wait`
**Chunk 4.2** — Wait for v9 (~8 min, polling pattern from previous package)
**Chunk 4.3** — Add a hidden dev-only "Force crash" button in a debug-only screen (or use `Sentry.captureException(new Error("test"))` at app launch behind a `__DEV__` flag — DELETE before package close)
**Chunk 4.4** — Test path: Adi installs v9 from internal testing → triggers test crash → CC verifies the event appears in Sentry dashboard within 60s with a readable stack trace and breadcrumbs

**Stop condition:** Test crash visible in Sentry with symbolicated source-mapped stack trace.

### Phase 5 — Adi uploads v9 to Play Console Internal Testing

100% Adi-driven. CC drafts the upload instructions (same template as `PLAY_CONSOLE_FIRST_UPLOAD.md` but referencing v9 + Sentry-enabled).

**Stop condition:** v9 live in Play Console Internal Testing. Adi installs, opens, no Sentry init errors visible. Optional: triggers test crash → verifies Sentry receives it.

---

## Exit Deliverables matrix

| Phase | Doc | Change |
|---|---|---|
| 0 | Session STATUS.md | row "Phase 0 in_progress" |
| 1 | session STATUS.md | row "Phase 1 passed" + dep installed |
| 2 | session STATUS.md | DSN config noted (NOT the DSN itself in docs); EAS env var set |
| 3 | session STATUS.md + INTEGRATION_LEARNINGS | source-map upload working; document any quirks |
| 4 | session STATUS.md + BUFF_DECISIONS_LOG D-2026-05-XX | "Sentry crash monitoring live; first test crash verified" |
| 5 | session STATUS.md + CLAUDE.md §Tech Stack | add Sentry as observability layer (replaces "Sentry/Crashlytics (observability), pending" in the future-list) |

---

## Risks

- **Sentry initialization slows app boot.** Mitigation: Sentry init is async + non-blocking by default; measure boot time delta in Phase 1.
- **Auth token leak.** Mitigation: token only in EAS secrets, never `.env` committed to repo, never logged.
- **Quota burn from a buggy build.** Free tier is 5K errors/month. If we ship a crash loop, we'd hit the cap. Mitigation: Sentry sample rate at default (100% for errors); if we see issue volume, tune via `Sentry.init({ sampleRate: 0.5 })`. Monitor first 24h after Phase 4.
- **PII leak in breadcrumbs.** This is the children's-app concern. Mitigation: `beforeSend` scrubber in Phase 1.4. Tested manually in Phase 4 — CC inspects a real captured event JSON and confirms no PII leaks through.
- **Source map upload fails silently.** Mitigation: Phase 3 verifies upload via EAS Build log; Phase 4 verifies end-to-end via test crash.

---

## What CC will NOT do

- Push to `main` (work happens on `pkg/sentry-crash-monitoring` branch; PR at end)
- Commit DSN, auth token, or any secret to git (verify with `git diff` before each commit)
- Install npm deps beyond `@sentry/react-native` without explicit approval
- Migrate existing code paths to use `Sentry.captureException` — that's per-feature work, not this package
- Set up iOS Sentry config (out of scope; iOS profile doesn't exist yet)
- Touch BUDDY logic, Vibe Check, Pause Mode, or any child-facing surface

---

## Open questions for Adi — RESOLVED 2026-05-16

1. **Sentry account?** No existing account. Adi will create with `adi@buffadhd.com` (BUFF Workspace email per memory). Single email = both account login and alert destination.
2. **Email for crash alerts.** Same: `adi@buffadhd.com`. No forwarding to Itay/Emi at this stage.
3. **PII aggressiveness.** **Aggressive** — CC's call. Children's app default: scrub emails + display names + child profile names from breadcrumbs and event metadata. Implemented via `beforeSend` + `beforeBreadcrumb` hooks in Phase 1.4.
4. **Timing.** **Start now** — CC's call. v8 ships to Internal Testing today; Sentry-enabled v9 ready in ~24h means real-tester crashes from day 1 of broader rollout are captured. No reason to wait.
