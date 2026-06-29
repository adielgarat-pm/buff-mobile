/**
 * installReferrer.android.ts — Android deferred deep link via Play Install Referrer.
 *
 * When a child taps the smart join link on an Android device WITHOUT BUFF
 * installed, landing-web routes them to the Play Store with `referrer=join_CODE`.
 * After install, on first launch we read that referrer once, parse the family
 * code, and hand it back so navigation can open ChildJoin pre-filled — the child
 * never types the code.
 *
 * Safety (IN-2026-06-17 native-import discipline + launch-hang guard):
 *   • the native module is imported LAZILY (dynamic import) inside the call, never
 *     at module-eval time, so it can't crash launch before Sentry.init;
 *   • the referrer read is TIME-BOXED — the Play service can fail to call its
 *     callback, and getInitialURL awaits this, so an unbounded wait would hang the
 *     whole app on splash. Time-box → resolve null;
 *   • everything is wrapped — any failure resolves to null, never throws;
 *   • consume-once via AsyncStorage so we never re-route (or re-wait) later.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseJoinCode } from './buffConfig';

const CONSUMED_KEY = 'buff.installReferrer.consumed';
// The Play Install Referrer connection is usually <100ms; cap well above that but
// short enough that a hung service never noticeably delays cold start.
const REFERRER_TIMEOUT_MS = 2500;

/** Read the raw Play Install Referrer string, or null on any failure/timeout. */
function readReferrer(): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: string | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    // Hard ceiling so a service that never calls back can't hang app launch.
    const timer = setTimeout(() => done(null), REFERRER_TIMEOUT_MS);
    import('react-native-play-install-referrer')
      .then(({ PlayInstallReferrer }) => {
        try {
          PlayInstallReferrer.getInstallReferrerInfo((info, error) => {
            clearTimeout(timer);
            done(error || !info ? null : info.installReferrer ?? null);
          });
        } catch {
          clearTimeout(timer);
          done(null);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        done(null);
      });
  });
}

export async function getInstallReferrerJoinCode(): Promise<string | null> {
  try {
    if (await AsyncStorage.getItem(CONSUMED_KEY)) return null;
    const code = parseJoinCode(await readReferrer());
    // Mark consumed regardless of outcome so later launches never re-trigger
    // (and a timed-out read never re-waits).
    await AsyncStorage.setItem(CONSUMED_KEY, '1');
    return code;
  } catch {
    return null;
  }
}
