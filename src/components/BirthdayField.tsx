/**
 * BirthdayField (native — iOS + Android).
 *
 * Encapsulates the native `@react-native-community/datetimepicker` behind a
 * platform-agnostic contract so onboarding screens don't branch on Platform.
 * The web counterpart lives in `BirthdayField.web.tsx` and renders a real
 * browser `<input type="date">` — Metro resolves it automatically on web, so
 * this native-only module never enters the web bundle.
 *
 * Behaviour preserved verbatim from the original inline UStep1 implementation:
 *   • iOS   — inline spinner, toggled open by the button, stays until dismissed
 *   • Android — button opens the platform modal picker, which self-closes
 */
import { useState } from 'react';
import { Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { PARENT_THEME as T } from '../theme';

type Props = {
  value: Date | null;
  onChange: (d: Date) => void;
  /** Shown on the button when no date is selected. */
  placeholder: string;
  /** App language, used to localise the displayed date. */
  locale: string;
};

/** Format a Date for display (en → "19 Oct 1998", he → "19 באוק׳ 1998"). */
function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BirthdayField({ value, onChange, placeholder, locale }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    // On Android the picker closes itself; on iOS it stays open until dismissed.
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      // Normalize to UTC midnight so the downstream `toISOString().split('T')[0]`
      // in UStep1 yields the exact day the user picked — matching BirthdayField.web
      // (which already emits UTC midnight). The native picker returns a LOCAL-midnight
      // Date, whose toISOString() rolls to the previous day for any UTC+ user (audit
      // M1). Both split variants must emit the SAME contract behind one prop shape.
      onChange(new Date(Date.UTC(selected.getFullYear(), selected.getMonth(), selected.getDate())));
    }
    if (event.type === 'dismissed') setShowDatePicker(false);
  };

  return (
    <>
      {/* iOS inline picker — always visible once toggled */}
      {Platform.OS === 'ios' && showDatePicker && (
        <DateTimePicker
          mode="date"
          display="spinner"
          value={value ?? new Date(2010, 0, 1)}
          maximumDate={new Date()}
          onChange={onDateChange}
          style={styles.iosSpinner}
        />
      )}

      {/* Button (Android always; iOS when picker is closed) */}
      {(Platform.OS !== 'ios' || !showDatePicker) && (
        <TouchableOpacity
          style={[styles.dateBtn, !!value && styles.dateBtnFilled]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dateBtnText, !!value && styles.dateBtnTextFilled]}>
            {value ? formatDate(value, locale) : placeholder}
          </Text>
          <Text style={styles.dateBtnIcon}>📅</Text>
        </TouchableOpacity>
      )}

      {/* Android: picker appears as modal overlay when open */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={value ?? new Date(2010, 0, 1)}
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: T.cardBorder, marginBottom: 4 },
  dateBtnFilled: { borderColor: T.accent, backgroundColor: '#F5F3FF' },
  dateBtnText: { flex: 1, color: T.textMuted, fontSize: 15 },
  dateBtnTextFilled: { color: T.text, fontWeight: '500' },
  dateBtnIcon: { fontSize: 18 },
  iosSpinner: { width: '100%', marginBottom: 4 },
});
