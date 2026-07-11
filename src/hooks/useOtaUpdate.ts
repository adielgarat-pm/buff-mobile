/**
 * useOtaUpdate (native) — checks for an EAS Update (OTA JS bundle) on launch and
 * lets expo-updates apply it SILENTLY on the next cold start. No UI (v1).
 *
 * Flow: on mount, if updates are enabled, checkForUpdateAsync() → if a newer JS
 * bundle exists for this runtime, fetchUpdateAsync() downloads it in the
 * background. We deliberately do NOT reloadAsync() here — swapping the bundle
 * mid-session would interrupt the user (and, on a child-owned device, surface a
 * jarring restart). The fetched bundle is applied automatically at the next
 * natural cold start (expo-updates default), so the update lands invisibly.
 *
 * Gated on Updates.isEnabled, which is false in dev clients / Expo Go and in any
 * build without the `updates` config (app.json) — so this is a no-op locally and
 * only live in preview/production builds. Every failure path is swallowed: a
 * broken update check must never affect the running app.
 *
 * Web resolves useOtaUpdate.web.ts (no-op); the expo-updates native module is
 * never imported into the web bundle (Platform Parity: unify the signal, split
 * the action). expo-updates is already a linked dependency (LanguageContext uses
 * Updates.reloadAsync for RTL), so this adds no new native surface.
 *
 * Purpose: deliver JS-only fixes (copy, UI, logic, bug fixes) to installed apps
 * within minutes, bypassing the Google Play review a new binary requires. Native
 * / permission / versionCode changes still need a binary — see docs/OTA_PLAYBOOK.md.
 */
import { useEffect } from 'react';
import * as Updates from 'expo-updates';

export function useOtaUpdate(): void {
  useEffect(() => {
    // false in dev/Expo Go and in any build without the updates config, where
    // checkForUpdateAsync() would throw. Skip entirely there.
    if (!Updates.isEnabled) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        // Intentionally no reloadAsync(): applied automatically next cold start.
      } catch (err) {
        // Non-fatal: stay on the current bundle until the next successful check.
        console.warn('[OTA] update check failed (non-fatal):', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
