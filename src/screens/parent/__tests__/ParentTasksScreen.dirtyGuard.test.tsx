/**
 * ParentTasksScreen — dirty-guard on the add/edit-task modal backdrop.
 * Feature: pkg/ux-parent-dashboard-ergo.
 *
 * The full-screen backdrop TouchableOpacity used to close the modal instantly,
 * discarding a typed task title. Now: unchanged form → instant close (no
 * alert); edited form → crossAlert confirm-discard, and the modal stays open
 * until the parent confirms.
 *
 * Mock scaffolding mirrors ParentTasksScreen.pickers.test.tsx.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ParentTasksScreen from '../ParentTasksScreen';
import { crossAlert } from '../../../platform';

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

jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: () => ({
    tasks: [{
      id: 'task-1', title: 'Homework', time: '16:00', credits: 10,
      completed: false, scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    }],
    loading: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    updateTask: jest.fn().mockResolvedValue(undefined),
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
jest.mock('../../../components/TimeField', () => ({ __esModule: true, default: () => null }));

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockCrossAlert = crossAlert as jest.Mock;

// ── Tests ──────────────────────────────────────────────────────────────────
describe('ParentTasksScreen — task-modal backdrop dirty-guard', () => {
  beforeEach(() => mockCrossAlert.mockClear());

  async function openEditModal() {
    const utils = render(<ParentTasksScreen />);
    await waitFor(() => expect(utils.getByText('Homework')).toBeTruthy());
    fireEvent.press(utils.getByText('Homework')); // open edit modal
    return utils;
  }

  test('clean form: backdrop tap closes instantly, no confirm asked', async () => {
    const { getByTestId, queryByTestId } = await openEditModal();

    fireEvent.press(getByTestId('task-modal-backdrop'));

    expect(mockCrossAlert).not.toHaveBeenCalled();
    // Generous timeout: first-render suites on this repo can exceed the 5s
    // default under parallel jest workers (seen on the Windows CI box).
    await waitFor(() => expect(queryByTestId('task-modal-backdrop')).toBeNull(), { timeout: 15000 });
  }, 30000);

  test('edited title: backdrop tap asks confirm-discard and keeps the modal open', async () => {
    const { getByTestId, getByDisplayValue } = await openEditModal();

    fireEvent.changeText(getByDisplayValue('Homework'), 'Homework + reading');
    fireEvent.press(getByTestId('task-modal-backdrop'));

    expect(mockCrossAlert).toHaveBeenCalledTimes(1);
    expect(mockCrossAlert).toHaveBeenCalledWith(
      'sheetGuard.discardTitle',
      undefined,
      expect.any(Array),
    );
    // Modal still open — nothing was discarded.
    expect(getByTestId('task-modal-backdrop')).toBeTruthy();
  });
});
