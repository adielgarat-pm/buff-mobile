/**
 * Pause-gate tests for the Mint (pastel) tasks screen.
 *
 * Regression for the 2026-07-06 user report: family Pause Mode hid tasks on
 * the Gamer theme but the Mint theme kept rendering the full task list
 * (PastelChildTasks read `settings` from useAppSettings but never checked
 * `isPauseActive`). See docs/sessions/fix-pause-visibility-child/SPEC.md.
 */
import { render } from '@testing-library/react-native';
import ChildTasksScreen from '../ChildTasksScreen';
import type { Task } from '../../../types/task';

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

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ themeName: 'mint' }),
  // Any palette key resolves to a harmless color string.
  useChildTheme: () => new Proxy({}, { get: () => '#888888' }),
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

jest.mock('../../../hooks/useChildSuggestions', () => ({
  useChildSuggestions: () => ({ suggestions: [], submit: jest.fn(), withdraw: jest.fn() }),
}));

jest.mock('../../../components/child/ChildSuggest', () => ({
  SuggestModal: () => null,
  SuggestionStatusList: () => null,
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

jest.mock('../../../components/PhaseView', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    PhaseView: () => <Text testID="phase-view">PHASE_VIEW</Text>,
  };
});

// The Gamer implementation has its own deps + its own pause coverage; stub it
// so this file exercises only the Mint router branch.
jest.mock('../GamerTasksScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <Text testID="gamer-tasks">GAMER</Text>,
  };
});

import { useChildData } from '../../../hooks/useChildProgress';
import { useAppSettings } from '../../../hooks/useAppSettings';

const mockedUseChildData   = useChildData   as jest.MockedFunction<typeof useChildData>;
const mockedUseAppSettings = useAppSettings as jest.MockedFunction<typeof useAppSettings>;

const oneTask: Partial<Task> = {
  id: 't-1', title: 'Brush teeth', time: '07:30', credits: 10,
  completed: false, category: 'responsibility', scheduleDays: [0, 1, 2, 3, 4, 5, 6],
};

function setHooks({ isPauseActive = false, loading = false } = {}) {
  mockedUseChildData.mockReturnValue({
    tasks: [oneTask as Task],
    totalBalance: 25,
    schoolEndTime: '14:00',
    schoolQuestEnabled: false,
    loading,
    completeTask: jest.fn(),
    uncompleteTask: jest.fn(),
  } as any);
  mockedUseAppSettings.mockReturnValue({
    settings: { friday_enabled: false },
    isPauseActive,
  } as any);
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('ChildTasksScreen (Mint) — pause gate', () => {
  beforeEach(() => setHooks());
  afterEach(() => jest.clearAllMocks());

  test('pause ON → PauseEmptyState, task list NOT rendered', () => {
    setHooks({ isPauseActive: true });

    const { getByTestId, queryByTestId, queryByText } = render(<ChildTasksScreen />);

    expect(getByTestId('pause-empty-state')).toBeTruthy();
    expect(queryByTestId('phase-view')).toBeNull();
    // Phase tab bar (part of the normal layout) must not render either.
    expect(queryByText('child.heading.quests')).toBeNull();
  });

  test('pause OFF → normal task list, no PauseEmptyState', () => {
    setHooks({ isPauseActive: false });

    const { getByTestId, queryByTestId } = render(<ChildTasksScreen />);

    expect(getByTestId('phase-view')).toBeTruthy();
    expect(queryByTestId('pause-empty-state')).toBeNull();
  });

  test('loading wins over pause (loader first, no flash of either state)', () => {
    setHooks({ isPauseActive: true, loading: true });

    const { queryByTestId } = render(<ChildTasksScreen />);

    expect(queryByTestId('pause-empty-state')).toBeNull();
    expect(queryByTestId('phase-view')).toBeNull();
  });
});
