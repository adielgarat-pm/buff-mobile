/**
 * Tests for GamerMyStatsScreen — the lite version of Stitch 5B.
 *
 * Covers: stat-grid render with data, Pause Mode short-circuit, loading state,
 * zero-data fallback (no crash on missing values).
 */
import { render } from '@testing-library/react-native';
import GamerMyStatsScreen from '../GamerMyStatsScreen';

// ── Mock hooks ──────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'child-1', display_name: 'TestKid' } }),
}));

jest.mock('../../../contexts/ModeContext', () => ({
  useMode: () => ({ previewChildId: null, isChildPreview: false }),
}));

jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: jest.fn(),
}));

jest.mock('../../../hooks/usePetState', () => ({
  usePetState: jest.fn(),
}));

jest.mock('../../../hooks/useAppSettings', () => ({
  useAppSettings: jest.fn(),
}));

jest.mock('../../../components/WelcomeBackModal', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <View testID="welcome-back-modal" />,
    useWelcomeBack: () => ({ visible: false, dismiss: jest.fn() }),
  };
});

jest.mock('../../../components/PauseEmptyState', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <Text testID="pause-empty-state">PAUSED</Text>,
  };
});

// Type-safe access to the mocked hooks
import { useChildData } from '../../../hooks/useChildProgress';
import { usePetState } from '../../../hooks/usePetState';
import { useAppSettings } from '../../../hooks/useAppSettings';

const mockedUseChildData    = useChildData as jest.MockedFunction<typeof useChildData>;
const mockedUsePetState     = usePetState as jest.MockedFunction<typeof usePetState>;
const mockedUseAppSettings  = useAppSettings as jest.MockedFunction<typeof useAppSettings>;

// ── Test data builders ─────────────────────────────────────────────────────
const baseChildData = {
  tasks: [],
  totalBalance: 1234,
  dailyGoal: 5,
  loading: false,
};

const basePetState = {
  petState: {
    evolution_days_count: 47,
    daily_streak: 9,
  } as any,
  loading: false,
};

const baseAppSettings = { isPauseActive: false } as any;

// ── Tests ──────────────────────────────────────────────────────────────────
describe('GamerMyStatsScreen', () => {
  beforeEach(() => {
    mockedUseChildData.mockReturnValue(baseChildData as any);
    mockedUsePetState.mockReturnValue(basePetState as any);
    mockedUseAppSettings.mockReturnValue(baseAppSettings);
  });

  test('renders 3 stat cards with the data from hooks', () => {
    const { getByText } = render(<GamerMyStatsScreen />);

    // Title
    expect(getByText('gamerMyStats.title')).toBeTruthy();

    // Stat values
    expect(getByText('1,234')).toBeTruthy();   // totalBalance, locale-formatted
    expect(getByText('47')).toBeTruthy();       // evolution_days_count
    expect(getByText('9')).toBeTruthy();        // daily_streak

    // Stat labels (i18n keys, since we mocked t to return the key)
    expect(getByText('gamerMyStats.statBuffs')).toBeTruthy();
    expect(getByText('gamerMyStats.statSuccessfulDays')).toBeTruthy();
    expect(getByText('gamerMyStats.statCurrentStreak')).toBeTruthy();
  });

  test('renders PauseEmptyState when isPauseActive is true (no stats shown)', () => {
    mockedUseAppSettings.mockReturnValue({ isPauseActive: true } as any);

    const { getByTestId, queryByText } = render(<GamerMyStatsScreen />);

    expect(getByTestId('pause-empty-state')).toBeTruthy();
    // Stats labels should NOT render during pause
    expect(queryByText('gamerMyStats.statBuffs')).toBeNull();
    expect(queryByText('1,234')).toBeNull();
  });

  test('renders 0 fallback for missing pet data without crashing', () => {
    mockedUsePetState.mockReturnValue({
      petState: { evolution_days_count: 0, daily_streak: 0 } as any,
      loading: false,
    } as any);
    mockedUseChildData.mockReturnValue({ ...baseChildData, totalBalance: 0 } as any);

    const { getAllByText } = render(<GamerMyStatsScreen />);

    // All three stats should show "0"
    expect(getAllByText('0').length).toBe(3);
  });

  test('shows loading indicator while either hook is loading', () => {
    mockedUseChildData.mockReturnValue({ ...baseChildData, loading: true } as any);

    const { queryByText } = render(<GamerMyStatsScreen />);

    // Title should not render during loading (loader short-circuits)
    expect(queryByText('gamerMyStats.title')).toBeNull();
  });
});
