/**
 * Layout-overflow regression tests for the timetable editor.
 *
 * Real-user report (Noa, 2026-07-06): with a long equipment list the save
 * control landed in the system-nav gesture zone — tapping it opened the
 * system menu instead of saving. See
 * docs/sessions/timetable-editor-overflow/SPEC.md.
 *
 * Asserts the three structural guarantees of the fix:
 *   1. every editor footer carries safe-area bottom padding (>= insets.bottom+12, min 20)
 *   2. the equipment field is bounded multiline (grows, never unbounded)
 *   3. manual mode is reachable and its footer renders (smoke)
 */
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import TimetableScreen from '../TimetableScreen';

// ── Mocks ───────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Emulate a device with a 48px gesture-nav inset — the exact class of device
// where the bug reproduced.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 48, left: 0, right: 0 }),
}));

jest.mock('../../../hooks/useChildrenDashboard', () => ({
  useChildrenDashboard: () => ({
    children: [{ childId: 'c1', displayName: 'Kid', avatar: '🐶' }],
    loading: false,
  }),
}));

jest.mock('../../../hooks/useTimetable', () => {
  const saveTimetable = jest.fn().mockResolvedValue(true);
  return {
    useTimetable: () => ({
      timetable: {},
      loading: false,
      saving: false,
      saveTimetable,
    }),
  };
});

jest.mock('../../../components/parent/ParentNotificationBell', () => ({
  ParentNotificationBell: () => null,
}));

jest.mock('../../../platform', () => ({ crossAlert: jest.fn() }));

// Handles to the shared mocks (factories above are hoisted; grab lazily).
const crossAlertMock = () =>
  (jest.requireMock('../../../platform') as { crossAlert: jest.Mock }).crossAlert;
const saveTimetableMock = () =>
  (jest.requireMock('../../../hooks/useTimetable') as { useTimetable: () => { saveTimetable: jest.Mock } })
    .useTimetable().saveTimetable;

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('../../../utils/timetableParser', () => ({
  parseExcelBase64: jest.fn(),
  processApiResponse: jest.fn(),
  periodsToTimetable: jest.fn(() => ({})),
  generateBuffStandardTime: jest.fn(() => '08:00'),
}));

