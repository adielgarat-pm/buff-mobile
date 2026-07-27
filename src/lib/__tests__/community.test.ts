/**
 * community — the one door to the parent WhatsApp community.
 *
 * What is worth guarding here:
 *  1. The link is an i18n VALUE, so a missing key makes i18next hand back the
 *     key string itself. Handing "philosophy.community.link" to the OS opens
 *     nothing on native and performs a bogus relative navigation on web, so a
 *     non-https value must never reach `openExternalUrl`.
 *  2. Both real groups must stay reachable — the HE and EN invite URLs are the
 *     product, and a typo in either strands a whole language.
 *  3. The post-onboarding invite is one-shot; a failed storage read must fall
 *     back to "already seen", never to "show it again every time".
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  openCommunity,
  isValidCommunityUrl,
  hasSeenCommunityInvite,
  markCommunityInviteSeen,
  COMMUNITY_LINK_KEY,
} from '../community';
import { logOnboardingEvent } from '../onboardingFunnel';
import { openExternalUrl } from '../../platform';
import he from '../../i18n/he.json';
import en from '../../i18n/en.json';

jest.mock('../onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));
jest.mock('../../platform', () => ({ openExternalUrl: jest.fn() }));

const mockedOpen = openExternalUrl as jest.MockedFunction<typeof openExternalUrl>;
const mockedLog  = logOnboardingEvent as jest.MockedFunction<typeof logOnboardingEvent>;

const HE_GROUP = 'https://chat.whatsapp.com/JUCsJ7yrNWQC4E25vqNIK5';
const EN_GROUP = 'https://chat.whatsapp.com/KM1b9UmQO0cBGgCVI54W7R';

beforeEach(() => {
  jest.clearAllMocks();
  void AsyncStorage.clear();
});

describe('the invite URL comes from the catalog, per language', () => {
  it('both catalogs carry a real https invite under the shared key', () => {
    expect((he as Record<string, string>)[COMMUNITY_LINK_KEY]).toBe(HE_GROUP);
    expect((en as Record<string, string>)[COMMUNITY_LINK_KEY]).toBe(EN_GROUP);
  });

  it('the two languages point at DIFFERENT groups', () => {
    expect((he as Record<string, string>)[COMMUNITY_LINK_KEY])
      .not.toBe((en as Record<string, string>)[COMMUNITY_LINK_KEY]);
  });
});

describe('isValidCommunityUrl', () => {
  it.each([HE_GROUP, EN_GROUP])('accepts a real invite (%s)', url => {
    expect(isValidCommunityUrl(url)).toBe(true);
  });

  it.each([
    ['the i18n key itself (missing translation)', COMMUNITY_LINK_KEY],
    ['an empty string', ''],
    ['plain http', 'http://chat.whatsapp.com/abc'],
    ['undefined', undefined],
    ['null', null],
  ])('rejects %s', (_label, url) => {
    expect(isValidCommunityUrl(url as string | undefined | null)).toBe(false);
  });
});

describe('openCommunity', () => {
  it('opens the group and records the placement', () => {
    const opened = openCommunity({ url: HE_GROUP, placement: 'settings', familyId: 'fam-1' });

    expect(opened).toBe(true);
    expect(mockedOpen).toHaveBeenCalledWith(HE_GROUP);
    expect(mockedLog).toHaveBeenCalledWith({
      familyId:  'fam-1',
      eventType: 'community_link_clicked',
      source:    'settings',
    });
  });

  it('never leaves the app when the URL failed to resolve', () => {
    const opened = openCommunity({
      url:       COMMUNITY_LINK_KEY, // i18next returns the key when it is missing
      placement: 'philosophy',
      familyId:  'fam-1',
    });

    expect(opened).toBe(false);
    expect(mockedOpen).not.toHaveBeenCalled();
    expect(mockedLog).not.toHaveBeenCalled();
  });

  it('still opens for a parent with no family id (the click is just not logged)', () => {
    // logOnboardingEvent itself drops family-less events; the point here is that
    // a missing family must never block the parent from reaching the group.
    const opened = openCommunity({ url: EN_GROUP, placement: 'settings', familyId: null });

    expect(opened).toBe(true);
    expect(mockedOpen).toHaveBeenCalledWith(EN_GROUP);
  });
});

describe('post-onboarding one-shot flag', () => {
  it('is unseen on a fresh device, and seen after it is marked', async () => {
    expect(await hasSeenCommunityInvite()).toBe(false);
    await markCommunityInviteSeen();
    expect(await hasSeenCommunityInvite()).toBe(true);
  });

  it('treats a storage failure as SEEN, so the invite cannot start repeating', async () => {
    const spy = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage gone'));
    expect(await hasSeenCommunityInvite()).toBe(true);
    spy.mockRestore();
  });

  it('does not throw when the write fails', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage gone'));
    await expect(markCommunityInviteSeen()).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
