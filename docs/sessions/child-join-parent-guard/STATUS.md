# child-join-parent-guard — STATUS

Ad-hoc fix package (no SPEC). Origin: production churn analysis of family `c717…` (Marina, RS, Android), 2026-10-08. Plan + plan review approved by Adi in-session ("מאשרת", 2026-10-08 / 2026-10-10).

| Chunk | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| A — ChildJoin parent-session guard, Back → parent home, `join_page_viewed` + `join_parent_guard_choice` telemetry, invite hint copy | code done; device/web verification pending | 2026-10-08 | `5af4c0a` | jest 154 suites / 1268 pass, tsc clean | IN-2026-10-08-01 |
| B — `useWelcomeBack` write loop + `record_child_activity` RPC (migration 061, applied to production 2026-10-10) | code done; device/web verification pending | 2026-10-10 | _this commit_ | jest 156 suites / 1274 pass, tsc clean; SQL role-simulation pass (rolled back) | IN-2026-10-08-02 |

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
