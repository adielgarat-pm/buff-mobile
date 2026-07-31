/**
 * ActivitiesScreen — date/time platform-split picker tests.
 * Feature: pkg/ux-parent-web-pickers.
 *
 * The add/edit-activity form used to render raw
 * `@react-native-community/datetimepicker` controls for the one-off DATE and
 * the optional TIME — both DEAD controls on web. They are now the
 * platform-split DateField (local-calendar Date in/out, future dates allowed)
 * and TimeField ("HH:MM" in/out).
 *
 * These tests stub both fields and verify the SCREEN's wiring: fields render,
 * and picked values reach the addActivity payload in the same stored formats
 * as before ("YYYY-MM-DD" schedule date, "HH:MM" time).
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ActivitiesScreen from '../ActivitiesScreen';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false, rowDirection: 'row', textAlign: 'left' }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: 'fam-1' }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Children roster query: profiles → one child.
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

// Stub the platform-split fields: each shows its bound value and "picks" a
// fixed value on press so tests can verify the screen's wiring.
jest.mock('../../../components/DateField', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ value, onChange, placeholder, testID }: any) => (
      <TouchableOpacity testID={testID} onPress={() => onChange(new Date(2026, 6, 20))}>
        <Text>{value ? value.toDateString() : placeholder}</Text>
      </TouchableOpacity>
    ),
  };
});
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

// ── Helpers ────────────────────────────────────────────────────────────────
async function openBlankForm(screen: ReturnType<typeof render>) {
  const { getByText } = screen;
  await waitFor(() => expect(getByText('activities.add')).toBeTruthy());
  fireEvent.press(getByText('activities.add'));            // open modal (template step)
  fireEvent.press(getByText('activities.template.blank')); // blank → form step
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('ActivitiesScreen — date/time fields (platform-split)', () => {
  beforeEach(() => mockAddActivity.mockClear());

  test('one-off schedule shows the DateField; TimeField always renders', async () => {
    const screen = render(<ActivitiesScreen />);
    await openBlankForm(screen);

    const { getByTestId, queryByTestId, getByText } = screen;
    expect(getByTestId('activity-time-field')).toBeTruthy();
    expect(queryByTestId('activity-date-field')).toBeNull(); // recurring by default

    fireEvent.press(getByText('activities.scheduleOneoff'));
    expect(getByTestId('activity-date-field')).toBeTruthy();
  });

  test('picked date + time reach the addActivity payload in the stored formats', async () => {
    const screen = render(<ActivitiesScreen />);
    await openBlankForm(screen);

    const { getByTestId, getByText, getByPlaceholderText } = screen;
    fireEvent.changeText(getByPlaceholderText('activities.titlePlaceholder'), 'Swim class');
    fireEvent.press(getByText('activities.scheduleOneoff'));
    fireEvent.press(getByTestId('activity-date-field')); // stub picks 2026-07-20 (local)
    fireEvent.press(getByTestId('activity-time-field')); // stub picks 09:45
    fireEvent.press(getByText('activities.save'));

    await waitFor(() => expect(mockAddActivity).toHaveBeenCalledTimes(1));
    expect(mockAddActivity).toHaveBeenCalledWith({
      childId: 'child-1',
      title: 'Swim class',
      templateId: null,
      schedule: { kind: 'oneoff', date: '2026-07-20' }, // local "YYYY-MM-DD", unchanged
      time: '09:45',                                     // "HH:MM", unchanged
      equipment: [],
    });
  });
});
