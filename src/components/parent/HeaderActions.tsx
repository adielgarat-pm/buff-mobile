/**
 * HeaderActions — the trailing action cluster for parent screen headers.
 *
 * Renders an optional primary "+" action (compact circular icon button) next to
 * the notification bell, as a single flex row. Because it is a real layout
 * element — not a floating overlay — the bell and the action each get their own
 * slot and can never overlap. The row flips as a unit under native RTL, so the
 * cluster sits opposite the title in both English and Hebrew with no special
 * casing (see IN-2026-06-04-01 for the floating-overlay collision this replaces).
 *
 * Screens with no primary action (Dashboard, Settings) can render
 * <ParentNotificationBell /> directly instead of this wrapper.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PARENT_THEME as T } from '../../theme';
import { ParentNotificationBell } from './ParentNotificationBell';

interface Props {
  /** Primary action (e.g. add task / add reward). Omit for bell-only headers. */
  onAction?: () => void;
  /** Icon for the primary action button. Defaults to a plus. */
  actionIcon?: React.ComponentProps<typeof Ionicons>['name'];
  actionDisabled?: boolean;
  /** Accessibility label for the action button (the visible text it replaces). */
  actionA11yLabel?: string;
  /** Render the notification bell. Default true. */
  showBell?: boolean;
}

export const HeaderActions: React.FC<Props> = ({
  onAction,
  actionIcon = 'add',
  actionDisabled = false,
  actionA11yLabel,
  showBell = true,
}) => (
  <View style={styles.cluster}>
    {onAction && (
      <Pressable
        onPress={onAction}
        disabled={actionDisabled}
        accessibilityRole="button"
        accessibilityLabel={actionA11yLabel}
        style={({ pressed }) => [
          styles.actionBtn,
          actionDisabled && styles.actionDisabled,
          pressed && styles.pressed,
        ]}
        hitSlop={8}
      >
        <Ionicons name={actionIcon} size={24} color="#fff" />
      </Pressable>
    )}
    {showBell && <ParentNotificationBell />}
  </View>
);

const styles = StyleSheet.create({
  // `gap` is writing-direction agnostic; the row itself mirrors under RTL.
  cluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
});
