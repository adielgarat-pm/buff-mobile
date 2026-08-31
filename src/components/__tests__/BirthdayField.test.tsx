/**
 * BirthdayField (native) tests — audit M1: the emitted Date must be UTC-midnight
 * so the downstream `toISOString().split('T')[0]` in UStep1 yields the exact day
 * the user picked, on both platforms and in every timezone. The native picker
 * returns a LOCAL-midnight Date; without normalization its toISOString() rolls to
 * the previous day for any UTC+ user (the original bug). This mirrors the
 * `.web` sibling's contract (also UTC-midnight).
 */
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import BirthdayField from '../BirthdayField';

// Stub the native picker; fire a LOCAL-midnight selection (2015-06-15) on press.
jest.mock('@react-native-community/datetimepicker', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: any) => (
      <TouchableOpacity
        testID="native-date-picker"
        onPress={() => props.onChange({ type: 'set' }, new Date(2015, 5, 15))}
      >
        <Text>PICKER</Text>
      </TouchableOpacity>
    ),
  };
});

describe('BirthdayField (native) — M1 UTC-midnight normalization', () => {
  beforeEach(() => { Platform.OS = 'android'; });

  test('emits a UTC-midnight Date for the picked day', () => {
    const onChange = jest.fn();
    const { getByText, getByTestId } = render(
      <BirthdayField value={null} onChange={onChange} placeholder="Pick birthday" locale="en" />,
    );
    fireEvent.press(getByText('Pick birthday'));
    fireEvent.press(getByTestId('native-date-picker')); // picks local 2015-06-15

    expect(onChange).toHaveBeenCalledTimes(1);
    const emitted = onChange.mock.calls[0][0] as Date;
    // UTC components are exactly the picked day...
    expect(emitted.getUTCFullYear()).toBe(2015);
    expect(emitted.getUTCMonth()).toBe(5);
    expect(emitted.getUTCDate()).toBe(15);
    expect(emitted.getUTCHours()).toBe(0);
    // ...and it survives the downstream serializer used by UStep1 in ANY tz.
    expect(emitted.toISOString().split('T')[0]).toBe('2015-06-15');
  });
});
