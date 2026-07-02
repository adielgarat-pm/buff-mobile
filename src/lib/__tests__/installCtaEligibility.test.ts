/**
 * installCtaEligibility.web — global cooldown + impression cap + once-ever
 * post-signup, sharing the nudge manager's 7-day cooldown (SPEC §4.5 / §6.1.3).
 */
import {
  isInstallCtaEligible,
  recordInstallCtaImpression,
  recordInstallCtaDismiss,
} from '../installCtaEligibility.web';

let mockCooldown = false;
const mockMarkDismissed = jest.fn();
jest.mock('../nudges/nudgeManager', () => ({
  isInGlobalNudgeCooldown: async () => mockCooldown,
  markNudgeDismissed: (...a: unknown[]) => {
    mockMarkDismissed(...a);
    return Promise.resolve();
  },
}));

// In-memory AsyncStorage mock.
let mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (k: string) => (k in mockStore ? mockStore[k] : null),
  setItem: async (k: string, v: string) => {
    mockStore[k] = v;
  },
}));

beforeEach(() => {
  mockStore = {};
  mockCooldown = false;
  mockMarkDismissed.mockClear();
});

it('eligible by default (fresh browser)', async () => {
  await expect(isInstallCtaEligible('entry')).resolves.toBe(true);
  await expect(isInstallCtaEligible('post-signup')).resolves.toBe(true);
});

it('suppressed while inside the shared global cooldown', async () => {
  mockCooldown = true;
  await expect(isInstallCtaEligible('entry')).resolves.toBe(false);
  await expect(isInstallCtaEligible('post-signup')).resolves.toBe(false);
});

it('post-signup shows once ever', async () => {
  await recordInstallCtaImpression('post-signup');
  await expect(isInstallCtaEligible('post-signup')).resolves.toBe(false);
  // entry is NOT gated by the once-ever flag (only its own cap)
  await expect(isInstallCtaEligible('entry')).resolves.toBe(true);
});

it('suppressed once the impression cap (3) is reached', async () => {
  await recordInstallCtaImpression('entry');
  await recordInstallCtaImpression('entry');
  await expect(isInstallCtaEligible('entry')).resolves.toBe(true); // 2 shown → still ok
  await recordInstallCtaImpression('entry');
  await expect(isInstallCtaEligible('entry')).resolves.toBe(false); // 3 shown → capped
});

it('dismiss starts the shared global cooldown', async () => {
  await recordInstallCtaDismiss();
  expect(mockMarkDismissed).toHaveBeenCalledTimes(1);
});

it('fails open when storage throws (private browsing)', async () => {
  const AS = require('@react-native-async-storage/async-storage');
  jest.spyOn(AS, 'getItem').mockRejectedValueOnce(new Error('blocked'));
  await expect(isInstallCtaEligible('entry')).resolves.toBe(true);
});
