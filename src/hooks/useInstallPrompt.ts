/**
 * useInstallPrompt (native no-op) — platform-split contract for Android/iOS native.
 *
 * Native builds are distributed via Play Store / App Store, so there's no PWA
 * install concept. This file satisfies the TypeScript contract so the UI can
 * import `useInstallPrompt` without a platform branch, while Metro resolves
 * `useInstallPrompt.web.ts` for the Expo Web bundle.
 */
export type InstallMode = 'install' | 'ios-safari' | 'ios-other' | 'hidden';

export interface InstallPromptState {
  mode: InstallMode;
  isMobile: boolean;
  promptInstall: () => Promise<void>;
}

export function useInstallPrompt(): InstallPromptState {
  return {
    mode: 'hidden',
    isMobile: false,
    promptInstall: async () => {},
  };
}
