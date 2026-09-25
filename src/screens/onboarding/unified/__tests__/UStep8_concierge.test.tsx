/** pkg/concierge-call — UStep8 shows the quiet call offer on first-time onboarding only. */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UStep8_Complete from '../UStep8_Complete';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => (k === 'concierge.bookingLink' ? 'https://cal.com/adi-elgarat-german-buff' : k), i18n: { language: 'en' } }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ reset: jest.fn() }),
  useRoute: () => ({ params: { childName: 'Lia', childProfileId: 'child-1' } }),
}));
jest.mock('../../../../contexts/LanguageContext', () => ({ useRTLStyles: () => ({ isRTL: false }) }));
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'parent-1' }, profile: { family_id: 'fam-8' }, familyShortCode: 'ABCD', refreshProfile: jest.fn().mockResolvedValue(undefined) }),
}));
jest.mock('../../../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));
jest.mock('../../../../lib/referralCapture', () => ({
  captureRefFromUrl: jest.fn(() => Promise.resolve()), getRefCode: jest.fn(() => Promise.resolve(null)), clearRefCode: jest.fn(),
}));
jest.mock('../../../../lib/community', () => ({
  openCommunity: jest.fn(), COMMUNITY_LINK_KEY: 'k',
  hasSeenCommunityInvite: jest.fn(() => Promise.resolve(true)), markCommunityInviteSeen: jest.fn(),
}));
const mockOpen = jest.fn(() => true);
jest.mock('../../../../lib/concierge', () => {
  const actual = jest.requireActual('../../../../lib/concierge');
  return { ...actual, openConcierge: (a: unknown) => mockOpen(a), logConciergeSeen: jest.fn() };
});
const mockPrev = { settings: {} as Record<string, unknown> };
jest.mock('../../../../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { pro_settings: mockPrev.settings }, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    })),
    rpc: jest.fn(),
  },
}));

beforeEach(() => { jest.clearAllMocks(); mockPrev.settings = {}; });

it('first-time onboarding: shows the offer and opens the booking page', async () => {
  const { findByTestId } = render(<UStep8_Complete />);
  fireEvent.press(await findByTestId('onb8-concierge'));
  expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining({
    url: 'https://cal.com/adi-elgarat-german-buff', placement: 'onboarding_complete', familyId: 'fam-8',
  }));
});

it('add-child flow (already onboarded): no offer', async () => {
  mockPrev.settings = { onboarding_complete: true };
  const { findByTestId, queryByTestId } = render(<UStep8_Complete />);
  await findByTestId('onb8-cta');
  await waitFor(() => expect(queryByTestId('onb8-concierge')).toBeNull());
});
