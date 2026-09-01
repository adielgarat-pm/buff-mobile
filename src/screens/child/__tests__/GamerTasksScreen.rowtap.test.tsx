/**
 * Full-row tap tests for GamerTasksScreen (pkg/ux-gamer-daily-loop).
 *
 * Regression for the 26×26pt tap-target defect: only the small checkCircle
 * toggled completion while the rest of the row was inert — a different
 * contract from the dashboard, where the whole card is tappable. The whole
 * row must now toggle completion, with the circle as a visual indicator only.
 */
import { render, fireEvent } from '@testing-library/react-native';
import GamerTasksScreen from '../GamerTasksScreen';
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

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

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

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'child-1', display_name: 'TestKid' } }),
}));

jest.mock('../../../contexts/ModeContext', () => ({
  useMode: () => ({ previewChildId: null, isChildPreview: false }),
}));

// pkg/teen-autonomy: the screen now reads the experience band (which pulls in
// ThemeContext). This rowtap test isn't about the create CTA, so pin the band —
// 'junior' keeps the pre-existing propose CTA rendering unchanged.
jest.mock('../../../hooks/useExperienceBand', () => ({
  useExperienceBand: () => 'junior',
}));

jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: jest.fn(),
}));

jest.mock('../../../hooks/useAppSettings', () => ({
  useAppSettings: () => ({ settings: { friday_enabled: false }, isPauseActive: false }),
}));

jest.mock('../../../hooks/useChildSuggestions', () => ({
  useChildSuggestions: () => ({ suggestions: [], submit: jest.fn(), withdraw: jest.fn() }),
}));

jest.mock('../../../components/child/ChildSuggest', () => ({
  SuggestModal: () => null,
  SuggestionStatusList: () => null,
}));

jest.mock('../../../components/PauseEmptyState', () => ({ __esModule: true, default: () => null }));

jest.mock('../../../components/WelcomeBackModal', () => ({
  __esModule: true,
  default: () => null,
  useWelcomeBack: () => ({ visible: false, dismiss: jest.fn() }),
}));

// Keep day-visibility out of scope — these tests are about the tap contract.
jest.mock('../../../lib/taskScheduling', () => ({
  isTaskVisibleOn: () => true,
  toDateKey: () => '2026-07-08',
}));

jest.mock('../../../lib/uiLocale', () => ({
  formatNum: (n: number) => String(n),
}));

import { useChildData } from '../../../hooks/useChildProgress';

const mockedUseChildData = useChildData as jest.MockedFunction<typeof useChildData>;

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    title: 'Brush teeth',
    time: '07:30',
    credits: 10,
    completed: false,
    category: 'responsibility',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    ...overrides,
  } as Task;
}

function setHooks(tasks: Task[], { completeTask = jest.fn(), uncompleteTask = jest.fn() } = {}) {
  mockedUseChildData.mockReturnValue({
    tasks,
    totalBalance: 25,
    schoolEndTime: '14:00',
    schoolQuestEnabled: false,
    loading: false,
    completeTask,
    uncompleteTask,
  } as any);
  return { completeTask, uncompleteTask };
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('GamerTasksScreen — full-row tap target', () => {
  afterEach(() => jest.clearAllMocks());

  test('tapping the row (not just the circle) completes an incomplete task', () => {
    const { completeTask, uncompleteTask } = setHooks([makeTask()]);

    const { getByTestId } = render(<GamerTasksScreen />);

    fireEvent.press(getByTestId('task-row-t-1'));
    expect(completeTask).toHaveBeenCalledWith('t-1');
    expect(uncompleteTask).not.toHaveBeenCalled();
  });

  test('tapping a completed task row un-completes it', () => {
    const { completeTask, uncompleteTask } = setHooks([makeTask({ completed: true })]);

    const { getByTestId } = render(<GamerTasksScreen />);

    fireEvent.press(getByTestId('task-row-t-1'));
    expect(uncompleteTask).toHaveBeenCalledWith('t-1');
    expect(completeTask).not.toHaveBeenCalled();
  });

  test('row carries checkbox semantics: role, checked state, and title in the label', () => {
    setHooks([makeTask({ completed: true })]);

    const { getByTestId } = render(<GamerTasksScreen />);
    const row = getByTestId('task-row-t-1');

    expect(row.props.accessibilityRole).toBe('checkbox');
    expect(row.props.accessibilityState).toEqual({ checked: true });
    expect(row.props.accessibilityLabel).toContain('Brush teeth');
    expect(row.props.accessibilityLabel).toContain('gamerTasks.markIncomplete');
  });

  test('row label offers the complete action for an incomplete task', () => {
    setHooks([makeTask({ completed: false })]);

    const { getByTestId } = render(<GamerTasksScreen />);
    const row = getByTestId('task-row-t-1');

    expect(row.props.accessibilityState).toEqual({ checked: false });
    expect(row.props.accessibilityLabel).toContain('gamerTasks.markComplete');
  });
});

// ── Gamer polish (pkg/ux-gamer-polish): haptics wired into completion ────────
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';

describe('GamerTasksScreen — completion haptics', () => {
  afterEach(() => jest.clearAllMocks());

  test('completing a task fires the success haptic (haptics on by default)', () => {
    setHooks([makeTask()]);

    const { getByTestId } = render(<GamerTasksScreen />);
    fireEvent.press(getByTestId('task-row-t-1'));

    expect(Haptics.notificationAsync).toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test('un-completing a task fires the light impact haptic', () => {
    setHooks([makeTask({ completed: true })]);

    const { getByTestId } = render(<GamerTasksScreen />);
    fireEvent.press(getByTestId('task-row-t-1'));

    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  test('haptics setting off (ChildSettings toggle) suppresses the haptic but still completes', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('false');
    const { completeTask } = setHooks([makeTask()]);

    const { getByTestId } = render(<GamerTasksScreen />);
    // Flush the AsyncStorage effect that loads the persisted preference.
    await act(async () => {});

    fireEvent.press(getByTestId('task-row-t-1'));

    expect(completeTask).toHaveBeenCalledWith('t-1');
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test('credits badge renders via the shared i18n key (no bare literal)', () => {
    setHooks([makeTask({ credits: 15 })]);

    const { getByText } = render(<GamerTasksScreen />);
    expect(getByText('gamerTasks.taskCredits')).toBeTruthy();
  });
});
