/**
 * Tests for LoginScreen error handling (pkg/ux-login-errors).
 *
 * Guards two truth-in-errors fixes:
 *   1. signIn failures are no longer all mapped to "Invalid email or
 *      password" — network/server failures (AuthRetryableFetchError,
 *      status 0/5xx, fetch TypeErrors) show auth.networkError instead,
 *      so a parent on flaky wifi doesn't "fix" a correct password.
 *   2. Password reset no longer ignores the API result — a failed
 *      resetPasswordForEmail shows auth.resetFailed instead of the
 *      "check your email" success state.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { isNetworkAuthError } from '../authErrors';

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

const mockSignIn = jest.fn();
const mockSignInWithGoogle = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
  }),
}));

const mockResetPasswordForEmail = jest.fn();
jest.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
  },
}));

const mockCrossAlert = jest.fn();
jest.mock('../../../platform', () => ({
  crossAlert: (...args: unknown[]) => mockCrossAlert(...args),
}));

// Presentational satellites — not the SUT.
jest.mock('../../../components/LanguagePicker', () => () => null);
jest.mock('../../../components/AppleSignInButton', () => () => null);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// ── Helpers ────────────────────────────────────────────────────────────────
function fillCredentials(utils: ReturnType<typeof render>) {
  fireEvent.changeText(utils.getByPlaceholderText('auth.email'), 'adi@buffadhd.com');
  fireEvent.changeText(utils.getByPlaceholderText('auth.password'), 'correct-horse');
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('LoginScreen sign-in error mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('network failure (AuthRetryableFetchError) shows connection message, NOT invalid credentials', async () => {
    mockSignIn.mockResolvedValue({
      error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 },
    });
    const utils = render(<LoginScreen />);
    fillCredentials(utils);

    fireEvent.press(utils.getByText('auth.login'));

    await waitFor(() => expect(mockCrossAlert).toHaveBeenCalledWith('auth.networkError'));
    expect(mockCrossAlert).not.toHaveBeenCalledWith('auth.invalidCredentials');
  });

  test('server 5xx shows connection message', async () => {
    mockSignIn.mockResolvedValue({
      error: { name: 'AuthApiError', message: 'Internal Server Error', status: 502 },
    });
    const utils = render(<LoginScreen />);
    fillCredentials(utils);

    fireEvent.press(utils.getByText('auth.login'));

    await waitFor(() => expect(mockCrossAlert).toHaveBeenCalledWith('auth.networkError'));
  });

  test('genuine invalid credentials keep the existing message', async () => {
    mockSignIn.mockResolvedValue({
      error: { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 },
    });
    const utils = render(<LoginScreen />);
    fillCredentials(utils);

    fireEvent.press(utils.getByText('auth.login'));

    await waitFor(() => expect(mockCrossAlert).toHaveBeenCalledWith('auth.invalidCredentials'));
    expect(mockCrossAlert).not.toHaveBeenCalledWith('auth.networkError');
  });

  test('successful sign-in shows no alert', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const utils = render(<LoginScreen />);
    fillCredentials(utils);

    fireEvent.press(utils.getByText('auth.login'));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
    expect(mockCrossAlert).not.toHaveBeenCalled();
  });
});

describe('LoginScreen password reset feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function openResetAndSend(utils: ReturnType<typeof render>) {
    fireEvent.press(utils.getByText('auth.forgotPassword'));
    // Two 'auth.email' inputs exist once the modal is open (login form +
    // modal); the modal's is rendered last.
    const emailInputs = utils.getAllByPlaceholderText('auth.email');
    fireEvent.changeText(emailInputs[emailInputs.length - 1], 'adi@buffadhd.com');
    fireEvent.press(utils.getByText('auth.sendResetLink'));
  }

  test('reset failure shows auth.resetFailed and NOT the success state', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 },
    });
    const utils = render(<LoginScreen />);

    openResetAndSend(utils);

    await waitFor(() => expect(mockCrossAlert).toHaveBeenCalledWith('auth.resetFailed'));
    expect(utils.queryByText('auth.checkEmail')).toBeNull();
  });

  test('reset success shows the check-your-email confirmation', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null, data: {} });
    const utils = render(<LoginScreen />);

    openResetAndSend(utils);

    await waitFor(() => expect(utils.getByText('auth.checkEmail')).toBeTruthy());
    expect(mockCrossAlert).not.toHaveBeenCalled();
  });
});

describe('isNetworkAuthError classification', () => {
  test.each([
    [{ name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 }, true],
    [{ name: 'AuthApiError', message: 'Bad Gateway', status: 502 }, true],
    [{ name: 'TypeError', message: 'Network request failed' }, true],
    [{ name: 'TypeError', message: 'Failed to fetch' }, true],
    [{ name: 'AuthApiError', message: 'Invalid login credentials', status: 400 }, false],
    [{ name: 'AuthApiError', message: 'Email not confirmed', status: 400 }, false],
    [null, false],
  ])('%o → %s', (error, expected) => {
    expect(isNetworkAuthError(error as Parameters<typeof isNetworkAuthError>[0])).toBe(expected);
  });
});
