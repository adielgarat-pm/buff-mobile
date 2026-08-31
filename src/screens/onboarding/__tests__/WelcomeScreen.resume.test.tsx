/**
 * WelcomeScreen — resume prompt (Shape A).
 *
 * Guards the behavior that replaced silent auto-restore: when RootNavigator
 * hands Welcome an in-progress-onboarding snapshot, the screen offers "Continue
 * setup" + "Start over" instead of a blank start; and it only does so when the
 * parent actually got past Step 1 (resuming to an empty UStep1 is just starting
 * fresh). Start-over must clear the snapshot so it can't re-appear.
 */
import { render, fireEvent } from '@testing-library/react-native';

import WelcomeScreen from '../WelcomeScreen';
import { clearOnboardingSnapshot } from '../../../navigation/onboardingPersistence';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, vars?: Record<string, unknown>) =>
      vars && Object.keys(vars).length ? `${k}(${Object.values(vars).join(',')})` : k,
    i18n: { language: 'en' },
  }),
}));

const mockNavigate = jest.fn();
const routeState: { params: unknown } = { params: {} };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute:      () => ({ params: routeState.params }),
}));

jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ textAlign: 'left', rowDirection: 'row' }),
}));

jest.mock('../../../navigation/onboardingPersistence', () => ({
  clearOnboardingSnapshot: jest.fn().mockResolvedValue(undefined),
}));

// Web-only install CTA — render nothing in the test bundle.
jest.mock('../../../components/install/GetTheAppCta', () => () => null);

const mockedClear = clearOnboardingSnapshot as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  routeState.params = {};
});

describe('WelcomeScreen resume prompt', () => {
  it('shows the normal start CTA when there is no snapshot', () => {
    const { getByTestId, queryByTestId } = render(<WelcomeScreen />);
    expect(getByTestId('welcome-cta')).toBeTruthy();
    expect(queryByTestId('welcome-resume')).toBeNull();
  });

  it('offers resume when a mid-wizard snapshot is present, and continues to that step', () => {
    routeState.params = {
      resumeSnapshot: {
        route: 'UStep4_Motivator',
        params: { childName: 'Maya', ageGroup: '9-11', mainChallenge: 'x', additionalChallenges: [] },
        t: Date.now(),
      },
    };
    const { getByTestId, queryByTestId } = render(<WelcomeScreen />);
    expect(getByTestId('welcome-resume')).toBeTruthy();
    expect(queryByTestId('welcome-cta')).toBeNull();

    fireEvent.press(getByTestId('welcome-resume'));
    expect(mockNavigate).toHaveBeenCalledWith(
      'UStep4_Motivator',
      expect.objectContaining({ childName: 'Maya' }),
    );
  });

  it('start-over clears the snapshot and begins at UStep1', () => {
    routeState.params = {
      resumeSnapshot: { route: 'UStep3_Challenges', params: { childName: 'Maya' }, t: Date.now() },
    };
    const { getByTestId } = render(<WelcomeScreen />);
    fireEvent.press(getByTestId('welcome-start-fresh'));
    expect(mockedClear).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('UStep1');
  });

  it('does NOT offer resume for a snapshot still at UStep1 (nothing to resume)', () => {
    routeState.params = {
      resumeSnapshot: { route: 'UStep1', params: {}, t: Date.now() },
    };
    const { getByTestId, queryByTestId } = render(<WelcomeScreen />);
    expect(getByTestId('welcome-cta')).toBeTruthy();
    expect(queryByTestId('welcome-resume')).toBeNull();
  });
});
