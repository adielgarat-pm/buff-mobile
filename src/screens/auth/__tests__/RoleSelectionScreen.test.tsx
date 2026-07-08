/**
 * Tests for RoleSelectionScreen — the pre-auth role choice screen.
 *
 * Guards the new-parent funnel fix (pkg/ux-parent-signup-path): the
 * "I'm a Parent" card must route brand-new parents to Signup (with the
 * parent role preselected), NOT to Login. Before this fix both the parent
 * card and the footer link went to Login, so a first-time parent landed on
 * a "Log In" form, got "Invalid email or password", and abandoned.
 *
 * Covered:
 *   - Parent card → Signup with { initialRole: 'parent' }
 *   - Child card  → ChildJoin (unchanged)
 *   - Footer "Already have an account?" link → Login (unchanged)
 */
import { render, fireEvent } from '@testing-library/react-native';
import RoleSelectionScreen from '../RoleSelectionScreen';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// SafeAreaView needs an insets provider in real trees; a plain View is enough
// for a navigation-wiring test.
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

// Presentational satellites of the screen — not the SUT. LanguagePicker pulls
// in LanguageContext; GetTheAppCta is the web-only install strip (null on
// native anyway).
jest.mock('../../../components/LanguagePicker', () => () => null);
jest.mock('../../../components/install/GetTheAppCta', () => () => null);

// ── Tests ──────────────────────────────────────────────────────────────────
describe('RoleSelectionScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  test('"I\'m a Parent" card navigates to Signup with the parent role preselected', () => {
    const { getByText } = render(<RoleSelectionScreen />);

    fireEvent.press(getByText('auth.iAmParent'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Signup', { initialRole: 'parent' });
  });

  test('"I\'m a Child" card navigates to ChildJoin', () => {
    const { getByText } = render(<RoleSelectionScreen />);

    fireEvent.press(getByText('auth.iAmChild'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('ChildJoin');
  });

  test('footer "Already have an account?" link still navigates to Login', () => {
    const { getByText } = render(<RoleSelectionScreen />);

    fireEvent.press(getByText('roleSelection.alreadyHaveAccount'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
