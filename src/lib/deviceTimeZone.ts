/**
 * deviceTimeZone — the IANA time zone of this device (e.g. 'Asia/Jerusalem').
 *
 * Stored on the parent's profile (profiles.timezone, migration 059) so the
 * evening child-invite reminder goes out at 19:30 where the parent actually is,
 * not at a fixed server hour. Both platforms: expo-localization reads the OS
 * calendar on Android and `Intl` on web. Returns null when nothing usable is
 * reported — the server then falls back to Asia/Jerusalem.
 */
import * as Localization from 'expo-localization';

export function deviceTimeZone(): string | null {
  try {
    const tz = Localization.getCalendars()[0]?.timeZone;
    if (tz) return tz;
  } catch { /* fall through */ }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}
