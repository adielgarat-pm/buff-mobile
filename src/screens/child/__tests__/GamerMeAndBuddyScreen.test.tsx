/**
 * Tests for GamerMeAndBuddyScreen — Stitch 5A.
 *
 * Covers: full layout, custom buddy name, friendship label per level,
 * Pause Mode short-circuit, L5 hides progress, back button navigates,
 * fresh-child fallback.
 */
import { render, fireEvent } from '@testing-library/react-native';
import GamerMeAndBuddyScreen from '../GamerMeAndBuddyScreen';
import type { BuddyRelationship } from '../../../types/buddy';

const mockGoBack = jest.fn();

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'buddyName' in opts) return `${key}:${opts.buddyName}`;
      if (opts && 'level' in opts)     return `${key}:${opts.level}`;
      return key;
    },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'child-1', display_name: 'TestKid' } }),
}));

jest.mock('../../../contexts/ModeContext', () => ({
  useMode: () => ({ previewChildId: null, isChildPreview: false }),
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

jest.mock('../../../hooks/usePetState', () => ({
  usePetState: jest.fn(),
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

import { useBuddyRelationship } from '../../../hooks/useBuddyRelationship';
import { useChildBuddyStats } from '../../../hooks/useChildBuddyStats';
import { useChildBuddyGifts } from '../../../hooks/useChildBuddyGifts';
import { useAppSettings } from '../../../hooks/useAppSettings';
import { usePetState } from '../../../hooks/usePetState';

const mockedUseBuddy       = useBuddyRelationship as jest.MockedFunction<typeof useBuddyRelationship>;
const mockedUseStats       = useChildBuddyStats   as jest.MockedFunction<typeof useChildBuddyStats>;
const mockedUseGifts       = useChildBuddyGifts   as jest.MockedFunction<typeof useChildBuddyGifts>;
const mockedUseAppSettings = useAppSettings       as jest.MockedFunction<typeof useAppSettings>;
const mockedUsePetState    = usePetState          as jest.MockedFunction<typeof usePetState>;

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
  last_level_up_at: null,
  last_successful_day_date: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

function setHooks({
  relationship = baseRelationship,
  daysTogether = 12,
  tasksCompleted = 47,
  isPauseActive = false,
  petSkin = 'wolf',
}: Partial<{
  relationship: BuddyRelationship | null;
  daysTogether: number;
  tasksCompleted: number;
  isPauseActive: boolean;
  petSkin: string;
}> = {}) {
  mockedUseBuddy.mockReturnValue({
    relationship, loading: false, error: null, refetch: jest.fn(),
    setBuddyVisible: jest.fn(), setBuddyName: jest.fn(),
  } as any);
  mockedUseStats.mockReturnValue({
    stats: { daysTogether, tasksCompleted }, loading: false, error: null, refetch: jest.fn(),
  } as any);
  mockedUseGifts.mockReturnValue({
    gifts: [], loading: false, error: null, refetch: jest.fn(),
    useGift: jest.fn().mockResolvedValue({ error: null, result: { success: true } }),
  } as any);
  mockedUseAppSettings.mockReturnValue({ isPauseActive } as any);
  mockedUsePetState.mockReturnValue({
    petState: { current_skin: petSkin } as any,
    loading: false,
  } as any);
}

describe('GamerMeAndBuddyScreen', () => {
  beforeEach(() => {
    mockGoBack.mockReset();
    setHooks();
  });

  test('renders full 5A layout with default name (STORMY for wolf) and friendship label', () => {
    const { getByText } = render(<GamerMeAndBuddyScreen />);

    expect(getByText('meAndBuddy.title')).toBeTruthy();
    expect(getByText('STORMY')).toBeTruthy(); // default name for wolf
    expect(getByText('buddy.friendshipLevel.L2.other')).toBeTruthy();
    expect(getByText('LEVEL 2')).toBeTruthy();
    expect(getByText('buddy.story.L2:STORMY')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('47')).toBeTruthy();
    expect(getByText('gamerMyStats.progressToNextLevel:3')).toBeTruthy();
  });

  test('renders custom buddy_name when set', () => {
    setHooks({ relationship: { ...baseRelationship, buddy_name: 'Sparky' } });

    const { getByText } = render(<GamerMeAndBuddyScreen />);
    expect(getByText('Sparky')).toBeTruthy();
    expect(getByText('buddy.story.L2:Sparky')).toBeTruthy();
  });

  test('renders L5 friendship label + hides progress bar', () => {
    setHooks({ relationship: { ...baseRelationship, friendship_level: 5, successful_days_count: 120 } });

    const { getByText, queryByText } = render(<GamerMeAndBuddyScreen />);
    expect(getByText('buddy.friendshipLevel.L5.other')).toBeTruthy();
    expect(getByText('LEVEL 5')).toBeTruthy();
    expect(queryByText('gamerMyStats.progressToNextLevel:6')).toBeNull();
  });

  test('Pause Mode shows PauseEmptyState — no hero/stats', () => {
    setHooks({ isPauseActive: true });

    const { getByTestId, queryByText } = render(<GamerMeAndBuddyScreen />);
    expect(getByTestId('pause-empty-state')).toBeTruthy();
    expect(queryByText('STORMY')).toBeNull();
    expect(queryByText('LEVEL 2')).toBeNull();
  });

  test('fresh-child fallback: null relationship renders L1 + pet-skin default name (wolf → STORMY)', () => {
    setHooks({ relationship: null, daysTogether: 0, tasksCompleted: 0 });

    const { getByText } = render(<GamerMeAndBuddyScreen />);
    expect(getByText('LEVEL 1')).toBeTruthy();
    // Pet skin defaults to 'wolf' in Gamer mode → STORMY is the buddy default
    expect(getByText('STORMY')).toBeTruthy();
    expect(getByText('buddy.friendshipLevel.L1.other')).toBeTruthy();
    expect(getByText('gamerMyStats.progressToNextLevel:2')).toBeTruthy();
  });

  test('pet skin drives default name when current_skin_id is null (wolf → STORMY)', () => {
    setHooks({
      relationship: { ...baseRelationship, current_skin_id: null },
      petSkin: 'wolf',
    });
    const { getByText } = render(<GamerMeAndBuddyScreen />);
    expect(getByText('STORMY')).toBeTruthy();
  });

  test('non-buddy pet skin (tiger) falls back to "Buddy" name', () => {
    setHooks({
      relationship: { ...baseRelationship, current_skin_id: null, buddy_name: null },
      petSkin: 'tiger',
    });
    const { getByText } = render(<GamerMeAndBuddyScreen />);
    expect(getByText('Buddy')).toBeTruthy();
  });

  test('back button navigates back', () => {
    const { getByTestId } = render(<GamerMeAndBuddyScreen />);
    fireEvent.press(getByTestId('me-and-buddy-back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
