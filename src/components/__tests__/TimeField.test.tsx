/**
 * TimeField tests — native tap-to-pick time control.
 * Feature: pkg/timetable-time-picker (docs/sessions/timetable-time-picker/SPEC.md).
 */
import { render, fireEvent } from '@testing-library/react-native';
import TimeField, { hhmmToDate, dateToHhmm } from '../TimeField';

// Stub the native picker: renders a marker + lets tests fire a selection.
jest.mock('@react-native-community/datetimepicker', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ onChange, value }: any) => (
      <TouchableOpacity
        testID="native-time-picker"
        onPress={() => {
          const picked = new Date(value);
          picked.setHours(9, 45, 0, 0);
          onChange({ type: 'set' }, picked);
        }}
      >
        <Text>PICKER</Text>
      </TouchableOpacity>
    ),
  };
});

describe('hhmmToDate / dateToHhmm', () => {
  test('round-trips a valid HH:MM', () => {
    expect(dateToHhmm(hhmmToDate('07:30'))).toBe('07:30');
    expect(dateToHhmm(hhmmToDate('23:59'))).toBe('23:59');
    expect(dateToHhmm(hhmmToDate('00:00'))).toBe('00:00');
  });

  test('invalid input falls back to 08:00 (defensive against legacy strings)', () => {
    expect(dateToHhmm(hhmmToDate(''))).toBe('08:00');
    expect(dateToHhmm(hhmmToDate('730'))).toBe('08:00');   // '730' → h=730 invalid
    expect(dateToHhmm(hhmmToDate('25:99'))).toBe('08:00');
    expect(dateToHhmm(hhmmToDate('abc'))).toBe('08:00');
  });

  test('partial-valid input keeps the valid part', () => {
    expect(dateToHhmm(hhmmToDate('09:99'))).toBe('09:00'); // minutes invalid only
  });
});

describe('TimeField (native)', () => {
  test('renders the value and no picker until tapped', () => {
    const { getByText, queryByTestId } = render(
      <TimeField value="07:30" onChange={jest.fn()} testID="tf" />,
    );
    expect(getByText('07:30')).toBeTruthy();
    expect(queryByTestId('native-time-picker')).toBeNull();
  });

  test('renders placeholder for empty value', () => {
    const { getByText } = render(<TimeField value="" onChange={jest.fn()} />);
    expect(getByText('--:--')).toBeTruthy();
  });

  test('tap → picker opens → selection commits HH:MM and closes the picker', () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TimeField value="07:30" onChange={onChange} testID="tf" />,
    );

    fireEvent.press(getByTestId('tf'));
    expect(getByTestId('native-time-picker')).toBeTruthy();

    fireEvent.press(getByTestId('native-time-picker')); // stub picks 09:45
    expect(onChange).toHaveBeenCalledWith('09:45');
    expect(queryByTestId('native-time-picker')).toBeNull(); // closed after set
  });
});
