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

import React, { useCallback, useMemo } from 'react';
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
import { isVisibleInFeed } from '../../lib/notificationClass';
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

  // The bell is a "what's new" queue, not an archive: show only items that
  // are still unread AND still relevant (ACTION persists; INFO ages out).
  // Single shared predicate with the badge — see lib/notificationClass.
  const visibleItems = useMemo(() => items.filter((n) => isVisibleInFeed(n)), [items]);

  const sections = useMemo(() => {
    const buckets = bucketize(visibleItems);
    return buckets.map((b) => ({
      title: t(BUCKET_LABEL_KEY[b.bucket]),
      data: b.items,
    }));
  }, [visibleItems, t]);

  const onRowPress = useCallback(
    (notification: FeedNotification) => {
      markRead(notification.id);
      const action = resolveRouteAction({
        type: notification.type,
        entity_id: notification.entity_id ?? undefined,
        child_id: notification.child_id ?? undefined,
        family_id: notification.family_id,
      });
      // Navigate into the parent tab navigator. ParentApp sits below this modal
      // in the root stack, so navigate() pops the modal and lands on the tab.
      // Only ParentRewards takes a param today (childId → pre-select the child
      // who made the redemption request); the others just switch tab.
      switch (action.kind) {
        case 'parent_rewards':
          navigation.navigate('ParentApp', {
            screen: 'ParentRewards',
            params: { childId: action.childId },
          });
          break;
        case 'parent_tasks':
          navigation.navigate('ParentApp', { screen: 'ParentTasks' });
          break;
        case 'parent_dashboard':
          navigation.navigate('ParentApp', { screen: 'ParentDashboard' });
          break;
        case 'noop':
        default:
          navigation.goBack();
          break;
      }
    },
    [markRead, navigation],
  );

  // Anything visible is by definition unread, so "is there something to
  // clear?" == "are there visible rows?". Drives the "Clear all" affordance.
  const hasUnread = visibleItems.length > 0;

  // NOTE: opening the feed deliberately does NOT mark anything read. The bell
  // is a queue you clear by acting (tapping a row, or "Clear all") — a glance
  // must not empty it. (Removed the old auto-mark-on-open effect — it fought
  // the unread-only model: it would empty the feed the instant it opened.)

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
      {loading ? null : visibleItems.length === 0 ? (
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
