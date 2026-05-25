# Sentry + EAS Resumption — Roadmap

> פאזות עם תנאי עצירה מפורשים. כל גבול פאזה הוא שער שניתן לבדוק.

## פאזה 0 — Branch setup + session folder ✅ (this commit)

**Scope:** Stash WIP, branch from main, create session folder with all docs.

**תנאי עצירה:**
- Working tree clean on `pkg/sentry-eas-resumption`
- 5 session files exist (README, SPEC, ROADMAP, TESTS, SPEC_SYNC, STATUS)
- SPEC.md Values Check passes 9/9

**Exit Deliverables:**
- [x] Session folder created
- [x] All docs filled in
- [x] STATUS.md row added (Phase 0 passed)
- [ ] Adi reviews + approves SPEC before Phase 1

---

## פאזה 1 — expo-doctor 4 → 0 + doc drift fix

**Scope:** Resolve the 4 expo-doctor failures inherited from main + correct F-2026-05-05-01 doc drift in INTEGRATION_LEARNINGS.

**Chunks (CC plan-mode approval per chunk):**
- 1.1: `npx expo install expo-font` (peer dep + duplicate version fix)
- 1.2: Align patch versions on the 9 packages reported by doctor — `npx expo install <list>`
- 1.3: Investigate `babel-preset-expo` major mismatch (^55 vs SDK 54 expects ~54). **Surface to Adi before action** — version downgrade is risky.
- 1.4: Verify `npx expo-doctor` returns 17/17 ✓
- 1.5: Verify `npx tsc --noEmit` clean
- 1.6: Correct F-2026-05-05-01 doc drift in INTEGRATION_LEARNINGS.md — reflect the 2026-05-16 loss + 2026-05-25 reconfirmation

**תנאי עצירה:**
- `npx expo-doctor` 17/17 ✓
- `npx tsc --noEmit` clean
- F-2026-05-05-01 accurate

**Exit Deliverables:**
- [ ] All chunks committed
- [ ] STATUS.md row for Phase 1
- [ ] INTEGRATION_LEARNINGS.md F-2026-05-05-01 corrected (per SPEC_SYNC)
- [ ] Values Check still passes (re-verify against implementation, not just SPEC)

---

## פאזה 2 — Install Sentry + verify EAS secrets

**Scope:** Verify EAS cloud state (keystore, secrets, project) + install Sentry SDK.

**Chunks:**
- 2.1: `npx eas project:info` + `npx eas secret:list` — confirm project `8796128b-5e2d-4c0e-9c41-016e87c62ab7`, keystore `dG1dqozJHO`, secret `SENTRY_AUTH_TOKEN` (id `da05ed42`). **If any missing → STOP**, surface remediation list to Adi.
- 2.2: `npx expo install @sentry/react-native@~7.2.0` (known-good for SDK 54)
- 2.3: Verify Sentry plugin auto-added to `app.json` plugins array
- 2.4: `npx expo-doctor` 17/17 ✓ + `tsc --noEmit` clean

**תנאי עצירה:**
- EAS cloud state verified OR remediation surfaced
- `@sentry/react-native@7.2.0` in deps
- Sentry plugin in app.json plugins
- doctor + tsc clean

**Exit Deliverables:**
- [ ] Phase commit with package.json + app.json changes
- [ ] STATUS.md row for Phase 2
- [ ] No new INTEGRATION_LEARNINGS entries unless surprises

---

## פאזה 3 — Wire DSN + Sentry.init + PII scrubbers

**Scope:** Wire Sentry config into eas.json + add init + wrap + PII scrubbing in App.tsx.

**Adi-side prep:** Confirm Sentry DSN (or supply if Phase 2 revealed rotation).

**Chunks:**
- 3.1: Add `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG=buffadhd`, `SENTRY_PROJECT=react-native` to `eas.json` `build.production.env` + `build.preview.env`. Dev profile clean.
- 3.2: App.tsx — import, init, wrap, PII scrubbers (`beforeSend`, `beforeBreadcrumb`)
- 3.3: Verify `tsc --noEmit` clean

