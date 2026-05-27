/**
 * NotificationRow — single notification row in NotificationFeedScreen.
 *
 * Source SPEC: docs/sessions/parent-notification-feed/SPEC.md § Phase 3 (OQ-B13).
 *
 * Visual rules:
 *   - Equal-weight rows: SAME typography, same colors regardless of type.
 *     NO red border on parent_sos (Pillar 2 — alarm-design risk).
 *   - Type-keyed leading icon only (Ionicons), all same neutral color.
 *   - Unread state: small dot, not a styling-level change.
 *   - Title: declarative parent voice (IN-2026-05-17-01).
 *
 * Tap behavior:
 *   - Caller wires onPress (mark-read + navigate via notificationRouter).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { FeedNotification } from '../../hooks/useNotificationsFeed';
import { PARENT_THEME } from '../../theme';

interface Props {
  notification: FeedNotification;
  onPress:      (notification: FeedNotification) => void;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Type → icon (all same neutral color; no per-type color emphasis). */
function iconForType(type: string): IconName {
  switch (type) {
    case 'parent_sos':         return 'chatbubble-ellipses-outline';
    case 'reward_redeemed':    return 'gift-outline';
    case 'task_completed':     return 'flag-outline';
    case 'quest_milestone':    return 'trophy-outline';
    case 'parent_engagement':  return 'leaf-outline';
    case 'family_joined':      return 'people-outline';
    default:                   return 'ellipse-outline';
  }
}

type TFn = (key: string, options?: Record<string, unknown>) => string;

/** Build body copy per type (declarative + connection-not-rescue, IN-2026-05-17-01). */
function bodyForType(notification: FeedNotification, t: TFn): string {
  const { type, child_name: name, entity_name: reward } = notification;
  switch (type) {
    case 'parent_sos':
      return t('notificationFeed.row.parent_sos', { name });
    case 'reward_redeemed':
      return t('notificationFeed.row.reward_redeemed', { name, reward });
    case 'task_completed':
      return t('notificationFeed.row.task_completed', { name });
    case 'quest_milestone':
      return t('notificationFeed.row.quest_milestone', { name });
    case 'parent_engagement':
      return t('notificationFeed.row.parent_engagement', { name });
    case 'family_joined':
      return t('notificationFeed.row.family_joined', { name });
    default:
      return name;
  }
}

/** Relative time helper — short formatting in feed. */
function relativeTime(createdAt: string, locale: 'he' | 'en'): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return locale === 'he' ? 'עכשיו' : 'just now';
  if (minutes < 60) return locale === 'he' ? `${minutes} ד׳` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'he' ? `${hours} ש׳` : `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === 'he' ? `${days} י׳` : `${days}d`;
  // For older items, the section header carries the date
  return new Date(createdAt).toLocaleDateString(locale);
}

export const NotificationRow: React.FC<Props> = ({ notification, onPress }) => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'he' ? 'he' : 'en') as 'he' | 'en';
  const body = bodyForType(notification, t as unknown as TFn);
  const time = relativeTime(notification.created_at, locale);
  const iconName = iconForType(notification.type);

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={20} color={PARENT_THEME.text} />
      </View>
      <View style={styles.body}>
        <Text
          style={[styles.bodyText, !notification.is_read && styles.bodyUnread]}
          numberOfLines={2}
        >
          {body}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      {!notification.is_read && <View style={styles.unreadDot} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: PARENT_THEME.card,
    borderBottomColor: PARENT_THEME.cardBorder,
    borderBottomWidth: 1,
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PARENT_THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  bodyText: {
    fontSize: 14,
    color: PARENT_THEME.text,
    lineHeight: 20,
  },
  bodyUnread: {
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: PARENT_THEME.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PARENT_THEME.accent,
    marginTop: 8,
    marginLeft: 8,
  },
});
