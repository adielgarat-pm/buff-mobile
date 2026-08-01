/**
 * otaToastThrottle — pure throttle for the OTA restart toast: at most once per
 * day per device. Timestamp is written at SHOW time (not dismiss), so a second
 * `isUpdatePending` flip in the same day can't re-toast.
 */
export const TOAST_THROTTLE_MS = 24 * 60 * 60 * 1000; // 1 day

export const TOAST_LAST_SHOWN_KEY = 'ota.toast.lastShownAt';

/**
 * @param lastShownMs epoch ms of the last show, or null if never shown.
 * @returns true if the toast is currently throttled (shown within the window).
 */
export function isToastThrottled(lastShownMs: number | null, now: number): boolean {
  if (lastShownMs == null) return false;
  return now - lastShownMs < TOAST_THROTTLE_MS;
}
