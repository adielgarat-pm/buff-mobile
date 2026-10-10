/**
 * useWelcomeBack — write-loop regression (family c717, 2026-10-08).
 *
 * recordChildActivity used to change identity (and lastChildActivity to change)
 * on every call; the effect re-ran on each change before its awaits finished,
 * firing ~90 app_settings PATCHes per child open. The hook must stamp activity
 * exactly once per mount even when its inputs churn.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useWelcomeBack } from '../WelcomeBackModal';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../contexts/ThemeContext', () => ({ useChildTheme: () => ({}) }));

const mockRecord = jest.fn().mockResolvedValue(undefined);
let mockState: { lastChildActivity: string | null; recordChildActivity: () => Promise<void> };
jest.mock('../../hooks/useAppSettings', () => ({
  useAppSettings: () => ({
    isPauseActive: false,
    settings: { family_id: 'fam-1' },
    lastChildActivity: mockState.lastChildActivity,
    recordChildActivity: mockState.recordChildActivity,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockState = { lastChildActivity: null, recordChildActivity: mockRecord };
});

describe('useWelcomeBack', () => {
  it('records child activity once per mount even when its inputs keep changing', async () => {
    const { rerender } = renderHook(() => useWelcomeBack());
    // Simulate the old churn: every render brings a new activity value and a
    // new callback identity.
    for (let i = 0; i < 5; i++) {
      mockState = {
        lastChildActivity: new Date(Date.now() - i * 1000).toISOString(),
        recordChildActivity: () => mockRecord(),
      };
      rerender({});
    }
    await waitFor(() => expect(mockRecord).toHaveBeenCalled());
    expect(mockRecord).toHaveBeenCalledTimes(1);
  });

  it('shows the modal after more than 3 days without child activity', async () => {
    mockState.lastChildActivity = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const { result } = renderHook(() => useWelcomeBack());
    await waitFor(() => expect(result.current.visible).toBe(true));
  });

  it('does not show the modal for recent activity', async () => {
    mockState.lastChildActivity = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { result } = renderHook(() => useWelcomeBack());
    await waitFor(() => expect(mockRecord).toHaveBeenCalledTimes(1));
    expect(result.current.visible).toBe(false);
  });
});
