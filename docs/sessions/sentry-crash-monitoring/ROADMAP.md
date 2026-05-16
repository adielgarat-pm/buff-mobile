# Sentry Crash Monitoring — Roadmap

> 6 phases with explicit stop conditions. Each chunk is a hard stop for diff review.

---

## Phase 1 — Install Sentry dep + config plugin (no DSN yet)

**Scope:** Add `@sentry/react-native` dep, register the Expo config plugin in `app.json`, edit `App.tsx` to init Sentry with PII scrubbing and wrap root with `Sentry.wrap()`. No DSN configured yet — init is a no-op until Phase 2 wires the env var.

**תנאי עצירה:**
- `@sentry/react-native` appears in `package.json` dependencies
- `app.json` `expo.plugins` includes the Sentry plugin
- `App.tsx` calls `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN, ... })` at module top
- `App.tsx` default export wrapped with `Sentry.wrap(App)`
- `beforeSend` and `beforeBreadcrumb` PII-scrubbing hooks present and tested in isolation
- `npm start` launches Metro and renders the app without Sentry-related errors
- `npx expo-doctor` still passes 17/17

**Chunks:**
- 1.1 — `npx expo install @sentry/react-native`
- 1.2 — Add `@sentry/react-native/expo` to `app.json` `expo.plugins`
- 1.3 — Edit `App.tsx`: import Sentry, init at module top, wrap default export
- 1.4 — Add `beforeSend` + `beforeBreadcrumb` PII scrubbers
- 1.5 — Smoke test: `npm start` + `npx expo-doctor`

**Exit Deliverables:**
- [ ] Code changes in `App.tsx`, `app.json`, `package.json`, `package-lock.json`
- [ ] STATUS.md Phase 1 row
- [ ] No INTEGRATION_LEARNINGS entry needed yet

---

## Phase 2 — DSN configuration (Adi-only blocker, then CC wires)

**Adi-only:**
1. Sign up at sentry.io with `adi@buffadhd.com`
2. Create project: framework "React Native", name "buff-mobile"
3. Copy the DSN (format: `https://abc@def.ingest.sentry.io/123`)
4. Paste DSN to CC

**CC-driven (after Adi pastes DSN):**
- 2.1 — Add `EXPO_PUBLIC_SENTRY_DSN` to `eas.json` `build.production.env` and `build.preview.env` (NOT `build.development.env`)

**תנאי עצירה:**
- `eas.json` has DSN in production + preview env
- DSN is not committed in any other location (no `.env` file, no `App.tsx` hardcode)
- Development profile has no DSN (intentional — keeps dev crashes out of Sentry quota)

**Exit Deliverables:**
- [ ] `eas.json` updated
- [ ] STATUS.md Phase 2 row
- [ ] DECISIONS_LOG entry `D-2026-05-16-XX` recording Sentry adoption + DSN-storage approach (DSN itself not in the entry — env var name only)

---

## Phase 3 — Source-map auto-upload via EAS

**Adi-only:**
1. Sentry → Settings → Auth Tokens → Create new token
2. Scope: `project:releases`, `project:write`, `org:read`
3. Paste token to CC

**CC-driven:**
- 3.1 — `npx eas-cli secret:create --scope project --name SENTRY_AUTH_TOKEN --value <token> --type string`
- 3.2 — Verify Sentry plugin is configured to auto-upload (default behavior; may need plugin-config block in app.json)
- 3.3 — Trigger preview build to confirm source-map upload appears in EAS Build logs (optional verification; can be combined with Phase 4)

**תנאי עצירה:**
- `eas secret:list` shows `SENTRY_AUTH_TOKEN` as a project secret
- (Phase 4) EAS Build logs contain a line like "Uploading source maps to Sentry"

**Exit Deliverables:**
- [ ] EAS secret set (`eas secret:list` proves)
- [ ] STATUS.md Phase 3 row

---

## Phase 4 — v9 build + crash verification

**Chunks:**
- 4.1 — Add a temporary dev-only "Force crash" button to a debug screen, OR add `Sentry.captureException(new Error("phase-4-test"))` behind a flag at app launch
- 4.2 — `npx eas build --platform android --profile production --non-interactive --no-wait`
- 4.3 — Wait for build (polling pattern from previous package), verify "Uploading source maps to Sentry" in build logs
- 4.4 — Adi installs v9 from internal testing → triggers test crash → CC + Adi verify event in Sentry dashboard
- 4.5 — Inspect captured event JSON manually: confirm no PII (no emails, no display names, no IP) in `event.user`, `event.tags`, `event.contexts`, or `event.breadcrumbs[*].message`
- 4.6 — Remove the temporary crash trigger; verify removal didn't break anything

**תנאי עצירה:**
- Build status: `finished`
- Sentry dashboard shows the test event with: readable stack trace mapping to TypeScript source (`App.tsx:XX` not `bundle.js:YY:ZZ`); breadcrumbs trail; no PII leaked
- Email alert hit `adi@buffadhd.com`
- Test trigger removed from code; final code state has no debug crash affordance

**Exit Deliverables:**
- [ ] DECISIONS_LOG entry `D-2026-05-16-XX` recording v9 build + Sentry working
- [ ] STATUS.md Phase 4 row with build ID + Sentry event link
- [ ] INTEGRATION_LEARNINGS IN-2026-05-16-XX if anything novel about the Sentry/EAS integration emerged

---

## Phase 5 — v9 to Play Console Internal Testing

100% Adi-driven (Play Console UI account-bound). CC drafts the upload instructions document referencing v9 + Sentry-enabled.

**תנאי עצירה:**
- v9 live in Play Console Internal Testing track
- Adi (or a tester) installs v9, opens, signs in, reaches dashboard
- No Sentry init errors visible at app launch (Sentry init is silent on success)

**Exit Deliverables:**
- [ ] STATUS.md Phase 5 row + Play Console release link
- [ ] `CLAUDE.md` §Tech Stack — add Sentry to the live observability stack (replace "Sentry/Crashlytics (observability)" in the future-list with current state)
- [ ] Closeout checklist below

---

## Closeout

- [ ] All 5 phases passed per TESTS.md
- [ ] Canonical docs synced per SPEC_SYNC.md
- [ ] Git tag created: `pkg/sentry-crash-monitoring/v1`
- [ ] STATUS.md closeout checklist complete
- [ ] PR to main, fast-forward merge, branch deleted (Verify-Before-Delete Protocol)
