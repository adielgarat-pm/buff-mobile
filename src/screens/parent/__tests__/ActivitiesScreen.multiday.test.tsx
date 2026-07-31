/**
 * ActivitiesScreen — multi-weekday recurring selection (pkg/activities-multi-day).
 *
 * Verifies the parent add form now emits a `weekdays` ARRAY: toggling extra day
 * pills accumulates (deduped, Sun→Sat order), and the min-1 guard makes tapping
 * the last selected day off a no-op.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ActivitiesScreen from '../ActivitiesScreen';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));
jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false, rowDirection: 'row', textAlign: 'left' }),
}));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ familyId: 'fam-1' }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Chain: .from().select().eq(family_id).eq(role).eq(is_deleted).order()
jest.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({
                data: [{ id: 'child-1', display_name: 'Emi', avatar: '🚀', created_at: '2026-01-01' }],
                error: null,
              }),
            })),
          })),
        })),
      })),
    })),
  },
}));

const mockAddActivity = jest.fn().mockResolvedValue(true);
jest.mock('../../../hooks/useActivities', () => ({
  useActivities: () => ({
    activities: [],
    loading: false,
    addActivity: mockAddActivity,
    updateActivity: jest.fn(),
    archiveActivity: jest.fn(),
    approveActivity: jest.fn(),
  }),
}));

jest.mock('../../../components/DateField', () => {
  const { View } = jest.requireActual('react-native');
  return { __esModule: true, default: () => <View /> };
});
jest.mock('../../../components/TimeField', () => {
  const { View } = jest.requireActual('react-native');
  return { __esModule: true, default: () => <View /> };
});

async function openBlankForm(screen: ReturnType<typeof render>) {
  const { getByText } = screen;
  await waitFor(() => expect(getByText('activities.add')).toBeTruthy());
  fireEvent.press(getByText('activities.add'));            // open modal (template step)
  fireEvent.press(getByText('activities.template.blank')); // blank → form step (recurring default)
}

describe('ActivitiesScreen — multi-weekday recurring', () => {
  beforeEach(() => mockAddActivity.mockClear());

  test('toggling Tue + Thu accumulates a deduped, Sun→Sat-ordered weekdays array', async () => {
    const screen = render(<ActivitiesScreen />);
    await openBlankForm(screen);

    const { getByText, getByPlaceholderText } = screen;
    fireEvent.changeText(getByPlaceholderText('activities.titlePlaceholder'), 'Karate');
    fireEvent.press(getByText('Tue')); // add Tuesday (Sunday is on by default)
    fireEvent.press(getByText('Thu')); // add Thursday
    fireEvent.press(getByText('activities.save'));

    await waitFor(() => expect(mockAddActivity).toHaveBeenCalledTimes(1));
    expect(mockAddActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        schedule: { kind: 'recurring', weekdays: ['sunday', 'tuesday', 'thursday'] },
      }),
    );
  });

  test('min-1 guard: tapping the last selected day off is a no-op', async () => {
    const screen = render(<ActivitiesScreen />);
    await openBlankForm(screen);

    const { getByText, getByPlaceholderText } = screen;
    fireEvent.changeText(getByPlaceholderText('activities.titlePlaceholder'), 'Chess');
    fireEvent.press(getByText('Sun')); // try to turn off the only selected day
    fireEvent.press(getByText('activities.save'));

    await waitFor(() => expect(mockAddActivity).toHaveBeenCalledTimes(1));
    expect(mockAddActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        schedule: { kind: 'recurring', weekdays: ['sunday'] }, // still exactly one day
      }),
    );
  });
});
