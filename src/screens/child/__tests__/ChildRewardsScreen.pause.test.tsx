/**
 * Pause-gate tests for the Mint (pastel) rewards screen.
 *
 * Companion to ChildTasksScreen.pause.test.tsx — the Mint shop had no pause
 * gate while GamerRewardsScreen short-circuited correctly.
 * See docs/sessions/fix-pause-visibility-child/SPEC.md.
 */
import { render } from '@testing-library/react-native';
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
  useAppSettings: jest.fn(),
}));

jest.mock('../../../components/PauseEmptyState', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <Text testID="pause-empty-state">PAUSED</Text>,
  };
});

jest.mock('../GamerRewardsScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <Text testID="gamer-rewards">GAMER</Text>,
  };
});

// store_rewards fetch — synchronous thenable so `loading` settles immediately.
jest.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            then: (cb: (r: { data: unknown[]; error: null }) => void) =>
              cb({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

import { useAppSettings } from '../../../hooks/useAppSettings';
const mockedUseAppSettings = useAppSettings as jest.MockedFunction<typeof useAppSettings>;

// ── Tests ───────────────────────────────────────────────────────────────────
describe('ChildRewardsScreen (Mint) — pause gate', () => {
  afterEach(() => jest.clearAllMocks());

  test('pause ON → PauseEmptyState, shop content NOT rendered', () => {
    mockedUseAppSettings.mockReturnValue({ isPauseActive: true } as any);

    const { getByTestId, queryByText, getByText } = render(<ChildRewardsScreen />);

    expect(getByTestId('pause-empty-state')).toBeTruthy();
    // Neither the empty-shop state nor the rewards list may render.
    expect(queryByText('childRewards.empty')).toBeNull();
    expect(queryByText('childRewards.available')).toBeNull();
    // Header (title + balance) stays visible to reassure — nothing is lost.
    expect(getByText('childRewards.title')).toBeTruthy();
  });

  test('pause OFF → normal shop (empty state for zero rewards), no PauseEmptyState', () => {
    mockedUseAppSettings.mockReturnValue({ isPauseActive: false } as any);

    const { getByText, queryByTestId } = render(<ChildRewardsScreen />);

    expect(getByText('childRewards.empty')).toBeTruthy();
    expect(queryByTestId('pause-empty-state')).toBeNull();
  });
});
