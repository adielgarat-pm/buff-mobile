/**
 * stepReachedWiring — proves the funnel telemetry is actually wired into the
 * real wizard screens, not just that the hook works in isolation.
 *
 * The unit test (src/hooks/__tests__/useStepReachedLog.test.ts) guards the hook's
 * dedup/scope rules. THIS test guards the thing that unit test cannot: that
 * mounting an actual onboarding screen fires `onboarding_step_reached` with that
 * screen's step id. If someone removes the hook call from a screen, this fails.
 *
 * Deterministic and offline — logOnboardingEvent is mocked, so nothing hits the
 * network. Each screen uses a distinct familyId so the hook's module-level
 * session Set can't cross-cancel between cases.
 */
import { render } from '@testing-library/react-native';

import UStep2_Goal from '../UStep2_Goal';
import UStep4_Motivator from '../UStep4_Motivator';
import { logOnboardingEvent } from '../../../../lib/onboardingFunnel';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute:      () => ({ params: { childName: 'Gal', ageGroup: '9-11', mainChallenge: 'morning_routine', additionalChallenges: [] } }),
}));

jest.mock('../../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false }),
}));

// familyId is set per-test via this mutable holder so each screen gets its own.
const authState: { familyId: string | null } = { familyId: null };
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: authState.familyId, user: { id: 'parent-1' } }),
}));

jest.mock('../../../../lib/onboardingFunnel', () => ({
  logOnboardingEvent: jest.fn(),
}));

const mockedLog = logOnboardingEvent as unknown as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('onboarding step-reached wiring', () => {
  it('UStep2_Goal fires onboarding_step_reached with variant 2_goal on mount', () => {
    authState.familyId = 'fam-step2';
    render(<UStep2_Goal />);
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      familyId:  'fam-step2',
      eventType: 'onboarding_step_reached',
      source:    'onboarding',
      variant:   '2_goal',
    }));
  });

  it('UStep4_Motivator fires onboarding_step_reached with variant 4_motivator on mount', () => {
    authState.familyId = 'fam-step4';
    render(<UStep4_Motivator />);
    expect(mockedLog).toHaveBeenCalledWith(expect.objectContaining({
      familyId:  'fam-step4',
      eventType: 'onboarding_step_reached',
      variant:   '4_motivator',
    }));
  });

  it('does not fire before a family exists (familyId null)', () => {
    authState.familyId = null;
    render(<UStep2_Goal />);
    expect(mockedLog).not.toHaveBeenCalled();
  });
});
