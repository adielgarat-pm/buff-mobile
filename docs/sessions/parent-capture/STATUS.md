# Parent Capture — STATUS

**Branch:** `pkg/parent-capture` (isolated dev home; `main` stays clean & releasable).
**State:** `Plan Mode — Phase 0 verification done. Build NOT approved (2 gates open).`

| Phase | State | Date | Notes |
|---|---|---|---|
| 0 — Foundation & verification | ✅ done (read-only) | 2026-06-05 | See `PHASE0_FINDINGS.md`. No code, no schema changes. |
| 1 — `parse-capture` Edge Fn | ⛔ blocked | — | 🔒 Gemini paid-key approval |
| 2 — Schema + RLS | ⛔ awaiting approval | — | Additive: `parent_items`, `capture_runs`, optional `grade_level` |
| 3 — CaptureScreen + in-app entry | 🟢 buildable now (no new dep, behind stub) | — | uses existing expo-clipboard / image-picker |
| 4 — ConfirmCard | 🟢 buildable now (stub) | — | incl. `category` enum mapping |
| 5 — Transfer-to-child | 🟡 buildable (touches prod `tasks`) | — | path verified; build last, behind flag |
| 6 — "This Week" surface | 🟢 buildable now (stub) | — | calm pull + recency |
| 7 — Android share target | 🔒 new-dep gate | — | needs `expo-share-intent` + rebuild + Adi approval |
| 8 — Privacy/consent + i18n | ⛔ blocked | — | 🔒 privacy posture (paid-tier path identified) |
| 9 — Spec sync + tests + PR | — | — | |

## Open gates (both Adi's)
1. **Now or V-next?** (focus call — DECISION §7; tester-retention signal informs it)
2. **Gemini paid key + privacy posture** (Phase 0 found a compliant path: paid tier only)
3. *(sub-gate)* **`expo-share-intent` new dependency** — only for the OS share-target (Phase 7)

## Isolation guarantees (per Adi's "build on the side" requirement)
- All work on `pkg/parent-capture`, **never merged to `main` until done** → not on the release path; hotfixes to the test build are fully independent.
- Backend changes **additive-only** (new tables / column / Edge Function) → production code ignores them; zero behavior change.
- The only phase touching production data (`tasks`) is **Transfer-to-child** — built last, behind a feature flag.
- Feature flag (off in production) gates every entry point even after eventual merge.

## Docs in this session
`DECISION.md` · `SPEC.md` · `IMPLEMENTATION_PLAN.md` · `PHASE0_FINDINGS.md` · `STATUS.md`
