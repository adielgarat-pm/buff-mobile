const mockLog = jest.fn();
jest.mock('../onboardingFunnel', () => ({ logOnboardingEvent: (a: unknown) => mockLog(a) }));
const mockOpen = jest.fn();
jest.mock('../../platform', () => ({ openExternalUrl: (u: string) => mockOpen(u) }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  shouldShowDashboardOffer, isValidConciergeUrl, openConcierge, logConciergeSeen,
  dismissConcierge, isConciergeDismissed, __resetConciergeForTests, CONCIERGE_WINDOW_DAYS,
} from '../concierge';

const URL_OK = 'https://cal.com/adi-elgarat-german-buff';
const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-09-25T12:00:00Z');
const base = {
  url: URL_OK, isChildPreview: false, hasFirstWin: false as boolean | null, dismissed: false,
  childCreatedAts: [new Date(now - 2 * DAY).toISOString()], now,
};

beforeEach(() => { jest.clearAllMocks(); __resetConciergeForTests(); });

describe('shouldShowDashboardOffer', () => {
  it('shows for a no-win family inside the window', () => {
    expect(shouldShowDashboardOffer(base)).toBe(true);
  });
  it('hides once there is a first win, or while it is unknown', () => {
    expect(shouldShowDashboardOffer({ ...base, hasFirstWin: true })).toBe(false);
    expect(shouldShowDashboardOffer({ ...base, hasFirstWin: null })).toBe(false);
  });
  it('hides after the window, measured from the FIRST child', () => {
    const old = new Date(now - (CONCIERGE_WINDOW_DAYS + 1) * DAY).toISOString();
    expect(shouldShowDashboardOffer({ ...base, childCreatedAts: [old] })).toBe(false);
    expect(shouldShowDashboardOffer({ ...base, childCreatedAts: [old, new Date(now).toISOString()] })).toBe(false);
  });
  it('hides with no children, in View-as-Child, when dismissed, or without a real https URL (kill switch)', () => {
    expect(shouldShowDashboardOffer({ ...base, childCreatedAts: [] })).toBe(false);
    expect(shouldShowDashboardOffer({ ...base, isChildPreview: true })).toBe(false);
    expect(shouldShowDashboardOffer({ ...base, dismissed: true })).toBe(false);
    expect(shouldShowDashboardOffer({ ...base, suppressed: true })).toBe(false);
    expect(shouldShowDashboardOffer({ ...base, url: '' })).toBe(false);
    expect(shouldShowDashboardOffer({ ...base, url: 'concierge.bookingLink' })).toBe(false);
  });
});

describe('open / seen / dismiss', () => {
  it('opens only a valid URL and logs the tap with its placement', () => {
    expect(isValidConciergeUrl('http://x')).toBe(false);
    expect(openConcierge({ url: 'nope', placement: 'dashboard', familyId: 'f' })).toBe(false);
    expect(mockOpen).not.toHaveBeenCalled();
    expect(openConcierge({ url: URL_OK, placement: 'onboarding_complete', familyId: 'f' })).toBe(true);
    expect(mockOpen).toHaveBeenCalledWith(URL_OK);
    expect(mockLog).toHaveBeenCalledWith({ familyId: 'f', eventType: 'concierge_offer_tapped', source: 'onboarding_complete' });
  });
  it('logs seen once per family+placement per session', () => {
    logConciergeSeen('f', 'dashboard'); logConciergeSeen('f', 'dashboard'); logConciergeSeen('f', 'onboarding_complete');
    expect(mockLog).toHaveBeenCalledTimes(2);
  });
  it('dismiss persists per family and logs', async () => {
    await dismissConcierge('f1');
    expect(await isConciergeDismissed('f1')).toBe(true);
    expect(await isConciergeDismissed('f2')).toBe(false);
    expect(mockLog).toHaveBeenCalledWith({ familyId: 'f1', eventType: 'concierge_offer_dismissed', source: 'dashboard' });
    await AsyncStorage.clear();
  });
});
