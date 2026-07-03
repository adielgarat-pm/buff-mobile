/**
 * useInstallPrompt (web) — detects whether and how the user can install BUFF
 * as a PWA, and exposes a typed state for the InstallNudge UI (SPEC §2).
 *
 * Mode decision table (SPEC §2.1):
 *   standalone (already installed)  → 'hidden'
 *   iOS + Safari                    → 'ios-safari'   (Share ⬆ → Add to Home Screen)
 *   iOS + any other browser         → 'ios-other'    (must open in Safari)
 *   Android/Chrome + deferred prompt → 'install'     (call promptInstall())
 *   desktop / unsupported browser  → 'hidden'        (Settings entry only)
 *
 * isMobile: iOS or Android → true. Nudge eligibility gates active banner on this.
 */
import { useState, useEffect } from 'react';
import {
  getDeferredInstallPrompt,
  clearDeferredInstallPrompt,
} from '../lib/setupPwa.web';

export type InstallMode = 'install' | 'ios-safari' | 'ios-other' | 'hidden';

export interface InstallPromptState {
  mode: InstallMode;
  isMobile: boolean;
  promptInstall: () => Promise<void>;
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  // CriOS = Chrome iOS, FxiOS = Firefox iOS, OPR/ = Opera
  return isIos() && /safari/i.test(ua) && !/criOS|fxiOS|opr\//i.test(ua);
}

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari sets navigator.standalone (non-standard)
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function detectMode(): InstallMode {
  if (isStandalone()) return 'hidden';
  if (isIos()) return isIosSafari() ? 'ios-safari' : 'ios-other';
  if (getDeferredInstallPrompt() !== null) return 'install';
  return 'hidden';
}

export function useInstallPrompt(): InstallPromptState {
  const [mode, setMode] = useState<InstallMode>(() =>
    typeof window === 'undefined' ? 'hidden' : detectMode(),
  );
  const isMobile = isIos() || isAndroid();

  useEffect(() => {
    // Re-evaluate if beforeinstallprompt fires after mount (race with hydration)
    const onBeforeInstall = () => setMode(detectMode());
    const onAppInstalled = () => setMode('hidden');

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<void> => {
    const prompt = getDeferredInstallPrompt();
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearDeferredInstallPrompt();
    if (outcome === 'accepted') setMode('hidden');
  };

  return { mode, isMobile, promptInstall };
}
