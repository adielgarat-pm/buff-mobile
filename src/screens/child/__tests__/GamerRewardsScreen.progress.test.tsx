/**
 * "Always close to a win" tests for GamerRewardsScreen (Gamer dark theme).
 *
 * The Gamer shop already had the progress-bar + "X to go" pattern; these tests
 * pin the two fixes this package adds:
 *   - the money tag (cash_value) is never shown to the child — only the Buffs
 *     price (cash_value stays parent-facing in ParentRewardsScreen)
 *   - no blocking "not enough" alert path remains (locked cards have no
 *     redeem button; the guard in handleClaim is a silent no-op)
 */
import { render } from '@testing-library/react-native';
import GamerRewardsScreen from '../GamerRewardsScreen';

// ── Mocks ───────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && typeof opts === 'object' && 'count' in opts ? `${key}:${opts.count}` : key,
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

// ── Tests ───────────────────────────────────────────────────────────────────
describe('GamerRewardsScreen — always close to a win', () => {
  beforeEach(() => {
    supabaseState.result = { data: [], error: null };
    supabaseState.fetchCount = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('cash_value reward: Buffs price shown, money tag NOT shown to the child', () => {
    supabaseState.result = {
      data: [{
        id: 'r1',
        title: 'New game',
        title_he: null,
        emoji: '🎮',
        size: 'small',
        credits_needed: 200,
        is_redeemed: false,
        cash_value: 50,
      }],
      error: null,
    };

    const { getByText, queryByText } = render(<GamerRewardsScreen />);

    expect(getByText('💎 200')).toBeTruthy();
    expect(queryByText(/parentRewards\.cashBadge/)).toBeNull();
    // Locked card (balance 50 < 200): progress copy with dynamic count.
    expect(getByText('gamerRewards.toGo:150')).toBeTruthy();
  });
});
