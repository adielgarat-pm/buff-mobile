# Package: in-app-updates

**Status:** DESIGN — awaiting Adi approval (not yet committed, no code written)
**Branch (proposed):** `pkg/in-app-updates` (cut fresh from `main`)
**Type:** Improvement Package (adds a new dependency → mandatory per WORKFLOW §"מתי משתמשים")
**Opened:** 2026-06-17
**Owner:** Adi (PO) · CC (implementer)

---

## One-line problem

Testers (Noa, and anyone whose Play Store "Auto-update apps" is set to **Wi-Fi only**) stay
stuck on an old build and hit a Google Play "Something went wrong" dialog, while the app gives
them **no in-app signal** that a newer version exists. There is no way for BUFF to say
"a new version is available — tap to update."

## One-line solution

Add Google Play **In-App Updates** (native API) so BUFF detects when a newer build is on the
track and shows a **non-blocking "Update available" prompt** (Flexible flow), with an optional
**blocking** flow reserved for critical hotfixes (e.g. the 1.6.2 Android-launch fix).

---

## Files in this package

| File | Role |
|---|---|
| `SPEC.md` | Target state + Capability Check + Values Check |
| `ROADMAP.md` | Phase sequence with stop conditions |
| `TESTS.md` | Pass/fail criteria per phase (incl. Reachability test) |
| `SPEC_SYNC.md` | Which canonical docs update, in which phase |
| `STATUS.md` | Phase status tracker (CC updates at each phase exit) |

## Why this matters now

This is the same failure mode that made the **1.6.2 Android-launch hotfix** slow to reach
testers: people sit on stale builds with no nudge. An in-app "update now" banner shortens
hotfix propagation dramatically. See memory `native_import_sentry_blindspot` + the 1.6.2 train.
