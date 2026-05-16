# Expo Health + EAS Android — Tests

> Concrete, verifiable pass/fail criteria for each phase.

## How tests are run

- **Automated (CC runs):** CLI checks — `expo-doctor`, `npm start` smoke, `eas-cli` version, `eas build:list`, `eas credentials` query
- **Manual on device (Adi runs):** Phase 4 install + smoke test only. No emulator UI work in this package.

---

## Phase 1 — expo-doctor clean

### Automated (CC)
- [ ] `npx expo-doctor` exits 0; no "X failed" lines in output
- [ ] `npx expo-doctor` shows `android.supportsRTL` schema warning is gone
- [ ] `npx expo-doctor` shows `expo-font` peer-dep warning is gone
- [ ] `npx expo-doctor` shows no major-version mismatch for `babel-preset-expo`
- [ ] `npm start` launches Metro and prints "Logs for your project will appear below" within 30 seconds (no exit, no error)

### Methodology
- [ ] STATUS.md row added: Phase 1, state=passed, commit hash, expo-doctor output snippet
- [ ] INTEGRATION_LEARNINGS.md: F-2026-05-05-01 moved to "Resolved" section in same commit
- [ ] Values Check still N/A (no child surface changed) — confirmed in commit message

---

## Phase 2 — EAS credentials configured

### Automated (CC)
- [ ] `npx eas credentials --platform android --json` (or interactive listing) returns a keystore for `production`
- [ ] SHA-1 + SHA-256 fingerprints captured + written to SPEC.md Capabilities section
- [ ] If option (a) `android/` removal chosen: `git ls-files android/` returns empty; `.gitignore` contains `android/`

### Manual (Adi confirms before chunk 2.2)
- [ ] `eas whoami` returns the account that owns project `8796128b-5e2d-4c0e-9c41-016e87c62ab7`

### Methodology
- [ ] STATUS.md row added: Phase 2, state=passed, commit hash
- [ ] SPEC.md Capabilities section now has filled-in fingerprints

---

## Phase 3 — First production AAB build

### Automated (CC)
- [ ] `eas build:list --platform android --limit 1 --json` returns one entry with `status: "finished"` and `channel: "production"`
- [ ] The build entry's `artifacts.applicationArchiveUrl` is a valid URL (HTTP 200 on HEAD)
- [ ] Build's `releaseChannel` or `distribution` is `internal` (per eas.json production profile)
- [ ] Build's metadata shows `appVersion: "1.0.0"` and `appBuildVersion` matching expected versionCode

### Methodology
- [ ] STATUS.md row added: Phase 3, state=passed, commit hash, build ID
- [ ] BUFF_DECISIONS_LOG.md: new D-2026-05-16-XX entry recording the build
- [ ] INTEGRATION_LEARNINGS.md: IN-2026-05-16-XX entry IF anything in Phase 2/3 surprised us

---

## Phase 4 — Internal Testing track live

### Manual (Adi)
- [ ] Play Console → BUFF → Testing → Internal Testing → release exists with status "Released" or "Available to testers"
- [ ] Internal testing link returns a Play Store install screen on Android
- [ ] Install on Pixel_7 AVD (or real device) succeeds
- [ ] App launches without crash
- [ ] Sign-in via Google OAuth reaches dashboard
- [ ] Either child or parent flow renders one full screen (no white screen / no crash)

### Methodology
- [ ] STATUS.md row added: Phase 4, state=passed, commit hash, Play Console release link
- [ ] CLAUDE.md §Tech Stack line 226 updated in same commit
- [ ] STATUS.md closeout checklist all ticked

---

## Closeout

- [ ] All 4 phases passed
- [ ] STATUS.md closeout complete
- [ ] Git tag `pkg/expo-health-and-eas-android/v1` created
- [ ] No drift between canonical docs and the live state (`expo-doctor` clean, AAB shipped, CLAUDE.md updated)
- [ ] End-to-end manual smoke: from Play Store internal testing link → install → open → sign in → dashboard works
