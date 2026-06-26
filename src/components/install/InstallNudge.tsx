/**
 * InstallNudge (native no-op) — platform-split contract.
 *
 * On Android/iOS native builds, BUFF is distributed via Play Store / App Store.
 * PWA install makes no sense. This file satisfies the TypeScript contract so
 * the dashboard and settings can import `InstallNudge` without a platform
 * branch; Metro resolves `InstallNudge.web.tsx` for the Expo Web bundle.
 *
 * NOTE: this base file MUST stay `.tsx` (not `.ts`). Metro resolves
 * per-extension, so a `.ts` base is found before it ever tries the `.tsx`
 * where `InstallNudge.web.tsx` lives — which silently shadows the web override
 * and ships this no-op stub to web instead of the real banner. (This is exactly
 * the bug this rename fixed.)
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useInstallNudgeRegistration(_onDismiss: () => void): void {}
