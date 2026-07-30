# STATUS — parent-ia-and-aha

| Phase | State | Date | Tests | Notes |
|---|---|---|---|---|
| **0 — valence fix** | PR open | 2026-07-30 | tsc ✅ · jest 19/19 (insight consumers) ✅ | `useParentInsights.ts:272` — positive card unshifted to hero; no longer suppressed by a single low category. <70% neutral-lead/silence = deferred to Phase 2 (copy decision, Adi). |
| **1 — stop losing `source` + tab audit + mainChallenge** | PR open | 2026-07-30 | tsc ✅ · jest 30/30 (hook consumers) ✅ · bundle builds clean (HTTP 200) | `daily_progress.source` written in completeTask via role+isChildPreview (null-safe ModeContext read); `parent_tab_viewed` listener on ParentTabs (child_id always null); `mainChallenge` → `tasks_generated.variant`. |

## Verification status

- **Compile/type/test:** green. tsc clean; 30 unit tests pass; dev bundle builds and serves (HTTP 200, no transform error).
- **⚠️ Runtime write-verification PENDING:** the emulator dev-launcher timed out loading the 17.7 MB dev bundle (infra, not code). The two live writes — a `parent_tab_viewed` row on tab focus, and a non-null `daily_progress.source` on completion — must be confirmed against the live tables once the code reaches a device (post-OTA on a real device, or a later emulator session), BEFORE relying on the data or cutting a release. Do NOT mark these "verified" until real rows are observed.

## Corrections logged this session (facts CC had wrong, caught by the panel)

- `mainChallenge` is NOT lost — it persists in `pro_settings.onboarding_data` (45/138 child profiles). Only `daily_progress.source` was being burned.
- The §4.6 fallback fires for 14 families, 8 on day-0 (false positives), not "2 families" — detector needs min-3-tasks + tenure guards (Phase 3).

## Next

- **Phase 2** (nav redesign: Plan segmented + Progress tab + gate inversion + de-brand door with approved copy) — separate PR after this lands (#390 no-stacking).
- **Checkpoint** before Phase 3: run corrected fallback query; proceed only if ≥3 real families show a detectable AHA.
