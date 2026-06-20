/**
 * InstallNudge (native no-op) — platform-split contract.
 *
 * On Android/iOS native builds, BUFF is distributed via Play Store / App Store.
 * PWA install makes no sense. This file satisfies the TypeScript contract so
 * the dashboard and settings can import `InstallNudge` without a platform
 * branch; Metro resolves `InstallNudge.web.tsx` for the Expo Web bundle.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useInstallNudgeRegistration(_onDismiss: () => void): void {}
