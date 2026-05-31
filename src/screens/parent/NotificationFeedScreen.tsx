/**
 * NotificationFeedScreen — chronological list of parent notifications.
 *
 * Source SPEC: docs/sessions/parent-notification-feed/SPEC.md § Phase 3 + 4 + 5.
 *
 * Layout:
 *   - SafeAreaView wrapper (no nav header on this screen — custom top bar)
 *   - Top bar: back button + title + "Mark all as read" action
 *   - SectionList with sticky headers (Today / Yesterday / This week / Older)
 *   - Empty state when items.length === 0
 *
 * Tap on row → marks read + navigates via shared notificationRouter.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useNotificationsFeed, type FeedNotification } from '../../hooks/useNotificationsFeed';
import { NotificationRow } from '../../components/parent/NotificationRow';
import { NotificationEmptyState } from '../../components/parent/NotificationEmptyState';
import { bucketize, type TimeBucket } from '../../lib/notificationTimeBuckets';
import { resolveRouteAction } from '../../lib/notificationRouter';
import { PARENT_THEME } from '../../theme';

interface NavigationLike {
  goBack: () => void;
  navigate: (route: string, params?: object) => void;
}

const BUCKET_LABEL_KEY: Record<TimeBucket, string> = {
  today:     'notificationFeed.bucket.today',
  yesterday: 'notificationFeed.bucket.yesterday',
  this_week: 'notificationFeed.bucket.this_week',
  older:     'notificationFeed.bucket.older',
};

export default function NotificationFeedScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationLike>();
  const { items, loading, markRead, markAllRead } = useNotificationsFeed();

  const sections = useMemo(() => {
    const buckets = bucketize(items);
    return buckets.map((b) => ({
      title: t(BUCKET_LABEL_KEY[b.bucket]),
      data: b.items,
    }));
  }, [items, t]);

  const onRowPress = useCallback(
    (notification: FeedNotification) => {
      markRead(notification.id);
      const action = resolveRouteAction({
        type: notification.type,
        entity_id: notification.entity_id ?? undefined,
        child_id: notification.child_id ?? undefined,
        family_id: notification.family_id,
      });
      // For now we just navigate back to the tab navigator; specific
      // sub-screen navigation requires nested-navigator awareness.
      // The matrix in `notificationRouter` documents the intended routes;
      // wiring deferred to a follow-up if needed.
      switch (action.kind) {
        case 'parent_dashboard':
        case 'parent_rewards':
        case 'parent_tasks':
          navigation.goBack();
          break;
        case 'noop':
        default:
          break;
      }
    },
    [markRead, navigation],
  );

  const hasUnread = useMemo(() => items.some((n) => !n.is_read), [items]);

  // Opening the feed counts as "seen" — mark everything read once on first load.
  // Guarded so it fires a single time per screen mount, not on every re-render.
  const didAutoMark = useRef(false);
  useEffect(() => {
    if (loading || didAutoMark.current) return;
    didAutoMark.current = true;
    if (hasUnread) markAllRead();
  }, [loading, hasUnread, markAllRead]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('notificationFeed.back.a11y')}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={PARENT_THEME.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notificationFeed.title')}</Text>
        {hasUnread ? (
          <TouchableOpacity
            onPress={markAllRead}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.markAll}>{t('notificationFeed.markAll')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {/* List */}
      {loading ? null : items.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow notification={item} onPress={onRowPress} />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PARENT_THEME.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PARENT_THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: PARENT_THEME.cardBorder,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: PARENT_THEME.text,
  },
  markAll: {
    color: PARENT_THEME.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    width: 60,
  },
  sectionHeader: {
    backgroundColor: PARENT_THEME.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomColor: PARENT_THEME.cardBorder,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: PARENT_THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
