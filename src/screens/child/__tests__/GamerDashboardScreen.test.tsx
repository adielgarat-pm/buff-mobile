/**
 * Tests for GamerDashboardScreen — daily-loop UX fixes (pkg/ux-gamer-daily-loop).
 *
 * Covers:
 *   1. "Successful days" reads the server-derived per-child count
 *      (buddy_relationships.successful_days_count) — NOT the per-device
 *      pet_state.evolution_days_count — so it matches GamerMyStats/MeAndBuddy.
 *   2. Streak-0 gate: a lapsed teen never sees a "0" streak — the card shows
 *      the forward-looking nudge instead (mirrors the Pastel streak>0 gate).
 *   3. Parent-preview banner is tappable and calls exitChildPreview
 *      (same contract as the Pastel ChildDashboardScreen banner).
 */
import { render, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import GamerDashboardScreen from '../GamerDashboardScreen';

// ── Mocks ───────────────────────────────────────────────────────────────────
// initReactI18next must survive the mock: src/i18n/index.ts (pulled in via
// lib/uiLocale) passes it to i18next.use() at module load.
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

// Keep day-visibility out of scope — the filter tests below are about the
// time-of-day chips, not schedule_days.
jest.mock('../../../utils/taskSchedule', () => ({
  isTaskVisibleToday: () => true,
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'child-1', display_name: 'TestKid' } }),
}));

jest.mock('../../../contexts/ModeContext', () => ({
  useMode: jest.fn(),
}));

jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: jest.fn(),
}));

jest.mock('../../../hooks/usePetState', () => ({
  usePetState: jest.fn(),
}));

jest.mock('../../../hooks/useChildStreak', () => ({
  useChildStreak: jest.fn(),
}));

jest.mock('../../../hooks/useBuffCatch', () => ({
  useBuffCatch: () => ({ best: 0, playsLeft: 3, reload: jest.fn() }),
}));

jest.mock('../../../hooks/useAppSettings', () => ({
  useAppSettings: () => ({ settings: { friday_enabled: false }, isPauseActive: false }),
}));

jest.mock('../../../hooks/useBuddyRelationship', () => ({
  useBuddyRelationship: jest.fn(),
}));

