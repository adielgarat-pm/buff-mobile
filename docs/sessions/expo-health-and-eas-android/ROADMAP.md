# Expo Health + EAS Android — Roadmap

> 4 phases with explicit stop conditions. Each chunk is a hard stop for diff review.

---

## Phase 1 — expo-doctor: 4 → 0 failures

**Scope:** Remove unknown `android.supportsRTL` field; add `expo-font` as direct dep to satisfy peer; run `npx expo install --check` to align `babel-preset-expo` + 8 patch mismatches.

**תנאי עצירה (concrete, measurable):**
- `npx expo-doctor` → 0 failures, 0 warnings about version mismatches
- `npm start` launches Metro without error
- All changes are `package.json` / `package-lock.json` / `app.json` only — no `src/` touched

**Chunks:**
- 1.1 — Remove `android.supportsRTL` from `app.json`
- 1.2 — `npx expo install expo-font` (promotes transitive to direct dep)
- 1.3 — `npx expo install --check` and accept proposed corrections
- 1.4 — Verify `npx expo-doctor` reports 0 failures

**Exit Deliverables:**
- [ ] `app.json` edited
- [ ] `package.json` + `package-lock.json` updated
- [ ] `docs/INTEGRATION_LEARNINGS.md` — move F-2026-05-05-01 to "Resolved" section (per SPEC_SYNC.md)
- [ ] `STATUS.md` — Phase 1 row with commit hash + `npx expo-doctor` output snippet
- [ ] Values Check still passes (still N/A for child surfaces)

---

## Phase 2 — EAS-managed Android credentials

**Scope:** Authenticate eas-cli, generate EAS-managed Android upload keystore in the cloud, decide on `android/` directory checked-in vs gitignored.

**תנאי עצירה:**
- `npx eas credentials` shows a keystore exists for Android `production`
- SHA-1 + SHA-256 fingerprints captured and written into `SPEC.md` Capabilities section
- `android/` decision made (chunk 2.3) — either gitignored + removed from index, or explicitly kept

**Chunks:**
- 2.1 — `npx eas-cli --version` ≥ 18.6.0 (or fall back to `npx eas-cli@latest`)
- 2.2 — `npx eas credentials` → Android → production → "Set up a new keystore" → let EAS generate. Capture fingerprints from output.
- 2.3 — Decide `android/` handling (gitignore + `git rm -r --cached android/` if option a). Surface diff first.

**Adi-required action (before 2.2):** Confirm `eas login` is authenticated to the account owning project `8796128b-5e2d-4c0e-9c41-016e87c62ab7`. CC cannot do this — account-bound.

**Exit Deliverables:**
- [ ] `SPEC.md` Capabilities section updated with fingerprints
- [ ] `.gitignore` updated (if option a chosen) and `android/` removed from index
- [ ] `STATUS.md` — Phase 2 row with commit hash

---

## Phase 3 — First production AAB build (cloud)

**Scope:** Trigger EAS Build, monitor, verify artifact, capture build metadata.

**תנאי עצירה:**
- EAS Build status: `finished`, no errors
- AAB artifact URL returned
- AAB signing fingerprint matches Phase 2.2 capture
- Build ID + version code captured

**Chunks:**
- 3.1 — Pre-flight: reconfirm `eas.json production.android.buildType == "app-bundle"` and `app.json` versionCode is 1
- 3.2 — `npx eas build --platform android --profile production --non-interactive`
- 3.3 — Pull artifact metadata via `eas build:list --platform android --limit 1 --json`; CC reports URL, build ID, fingerprint to Adi

**If the build fails:** Stop. Read `eas build:view <id>`. Diagnose before any retry. Likely failure modes: a doctor regression slipped through (re-check Phase 1), a native module mis-config, or a credentials hiccup.

**Exit Deliverables:**
- [ ] `docs/BUFF_DECISIONS_LOG.md` — new entry `D-2026-05-16-XX` recording the signing approach, build ID, fingerprint
- [ ] `STATUS.md` — Phase 3 row with commit hash + build ID
- [ ] `docs/INTEGRATION_LEARNINGS.md` — IN-2026-05-16-XX entry if `android/` handling or first build surfaced anything surprising

---

## Phase 4 — Manual upload to Play Console Internal Testing

**Scope:** Adi uploads the AAB to Play Console Internal Testing. CC supports with release notes draft + checklist.

**תנאי עצירה:**
- Play Console Internal Testing track shows an active release
- Adi (as first internal tester) successfully installs BUFF via the internal testing link
- App launches; Google OAuth login succeeds; child/parent dashboard reachable

**Chunks:**
- 4.1 — CC produces: release notes (EN + HE), pre-upload checklist (listing fields needed), upload instruction sheet
- 4.2 — Adi uploads AAB → Play Console → Internal Testing → Create release → Upload → Roll out
- 4.3 — Adi verifies install on Pixel_7 AVD or real Android device

**Adi-driven (100%) per CLAUDE.md delegation rules.** CC has no Play Console API access in this package.

**Exit Deliverables:**
- [ ] `CLAUDE.md` §Tech Stack line 226 — update "EAS Build / Submit decision pending DevEx session" to reflect the shipped state
- [ ] `STATUS.md` — Phase 4 row with commit hash + Play Console release link
- [ ] Closeout checklist below ticked

---

## Closeout

- [ ] All phases pass per TESTS.md
- [ ] Canonical docs synced per SPEC_SYNC.md (verified: F-2026-05-05-01 resolved; CLAUDE.md updated; new D-entry in DECISIONS_LOG)
- [ ] Git tag created: `pkg/expo-health-and-eas-android/v1`
- [ ] STATUS.md closeout checklist complete
- [ ] PR to main, fast-forward merge, branch deleted (per Verify-Before-Delete Protocol)
