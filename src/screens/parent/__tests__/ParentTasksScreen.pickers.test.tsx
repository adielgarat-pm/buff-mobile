/**
 * ParentTasksScreen — task-time platform-split picker tests.
 * Feature: pkg/ux-parent-web-pickers.
 *
 * The add/edit-task modal's time row used to render a raw
 * `@react-native-community/datetimepicker`, which is a DEAD control on web —
 * a parent literally could not change a task's time there (every task stuck
 * at the 16:00 default). The row is now the platform-split TimeField
 * ("HH:MM" in / "HH:MM" out; TimeField.web.tsx renders <input type="time">).
 *
 * These tests stub TimeField and verify the SCREEN's wiring: the field
 * renders the task's current time, and a picked time reaches the persisted
 * payload unchanged in format.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ParentTasksScreen from '../ParentTasksScreen';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: jest.fn(), // focus refetch not under test
}));

jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false, rowDirection: 'row', textAlign: 'left' }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: 'fam-1' }),
}));

jest.mock('../../../platform', () => ({ crossAlert: jest.fn() }));

jest.mock('../../../hooks/useChildrenDashboard', () => ({
  useChildrenDashboard: () => ({
    children: [{ childId: 'child-1', displayName: 'Emi', avatar: '🚀' }],
    loading: false,
  }),
}));

jest.mock('../../../hooks/useSubscription', () => ({
  FREE_TASK_LIMIT: 8,
  useSubscription: () => ({ isSubscribed: true }),
}));

const mockUpdateTask = jest.fn().mockResolvedValue(undefined);
const mockRefetch = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: () => ({
    tasks: [{
      id: 'task-1', title: 'Homework', time: '16:00', credits: 10,
      completed: false, scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    }],
    loading: false,
    refetch: mockRefetch,
    updateTask: mockUpdateTask,
    deleteTask: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useChildSuggestions', () => ({
  usePendingSuggestions: () => ({
    suggestions: [],
    markApproved: jest.fn(),
    markDiscussing: jest.fn(),
    refetch: jest.fn(),
  }),
}));

// Presentational neighbours — not the system under test.
jest.mock('../../../components/parent/PendingSuggestions', () => ({ PendingSuggestions: () => null }));
jest.mock('../../../components/PhilosophyTip', () => () => null);
jest.mock('../../../components/DayScheduleToggles', () => ({ DayScheduleToggles: () => null }));
jest.mock('../../../components/parent/DuplicateToChildModal', () => ({ DuplicateToChildModal: () => null }));
jest.mock('../../../components/parent/HeaderActions', () => ({ HeaderActions: () => null }));

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

// Stub the platform-split TimeField: shows the bound value, and "picks" 09:45
// on press so tests can verify the screen's value/onChange wiring.
jest.mock('../../../components/TimeField', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ value, onChange, testID }: any) => (
      <TouchableOpacity testID={testID} onPress={() => onChange('09:45')}>
        <Text>{value || '--:--'}</Text>
      </TouchableOpacity>
    ),
  };
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe('ParentTasksScreen — time field (platform-split)', () => {
  beforeEach(() => {
    mockUpdateTask.mockClear();
    mockRefetch.mockClear();
  });

  test('edit modal renders the TimeField bound to the task time', async () => {
    const { getByText, getByTestId } = render(<ParentTasksScreen />);
    await waitFor(() => expect(getByText('Homework')).toBeTruthy());

    fireEvent.press(getByText('Homework')); // open edit modal

    const field = getByTestId('task-time-field');
    expect(field).toBeTruthy();
    expect(getByText('16:00')).toBeTruthy(); // current value shown in the field
  });

  test('picked time propagates to updateTask as an "HH:MM" string (format preserved)', async () => {
    const { getByText, getByTestId } = render(<ParentTasksScreen />);
    await waitFor(() => expect(getByText('Homework')).toBeTruthy());

    fireEvent.press(getByText('Homework'));
    fireEvent.press(getByTestId('task-time-field')); // stub picks 09:45
    fireEvent.press(getByText('parentTasks.editModal.confirm'));

    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(1));
    expect(mockUpdateTask).toHaveBeenCalledWith('task-1', {
      title: 'Homework',
      time: '09:45',
      credits: 10,
      category: 'responsibility',
      scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    });
  });
});
