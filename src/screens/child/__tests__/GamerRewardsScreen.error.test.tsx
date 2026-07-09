/**
 * Fetch-error tests for GamerRewardsScreen (Gamer dark theme).
 *
 * Companion to ChildRewardsScreen.error.test.tsx — the Gamer shop had the
 * identical bug: a Supabase fetch error left `rewards = []`, so the child saw
 * "No rewards yet / Ask your parent to add some rewards" even when rewards
 * exist. Error must render a distinct retryable state instead.
 */
import { render, fireEvent } from '@testing-library/react-native';
import GamerRewardsScreen from '../GamerRewardsScreen';

// ── Mocks ───────────────────────────────────────────────────────────────────
// initReactI18next must survive the mock: src/i18n/index.ts (pulled in via
// lib/currency) passes it to i18next.use() at module load.
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
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

jest.mock('../../../platform', () => ({
  crossAlert: jest.fn(),
}));

jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: () => ({ totalBalance: 50, refetch: jest.fn() }),
}));

jest.mock('../../../hooks/useChildSuggestions', () => ({
  useChildSuggestions: () => ({ suggestions: [], submit: jest.fn(), withdraw: jest.fn() }),
}));

jest.mock('../../../components/child/ChildSuggest', () => ({
  SuggestModal: () => null,
  SuggestionStatusList: () => null,
}));

jest.mock('../../../hooks/useRewardRedemptions', () => ({
  useRewardRedemptions: () => ({
    openForReward: () => null,
    request: jest.fn(),
    withdraw: jest.fn(),
    acknowledge: jest.fn(),
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useAppSettings', () => ({
  useAppSettings: () => ({ isPauseActive: false }),
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

// store_rewards fetch — synchronous thenable with mutable result so each test
// (and each retry within a test) controls what the "network" returns.
jest.mock('../../../integrations/supabase/client', () => {
  const state = {
    result: { data: [] as unknown[] | null, error: null as { message: string } | null },
    fetchCount: 0,
  };
  return {
    __state: state,
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              then: (cb: (r: typeof state.result) => void) => {
                state.fetchCount += 1;
                cb(state.result);
              },
            }),
          }),
        }),
      }),
    },
  };
});

const { __state: supabaseState } = jest.requireMock('../../../integrations/supabase/client');

const REWARD = {
  id: 'r1',
  title: 'New game',
  title_he: null,
  emoji: '🎮',
  size: 'small',
  credits_needed: 10,
  is_redeemed: false,
  cash_value: null,
};

// ── Tests ───────────────────────────────────────────────────────────────────
describe('GamerRewardsScreen — fetch error state', () => {
  beforeEach(() => {
    supabaseState.result = { data: [], error: null };
    supabaseState.fetchCount = 0;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetch error → error state rendered, NOT the empty state', () => {
    supabaseState.result = { data: null, error: { message: 'network reset' } };

    const { getByTestId, getByText, queryByText } = render(<GamerRewardsScreen />);

    expect(getByTestId('rewards-error-state')).toBeTruthy();
    expect(getByText('gamerRewards.errorTitle')).toBeTruthy();
    // The misleading "ask your parent" empty state must NOT render.
    expect(queryByText('gamerRewards.emptyParentTitle')).toBeNull();
    expect(queryByText('gamerRewards.emptyParentSubtitle')).toBeNull();
    // Rewards grid must not render either.
    expect(queryByText('gamerRewards.parentSectionTitle')).toBeNull();
  });

  test('retry is an accessible button and re-runs the fetch', () => {
    supabaseState.result = { data: null, error: { message: 'network reset' } };

    const { getByRole, getByText, queryByTestId } = render(<GamerRewardsScreen />);
    expect(supabaseState.fetchCount).toBe(1);

    // The "network" recovers; retry should re-fetch and render the grid.
    supabaseState.result = { data: [REWARD], error: null };
    fireEvent.press(getByRole('button', { name: 'gamerRewards.retry' }));

    expect(supabaseState.fetchCount).toBe(2);
    expect(queryByTestId('rewards-error-state')).toBeNull();
    expect(getByText('gamerRewards.parentSectionTitle')).toBeTruthy();
    expect(getByText('New game')).toBeTruthy();
  });

  test('empty data without error still shows the empty state (not the error state)', () => {
    supabaseState.result = { data: [], error: null };

    const { getByText, queryByTestId } = render(<GamerRewardsScreen />);

    expect(getByText('gamerRewards.emptyParentTitle')).toBeTruthy();
    expect(queryByTestId('rewards-error-state')).toBeNull();
  });
});
