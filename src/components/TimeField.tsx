/**
 * TimeField — tap-to-pick time control (native).
 *
 * Opens the OS time picker (Android Material clock / iOS spinner) instead of
 * free-text "HH:MM" typing — the same interaction the task-edit modal already
 * has (ParentTasksScreen), requested verbatim by a real user for the timetable
 * editor (Noa, 2026-07-06: "בלחיצה על השעון להקפיץ מסך של שעון").
 *
 * Platform split: TimeField.web.tsx renders a browser <input type="time">
 * because `@react-native-community/datetimepicker` has no web implementation
 * (same lesson as BirthdayField.web — a native-only picker is a dead control
 * on web). Do NOT import this file from web-only code.
 *
 * Value contract: 24h "HH:MM" string in, "HH:MM" string out.
 */
import { useState } from 'react';
import {
  Text, TouchableOpacity, Platform,
  type StyleProp, type ViewStyle, type TextStyle,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

export interface TimeFieldProps {
  /** "HH:MM" (24h). Empty string allowed — renders a placeholder. */
  value: string;
  onChange: (hhmm: string) => void;
  /** Touchable container style (border/size — match the host screen). */
  style?: StyleProp<ViewStyle>;
  /** Time text style. */
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

/** "HH:MM" → Date (today), defensive: invalid/empty falls back to 08:00. */
export function hhmmToDate(hhmm: string): Date {
  const [h, m] = (hhmm ?? '').split(':').map(n => parseInt(n, 10));
  const d = new Date();
  const validH = Number.isFinite(h) && h >= 0 && h <= 23 ? h : 8;
  const validM = Number.isFinite(m) && m >= 0 && m <= 59 ? m : 0;
  d.setHours(validH, validM, 0, 0);
  return d;
}

/** Date → "HH:MM" (24h, zero-padded). */
export function dateToHhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TimeField({
  value, onChange, style, textStyle, accessibilityLabel, testID,
}: TimeFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        activeOpacity={0.7}
      >
        {/* Time always renders LTR, even in RTL locales */}
        <Text style={[{ writingDirection: 'ltr' }, textStyle]}>
          {value || '--:--'}
        </Text>
        <Text style={{ fontSize: 11 }}>🕐</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={hhmmToDate(value)}
          onChange={(e: DateTimePickerEvent, selected?: Date) => {
            // Android fires exactly once ('set' | 'dismissed'); hide first so
            // the dialog never re-opens from a re-render.
            setShow(false);
            if (e.type === 'set' && selected) onChange(dateToHhmm(selected));
          }}
        />
      )}
    </>
  );
}