// Native time picker (pkg/timetable-time-picker) — stub so tapping the
// TimeField in jsdom never touches the native module.
jest.mock('@react-native-community/datetimepicker', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: () => <Text testID="native-time-picker">PICKER</Text>,
  };
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function openManualMode() {
  const api = render(<TimetableScreen />);
  // empty timetable → empty state → choose → manual
  fireEvent.press(api.getByText('timetable.importBtn'));
  fireEvent.press(api.getByText('timetable.methodManual'));
  return api;
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('TimetableScreen — editor overflow fix', () => {
  test('manual-mode footer clears the system nav area (insets.bottom + 12)', () => {
    const { getByTestId } = openManualMode();

    const footer = getByTestId('timetable-footer-manual');
    const flat = StyleSheet.flatten(footer.props.style);
    // bottom=48 mocked → expected max(48+12, 20) = 60
    expect(flat.paddingBottom).toBe(60);
  });

  test('equipment input is bounded multiline (grows to a cap, then scrolls)', () => {
    const api = openManualMode();
    // seed one lesson row
    fireEvent.press(api.getByText('timetable.addLesson'));

    const equip = api.getAllByLabelText('timetable.equipmentForLesson')[0];
    expect(equip.props.multiline).toBe(true);

    const flat = StyleSheet.flatten(equip.props.style);
    expect(flat.maxHeight).toBe(76);   // bounded — can never swallow the screen
    expect(flat.minHeight).toBe(34);   // but keeps the compact default
    expect(flat.height).toBeUndefined(); // no fixed height fighting multiline
  });

  test('save button still renders and stays pressable with a long equipment text', () => {
    const api = openManualMode();
    fireEvent.press(api.getByText('timetable.addLesson'));
    fireEvent.changeText(api.getAllByPlaceholderText('timetable.lessonPlaceholder')[0], 'קייטנה');

    const equip = api.getAllByLabelText('timetable.equipmentForLesson')[0];
    fireEvent.changeText(
      equip,
      'בקבוק מים, כובע, נעלים סגורות, קרם הגנה, אלתוש, בגד ים, כובע ים, משקפת, מגבת, בגדים להחלפה, חיוך גדול, עוד ציוד, ועוד ציוד, ועוד קצת',
    );

    // Footer + save button still present in the tree (not displaced/unmounted)
    expect(api.getByTestId('timetable-footer-manual')).toBeTruthy();
    expect(api.getByText('timetable.saveLessons')).toBeTruthy();
  });

  test('lesson time is a tap-to-pick TimeField, not free text (pkg/timetable-time-picker)', () => {
    const api = openManualMode();
    fireEvent.press(api.getByText('timetable.addLesson'));

    // The seeded lesson renders a TimeField with the generated default time
    const tf = api.getByTestId('time-field-manual-0');
    expect(tf).toBeTruthy();
    expect(api.getByText('08:00')).toBeTruthy(); // generateBuffStandardTime mock

    // Tapping opens the (stubbed) native picker
    fireEvent.press(tf);
    expect(api.getByTestId('native-time-picker')).toBeTruthy();
  });

  test('review/paste footers share the same safe-area padding style', () => {
    // paste mode is reachable directly from choose
    const api = render(<TimetableScreen />);
    fireEvent.press(api.getByText('timetable.importBtn'));
    fireEvent.press(api.getByText('timetable.methodPaste'));

    const footer = api.getByTestId('timetable-footer-paste');
    const flat = StyleSheet.flatten(footer.props.style);
    expect(flat.paddingBottom).toBe(60);
  });
});

describe('TimetableScreen — clear day + empty save (season change: school → camp)', () => {
  beforeEach(() => {
    crossAlertMock().mockClear();
    saveTimetableMock().mockClear();
  });

  test('clear-day button empties the current day in one tap', () => {
    const api = openManualMode();
    fireEvent.press(api.getByText('timetable.addLesson'));
    fireEvent.press(api.getByText('timetable.addLesson'));
    expect(api.getAllByLabelText('timetable.equipmentForLesson')).toHaveLength(2);

    fireEvent.press(api.getByTestId('clear-day'));

    expect(api.queryAllByLabelText('timetable.equipmentForLesson')).toHaveLength(0);
    // affordance hides once the day is empty; add-lesson stays available
    expect(api.queryByTestId('clear-day')).toBeNull();
    expect(api.getByText('timetable.addLesson')).toBeTruthy();
  });

  test('saving an EMPTY schedule is allowed behind an explicit confirm (was hard-blocked)', () => {
    const api = openManualMode();

    // Save button must NOT be disabled at 0 lessons anymore
    const save = api.getByTestId('manual-save');
    expect(save.props.accessibilityState?.disabled).not.toBe(true);
    expect(api.getByText('timetable.saveEmpty')).toBeTruthy();

    fireEvent.press(save);

    // Confirm dialog fired instead of a silent block
    const alert = crossAlertMock();
    expect(alert).toHaveBeenCalledWith(
      'timetable.clearAllTitle',
      'timetable.clearAllMsg',
      expect.any(Array),
    );

    // Confirming the destructive option persists an all-empty timetable
    const buttons = alert.mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    const confirm = buttons.find(b => b.text === 'timetable.clearAllConfirm');
    expect(confirm).toBeTruthy();
    confirm!.onPress!();

    const saved = saveTimetableMock().mock.calls[0][0] as Record<string, unknown[]>;
    expect(Object.values(saved).every(rows => rows.length === 0)).toBe(true);
  });

  test('cancel on the empty-save confirm does NOT persist anything', () => {
    const api = openManualMode();
    fireEvent.press(api.getByTestId('manual-save'));

    const buttons = crossAlertMock().mock.calls[0][2] as Array<{ text: string; onPress?: () => void }>;
    const cancel = buttons.find(b => b.text === 'timetable.cancel');
    expect(cancel).toBeTruthy();
    cancel!.onPress?.();

    expect(saveTimetableMock()).not.toHaveBeenCalled();
  });
});

describe('TimetableScreen — copy day (pkg/timetable-copy-day)', () => {
  function seedLesson(api: ReturnType<typeof openManualMode>, subject: string, equipment: string) {
    fireEvent.press(api.getByText('timetable.addLesson'));
    const subjects = api.getAllByPlaceholderText('timetable.lessonPlaceholder');
    fireEvent.changeText(subjects[subjects.length - 1], subject);
    const equips = api.getAllByLabelText('timetable.equipmentForLesson');
    fireEvent.changeText(equips[equips.length - 1], equipment);
  }

  test('copy affordance appears only once the day has a lesson row', () => {
    const api = openManualMode();
    expect(api.queryByTestId('copy-day-open')).toBeNull();
    fireEvent.press(api.getByText('timetable.addLesson'));
    expect(api.getByTestId('copy-day-open')).toBeTruthy();
  });

  test('copies lessons + equipment to an empty day and jumps to it', () => {
    const api = openManualMode();
    seedLesson(api, 'קייטנה', 'בקבוק מים, כובע');

    fireEvent.press(api.getByTestId('copy-day-open'));
    fireEvent.press(api.getByTestId('copy-day-chip-monday'));
    fireEvent.press(api.getByTestId('copy-day-confirm'));

    // Editor jumped to Monday and shows the copied lesson (deep copy)
    expect(api.getByDisplayValue('קייטנה')).toBeTruthy();
    expect(api.getByDisplayValue('בקבוק מים, כובע')).toBeTruthy();

    // Editing the Monday copy must NOT touch Sunday's original (no shared refs):
    fireEvent.changeText(api.getByDisplayValue('קייטנה'), 'בריכה');
    // (state assertions on Sunday's row are covered by timetableCopy unit tests;
    // here we only assert the copy is an editable, independent row)
    expect(api.getByDisplayValue('בריכה')).toBeTruthy();
  });

  test('confirm is disabled with no target selected', () => {
    const api = openManualMode();
    seedLesson(api, 'קייטנה', '');
    fireEvent.press(api.getByTestId('copy-day-open'));

    const confirm = api.getByTestId('copy-day-confirm');
    expect(confirm.props.accessibilityState?.disabled).toBe(true);
  });
});
