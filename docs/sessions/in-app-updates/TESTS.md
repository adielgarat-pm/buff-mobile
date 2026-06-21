# TESTS — in-app-updates

Pass/fail per phase. Hat 1 = Jest/typecheck/code-review (CC). Hat 3 = device automation.
Hat 4 = real-device-only, Adi.

---

## Phase 0 — Compatibility

- [ ] Library version pinned + confirmed compatible with installed Expo SDK / RN.
- [ ] Confirmed config-plugin only (no manual native source edits) for managed workflow.
- [ ] Confirmed it triggers on the Internal Testing track.
- [ ] Values check still passes for this phase.

## Phase 1 — Wiring (Hat 1)

- [ ] `npx tsc --noEmit` clean.
- [ ] Import of the native module is **lazy / Android-gated** — grep confirms no top-level native
      import at app root (memory `native_import_sentry_blindspot`).
- [ ] App still launches on the existing dev-client (hook no-ops when no update / non-Play install).
- [ ] Immediate flow is present but flag-OFF by default (verified in code).
- [ ] `app.json` plugin entry added; `npx expo prebuild` succeeds.
- [ ] Code-review clean.
- [ ] Values check still passes for this phase.

## Phase 2 — Reachability (Hat 4, Adi, real device — THE decisive test)

- [ ] Device has build **N** installed via the Play **internal-test link** (not sideloaded).
- [ ] Build **N+1** published to the internal track.
- [ ] Cold-open BUFF on the device → **"update available" prompt appears** (no dev shortcut).
- [ ] Tapping update downloads in background; app relaunches on **N+1**.
- [ ] Dismissing the Flexible prompt lets the app continue normally.
- [ ] No "Something went wrong" Play dialog on the updated build.
- [ ] Values check verified against implemented behaviour (copy is neutral/gentle on child device).

## Negative / edge

- [ ] Sideloaded (non-Play) build: hook no-ops, no crash, no error toast.
- [ ] No newer version on track: no prompt, silent.
- [ ] Airplane mode at launch: no crash, no error surfaced to user.
