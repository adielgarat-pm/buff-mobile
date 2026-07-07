/**
 * TimeField (web).
 *
 * `@react-native-community/datetimepicker` has no web implementation, so the
 * native TimeField would be a dead control here (the BirthdayField lesson,
 * 2026-06-26). Renders a real browser <input type="time"> — react-native-web
 * passes it straight through to react-dom and the browser shows its own
 * localized time UI.
 *
 * Contract matches TimeField.tsx ("HH:MM" in / "HH:MM" out). The input is
 * self-styled to the timetable editor's compact look; the RN `style` /
 * `textStyle` props are part of the shared contract but not translatable to
 * CSS, so they are intentionally unused (mirrors BirthdayField.web).
 */
import { PARENT_THEME as T } from '../theme';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

interface TimeFieldProps {
  value: string;
  onChange: (hhmm: string) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export default function TimeField({ value, onChange, accessibilityLabel, testID }: TimeFieldProps) {
  return (
    <input
      type="time"
      value={value}
      aria-label={accessibilityLabel}
      data-testid={testID}
      onChange={(e) => {
        // Browsers emit "" mid-edit; only commit a complete HH:MM value.
        if (e.target.value) onChange(e.target.value);
      }}
      style={{
        width: 84,
        height: 36,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        color: T.text,
        borderRadius: 8,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: T.cardBorder,
        fontSize: 13,
        fontFamily: 'inherit',
        textAlign: 'center',
        direction: 'ltr',
      }}
    />
  );
}
