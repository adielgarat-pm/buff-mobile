# child-join-parent-guard — STATUS

Ad-hoc fix package (no SPEC). Origin: production churn analysis of family `c717…` (Marina, RS, Android), 2026-10-08. Plan + plan review approved by Adi in-session ("מאשרת", 2026-10-08 / 2026-10-10).

| Chunk | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| A — ChildJoin parent-session guard, Back → parent home, `join_page_viewed` + `join_parent_guard_choice` telemetry, invite hint copy | code done; device/web verification pending | 2026-10-08 | `5af4c0a` | jest 154 suites / 1268 pass, tsc clean | IN-2026-10-08-01 |
| B — `useWelcomeBack` write loop + `record_child_activity` RPC (migration 061, applied to production 2026-10-10) | code done; device/web verification pending | 2026-10-10 | _this commit_ | jest 156 suites / 1274 pass, tsc clean; SQL role-simulation pass (rolled back) | IN-2026-10-08-02 |
| R0 — migration 062: `smart_insight_feedback` parent-only family SELECT + grant; `record_insight_vote` requires a parent of the child's family, anon revoked, 5-arg overload dropped | **applied 2026-10-10** via execute_sql without DROP (DROP hangs in the MCP tools); role simulation + advisor pass | 2026-10-10 | _this commit_ | pending SQL role simulation | — |
| R1 — guard copy (Adi-approved), "Menu → Grown-up sign-in" hint, grown-up Login hides Sign Up + role hint, invite hint "not yours", Welcome Back silent in parent preview | code done; device/web verification pending | 2026-10-10 | _this commit_ | jest 156 suites / 1277 pass, tsc clean | — |
| R1-fix — regression after merge (#506, OTA published 15:33): web-smoke ran red AFTER the merge (A10, C5, C6, D3). Guard now only for a link with a code (in-app entries — Welcome "my kid joins here", RoleSelection, Google picker — skip it); "Sign Up" restored on grown-up Login (a NEW parent on a shared device signs up there, A10); web-smoke C5/D3 updated to guard → Switch → code | code done | 2026-10-10 | _this commit_ | jest 156 / 1278 pass, tsc clean; web-smoke failing flows 28/28 locally | IN-2026-10-10-01 |
| R0b — migration 063: `get_admin_smart_insights` admin-only (was callable by anon: every child's name, family, AI headline, parent notes); `refresh_all_basic_insights` / `compute_basic_insight` revoked from anon + authenticated (cron unaffected) | **applied 2026-10-10** | 2026-10-10 | _this commit_ | admin → 6 rows; parent → "not authorized"; anon → no EXECUTE; cron job intact. Edge logs (24h window) show no calls | IN-2026-10-10-02 |

## Values Check (implemented behavior)

- **Pillar 1 — Intrinsic Motivation:** neutral; no rewards / tasks / BUDDY touched.
- **Pillar 2 — Positive Coaching:** guard copy is neutral, no blame. Chunk B turns on the existing, already-approved no-shame Welcome Back modal for real children (approved by Adi 2026-10-08).
- **Pillar 3 — Independence-Building:** the kid joins from their own device; hand-back remains one tap (guard skipped on `autoFind`).

## Deploy order

Migration 061 is live. Old app builds keep calling the direct UPDATE (still a silent no-op for children, unchanged). New builds call the RPC and swallow errors, so either order is safe.

## Open

- [ ] Android emulator verification (Hat 3): parent opens `buff://join/<code>` → guard; Keep → ParentApp; Switch → code step; child open → exactly one `rpc/record_child_activity` in edge logs.
- [ ] Web verification (`npm run web`): same guard flow at `/join/<code>` with a parent session.
- [ ] Out of scope, flagged: Welcome Back "shown" flag is never cleared (shows once per device ever); `last_child_activity` is per family, not per child; Welcome Back does not check child preview.
