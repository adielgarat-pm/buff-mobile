# Sentry Crash Monitoring — Tests

> Concrete pass/fail criteria per phase.

## How tests run

- **Automated (CC):** `npm start`, `npx expo-doctor`, `eas build:list`, `eas secret:list`, JSON inspection of captured Sentry events.
- **Manual (Adi):** Phase 4.4 install + crash trigger + Sentry dashboard check. Phase 5 install + smoke test.

---

## Phase 1 — Install + config (no DSN)

### Automated (CC)
- [ ] `npx expo-doctor` reports 17/17 checks pass (no regression)
- [ ] `npm start` launches Metro within 30s; no Sentry init error in console
- [ ] `package.json` lists `@sentry/react-native` in dependencies
- [ ] `app.json` `expo.plugins` array contains `@sentry/react-native/expo`
- [ ] `App.tsx` imports Sentry, calls `Sentry.init`, exports `Sentry.wrap(App)`
- [ ] `beforeSend` and `beforeBreadcrumb` functions present in `Sentry.init` options

### Methodology
- [ ] STATUS.md Phase 1 row with commit hash

---

## Phase 2 — DSN wired

### Automated (CC)
- [ ] `eas.json` `build.production.env.EXPO_PUBLIC_SENTRY_DSN` is set
- [ ] `eas.json` `build.preview.env.EXPO_PUBLIC_SENTRY_DSN` is set
- [ ] `eas.json` `build.development.env.EXPO_PUBLIC_SENTRY_DSN` is NOT set (verify by grep)
- [ ] DSN does not appear in any `.env*` file, `App.tsx`, or any other tracked source

### Manual (Adi confirms)
- [ ] DSN was created via her own Sentry account at sentry.io

### Methodology
- [ ] STATUS.md Phase 2 row
- [ ] DECISIONS_LOG entry created (records the adoption, not the DSN itself)

---

## Phase 3 — Source-map upload configured

### Automated (CC)
- [ ] `npx eas-cli secret:list --scope project` returns `SENTRY_AUTH_TOKEN`
- [ ] Auth token not committed to repo (`git log --all -p -- ":!docs/sessions/sentry-crash-monitoring" | grep -i "sentry.*token"` empty)

### Manual (Adi confirms)
- [ ] Token was generated with scopes `project:releases`, `project:write`, `org:read` only — no overscoped permissions

### Methodology
- [ ] STATUS.md Phase 3 row

---

## Phase 4 — v9 build + crash verification

### Automated (CC)
- [ ] `eas build:list --platform android --profile production --limit 1 --json` returns one entry with `status: "finished"` (this becomes v9)
- [ ] EAS Build logs contain a line matching `Uploading source maps to Sentry` (or equivalent)
- [ ] Final code state has NO `Sentry.captureException(new Error("phase-4-test"))` or temporary crash-trigger UI

### Manual (Adi)
- [ ] Adi installs v9 from Internal Testing link
- [ ] Adi triggers the temporary crash affordance (button or auto-trigger)
- [ ] Within 60s, Sentry dashboard shows the event
- [ ] Event stack trace shows `App.tsx:XX` or other TypeScript file paths — NOT `bundle.js:YY:ZZ`
- [ ] Event breadcrumbs trail visible: at least app start + navigation breadcrumb
- [ ] Adi receives email alert at `adi@buffadhd.com` for the new crash signature

### PII audit (manual JSON inspection — CC + Adi)
- [ ] `event.user.email` is absent or `[Filtered]`
- [ ] `event.user.username` is absent or `[Filtered]`
- [ ] `event.user.ip_address` is absent or `[Filtered]`
- [ ] No raw email regex matches in `event.breadcrumbs[*].message`
- [ ] No child profile display names in any event field

### Methodology
- [ ] STATUS.md Phase 4 row
- [ ] DECISIONS_LOG entry for v9 + Sentry live
- [ ] INTEGRATION_LEARNINGS entry IF source-map upload or PII scrubbing surfaced anything novel

---

## Phase 5 — Play Console upload

### Manual (Adi)
- [ ] Play Console → BUFF → Internal Testing → release exists with v9 AAB
- [ ] Install on Pixel_7 AVD or real device succeeds
- [ ] App launches without crash
- [ ] Google OAuth sign-in succeeds
- [ ] Reaches parent or child dashboard

### Methodology
- [ ] STATUS.md Phase 5 row + Play Console release link
- [ ] CLAUDE.md §Tech Stack updated

---

## Closeout

- [ ] All 5 phases passed
- [ ] Git tag `pkg/sentry-crash-monitoring/v1` created
- [ ] No drift between canonical docs and live state (Sentry receiving events from real testers proves end-to-end)
