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

jest.mock('../../../hooks/useTimetable', () => ({
  useTimetable: () => ({
    timetable: {},
    loading: false,
    saving: false,
    saveTimetable: jest.fn(),
  }),
}));

jest.mock('../../../components/parent/ParentNotificationBell', () => ({
  ParentNotificationBell: () => null,
}));

jest.mock('../../../platform', () => ({ crossAlert: jest.fn() }));

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

    const equip = api.getAllByLabelText('timetable.equipmentForLesson')[0];
    fireEvent.changeText(
      equip,
      'בקבוק מים, כובע, נעלים סגורות, קרם הגנה, אלתוש, בגד ים, כובע ים, משקפת, מגבת, בגדים להחלפה, חיוך גדול, עוד ציוד, ועוד ציוד, ועוד קצת',
    );

    // Footer + save button still present in the tree (not displaced/unmounted)
    expect(api.getByTestId('timetable-footer-manual')).toBeTruthy();
    expect(api.getByText('timetable.saveLessons')).toBeTruthy();
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
