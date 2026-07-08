/**
 * DateField — tap-to-pick date control (native, iOS + Android).
 *
 * Generalized sibling of BirthdayField: same platform-split contract, but
 * without the birthday-specific `maximumDate: today` clamp (activities dates
 * are usually in the FUTURE, so BirthdayField would block them). Callers pass
 * `minimumDate` / `maximumDate` when a range applies.
 *
 * Platform split: DateField.web.tsx renders a browser <input type="date">
 * because `@react-native-community/datetimepicker` has no web implementation —
 * a native-only picker is a dead control on web (the BirthdayField lesson,
 * 2026-06-26). Do NOT import this file from web-only code.
 *
 * Value contract: `Date | null` in, local-calendar `Date` out. Format the
 * stored value with LOCAL date components (getFullYear/getMonth/getDate),
 * not toISOString(), so the day never shifts across timezones.
 */
import { useState } from 'react';
import {
  Text, TouchableOpacity, Platform, StyleSheet,
  type StyleProp, type ViewStyle, type TextStyle,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { PARENT_THEME as T } from '../theme';

export type DateFieldProps = {
  value: Date | null;
  onChange: (d: Date) => void;
  /** Shown on the button when no date is selected. */
  placeholder: string;
  /** App language, used to localise the displayed date. */
  locale: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Button container style override (match the host screen). */
  style?: StyleProp<ViewStyle>;
  /** Date/placeholder text style override. */
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

/** Format a Date for display (en → "19 Oct 2026", he → "19 באוק׳ 2026"). */
function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DateField({
  value, onChange, placeholder, locale, minimumDate, maximumDate,
  style, textStyle, accessibilityLabel, testID,
}: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    // On Android the picker closes itself; on iOS it stays open until dismissed.
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selected) onChange(selected);
    if (event.type === 'dismissed') setShowPicker(false);
  };

  return (
    <>
      {/* iOS inline picker — always visible once toggled */}
      {Platform.OS === 'ios' && showPicker && (
        <DateTimePicker
          mode="date"
          display="spinner"
          value={value ?? new Date()}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onDateChange}
          style={styles.iosSpinner}
        />
      )}

      {/* Button (Android always; iOS when picker is closed) */}
      {(Platform.OS !== 'ios' || !showPicker) && (
        <TouchableOpacity
          style={[styles.dateBtn, style]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? placeholder}
          testID={testID}
        >
          <Text style={[styles.dateBtnText, !value && styles.dateBtnPlaceholder, textStyle]}>
            {value ? formatDate(value, locale) : placeholder}
          </Text>
          <Text style={styles.dateBtnIcon}>📅</Text>
        </TouchableOpacity>
      )}

      {/* Android: picker appears as modal overlay when open */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={value ?? new Date()}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onDateChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: T.cardBorder },
  dateBtnText: { flex: 1, color: T.text, fontSize: 15 },
  dateBtnPlaceholder: { color: T.textMuted },
  dateBtnIcon: { fontSize: 18 },
  iosSpinner: { width: '100%', marginBottom: 4 },
});
