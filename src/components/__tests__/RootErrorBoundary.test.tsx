import { render, fireEvent, act } from '@testing-library/react-native';
import { Text } from 'react-native';

// The global Sentry mock (jest-setup.ts) has no ErrorBoundary; use the real one
// from @sentry/react (what @sentry/react-native re-exports). With no client
// initialised its capture is a no-op.
jest.mock('@sentry/react-native', () => ({
  ErrorBoundary: jest.requireActual('@sentry/react').ErrorBoundary,
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockRestartApp = jest.fn();
jest.mock('../../lib/restartApp', () => ({
  restartApp: (remount: () => void) => mockRestartApp(remount),
}));

import { RootErrorBoundary } from '../RootErrorBoundary';
import i18n from '../../i18n';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <Text>all good</Text>;
}

describe('RootErrorBoundary', () => {
  const realError = console.error;
  beforeEach(() => {
    shouldThrow = true;
    mockRestartApp.mockReset();
    console.error = jest.fn(); // React logs the caught error; keep output clean
  });
  afterEach(() => { console.error = realError; });

  it('renders children when nothing throws', () => {
    shouldThrow = false;
    const { getByText } = render(<RootErrorBoundary><Bomb /></RootErrorBoundary>);
    expect(getByText('all good')).toBeTruthy();
  });

  it('shows the calm fallback instead of unmounting the tree', () => {
    const { getByText, getByTestId } = render(<RootErrorBoundary><Bomb /></RootErrorBoundary>);
    expect(getByText(i18n.t('errorBoundary.title'))).toBeTruthy();
    expect(getByText(i18n.t('errorBoundary.body'))).toBeTruthy();
    expect(getByTestId('error-boundary-retry')).toBeTruthy();
  });

  it('"Try again" calls restartApp with a remount that recovers the tree', () => {
    const { getByTestId, getByText } = render(<RootErrorBoundary><Bomb /></RootErrorBoundary>);
    fireEvent.press(getByTestId('error-boundary-retry'));
    expect(mockRestartApp).toHaveBeenCalledTimes(1);

    // Simulate the remount fallback path (no full reload available).
    shouldThrow = false;
    const remount = mockRestartApp.mock.calls[0][0] as () => void;
    act(() => remount());
    expect(getByText('all good')).toBeTruthy();
  });
});
