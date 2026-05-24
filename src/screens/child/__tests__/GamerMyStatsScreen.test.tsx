/**
 * Tests for GamerMyStatsScreen — the full Stitch 5B layout.
 *
 * Covers: render with V0.5 data, Pause Mode short-circuit, loading state,
 * fresh-child fallback (relationship === null → L1 + zeros), L5 hides
 * progress bar, booster carousel renders gifts.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GamerMyStatsScreen from '../GamerMyStatsScreen';
import type { BuddyRelationship, BuddyGift } from '../../../types/buddy';

// ── Mock hooks ──────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'level' in opts ? `${key}:${opts.level}` : key,
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'child-1', display_name: 'TestKid' } }),
}));

jest.mock('../../../contexts/ModeContext', () => ({
  useMode: () => ({ previewChildId: null, isChildPreview: false }),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../hooks/useBuddyRelationship', () => ({
  useBuddyRelationship: jest.fn(),
}));

jest.mock('../../../hooks/useChildBuddyStats', () => ({
  useChildBuddyStats: jest.fn(),
}));

jest.mock('../../../hooks/useChildBuddyGifts', () => ({
  useChildBuddyGifts: jest.fn(),
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
import { useBuddyRelationship } from '../../../hooks/useBuddyRelationship';
import { useChildBuddyStats } from '../../../hooks/useChildBuddyStats';
import { useChildBuddyGifts } from '../../../hooks/useChildBuddyGifts';
import { useAppSettings } from '../../../hooks/useAppSettings';

const mockedUseBuddy       = useBuddyRelationship as jest.MockedFunction<typeof useBuddyRelationship>;
const mockedUseStats       = useChildBuddyStats   as jest.MockedFunction<typeof useChildBuddyStats>;
const mockedUseGifts       = useChildBuddyGifts   as jest.MockedFunction<typeof useChildBuddyGifts>;
const mockedUseAppSettings = useAppSettings       as jest.MockedFunction<typeof useAppSettings>;

// ── Test data builders ─────────────────────────────────────────────────────
const baseRelationship: BuddyRelationship = {
  id: 'rel-1',
  child_profile_id: 'child-1',
  friendship_level: 2,
  successful_days_count: 5,
  current_skin_id: 'wolf',
  current_theme_color: null,
  buddy_name: null,
  buddy_visible: true,
  has_pending_gift: false,
  relationship_started_at: '2026-05-01T00:00:00Z',
  last_level_up_at: '2026-05-15T00:00:00Z',
  last_successful_day_date: '2026-05-19',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-15T00:00:00Z',
};

const baseGift: BuddyGift = {
  id: 'gift-1',
  child_profile_id: 'child-1',
  gift_type: 'theme_color',
  gift_value: 'lime',
  given_at_level: 2,
  given_at: '2026-05-15T00:00:00Z',
  used_at: null,
  is_used: false,
  created_at: '2026-05-15T00:00:00Z',
};

function setHooks({
  relationship = baseRelationship,
  daysTogether = 12,
  tasksCompleted = 47,
  gifts = [baseGift],
  loading = { buddy: false, stats: false, gifts: false },
  isPauseActive = false,
}: Partial<{
  relationship: BuddyRelationship | null;
  daysTogether: number;
  tasksCompleted: number;
  gifts: BuddyGift[];
  loading: { buddy: boolean; stats: boolean; gifts: boolean };
  isPauseActive: boolean;
}> = {}) {
  mockedUseBuddy.mockReturnValue({
    relationship,
    loading: loading.buddy,
    error: null,
    refetch: jest.fn(),
    setBuddyVisible: jest.fn(),
    setBuddyName: jest.fn(),
  } as any);
  mockedUseStats.mockReturnValue({
    stats: { daysTogether, tasksCompleted },
    loading: loading.stats,
    error: null,
    refetch: jest.fn(),
  } as any);
  mockedUseGifts.mockReturnValue({
    gifts,
    loading: loading.gifts,
    error: null,
    refetch: jest.fn(),
  } as any);
  mockedUseAppSettings.mockReturnValue({ isPauseActive } as any);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('GamerMyStatsScreen', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    setHooks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders full 5B layout with V0.5 data', () => {
    const { getByText, queryAllByText } = render(<GamerMyStatsScreen />);

    // Title + LEVEL N (from LevelPill)
    expect(getByText('gamerMyStats.title')).toBeTruthy();
    expect(getByText('LEVEL 2')).toBeTruthy();

    // 3 stat values
    expect(getByText('12')).toBeTruthy(); // daysTogether
    expect(getByText('5')).toBeTruthy();  // successful_days_count
    expect(getByText('47')).toBeTruthy(); // tasksCompleted

    // 3 stat labels
    expect(getByText('gamerMyStats.statDaysTogether')).toBeTruthy();
    expect(getByText('gamerMyStats.statSuccessfulDays')).toBeTruthy();
    expect(getByText('gamerMyStats.statTasksCompleted')).toBeTruthy();

    // Progress bar label (level=2 → next is 3)
    expect(getByText('gamerMyStats.progressToNextLevel:3')).toBeTruthy();

    // Booster carousel section title + one available gift label
    expect(queryAllByText('buddy.boosters.sectionTitle').length).toBeGreaterThan(0);
    expect(queryAllByText('buddy.boosters.giftType.theme_color').length).toBeGreaterThan(0);
  });

  test('renders PauseEmptyState when isPauseActive — no stats shown', () => {
    setHooks({ isPauseActive: true });

    const { getByTestId, queryByText } = render(<GamerMyStatsScreen />);

    expect(getByTestId('pause-empty-state')).toBeTruthy();
    expect(queryByText('gamerMyStats.statDaysTogether')).toBeNull();
    expect(queryByText('12')).toBeNull();
  });

  test('shows loader while any of buddy/stats/gifts is loading', () => {
    setHooks({ loading: { buddy: false, stats: true, gifts: false } });

    const { queryByText } = render(<GamerMyStatsScreen />);

    expect(queryByText('gamerMyStats.title')).toBeNull();
  });

  test('fresh-child fallback: null relationship renders L1 with zeros', () => {
    setHooks({ relationship: null, daysTogether: 0, tasksCompleted: 0, gifts: [] });

    const { getByText, getAllByText } = render(<GamerMyStatsScreen />);

    expect(getByText('LEVEL 1')).toBeTruthy();
    // All 3 stat values render as "0"
    expect(getAllByText('0').length).toBe(3);
    // Progress bar visible (level < 5) — next level is 2
    expect(getByText('gamerMyStats.progressToNextLevel:2')).toBeTruthy();
  });

  test('L5 hides the progress bar', () => {
    setHooks({ relationship: { ...baseRelationship, friendship_level: 5, successful_days_count: 120 } });

    const { queryByText } = render(<GamerMyStatsScreen />);

    expect(queryByText('LEVEL 5')).toBeTruthy();
    // progressToNextLevel:6 would render if the bar wasn't hidden
    expect(queryByText('gamerMyStats.progressToNextLevel:6')).toBeNull();
  });

  test('tapping an available booster fires the coming-soon alert', () => {
    const { getByText } = render(<GamerMyStatsScreen />);

    fireEvent.press(getByText('buddy.boosters.giftType.theme_color'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});
