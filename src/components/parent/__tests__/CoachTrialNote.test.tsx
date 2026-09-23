/**
 * CoachTrialNote — renders the right one-time trial moment, parent-only,
 * never a purchase button on iOS, and every action dismisses the note.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { CoachTrialNote } from '../CoachTrialNote';

const mockNavigate = jest.fn();
const mockDismiss = jest.fn();
const mockTrial = { phase: 'none' as string };
const mockAuth = { profile: { role: 'parent' } as { role: string } };

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, v?: { name?: string }) => (v?.name ? `${k}(${v.name})` : k) }),
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../../hooks/useFamilyTrial', () => ({
  useFamilyTrial: () => ({ phase: mockTrial.phase, dismiss: mockDismiss }),
}));

const originalOS = Platform.OS;
const setOS = (os: string) => { (Platform as { OS: string }).OS = os; };

describe('CoachTrialNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.profile = { role: 'parent' };
    setOS('android');
  });
  afterAll(() => setOS(originalOS));

  test('renders nothing when there is no trial moment', () => {
    mockTrial.phase = 'none';
    expect(render(<CoachTrialNote childName="Emi" />).toJSON()).toBeNull();
  });

  test('renders nothing for a child profile, whatever the phase (Pillar 1)', () => {
    mockAuth.profile = { role: 'child' };
    for (const p of ['started', 'ending', 'ended']) {
      mockTrial.phase = p;
      expect(render(<CoachTrialNote childName="Emi" />).toJSON()).toBeNull();
    }
  });

  test('started: positive note with the child name, only a Close button', () => {
    mockTrial.phase = 'started';
    const { getByText, queryByTestId, getByTestId } = render(<CoachTrialNote childName="Emi" />);
    expect(getByText('coachTrial.started(Emi)')).toBeTruthy();
    expect(queryByTestId('coach-trial-keep')).toBeNull();
    fireEvent.press(getByTestId('coach-trial-close'));
    expect(mockDismiss).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('ending: tap opens the insights and dismisses', () => {
    mockTrial.phase = 'ending';
    const { getByTestId } = render(<CoachTrialNote childName="Emi" childId="c-1" />);
    fireEvent.press(getByTestId('coach-trial-note-ending'));
    expect(mockDismiss).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('ParentInsights', { childId: 'c-1' });
  });

  test('ended on Android: Keep opens the Paywall; Close just dismisses', () => {
    mockTrial.phase = 'ended';
    const { getByTestId, getByText } = render(<CoachTrialNote childName="Emi" />);
    expect(getByText('coachTrial.ended(Emi)')).toBeTruthy();
    fireEvent.press(getByTestId('coach-trial-keep'));
    expect(mockNavigate).toHaveBeenCalledWith('Paywall', { childName: 'Emi' });
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('coach-trial-close'));
    expect(mockDismiss).toHaveBeenCalledTimes(2);
  });

  test('ended on web: Keep is shown (Paywall routes to the Android app)', () => {
    setOS('web');
    mockTrial.phase = 'ended';
    expect(render(<CoachTrialNote childName="Emi" />).getByTestId('coach-trial-keep')).toBeTruthy();
  });

  test('ended on iOS: no purchase button (no IAP yet), Close only', () => {
    setOS('ios');
    mockTrial.phase = 'ended';
    const { queryByTestId, getByTestId } = render(<CoachTrialNote childName="Emi" />);
    expect(queryByTestId('coach-trial-keep')).toBeNull();
    expect(getByTestId('coach-trial-close')).toBeTruthy();
  });
});
