/**
 * Tests for ParentActivitiesEntry — the dashboard doorway to "פעילויות וציוד".
 *
 * What matters, and why:
 *   - It renders unconditionally (no feature flag) — the feature is already
 *     live in Settings, so hiding the card would defeat the whole package.
 *   - Tapping it routes to the 'Activities' screen AND logs
 *     `activities_entry_tapped` — the tap half of the funnel.
 *   - It logs `activities_entry_seen` exactly once per app session, no matter
 *     how many times the dashboard re-renders. This is the "seen but never
 *     tapped" vs "never seen" distinction — opposite fixes — so the dedup is
 *     load-bearing, not cosmetic.
 *   - It never logs a seen event before the profile resolves (familyId null),
 *     which would burn the exposure before it could be recorded.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { ParentActivitiesEntry } from '../ParentActivitiesEntry';
import { logOnboardingEvent } from '../../../lib/onboardingFunnel';
import { __resetActivitiesEntryTelemetryForTests } from '../../../lib/activities/entryTelemetry';

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockNavigate = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// useAuth returns whatever the test sets on this holder before rendering.
let mockFamilyId: string | null | undefined = 'fam-1';
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: mockFamilyId }),
}));

jest.mock('../../../lib/onboardingFunnel', () => ({
  logOnboardingEvent: jest.fn(),
}));

const mockedLog = logOnboardingEvent as jest.MockedFunction<typeof logOnboardingEvent>;

describe('ParentActivitiesEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetActivitiesEntryTelemetryForTests();
    mockFamilyId = 'fam-1';
  });

  test('renders the entry copy unconditionally (no feature flag)', () => {
    const { getByText } = render(<ParentActivitiesEntry />);
    expect(getByText('activities.entryTitle')).toBeTruthy();
    expect(getByText('activities.entrySub')).toBeTruthy();
  });

  test('logs activities_entry_seen once on mount', () => {
    render(<ParentActivitiesEntry />);
    const seen = mockedLog.mock.calls.filter(([arg]) => arg.eventType === 'activities_entry_seen');
    expect(seen).toHaveLength(1);
    expect(seen[0][0]).toEqual({ familyId: 'fam-1', eventType: 'activities_entry_seen', source: 'dashboard' });
  });

  test('re-mounting in the same session does not log a second seen event', () => {
    const first = render(<ParentActivitiesEntry />);
    first.unmount();
    render(<ParentActivitiesEntry />);
    const seen = mockedLog.mock.calls.filter(([arg]) => arg.eventType === 'activities_entry_seen');
    expect(seen).toHaveLength(1);
  });

  test('does not log a seen event before familyId resolves', () => {
    mockFamilyId = null;
    render(<ParentActivitiesEntry />);
    expect(mockedLog).not.toHaveBeenCalled();
  });

  test('tapping routes to Activities and logs activities_entry_tapped', () => {
    const { getByRole } = render(<ParentActivitiesEntry />);
    fireEvent.press(getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith('Activities');
    const tapped = mockedLog.mock.calls.filter(([arg]) => arg.eventType === 'activities_entry_tapped');
    expect(tapped).toHaveLength(1);
    expect(tapped[0][0]).toEqual({ familyId: 'fam-1', eventType: 'activities_entry_tapped', source: 'dashboard' });
  });
});
