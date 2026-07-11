/**
 * useVersionGate (Android — base/native) — on launch, if a newer binary is
 * available on the Play track, start Google Play's FLEXIBLE in-app-update flow:
 * a non-blocking Play sheet lets the user update (background download) or dismiss
 * and keep using the app. Play shows its own "restart to install" snackbar when
 * the download finishes — no in-app completion code needed (v1 uses Google's
 * native update UI).
 *
 * Solves the discoverability gap (tester Noa, 2026-06-17): a user on cellular /
 * "auto-update over Wi-Fi only" otherwise never learns a newer binary exists.
 * OTA (expo-updates) cannot deliver a new binary — this closes that gap.
 *
 * FLEXIBLE only (v1): `startUpdate(false)` forces the dismissible flow regardless
 * of Play server priority, so the blocking IMMEDIATE flow never fires. To enable
 * immediate for critical hotfixes later, switch to `checkAndStartUpdate()`
 * (Play-priority driven) — a deliberate future toggle, OFF for now.
 *
 * Fires only for Play-installed builds (Play Store / internal-test link). No-op
 * in dev (`__DEV__`) and for sideloaded EAS internal APKs (checkForUpdate returns
 * no update / throws there — all swallowed; a failed check must never affect the
 * running app). expo-in-app-updates is native-only; web resolves useVersionGate
 * .web.ts and iOS resolves .ios.ts (both no-ops), so the native module never
 * enters the web bundle (Platform Parity: unify the signal, split the action).
 *
 * Requires a build that includes the native module — no-op in Expo Go and only
 * real on a fresh dev-client/preview/production build.
 */
import { useEffect } from 'react';
import * as InAppUpdates from 'expo-in-app-updates';

export function useVersionGate(): void {
  useEffect(() => {
    if (__DEV__) return; // never in dev; also a no-op on non-Play installs

    (async () => {
      try {
        const { updateAvailable, flexibleAllowed } = await InAppUpdates.checkForUpdate();
        if (updateAvailable && flexibleAllowed) {
          await InAppUpdates.startUpdate(false); // false = FLEXIBLE (dismissible); IMMEDIATE off for v1
        }
      } catch (err) {
        // Non-fatal: a failed update check must never affect the running app.
        console.warn('[version-gate] in-app-update check failed (non-fatal):', err);
      }
    })();
  }, []);
}
