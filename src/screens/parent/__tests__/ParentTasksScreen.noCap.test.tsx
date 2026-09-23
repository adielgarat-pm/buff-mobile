/**
 * ParentTasksScreen — Freemium v2 (D: Adi 2026-09-23): tasks have NO cap.
 *
 * Before v2 a free family with >= FREE_TASK_LIMIT (6) tasks per child was sent
 * to the Paywall when tapping "+". The paywall now only meets a parent on an AI
 * action, so a free family with many tasks must land in the add-task modal.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ParentTasksScreen from '../ParentTasksScreen';

const mockNavigate = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: jest.fn(),
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

// A FREE family (no entitlement anywhere). If the screen still consulted the
// subscription for a task cap, this is the state that used to hit the Paywall.
jest.mock('../../../hooks/useSubscription', () => ({
  useSubscription: () => ({ isSubscribed: false, hasRealEntitlement: false }),
}));

const mockTwelveTasks = Array.from({ length: 12 }, (_, i) => ({
  id: `task-${i}`, title: `Task ${i}`, time: '16:00', credits: 10,
  completed: false, scheduleDays: [0, 1, 2, 3, 4, 5, 6],
}));

jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: () => ({
    tasks: mockTwelveTasks,
    loading: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useChildSuggestions', () => ({
  usePendingSuggestions: () => ({
    suggestions: [], markApproved: jest.fn(), markDiscussing: jest.fn(), refetch: jest.fn(),
  }),
}));

jest.mock('../../../components/parent/PendingSuggestions', () => ({ PendingSuggestions: () => null }));
jest.mock('../../../components/PhilosophyTip', () => () => null);
jest.mock('../../../components/DayScheduleToggles', () => ({ DayScheduleToggles: () => null }));
jest.mock('../../../components/parent/DuplicateToChildModal', () => ({ DuplicateToChildModal: () => null }));
jest.mock('../../../components/parent/HeaderActions', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    HeaderActions: ({ onAction }: { onAction?: () => void }) => (
      <TouchableOpacity testID="add-task" onPress={onAction}><Text>+</Text></TouchableOpacity>
    ),
  };
});
jest.mock('../../../integrations/supabase/client', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../../../components/TimeField', () => ({ __esModule: true, default: () => null }));

describe('ParentTasksScreen — no free task cap (Freemium v2)', () => {
  beforeEach(() => mockNavigate.mockClear());

  test('a free family with 12 tasks opens the add-task modal, never the Paywall', async () => {
    const { getByTestId, getByText } = render(<ParentTasksScreen />);
    await waitFor(() => expect(getByText('Task 0')).toBeTruthy());

    fireEvent.press(getByTestId('add-task'));

    expect(mockNavigate).not.toHaveBeenCalledWith('Paywall', expect.anything());
    expect(getByText('parentTasks.addModal.title')).toBeTruthy();
  });
});
