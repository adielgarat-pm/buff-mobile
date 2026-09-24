/**
 * pkg/first-win P0 — UStep8 logs that it was reached and that the final CTA
 * was tapped (with the chosen access mode), and the CTA still resets into the
 * app exactly as before.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UStep8_Complete from '../UStep8_Complete';
import { logOnboardingEvent } from '../../../../lib/onboardingFunnel';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ reset: mockReset }),
  useRoute: () => ({ params: { childName: 'Lia', childProfileId: 'child-1', accessMode: 'shared_device' } }),
}));
jest.mock('../../../../contexts/LanguageContext', () => ({ useRTLStyles: () => ({ isRTL: false }) }));
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'parent-1' }, profile: { family_id: 'fam-8' }, familyShortCode: 'ABCD',
    refreshProfile: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('../../../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));
jest.mock('../../../../lib/referralCapture', () => ({
  captureRefFromUrl: jest.fn(() => Promise.resolve()), getRefCode: jest.fn(() => Promise.resolve(null)), clearRefCode: jest.fn(),
}));
jest.mock('../../../../lib/community', () => ({
  openCommunity: jest.fn(), COMMUNITY_LINK_KEY: 'k',
  hasSeenCommunityInvite: jest.fn(() => Promise.resolve(true)), markCommunityInviteSeen: jest.fn(),
}));
jest.mock('../../../../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { pro_settings: {} }, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    })),
    rpc: jest.fn(),
  },
}));

const mockedLog = logOnboardingEvent as unknown as jest.Mock;

it('logs 8_complete on mount, and onboarding_complete_cta with the access mode on tap', async () => {
  const { findByTestId } = render(<UStep8_Complete />);
  expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
    familyId: 'fam-8', eventType: 'onboarding_step_reached', variant: '8_complete',
  }));
  const cta = await findByTestId('onb8-cta');
  fireEvent.press(cta);
  expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
    familyId: 'fam-8', eventType: 'onboarding_complete_cta', method: 'shared_device', childId: 'child-1',
  }));
  await waitFor(() => expect(mockReset).toHaveBeenCalledWith({
    index: 0,
    routes: [{ name: 'ParentApp', params: { screen: 'ParentDashboard', params: { previewChildId: 'child-1' } } }],
  }));
});
