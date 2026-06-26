/**
 * BirthdayField (web).
 *
 * The native `@react-native-community/datetimepicker` has no web implementation,
 * so on web the original button rendered but opened nothing — a dead control
 * that stalled parents mid-onboarding (verified 2026-06-26). Here we render a
 * real browser `<input type="date">`, which react-native-web passes straight
 * through to react-dom.
 *
 * Contract matches BirthdayField.tsx. Dates are normalised to UTC midnight so
 * the downstream `toISOString().split('T')[0]` in UStep1 yields the exact day
 * the user picked (no timezone off-by-one).
 */
import { PARENT_THEME as T } from '../theme';

type Props = {
  value: Date | null;
  onChange: (d: Date) => void;
  /** Used as the accessible label (browsers render their own placeholder). */
  placeholder: string;
  /** Part of the shared contract; unused on web (native localises the label). */
  locale: string;
};

/** Date → "YYYY-MM-DD" for the input's value attribute. */
function toInputValue(d: Date | null): string {
  return d ? d.toISOString().split('T')[0] : '';
}

export default function BirthdayField({ value, onChange, placeholder }: Props) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <input
      type="date"
      value={toInputValue(value)}
      max={today}
      aria-label={placeholder}
      onChange={(e) => {
        const v = e.target.value;
        // Parse as UTC midnight so the stored ISO day matches the picked day.
        if (v) onChange(new Date(`${v}T00:00:00Z`));
      }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#F9FAFB',
        color: T.text,
        borderRadius: 12,
        padding: '14px 16px',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: value ? T.accent : T.cardBorder,
        fontSize: 16,
        fontFamily: 'inherit',
        marginBottom: 4,
      }}
    />
  );
}
