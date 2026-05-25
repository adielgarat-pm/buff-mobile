# PR Draft — Copy/paste into GitHub

> CC pushed `pkg/sentry-eas-resumption` to origin. `gh` CLI is not authenticated locally, so the PR open step is on Adi.
> One-click URL: **https://github.com/adielgarat-pm/buff-mobile/pull/new/pkg/sentry-eas-resumption**

---

## Title (paste into GitHub PR title field)

```
feat(sentry-eas-resumption): Sentry crash monitoring + production AAB v10
```

---

## Body (paste into GitHub PR description field — `as Draft` if you want to merge after Phase 5)

```markdown
## TL;DR

Re-applies the work from 2026-05-16 (pkg/expo-health-and-eas-android +
pkg/sentry-crash-monitoring) that was lost when those branches were deleted
without merging to main. Ships a production AAB v10 with Sentry crash
monitoring to Play Console Internal Testing, ahead of the 2026-06-01 beta
launch (WhatsApp distribution).

## Background — why this PR exists

On 2026-05-16 two packages were paused mid-Phase-4 for regression testing
(see `docs/sessions/beta-2026-06-01/RESUMPTION_NOTES_2026-05-16.md` in git
history at `b5c723e` — not on main). Between 2026-05-16 and 2026-05-25 the
branches were deleted before regression resumed, and all the work — Sentry
SDK install, DSN wiring, eas.json env vars, App.tsx PII scrubbers, session
docs, the resumption notes themselves, and decisions D-2026-05-16-01 +
D-2026-05-16-02 — was lost from `main`.

Diagnosis 2026-05-25 confirmed:
- `app.json`, `eas.json`, `App.tsx`, `package.json` on main were bare of Sentry
- `expo-doctor` still 4 failures (Phase 1 of EAS package never landed)
- F-2026-05-05-01 status `open` (accurate — no doc drift to fix)
- EAS keystore `dG1dqozJHO`, EAS secret `SENTRY_AUTH_TOKEN`, Sentry DSN, Play
  Console listing all survived (cloud-side, not in repo)

Path chosen: **C — fresh build from current main + Sentry resumption from
zero**. Paths A (publish v9) and B (publish v8) rejected because their AABs
were from the 2026-05-16 codebase, missing 9 days of feature work merged
since (vibe-check, teen-ui-buddy-character, FCM, buddy-sync, dashboard-
toggle, timetable-import-fixes, timetable-split-groups, mobile-quickstart).

## What's in this PR (Phases 0-4 complete, Phase 5 + Closeout pending)

| Phase | Commit | What |
|---|---|---|
| 0 | `4740fd2` | docs/sessions/sentry-eas-resumption/ — SPEC, ROADMAP, TESTS, SPEC_SYNC, STATUS, README |
| 1 | `8e78ba1` | expo-doctor 4 → 0 (18/18 ✓): remove `android.supportsRTL`, install expo-font, align 9 packages to SDK 54 (incl. babel-preset-expo ^55 → ~54) |
| 2 | `9f70a19` | install `@sentry/react-native@~7.2.0`, plugin auto-added to app.json, EAS state verified (project + keystore + SENTRY_AUTH_TOKEN secret all present) |
| 3 | `7cc235d` | eas.json: 3 Sentry env vars on production + preview (dev clean). App.tsx: Sentry.init with aggressive PII scrubbing (beforeSend strips email/username/ip_address, beforeBreadcrumb regex-redacts emails), default export wrapped with Sentry.wrap |
| 4 | `88e1e1c` | EAS production build `c9aa1828-8495-45ac-8365-3153e6e864cb` FINISHED in 8m 35s. AAB v10: https://expo.dev/artifacts/eas/qUkBTuTYYccCZjUm1kSd1t.aab (expires 2026-06-24). PLAY_CONSOLE_v10_UPLOAD.md drafted for Phase 5 |
| extra | `e92d5ab` | added Sentry-dashboard preflight to upload guide after discovering SENTRY_AUTH_TOKEN is Secret-type and can't be verified via local CLI |

## Verification status

- ✓ `npx expo-doctor`: 18/18
- ✓ `npx tsc --noEmit`: clean
- ✓ EAS build: FINISHED (versionCode 10, keystore dG1dqozJHO reused)
- ⏸ Sentry source-map upload: **implicit pass** (build would have ERRORED if
  upload failed); explicit verification deferred to Phase 5 dashboard check +
  smoke crash test (see `docs/sessions/sentry-eas-resumption/PLAY_CONSOLE_v10_UPLOAD.md` § Pre-flight step 0)

## Phase 5 — Adi-side

Follow `docs/sessions/sentry-eas-resumption/PLAY_CONSOLE_v10_UPLOAD.md`:
1. (30 sec) Verify Sentry release `com.buffapp.mobile@1.0.0+10` exists with source maps in https://buffadhd.sentry.io/releases/
2. Download AAB → Play Console Internal Testing → Create release → paste EN+HE release notes from the guide → roll out
3. Install v10 on device via internal-testing link → confirm dashboard reachable
4. (Optional) Optional smoke crash + PII audit

## Closeout — after Adi confirms install

CC will autonomously commit:
- D-2026-05-25-XX × 2 in `docs/BUFF_DECISIONS_LOG.md` (Sentry re-adoption + work-loss root cause)
- IN-2026-05-25-XX in `docs/INTEGRATION_LEARNINGS.md` (lost-work pattern + mitigation: merge phase-complete commits when pause > 5 days)
- F-2026-05-05-01 marked Resolved with this commit's hash
- `CLAUDE.md` §Tech Stack: "EAS Build / Submit decision pending DevEx session" → "EAS Build production shipped to Play Console Internal Testing; Sentry crash monitoring integrated; EAS Submit deferred to future package"
- `CLAUDE.md` §Open FLAGs: Sentry-for-beta removed
- `git tag pkg/sentry-eas-resumption/v1`
- After merge: Verify-Before-Delete Protocol on branch
- Sentry post-deploy regression check 15+ min after merge

## Reference docs in this PR

- `docs/sessions/sentry-eas-resumption/SPEC.md` — target state, Values Check 9/9 pass
- `docs/sessions/sentry-eas-resumption/ROADMAP.md` — phase-by-phase plan
- `docs/sessions/sentry-eas-resumption/TESTS.md` — pass/fail criteria
- `docs/sessions/sentry-eas-resumption/STATUS.md` — phase tracker
- `docs/sessions/sentry-eas-resumption/PLAY_CONSOLE_v10_UPLOAD.md` — Adi runbook
- Plan file (out of repo): `~/.claude/plans/linked-gliding-bear.md`

## Coordination notes

- Branched from main `2d701cb` (post PR #79 merge)
- Built in worktree `.claude/worktrees/sentry-eas-resumption/` (parallel-CC incident — see memory entry `project-parallel-cc-pattern`)
- pkg/timetable-paste-mode is being worked on in parallel in the main worktree — files touched there are isolated from this PR (different code paths)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## After paste

- Check "Create as draft" if you want to merge AFTER Phase 5 (recommended)
- Or open as regular PR if you'd like CI to run while you do Phase 5
- Tell CC `v10 installed, dashboard reachable` after Phase 5 → CC does Closeout autonomously
