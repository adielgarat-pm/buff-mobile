# Sentry + EAS Resumption — Tests

> קריטריוני pass/fail לכל פאזה. **קונקרטי וניתן לאימות.**

## איך מריצים בדיקות

- **CC מריץ אוטומטית:** `npx expo-doctor`, `npx tsc --noEmit`, `npx eas project:info`, `npx eas secret:list`, `npx eas build:view`
- **Adi מריצה ידנית:** Play Console UI (Phase 5), device install, smoke test
- **Sentry log health check** — N/A pre-merge (this IS the Sentry package). Post-merge regression check runs at Closeout per template convention.

---

## פאזה 0 — Branch setup + session folder

### בדיקות אוטומטיות (CC מריץ)
- [x] `git status` → working tree clean on `pkg/sentry-eas-resumption`
- [x] All 5 session files exist (README, SPEC, ROADMAP, TESTS, SPEC_SYNC, STATUS)
- [x] SPEC.md Values Check 9/9 marked

### בדיקות מתודולוגיות
- [x] STATUS.md row for Phase 0
- [x] Stash entry `stash@{0}` preserved with descriptive label

**Pass condition:** All boxes checked; Adi approves SPEC before Phase 1.

---

## פאזה 1 — expo-doctor 4 → 0 + doc drift fix

### בדיקות אוטומטיות (CC מריץ)
- [ ] `npx expo-doctor` returns 17/17 ✓ (zero failures)
- [ ] `npx tsc --noEmit` exits 0
- [ ] `git grep "F-2026-05-05-01" docs/INTEGRATION_LEARNINGS.md` shows accurate status reflecting 5/16 loss + 5/25 reconfirmation

### בדיקות ידניות באמולטור (Adi)
- [ ] N/A — no runtime code changed

### בדיקות מתודולוגיות
- [ ] STATUS.md row for Phase 1 (state=passed)
- [ ] INTEGRATION_LEARNINGS.md F-2026-05-05-01 updated (per SPEC_SYNC)
- [ ] Values Check still passes (no user-facing change)

---

## פאזה 2 — Install Sentry + verify EAS secrets

### בדיקות אוטומטיות (CC מריץ)
- [ ] `npx eas project:info` confirms project `8796128b-5e2d-4c0e-9c41-016e87c62ab7`, owner `iamadi79`
- [ ] `npx eas secret:list` shows `SENTRY_AUTH_TOKEN` (id `da05ed42`)
- [ ] `npx eas credentials --platform android` shows keystore `dG1dqozJHO (default)` (or equivalent — may require interactive; fallback: capture EAS dashboard URL for Adi)
- [ ] `package.json` contains `@sentry/react-native@~7.2.0`
- [ ] `app.json` plugins array contains `@sentry/react-native/expo`
- [ ] `npx expo-doctor` 17/17 ✓ (no regression from Phase 1)
- [ ] `npx tsc --noEmit` clean

### בדיקות מתודולוגיות
- [ ] STATUS.md row for Phase 2 (state=passed OR state=blocked if remediation surfaced)
- [ ] No new INTEGRATION_LEARNINGS unless surprise

---

## פאזה 3 — Wire DSN + Sentry.init + PII scrubbers

### בדיקות אוטומטיות (CC מריץ)
- [ ] `eas.json` `build.production.env` has `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG=buffadhd`, `SENTRY_PROJECT=react-native`
- [ ] `eas.json` `build.preview.env` has the same 3 vars
- [ ] `eas.json` `build.development.env` does NOT have DSN
- [ ] `App.tsx` imports `* as Sentry from '@sentry/react-native'`
- [ ] `App.tsx` has `Sentry.init(...)` call with `beforeSend` + `beforeBreadcrumb`
- [ ] Default export wrapped with `Sentry.wrap(...)`
- [ ] `npx tsc --noEmit` clean

### בדיקות מתודולוגיות
- [ ] STATUS.md row for Phase 3
- [ ] No INTEGRATION_LEARNINGS unless surprise
- [ ] D-2026-05-25-XX drafted (Sentry adoption)

---

## פאזה 4 — First production AAB v10 build + verify source-map upload

### בדיקות אוטומטיות (CC מריץ)
- [ ] `npx eas build:view <id>` returns state=FINISHED
- [ ] Build logs contain "Uploading source maps to Sentry" (or equivalent — exact phrase verified from build logs)
- [ ] AAB artifact URL accessible
- [ ] versionCode = 10 (EAS auto-incremented from 9 — confirmed by build artifact metadata)

### בדיקות מתודולוגיות
- [ ] STATUS.md row for Phase 4 with build ID + AAB URL + versionCode
- [ ] D-2026-05-25-XX drafted (first AAB v10)

---

## פאזה 5 — Play Console + smoke test

### בדיקות ידניות (Adi via Play Console UI)
- [ ] AAB v10 uploaded to Internal Testing for `com.buffapp.mobile`
- [ ] Release rolled out
- [ ] Internal-testing link installs v10 on her device
- [ ] App opens; reaches dashboard

### בדיקות אוטומטיות + ידניות (Sentry verification)
- [ ] Test crash triggered via hidden dev affordance or one-off script (mechanism finalized in Phase 4.4)
- [ ] Sentry dashboard shows the event within 60s
- [ ] Stack trace is symbolicated (TypeScript source line numbers visible)
- [ ] Breadcrumbs visible (navigation events at minimum)
- [ ] Email alert reached `adi@buffadhd.com`

### בדיקות PII (manual JSON audit)
- [ ] Captured event JSON does NOT contain any email address
- [ ] Captured event JSON does NOT contain child names (Etay, Emi, Itay, Mattan, Leia)
- [ ] Captured event JSON does NOT contain IP address
- [ ] Breadcrumb messages do not contain email patterns

### בדיקות מתודולוגיות
- [ ] STATUS.md row for Phase 5
- [ ] IN-2026-05-25-XX drafted (lost-work pattern)

---

## Closeout

- [ ] כל בדיקות הפאזות עוברות
- [ ] STATUS.md closeout checklist הושלם
- [ ] Git tag `pkg/sentry-eas-resumption/v1` נוצר
- [ ] אין drift בין canonical docs לבין המערכת החיה
- [ ] PR ל-main מוכן
- [ ] **Sentry post-deploy regression check** — מינ' 15 דק' אחרי merge. Note: this IS the Sentry merge; there is no prior Sentry baseline. Post-merge run = first-ever baseline.
  - Run pattern from TESTS.md template § Sentry log health check
  - Expected: 0 unrelated new issues; smoke-test crash is the only event
- [ ] **Verify-Before-Delete Protocol** before any branch deletion (per CLAUDE.md § Verify-Before-Delete Protocol)
