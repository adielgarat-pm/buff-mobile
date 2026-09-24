/**
 * firstWinWiring — pkg/first-win P0. Proves the post-save onboarding steps log
 * where parents stop: UStep6 (step reached + the presence answer) and
 * ChildAccessStep (step reached). logOnboardingEvent is mocked; offline.
 */
import { render, fireEvent } from '@testing-library/react-native';

import UStep6_FirstTask from '../UStep6_FirstTask';
import ChildAccessStep from '../ChildAccessStep';
import { logOnboardingEvent } from '../../../../lib/onboardingFunnel';

const mockNavigate = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: { childName: 'Gal', childProfileId: 'child-1', gender: 'boy' } }),
}));
jest.mock('../../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false }),
}));
const authState: { familyId: string | null } = { familyId: null };
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: authState.familyId, familyShortCode: 'ABC123', user: { id: 'parent-1' } }),
}));
jest.mock('../../../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));
jest.mock('../../../../integrations/supabase/client', () => {
  const chain: Record<string, jest.Mock> = {};
  for (const m of ['select', 'eq', 'order', 'update']) chain[m] = jest.fn(() => chain);
  chain.limit = jest.fn(() => Promise.resolve({ data: [{ id: 't1', title: 'Water' }], error: null }));
  return { supabase: { from: jest.fn(() => chain) } };
});
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const mockedLog = logOnboardingEvent as unknown as jest.Mock;
beforeEach(() => { jest.clearAllMocks(); });

describe('first-win onboarding wiring', () => {
  it('UStep6 logs step 6_first_task on mount', () => {
    authState.familyId = 'fam-6a';
    render(<UStep6_FirstTask />);
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      familyId: 'fam-6a', eventType: 'onboarding_step_reached', variant: '6_first_task',
    }));
  });

  it('UStep6 "not right now" logs presence_answered not_now and goes to the access step', () => {
    authState.familyId = 'fam-6b';
    const { getByText } = render(<UStep6_FirstTask />);
    fireEvent.press(getByText('onboarding.stepD.presenceNo'));
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      familyId: 'fam-6b', eventType: 'presence_answered', method: 'not_now',
      variant: 'presence', childId: 'child-1',
    }));
    expect(mockNavigate).toHaveBeenCalledWith('ChildAccessStep', expect.anything());
  });

  it('UStep6 "we are together" logs presence_answered together', () => {
    authState.familyId = 'fam-6c';
    const { getByText } = render(<UStep6_FirstTask />);
    fireEvent.press(getByText('onboarding.stepD.presenceYes'));
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'presence_answered', method: 'together', variant: 'presence',
    }));
  });

  it('ChildAccessStep logs step 7_access on mount', () => {
    authState.familyId = 'fam-7';
    render(<ChildAccessStep />);
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      familyId: 'fam-7', eventType: 'onboarding_step_reached', variant: '7_access',
    }));
  });
});
