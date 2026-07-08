/**
 * DateField tests — native tap-to-pick date control.
 * Feature: pkg/ux-parent-web-pickers (platform parity for parent edit flows).
 *
 * DateField is the generalized sibling of BirthdayField (no implicit
 * max=today clamp — activity dates are usually in the future).
 */
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import DateField from '../DateField';

// Capture the props the native picker receives + let tests fire a selection.
let lastPickerProps: any = null;
jest.mock('@react-native-community/datetimepicker', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: any) => {
      lastPickerProps = props;
      return (
        <TouchableOpacity
          testID="native-date-picker"
          onPress={() => props.onChange({ type: 'set' }, new Date(2026, 6, 20))}
        >
          <Text>PICKER</Text>
        </TouchableOpacity>
      );
    },
  };
});

describe('DateField (native)', () => {
  beforeEach(() => {
    lastPickerProps = null;
    // Exercise the Android path deterministically (self-closing modal picker).
    Platform.OS = 'android';
  });

  test('renders the placeholder when no date is selected, and no picker', () => {
    const { getByText, queryByTestId } = render(
      <DateField value={null} onChange={jest.fn()} placeholder="Pick a date" locale="en" testID="df" />,
    );
    expect(getByText('Pick a date')).toBeTruthy();
    expect(queryByTestId('native-date-picker')).toBeNull();
  });

  test('renders the localized date when a value is set', () => {
    const { getByText } = render(
      <DateField value={new Date(2026, 6, 20)} onChange={jest.fn()} placeholder="Pick a date" locale="en" />,
    );
    expect(getByText('Jul 20, 2026')).toBeTruthy();
  });

  test('tap → picker opens → selection commits the Date and closes the picker', () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <DateField value={null} onChange={onChange} placeholder="Pick a date" locale="en" testID="df" />,
    );

    fireEvent.press(getByTestId('df'));
    expect(getByTestId('native-date-picker')).toBeTruthy();

    fireEvent.press(getByTestId('native-date-picker')); // stub picks 2026-07-20
    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = onChange.mock.calls[0][0] as Date;
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(6);
    expect(picked.getDate()).toBe(20);
    expect(queryByTestId('native-date-picker')).toBeNull(); // closed after set
  });

  test('forwards minimumDate / maximumDate to the native picker (no implicit max=today)', () => {
    const min = new Date(2026, 0, 1);
    const max = new Date(2027, 0, 1);
    const { getByTestId } = render(
      <DateField
        value={null} onChange={jest.fn()} placeholder="Pick" locale="en"
        minimumDate={min} maximumDate={max} testID="df"
      />,
    );
    fireEvent.press(getByTestId('df'));
    expect(lastPickerProps.minimumDate).toBe(min);
    expect(lastPickerProps.maximumDate).toBe(max);
  });

  test('omits max entirely when not passed (future dates allowed)', () => {
    const { getByTestId } = render(
      <DateField value={null} onChange={jest.fn()} placeholder="Pick" locale="en" testID="df" />,
    );
    fireEvent.press(getByTestId('df'));
    expect(lastPickerProps.maximumDate).toBeUndefined();
    expect(lastPickerProps.minimumDate).toBeUndefined();
  });
});
