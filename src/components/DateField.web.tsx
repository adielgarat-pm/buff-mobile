/**
 * DateField (web).
 *
 * `@react-native-community/datetimepicker` has no web implementation, so the
 * native DateField would be a dead control here (the BirthdayField lesson,
 * 2026-06-26). Renders a real browser <input type="date"> — react-native-web
 * passes it straight through to react-dom.
 *
 * Contract matches DateField.tsx: `Date | null` in, local-calendar `Date` out.
 * Unlike BirthdayField.web (UTC midnight for a downstream toISOString()),
 * dates here are parsed as LOCAL midnight because DateField callers format
 * with local components (getFullYear/getMonth/getDate) — this keeps the
 * stored day identical to the picked day in every timezone.
 *
 * The RN `style` / `textStyle` props are part of the shared contract but not
 * translatable to CSS, so they are intentionally unused (mirrors
 * BirthdayField.web / TimeField.web).
 */
import { PARENT_THEME as T } from '../theme';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type DateFieldProps = {
  value: Date | null;
  onChange: (d: Date) => void;
  /** Used as the accessible label (browsers render their own placeholder). */
  placeholder: string;
  /** Part of the shared contract; unused on web (native localises the label). */
  locale: string;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

/** Date → "YYYY-MM-DD" (local components) for the input's value/min/max. */
function toInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DateField({
  value, onChange, placeholder, minimumDate, maximumDate, accessibilityLabel, testID,
}: DateFieldProps) {
  return (
    <input
      type="date"
      value={toInputValue(value)}
      min={toInputValue(minimumDate) || undefined}
      max={toInputValue(maximumDate) || undefined}
      aria-label={accessibilityLabel ?? placeholder}
      data-testid={testID}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return; // browsers emit "" mid-edit; only commit complete dates
        const [y, m, d] = v.split('-').map((n) => parseInt(n, 10));
        onChange(new Date(y, m - 1, d)); // local midnight — see header comment
      }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#F9FAFB',
        color: T.text,
        borderRadius: 12,
        padding: '12px 16px',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: value ? T.accent : T.cardBorder,
        fontSize: 15,
        fontFamily: 'inherit',
      }}
    />
  );
}
