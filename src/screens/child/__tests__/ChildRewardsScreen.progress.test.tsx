/**
 * "Always close to a win" tests for the Mint (pastel) rewards screen.
 *
 * Pillar 1 (Intrinsic Motivation): the next real-life reward should always
 * FEEL close. These tests pin the redesign:
 *   - per-card progress fill (balance / price, capped at 100%)
 *   - inline "Only X to go!" on unaffordable cards (dynamic count)
 *   - NO blocking alert on an unaffordable tap (impulsive-tap friction)
 *   - the Buffs price is ALWAYS shown — never a money tag (cash_value is
 *     parent-facing only, in ParentRewardsScreen)
 *   - unlocked-first ordering (mirrors GamerRewardsScreen)
 */
import { render, fireEvent } from '@testing-library/react-native';
import ChildRewardsScreen from '../ChildRewardsScreen';

// ── Mocks ───────────────────────────────────────────────────────────────────
// initReactI18next must survive the mock: src/i18n/index.ts (pulled in via
// lib/uiLocale) passes it to i18next.use() at module load.
// t() echoes the key plus the interpolated count so tests can assert the
// dynamic "X to go" number.
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && typeof opts === 'object' && 'count' in opts ? `${key}:${opts.count}` : key,
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

// Mutable balance so each test controls affordability.
jest.mock('../../../hooks/useChildProgress', () => {
  const state = { balance: 0 };
  return {
    __balance: state,
    useChildData: () => ({ totalBalance: state.balance, refetch: jest.fn() }),
  };
});

jest.mock('../../../hooks/useChildSuggestions', () => ({
  useChildSuggestions: () => ({ suggestions: [], submit: jest.fn(), withdraw: jest.fn() }),
}));

jest.mock('../../../components/child/ChildSuggest', () => ({
  SuggestModal: () => null,
  SuggestionStatusList: () => null,
}));

jest.mock('../../../hooks/useRewardRedemptions', () => {
  const request = jest.fn(async () => ({ error: null }));
  return {
    __request: request,
    useRewardRedemptions: () => ({
      openForReward: () => null,
      request,
      withdraw: jest.fn(),
      acknowledge: jest.fn(),
      refetch: jest.fn(),
    }),
  };
});

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

// store_rewards fetch — synchronous thenable with mutable result.
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
const { __balance: balanceState } = jest.requireMock('../../../hooks/useChildProgress');
const { __request: requestMock } = jest.requireMock('../../../hooks/useRewardRedemptions');
const { crossAlert } = jest.requireMock('../../../platform');

const reward = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'r1',
  title: 'Ice cream',
  title_he: null,
  emoji: '🍦',
  size: 'small',
  credits_needed: 100,
  is_redeemed: false,
  cash_value: null,
  ...over,
});

// ── Tests ───────────────────────────────────────────────────────────────────
describe('ChildRewardsScreen (Mint) — always close to a win', () => {
  beforeEach(() => {
    supabaseState.result = { data: [], error: null };
    supabaseState.fetchCount = 0;
    balanceState.balance = 0;
    requestMock.mockClear();
    crossAlert.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('unaffordable reward: progress bar + dynamic "X to go", claim button still shows the price', () => {
    balanceState.balance = 60;
    supabaseState.result = { data: [reward({ credits_needed: 100 })], error: null };

    const { getByTestId, getByText } = render(<ChildRewardsScreen />);

    expect(getByTestId('reward-progress-r1')).toBeTruthy();
    // 100 - 60 = 40 to go (count interpolated by the t() mock).
    expect(getByText('childRewards.toGo:40')).toBeTruthy();
    // Buffs price stays visible on the card.
    expect(getByText('childRewards.needed:100')).toBeTruthy();
  });

  test('unaffordable tap = silent no-op: no alert, no redemption request', () => {
    balanceState.balance = 60;
    supabaseState.result = { data: [reward({ credits_needed: 100 })], error: null };

    const { getByText } = render(<ChildRewardsScreen />);
    fireEvent.press(getByText('100⚡'));

    expect(crossAlert).not.toHaveBeenCalled();
    expect(requestMock).not.toHaveBeenCalled();
  });

  test('affordable reward: no "X to go" text, tap opens a redemption request', async () => {
    balanceState.balance = 150;
    supabaseState.result = { data: [reward({ credits_needed: 100 })], error: null };

    const { getByTestId, getByText, queryByText } = render(<ChildRewardsScreen />);

    // Progress bar still renders (full), but no "to go" nag.
    expect(getByTestId('reward-progress-r1')).toBeTruthy();
    expect(queryByText(/childRewards\.toGo/)).toBeNull();

    fireEvent.press(getByText('100⚡'));
    expect(requestMock).toHaveBeenCalledWith({
      id: 'r1',
      title: 'Ice cream',
      credits_needed: 100,
    });
    // Confirmation alert (request sent) is allowed — only the blocking
    // not-enough alert is banned.
    await Promise.resolve();
    expect(crossAlert).toHaveBeenCalledWith(
      'childRewards.requestSentTitle',
      'childRewards.requestSentMsg',
    );
  });

  test('zero balance: full price remaining in "X to go"', () => {
    balanceState.balance = 0;
    supabaseState.result = { data: [reward({ credits_needed: 100 })], error: null };

    const { getByText } = render(<ChildRewardsScreen />);
    expect(getByText('childRewards.toGo:100')).toBeTruthy();
  });

  test('cash_value reward: Buffs price shown, money tag NOT shown to the child', () => {
    balanceState.balance = 0;
    supabaseState.result = { data: [reward({ credits_needed: 100, cash_value: 50 })], error: null };

    const { getByText, queryByText } = render(<ChildRewardsScreen />);

    expect(getByText('childRewards.needed:100')).toBeTruthy();
    expect(queryByText(/parentRewards\.cashBadge/)).toBeNull();
  });

  test('unlocked rewards sort before locked ones', () => {
    balanceState.balance = 50;
    supabaseState.result = {
      data: [
        reward({ id: 'r-locked', title: 'Big trip', credits_needed: 500 }),
        reward({ id: 'r-unlocked', title: 'Sticker', credits_needed: 20 }),
      ],
      error: null,
    };

    const { toJSON } = render(<ChildRewardsScreen />);

    // Compare render order via the serialized tree: the affordable "Sticker"
    // must appear before the locked "Big trip" even though the fetch returned
    // the locked one first.
    const json = JSON.stringify(toJSON());
    expect(json.indexOf('Sticker')).toBeGreaterThan(-1);
    expect(json.indexOf('Sticker')).toBeLessThan(json.indexOf('Big trip'));
  });
});