jest.mock('../../../hooks/useDailyVibe', () => ({
  useDailyVibe: () => ({
    hasVibedToday: true,
    recordVibe: jest.fn(),
    loading: false,
    isLowPower: false,
    sosSent: false,
    sendSos: jest.fn(),
    awardInstantBuff: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useVibeDismiss', () => ({
  useVibeDismiss: () => ({ isDismissed: false, markDismissed: jest.fn(), loading: false }),
}));

jest.mock('../../../hooks/useIncomingSticker', () => ({
  useIncomingSticker: () => ({ sticker: null, markSeen: jest.fn() }),
}));

// Presentational children — stubbed; not under test here.
jest.mock('../../../components/PauseEmptyState', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../components/OffRoutineBanner', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../components/WelcomeBackModal', () => ({
  __esModule: true,
  default: () => null,
  useWelcomeBack: () => ({ visible: false, dismiss: jest.fn() }),
}));
jest.mock('../../../components/buddy/BuddyHero', () => ({ BuddyHero: () => null }));
jest.mock('../../../components/buddy/BuddyToggleModal', () => ({ BuddyToggleModal: () => null }));
jest.mock('../VibeCheckScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../components/child/IncomingStickerModal', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../components/LowPowerBanner', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../components/SosButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../components/InstantBuffCard', () => ({ __esModule: true, default: () => null }));
jest.mock('../../../components/PackingCard', () => ({ __esModule: true, default: () => null }));

jest.mock('../../../lib/uiLocale', () => ({
  formatNum: (n: number) => String(n),
}));

// Type-safe access to the mocked hooks
import { useMode } from '../../../contexts/ModeContext';
import { useChildData } from '../../../hooks/useChildProgress';
import { usePetState } from '../../../hooks/usePetState';
import { useChildStreak } from '../../../hooks/useChildStreak';
import { useBuddyRelationship } from '../../../hooks/useBuddyRelationship';

const mockedUseMode      = useMode              as jest.MockedFunction<typeof useMode>;
const mockedUseChildData = useChildData         as jest.MockedFunction<typeof useChildData>;
const mockedUsePetState  = usePetState          as jest.MockedFunction<typeof usePetState>;
const mockedUseStreak    = useChildStreak       as jest.MockedFunction<typeof useChildStreak>;
const mockedUseBuddy     = useBuddyRelationship as jest.MockedFunction<typeof useBuddyRelationship>;

function setHooks({
  streak = 0,
  successfulDays = 5,
  evolutionDaysCount = 99, // deliberately different — must never be shown
  isChildPreview = false,
  exitChildPreview = jest.fn(),
  tasks = [],
  completeTask = jest.fn(),
  uncompleteTask = jest.fn(),
}: Partial<{
  streak: number;
  successfulDays: number;
  evolutionDaysCount: number;
  isChildPreview: boolean;
  exitChildPreview: () => void;
  tasks: any[];
  completeTask: () => void;
  uncompleteTask: () => void;
}> = {}) {
  mockedUseMode.mockReturnValue({
    viewMode: isChildPreview ? 'child-preview' : 'child',
    isChildPreview,
    previewChildId: isChildPreview ? 'child-1' : null,
    previewChildName: isChildPreview ? 'TestKid' : null,
    enterChildPreview: jest.fn(),
    exitChildPreview,
  } as any);
  mockedUseChildData.mockReturnValue({
    tasks,
    totalBalance: 25,
    loading: false,
    completeTask,
    uncompleteTask,
    refetch: jest.fn(),
    offRoutineActive: false,
  } as any);
  mockedUsePetState.mockReturnValue({
    petState: { current_skin: 'wolf', evolution_days_count: evolutionDaysCount },
    loading: false,
    reload: jest.fn(),
  } as any);
  mockedUseStreak.mockReturnValue({ streak, refetch: jest.fn() } as any);
  mockedUseBuddy.mockReturnValue({
    relationship: {
      id: 'rel-1',
      child_profile_id: 'child-1',
      friendship_level: 2,
      successful_days_count: successfulDays,
      current_skin_id: null,
      current_theme_color: null,
      buddy_name: null,
      buddy_visible: false, // keep the hero out of these tests
      has_pending_gift: false,
    },
    setBuddyVisible: jest.fn(),
    refetch: jest.fn(),
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('GamerDashboardScreen — daily-loop fixes', () => {
  beforeEach(() => setHooks());
  afterEach(() => jest.clearAllMocks());

  test('"Successful days" shows the server relationship count, not the per-device pet count', () => {
    setHooks({ successfulDays: 5, evolutionDaysCount: 99 });

    const { getByTestId, queryByText } = render(<GamerDashboardScreen />);

    expect(getByTestId('successful-days-value').props.children).toBe(5);
    // The stale per-device number must not appear anywhere.
    expect(queryByText('99')).toBeNull();
  });

  test('null relationship (fresh child) falls back to 0, still never the pet count', () => {
    setHooks({ evolutionDaysCount: 99 });
    mockedUseBuddy.mockReturnValue({
      relationship: null, setBuddyVisible: jest.fn(), refetch: jest.fn(),
    } as any);

    const { getByTestId } = render(<GamerDashboardScreen />);

    expect(getByTestId('successful-days-value').props.children).toBe(0);
  });

  test('streak 0 → no "0" shown; forward-looking nudge instead', () => {
    setHooks({ streak: 0 });

    const { getByTestId, queryByTestId, getByText } = render(<GamerDashboardScreen />);

    expect(queryByTestId('streak-value')).toBeNull();
    expect(getByTestId('streak-start')).toBeTruthy();
    expect(getByText('gamerDashboard.streakStart')).toBeTruthy();
  });

  test('streak > 0 → numeric value shown, nudge hidden', () => {
    setHooks({ streak: 4 });

    const { getByTestId, queryByTestId } = render(<GamerDashboardScreen />);

    expect(queryByTestId('streak-start')).toBeNull();
    expect(getByTestId('streak-value').props.children).toBe(4);
  });

  test('parent-preview banner is tappable and calls exitChildPreview', () => {
    const exitChildPreview = jest.fn();
    setHooks({ isChildPreview: true, exitChildPreview });

    const { getByTestId } = render(<GamerDashboardScreen />);

    fireEvent.press(getByTestId('preview-banner'));
    expect(exitChildPreview).toHaveBeenCalledTimes(1);
  });

  test('no preview banner outside child preview', () => {
    setHooks({ isChildPreview: false });

    const { queryByTestId } = render(<GamerDashboardScreen />);

    expect(queryByTestId('preview-banner')).toBeNull();
  });
});

// ── Gamer polish (pkg/ux-gamer-polish) ───────────────────────────────────────
const makeTask = (overrides: Record<string, unknown> = {}) => ({
  id: 't-1',
  title: 'Brush teeth',
  time: '07:30',
  credits: 10,
  completed: false,
  category: 'responsibility',
  ...overrides,
});

describe('GamerDashboardScreen — time-filter buckets', () => {
  beforeEach(() => setHooks());
  afterEach(() => jest.clearAllMocks());

  test('a task with unparseable time stays visible under EVERY filter', () => {
    setHooks({
      tasks: [
        makeTask({ id: 't-vague', title: 'Practice guitar', time: 'whenever' }),
        makeTask({ id: 't-eve', title: 'Shower', time: '19:00' }),
      ],
    });

    const { getByTestId, queryByTestId } = render(<GamerDashboardScreen />);

    // Evening: bucketed evening task AND the unbucketable task both show.
    fireEvent.press(getByTestId('filter-chip-evening'));
    expect(getByTestId('hq-task-t-vague')).toBeTruthy();
    expect(getByTestId('hq-task-t-eve')).toBeTruthy();

    // Morning: evening task drops out, the unbucketable one does NOT vanish.
    fireEvent.press(getByTestId('filter-chip-morning'));
    expect(getByTestId('hq-task-t-vague')).toBeTruthy();
    expect(queryByTestId('hq-task-t-eve')).toBeNull();
  });

  test('a task with empty time is visible under a non-all filter', () => {
    setHooks({ tasks: [makeTask({ id: 't-none', time: undefined })] });

    const { getByTestId } = render(<GamerDashboardScreen />);

    fireEvent.press(getByTestId('filter-chip-noon'));
    expect(getByTestId('hq-task-t-none')).toBeTruthy();
  });

  test('filter chips expose button role + selected state', () => {
    const { getByTestId } = render(<GamerDashboardScreen />);

    const allChip = getByTestId('filter-chip-all');
    expect(allChip.props.accessibilityRole).toBe('button');
    expect(allChip.props.accessibilityState).toEqual({ selected: true });

    fireEvent.press(getByTestId('filter-chip-evening'));
    expect(getByTestId('filter-chip-evening').props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('filter-chip-all').props.accessibilityState).toEqual({ selected: false });
  });
});

describe('GamerDashboardScreen — header controls', () => {
  beforeEach(() => setHooks());
  afterEach(() => jest.clearAllMocks());

  test('gear navigates to ChildSettings', () => {
    const { getByTestId } = render(<GamerDashboardScreen />);

    fireEvent.press(getByTestId('dashboard-settings-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('ChildSettings');
  });

  test('dead bell is gone', () => {
    const { UNSAFE_queryAllByProps } = render(<GamerDashboardScreen />);

    expect(UNSAFE_queryAllByProps({ name: 'notifications-outline' })).toHaveLength(0);
  });
});

describe('GamerDashboardScreen — HQ task completion feedback', () => {
  beforeEach(() => setHooks());
  afterEach(() => jest.clearAllMocks());

  test('tapping an incomplete HQ card completes it and fires the success haptic', () => {
    const completeTask = jest.fn();
    const uncompleteTask = jest.fn();
    setHooks({ tasks: [makeTask()], completeTask, uncompleteTask });

    const { getByTestId } = render(<GamerDashboardScreen />);
    fireEvent.press(getByTestId('hq-task-t-1'));

    expect(completeTask).toHaveBeenCalledWith('t-1');
    expect(uncompleteTask).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  test('tapping a completed HQ card un-completes it with a light impact haptic', () => {
    const completeTask = jest.fn();
    const uncompleteTask = jest.fn();
    setHooks({ tasks: [makeTask({ completed: true })], completeTask, uncompleteTask });

    const { getByTestId } = render(<GamerDashboardScreen />);
    fireEvent.press(getByTestId('hq-task-t-1'));

    expect(uncompleteTask).toHaveBeenCalledWith('t-1');
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  test('HQ card carries checkbox semantics and the shared credits key', () => {
    setHooks({ tasks: [makeTask({ completed: true })] });

    const { getByTestId, getByText } = render(<GamerDashboardScreen />);
    const row = getByTestId('hq-task-t-1');

    expect(row.props.accessibilityRole).toBe('checkbox');
    expect(row.props.accessibilityState).toEqual({ checked: true });
    // i18n'd credits badge (was a hardcoded "+N BUFFs" literal).
    expect(getByText('gamerTasks.taskCredits')).toBeTruthy();
  });
});
