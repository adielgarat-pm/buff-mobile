# OTA Playbook — planning BUFF releases with EAS Update

**Status:** ACTIVE (from `pkg/eas-update-ota`)
**Owner:** Adi + CC
**Problem it solves:** a Google Play *production* review takes **days**, and BUFF gets
extra scrutiny as a children's app (Families policy). Routing every small fix through that
door made iteration slow. EAS Update (OTA) lets JS-only changes reach installed apps in
**minutes, with no store review**.

---

## The core idea — two lanes, chosen by change type

Stop sending every change through the slowest door. Route by what the change touches:

| Lane | Time to users | Mechanism | Use for |
|---|---|---|---|
| **Fast (OTA)** | minutes, **no review** | `eas update` (`expo-updates`) | JS/TS: copy, UI, layout, logic, bug fixes, config in JS |
| **Store (binary)** | days (Play review) | `eas build` → submit → promote | native modules, new permissions, `app.json` native config, SDK bumps |
| **Web PWA** | instant | `expo export --platform web` → deploy | anything web; served fresh each load |

**Rule of thumb:** if `npm run typecheck` passes and you changed **only** `.ts`/`.tsx`
(no `package.json` native dep, no `app.json` native/plugin/permission change), it can go OTA.

---

## How it works here (the mechanics)

- **Config** (`app.json`): `updates.url` points at the EAS project; `runtimeVersion.policy = "fingerprint"`.
- **`runtimeVersion` = fingerprint** is the safety gate. It is computed from the **native**
  fingerprint of the build. An OTA update only lands on a binary with a **matching**
  runtime — so an OTA can **never** be delivered to an incompatible binary. Change a native
  dep → the fingerprint changes → that OTA simply won't reach old binaries (they wait for the
  new binary). This is what keeps the native/JS boundary safe.
- **Channels** (`eas.json`): `production` build → `production` channel; `preview` build →
  `preview` channel. `eas update --branch <b>` publishes to the branch linked to that channel.
- **App-side** (`src/hooks/useOtaUpdate.ts`): on launch, if `Updates.isEnabled`,
  check → fetch in background → **apply silently on the next cold start**. No prompt (v1).
  Web resolves `useOtaUpdate.web.ts` (no-op); expo-updates never enters the web bundle.

---

## ⚠️ Two things to know before relying on OTA

1. **The currently-live binary cannot receive OTA.** It was built *before* the `updates`
   config existed. The **first** OTA-capable binary must ship through the store once
   (normal review). From that binary onward, every JS change is OTA. You pay one last
   review to buy the fast lane.
2. **OTA cannot deliver native changes.** New native module, permission, or SDK bump → a
   binary is required, full stop. Fingerprint will refuse to push such JS to old binaries
   anyway (by design).

---

## Recommended cadence — the release train

- **OTA: anytime.** Merge a JS-only fix to `main`, run `npm run ota:prod`, it's live in minutes.
- **Binary: on a fixed cadence** (suggest **every 2 weeks**, or sooner for a native hotfix).
  Batch all accumulated native changes into one build instead of cutting a binary per change.
  This replaces "3 binaries a week, each waiting days" with "one planned binary, OTA in between."

---

## Commands

```bash
# JS-only fix → production users, minutes, no review:
npm run ota:prod    -- --message "fix: onboarding resume banner copy"

# JS-only fix → preview/internal testers first:
npm run ota:preview -- --message "test: new first-task flow"

# Native change (new dep/permission/SDK) → binary (Adi triggers; bills EAS quota):
eas build --profile production --platform android
# then submit + promote in Play Console (this is the slow, reviewed path)
```

Publish OTA **from `main`** after merge (same discipline as binary builds — see
`feedback_build_from_main_merge_first`), so OTA content always matches what's in `main`.

---

## What is NOT covered by OTA (complementary work)

- **New-binary discoverability** — telling users a newer *binary* exists (the Noa case).
  OTA can't push a binary, so an in-app-updates nudge is still worth doing. See
  `docs/sessions/in-app-updates/SPEC.md`. **Complementary, not replaced by** OTA.
- **Web "reload to update"** toast — low priority; the PWA SW is network-passthrough so web
  rarely goes stale (same SPEC §Web).

---

## Verification notes

- OTA is a **no-op in dev / Expo Go** (`Updates.isEnabled === false`) and **no-op on web**.
- It **can** be verified on the emulator with a `preview`-profile build (unlike in-app-updates,
  which needs a real Play track): build → `eas update --branch preview` → relaunch → confirm
  the new bundle applied on the second cold start.
- Source maps: the `@sentry/react-native/expo` plugin uploads maps on `eas update`; confirm the
  `updateId` tags crashes so an OTA regression is traceable in Sentry.