**תנאי עצירה:**
- eas.json has 3 Sentry env vars on production + preview only
- App.tsx imports + init + wrap + scrubbers present
- tsc clean

**Exit Deliverables:**
- [ ] Phase commit
- [ ] STATUS.md row for Phase 3
- [ ] No INTEGRATION_LEARNINGS unless surprises
- [ ] D-2026-05-25-XX (Sentry adoption) drafted (committed at Closeout)

---

## פאזה 4 — First production AAB v10 build + verify source-map upload

**Scope:** Trigger cloud build, monitor to completion, verify source-map upload.

**Chunks:**
- 4.1: `npx eas build --platform android --profile production --non-interactive --no-wait` — trigger; save build ID
- 4.2: Monitor via `npx eas build:view <id>` until FINISHED (ETA 8-12 min); can run in background
- 4.3: Grep build logs for "Uploading source maps to Sentry" or equivalent
- 4.4: Capture AAB artifact URL + versionCode (expected: 10, EAS auto-increment)

**תנאי עצירה:**
- Build state FINISHED
- Source-map upload confirmed in logs
- AAB URL captured
- versionCode = 10

**Exit Deliverables:**
- [ ] Phase commit (no code change; STATUS update + AAB metadata into SPEC if needed)
- [ ] STATUS.md row for Phase 4
- [ ] D-2026-05-25-XX (first AAB v10) drafted (committed at Closeout)

---

## פאזה 5 — Play Console Internal Testing upload + smoke test

**Scope:** Adi uploads v10 to Play Console Internal Testing; smoke test on her device; PII audit on first captured event.

**Adi-side actions (CC cannot — Play Console UI is account-bound):**
- Download v10 AAB from EAS artifact URL
- Play Console → `com.buffapp.mobile` → Internal Testing → Create release → Upload v10 AAB
- Verify upload-key fingerprint matches keystore
- Add testers (existing Internal Testing list)
- Roll out to Internal Testing
- Install via internal-testing link on her device
- Verify app opens, reaches dashboard

**CC chunks:**
- 5.1: Draft release notes (EN + HE) covering Sentry + 9 days of feature work since v8
- 5.2: Produce `PLAY_CONSOLE_v10_UPLOAD.md` step-by-step guide

**Smoke test (Adi triggers, both verify):**
- Trigger `Sentry.captureException(new Error("v10 smoke test"))` once via hidden dev affordance or by running `npx tsx scripts/test-sentry.ts` (or similar). **Specifics decided in Phase 4.4.**
- Confirm event appears in Sentry within 60s, stack trace readable
- PII audit on the captured event JSON: no emails, no child names, no IP

**תנאי עצירה:**
- v10 installed on Adi's device
- Dashboard reachable
- Test crash visible in Sentry, symbolicated
- PII audit clean

**Exit Deliverables:**
- [ ] STATUS.md row for Phase 5
- [ ] INTEGRATION_LEARNINGS.md IN-2026-05-25-XX (lost work pattern + mitigation)

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] `docs/BUFF_DECISIONS_LOG.md` עודכן:
  - D-2026-05-25-XX — Sentry re-adopted after 5/16 work lost; first AAB v10 with Sentry shipped
  - D-2026-05-25-XX — Cause of 5/16 work loss documented + prevention (Verify-Before-Delete Protocol reinforcement)
- [ ] `docs/INTEGRATION_LEARNINGS.md` עודכן:
  - IN-2026-05-25-XX — Lost-work pattern + mitigation (merge phase-complete commits when pause > 5 days)
  - F-2026-05-05-01 re-marked Resolved with correct date + commit
- [ ] `CLAUDE.md` §Tech Stack updated: "EAS Build / Submit decision pending DevEx session" → "EAS Build production profile shipped to Play Console Internal Testing; Sentry crash monitoring integrated; EAS Submit deferred to future package"
- [ ] `CLAUDE.md` §Open FLAGs updated — Sentry-for-beta is no longer open
- [ ] STATUS.md closeout checklist complete
- [ ] Git tag `pkg/sentry-eas-resumption/v1`
- [ ] PR to main
- [ ] **Verify-Before-Delete Protocol** before any branch deletion (this incident is exactly why the protocol exists — do not skip)
