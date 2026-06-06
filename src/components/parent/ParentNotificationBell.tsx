/**
 * ParentNotificationBell — inline bell button for parent screen headers.
 *
 * Source SPEC: docs/sessions/parent-notification-feed/SPEC.md § Phase 2.
 *
 * Design decisions (locked):
 *   - Inline header element (OQ-B1: visible on all 5 tabs). It lives inside each
 *     screen's header row — usually inside <HeaderActions> next to the screen's
 *     primary "+" action — so layout (flex) keeps it in its own slot and it can
 *     never overlap another control. RTL is handled by the header's flex row,
 *     not by absolute `left`/`right` (see IN-2026-06-04-01 for why the old
 *     floating overlay collided with corner action buttons in both directions).
 *   - Numeric unread badge, max "99+" (OQ-B10)
 *   - Theme-accent color (NOT red — Pillar-2 risk per OQ-B10)
 *   - Hidden when count = 0 (OQ-B10) and when parent has 0 children (OQ-B15)
 *   - Hidden in View-as-Child mode (OQ-B16) — caller wraps appropriately
 *
 * Tap action: navigates to NotificationFeedScreen (Phase 3).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useNotificationsFeed } from '../../hooks/useNotificationsFeed';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { PARENT_THEME } from '../../theme';

interface NavigationLike {
  navigate: (route: string) => void;
}

export const ParentNotificationBell: React.FC = () => {
  const { unreadCount } = useNotificationsFeed();
  const { children } = useChildrenDashboard();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationLike>();

  // Hidden when no children yet (OQ-B15 — reduces onboarding noise)
  if (!children || children.length === 0) return null;

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const a11yLabel = t('notificationBell.a11y', { count: unreadCount });

  // Solid icon when there are unread items — signals "active button, has content".
  // Outline icon when the queue is empty — passive but still discoverable.
  const hasUnread = unreadCount > 0;
  const iconName = hasUnread ? 'notifications' : 'notifications-outline';

  const handlePress = () => {
    // Light haptic on press makes the bell clearly read as a button.
    // Failure is benign (e.g. emulator without haptics) — swallow.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('NotificationFeed');
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [
        styles.bell,
        pressed && styles.bellPressed,
      ]}
      hitSlop={12}
    >
      <Ionicons name={iconName} size={22} color={PARENT_THEME.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </Pressable>
  );
};

const BADGE_BG = PARENT_THEME.accent;

const styles = StyleSheet.create({
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: PARENT_THEME.tabBarBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  bellPressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
