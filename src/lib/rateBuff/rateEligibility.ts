/**
 * Rate-nudge eligibility (pure decision — unit tested) + its storage glue.
 *
 * Thresholds are the industry numbers from the competitor research (SPEC §4.3):
 * only ask retained users (≥7 days, ≥3 sessions), and re-ask at most every
 * ~90 days. This local cooldown layers ABOVE the Nudge Manager's 7-day GLOBAL
 * cooldown, so install + rate can never overload the dashboard.
 *
 * The pure `isRateEligible` takes a snapshot so it can be tested without time
 * or storage; `readRateEligibility` / `recordRateNudgeSeen` are the thin
 * AsyncStorage wrappers the registration hook uses.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RATE_MIN_DAYS = 7;
export const RATE_MIN_SESSIONS = 3;
export const RATE_LOCAL_COOLDOWN_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

const K_FIRST_SEEN = 'rate:firstSeenAt';
const K_SESSIONS = 'rate:sessions';
const K_LAST_PROMPTED = 'rate:lastPromptedAt';
const K_DONE = 'rate:done';

export interface RateEligibilityState {
  /** Native build, or web running as an installed standalone PWA. */
  isInstalledContext: boolean;
  /** User already submitted a rating/feedback → never ask again. */
  alreadyRated: boolean;
  /** ms epoch of first dashboard view, or null if never recorded. */
  firstSeenAt: number | null;
  /** Count of recorded sessions. */
  sessions: number;
  /** ms epoch the banner was last shown-then-dismissed, or null. */
  lastPromptedAt: number | null;
  /** ms epoch "now". */
  now: number;
}

export function isRateEligible(s: RateEligibilityState): boolean {
  if (!s.isInstalledContext) return false;
  if (s.alreadyRated) return false;
  if (s.firstSeenAt == null) return false;
  if ((s.now - s.firstSeenAt) / DAY_MS < RATE_MIN_DAYS) return false;
  if (s.sessions < RATE_MIN_SESSIONS) return false;
  if (s.lastPromptedAt != null && (s.now - s.lastPromptedAt) / DAY_MS < RATE_LOCAL_COOLDOWN_DAYS) {
    return false;
  }
  return true;
}

function num(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Read the stored eligibility snapshot (everything except platform + now). */
export async function readRateEligibility(): Promise<
  Omit<RateEligibilityState, 'isInstalledContext' | 'now'>
> {
  try {
    const [firstSeen, sessions, lastPrompted, done] = await AsyncStorage.multiGet([
      K_FIRST_SEEN,
      K_SESSIONS,
      K_LAST_PROMPTED,
      K_DONE,
    ]);
    return {
      firstSeenAt: num(firstSeen[1]),
      sessions: num(sessions[1]) ?? 0,
      lastPromptedAt: num(lastPrompted[1]),
      alreadyRated: done[1] === '1',
    };
  } catch {
    return { firstSeenAt: null, sessions: 0, lastPromptedAt: null, alreadyRated: true };
  }
}

/** Stamp first-seen (once) and bump the session counter. Call once per mount. */
export async function recordRateNudgeSeen(now: number): Promise<void> {
  try {
    const firstSeen = await AsyncStorage.getItem(K_FIRST_SEEN);
    if (firstSeen == null) await AsyncStorage.setItem(K_FIRST_SEEN, String(now));
    const sessions = num(await AsyncStorage.getItem(K_SESSIONS)) ?? 0;
    await AsyncStorage.setItem(K_SESSIONS, String(sessions + 1));
  } catch {
    /* non-fatal */
  }
}

/** Start the 90-day local cooldown (banner dismissed without rating). */
export async function recordRateNudgeDismissed(now: number): Promise<void> {
  try {
    await AsyncStorage.setItem(K_LAST_PROMPTED, String(now));
  } catch {
    /* non-fatal */
  }
}

/** Permanently stop asking (a rating or feedback was submitted). */
export async function markRated(): Promise<void> {
  try {
    await AsyncStorage.setItem(K_DONE, '1');
  } catch {
    /* non-fatal */
  }
}
