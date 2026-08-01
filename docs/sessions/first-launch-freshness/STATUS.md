# STATUS — first-launch-freshness

| Date | State | Commit | Tests | Notes |
|---|---|---|---|---|
| 2026-08-01 | Layer 3 (OTA restart toast) built | `41ba620` | tsc ✓ · jest 25/25 (new) · guards ✓ | Ships via OTA to vc68 (fingerprint matched). Web = no-op (deferred). |
| 2026-08-01 | Layer 1 (first-launch gate) built | `04d19d8` | tsc ✓ · full jest 925/925 · guards ✓ | Rides vc69 (benefits only the embedding binary). No-op on existing installs. |

**Package:** `pkg/first-launch-freshness` — client half of the release-freshness plan (companion to `pkg/ota-freshness-ci` #428, layers 2+4). SPEC: `docs/sessions/first-launch-freshness/SPEC.md` (PR #429). Built as ONE package per Adi.

**Verification status:**
- Hat-1 (tsc + jest + guards): ✅ green.
- Hat-3/Hat-4 (real device): **pending Adi.** Layer 3 = force a preview OTA, confirm the toast on a parent surface + dismiss/refresh + once/day. Layer 1 = install a binary that embeds it (vc69), publish a newer OTA, do a FRESH install, confirm session-1 freshness. No emulator/web shortcut for Layer 1.

**Delivery on merge:**
- OTA → Layer 3 live for existing vc68 users.
- vc69 cut → Layer 1 activates for fresh installs.

**Known v1 limitation (follow-up):** the safe-surface predicate gates modal editors (route changes) but not an inline in-tab sheet (no route change). Bounded (toast is non-blocking, explicit-tap). Follow-up: a global "sheet open" signal.
