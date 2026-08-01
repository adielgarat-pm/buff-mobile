/** Tests for the once-per-day OTA restart-toast throttle (pure). */
import { isToastThrottled, TOAST_THROTTLE_MS } from '../otaToastThrottle';

describe('isToastThrottled', () => {
  const now = 1_000_000_000_000;

  test('never shown → not throttled', () => {
    expect(isToastThrottled(null, now)).toBe(false);
  });

  test('shown just now → throttled', () => {
    expect(isToastThrottled(now, now)).toBe(true);
  });

  test('shown within the window → throttled', () => {
    expect(isToastThrottled(now - (TOAST_THROTTLE_MS - 1), now)).toBe(true);
  });

  test('shown exactly a window ago → no longer throttled', () => {
    expect(isToastThrottled(now - TOAST_THROTTLE_MS, now)).toBe(false);
  });

  test('shown longer than a window ago → not throttled', () => {
    expect(isToastThrottled(now - TOAST_THROTTLE_MS - 1, now)).toBe(false);
  });
});
