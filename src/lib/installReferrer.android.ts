/**
 * installReferrer.android.ts — Android deferred deep link via Play Install Referrer.
 *
 * When a child taps the smart join link on an Android device WITHOUT BUFF
 * installed, landing-web routes them to the Play Store with `referrer=join_CODE`.
 * After install, on first launch we read that referrer once, parse the family
 * code, and hand it back so navigation can open ChildJoin pre-filled — the child
 * never types the code.
 *
 * Safety (IN-2026-06-17 native-import discipline):
 *   • the native module is imported LAZILY (dynamic import) inside the call, never
 *     at module-eval time, so it can't crash launch before Sentry.init;
 *   • everything is wrapped — any failure resolves to null, never throws;
 *   • consume-once via AsyncStorage so we never re-route on later launches.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSUMED_KEY = 'buff.installReferrer.consumed';

/** Read the raw Play Install Referrer string, or null on any failure. */
function readReferrer(): Promise<string | null> {
  return new Promise((resolve) => {
    import('react-native-play-install-referrer')
      .then(({ PlayInstallReferrer }) => {
        try {
          PlayInstallReferrer.getInstallReferrerInfo((info, error) => {
            resolve(error || !info ? null : info.installReferrer ?? null);
          });
        } catch {
          resolve(null);
        }
      })
      .catch(() => resolve(null));
  });
}

/**
 * Parse a `join_CODE` referrer into the 6-char family code, or null.
 * Liberal about encoding / extra utm params: "join_ABC123",
 * "join_ABC123&utm_source=x", or a url-encoded variant all yield "ABC123".
 */
export function parseJoinCode(referrer: string | null): string | null {
  if (!referrer) return null;
  let decoded = referrer;
  try {
    decoded = decodeURIComponent(referrer);
  } catch {
    // keep raw if it isn't valid percent-encoding
  }
  const m = decoded.match(/(?:^|[?&])join[_=]([A-Za-z0-9]{6})/);
  return m ? m[1].toUpperCase() : null;
}

export async function getInstallReferrerJoinCode(): Promise<string | null> {
  try {
    if (await AsyncStorage.getItem(CONSUMED_KEY)) return null;
    const code = parseJoinCode(await readReferrer());
    // Mark consumed regardless of outcome so later launches never re-trigger.
    await AsyncStorage.setItem(CONSUMED_KEY, '1');
    return code;
  } catch {
    return null;
  }
}
