/**
 * useOtaRestartToast (web) — no-op. Web serves a fresh bundle per load, so there
 * is no in-session pending OTA to apply; the restart toast is native-only for
 * v1 (see useSafeSurface.web.ts for the deferral rationale). Keeps the native
 * `expo-updates` `useUpdates` hook out of the web bundle.
 */
import type { OtaToastVM } from './useOtaRestartToast';

export function useOtaRestartToast(): OtaToastVM {
  return { visible: false, refresh: () => undefined, dismiss: () => undefined };
}
