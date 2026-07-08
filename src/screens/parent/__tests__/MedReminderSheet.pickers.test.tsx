/**
 * MedReminderSheet — dose-time platform-split picker tests.
 * Feature: pkg/ux-parent-web-pickers.
 *
 * The morning/evening dose rows used to render raw
 * `@react-native-community/datetimepicker` controls — DEAD on web. They now
 * use the platform-split TimeField ("HH:MM" in/out).
 *
 * These tests stub TimeField and verify the SHEET's wiring: fields render
 * their defaults, and picked times reach the inserted tasks rows unchanged
 * in format.
 */
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import MedReminderSheet from '../MedReminderSheet';
import { supabase } from '../../../integrations/supabase/client';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false, rowDirection: 'row', textAlign: 'left' }),
}));

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

// Stub the platform-split TimeField: shows the bound value; pressing "picks"
// a per-instance time keyed off the testID so morning/evening stay distinct.
jest.mock('../../../components/TimeField', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ value, onChange, testID }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={() => onChange(testID === 'med-evening-time' ? '21:15' : '08:15')}
      >
        <Text>{value || '--:--'}</Text>
      </TouchableOpacity>
    ),
  };
});

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

function installInsertMock() {
  const insertSpy = jest.fn().mockResolvedValue({ error: null });
  mockedFrom.mockImplementation(() => ({ insert: insertSpy }) as never);
  return insertSpy;
}

const baseProps = {
  visible: true,
  childId: 'child-1',
  childName: 'Emi',
  familyId: 'fam-1',
  onClose: jest.fn(),
  onSaved: jest.fn(),
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe('MedReminderSheet — dose time fields (platform-split)', () => {
  beforeEach(() => {
    mockedFrom.mockReset();
    (baseProps.onSaved as jest.Mock).mockClear();
  });

  test('renders the morning TimeField with the 07:30 default', () => {
    installInsertMock();
    const { getByTestId } = render(<MedReminderSheet {...baseProps} />);
    const field = getByTestId('med-morning-time');
    // Scoped: "07:30" also appears in the child-preview card below the form.
    expect(within(field).getByText('07:30')).toBeTruthy();
  });

  test('picked morning time reaches the inserted task row as "HH:MM"', async () => {
    const insertSpy = installInsertMock();
    const { getByTestId, getByText } = render(<MedReminderSheet {...baseProps} />);

    fireEvent.press(getByTestId('med-morning-time')); // stub picks 08:15
    fireEvent.press(getByText('medReminder.save'));

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    const rows = insertSpy.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      family_id: 'fam-1',
      assigned_to: 'child-1',
      category: 'self-care',
      time: '08:15',
      schedule_days: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(baseProps.onSaved).toHaveBeenCalledWith('Emi');
  });

  test('evening dose gets its own TimeField and both times persist', async () => {
    const insertSpy = installInsertMock();
    const { getByTestId, getByText } = render(<MedReminderSheet {...baseProps} />);

    fireEvent.press(getByText('+ medReminder.addEvening')); // enable evening dose
    const eveningField = getByTestId('med-evening-time');
    expect(within(eveningField).getByText('20:00')).toBeTruthy(); // evening default

    fireEvent.press(getByTestId('med-evening-time')); // stub picks 21:15
    fireEvent.press(getByText('medReminder.save'));

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    const rows = insertSpy.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ time: '07:30' }); // morning untouched
    expect(rows[1]).toMatchObject({ time: '21:15' });
  });
});
