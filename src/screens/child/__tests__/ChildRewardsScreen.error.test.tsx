/**
 * Fetch-error tests for the Mint (pastel) rewards screen.
 *
 * A Supabase fetch error used to leave `rewards = []`, so the child saw the
 * empty state ("No rewards yet. Ask your parent to add some!") even when
 * rewards exist — the kid nags the parent, the parent sees rewards on their
 * side, trust erodes. Common in the wild: some Israeli networks get
 * ERR_CONNECTION_RESET to Supabase.
 *
 * These tests pin the fix: error → distinct retryable error state (never the
 * empty state), and the retry affordance re-runs the fetch.
 */
import { render, fireEvent } from '@testing-library/react-native';
import ChildRewardsScreen from '../ChildRewardsScreen';

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

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ themeName: 'mint' }),
  useChildTheme: () => new Proxy({}, { get: () => '#888888' }),
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

jest.mock('../GamerRewardsScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <Text testID="gamer-rewards">GAMER</Text>,
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
  title: 'Ice cream',
  title_he: null,
  emoji: '🍦',
  size: 'small',
  credits_needed: 10,
  is_redeemed: false,
  cash_value: null,
};

// ── Tests ───────────────────────────────────────────────────────────────────
describe('ChildRewardsScreen (Mint) — fetch error state', () => {
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

    const { getByTestId, getByText, queryByText } = render(<ChildRewardsScreen />);

    expect(getByTestId('rewards-error-state')).toBeTruthy();
    expect(getByText('childRewards.errorTitle')).toBeTruthy();
    // The misleading "ask your parent" empty state must NOT render.
    expect(queryByText('childRewards.empty')).toBeNull();
    expect(queryByText('childRewards.emptySub')).toBeNull();
    // Rewards list must not render either.
    expect(queryByText('childRewards.available')).toBeNull();
  });

  test('retry is an accessible button and re-runs the fetch', () => {
    supabaseState.result = { data: null, error: { message: 'network reset' } };

    const { getByRole, getByText, queryByTestId } = render(<ChildRewardsScreen />);
    expect(supabaseState.fetchCount).toBe(1);

    // The "network" recovers; retry should re-fetch and render the list.
    supabaseState.result = { data: [REWARD], error: null };
    fireEvent.press(getByRole('button', { name: 'childRewards.retry' }));

    expect(supabaseState.fetchCount).toBe(2);
    expect(queryByTestId('rewards-error-state')).toBeNull();
    expect(getByText('childRewards.available')).toBeTruthy();
    expect(getByText('Ice cream')).toBeTruthy();
  });

  test('empty data without error still shows the empty state (not the error state)', () => {
    supabaseState.result = { data: [], error: null };

    const { getByText, queryByTestId } = render(<ChildRewardsScreen />);

    expect(getByText('childRewards.empty')).toBeTruthy();
    expect(queryByTestId('rewards-error-state')).toBeNull();
  });
});
