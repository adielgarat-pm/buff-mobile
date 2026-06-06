/**
 * ThisWeekScreen — the calm "pull" destination for captured items.
 *
 * Grouped by time bucket (Today / This week / Later / No date). Past-dated items
 * auto-move to a collapsed Archive (recency filter). Notifications are opt-in per
 * item (a quiet bell toggle) — never default-on. No buddy face, no alarm colors.
 * Gated by FEATURE_PARENT_CAPTURE. See docs/sessions/parent-capture/.
 *
 * NOTE: all copy is DRAFT pending Adi's review (CLAUDE.md).
 */

import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { ParentItem } from '../../types/parentCapture';
import { useParentCapture } from '../../hooks/useParentCapture';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ThisWeekScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { grouped, archived, markDone, toggleReminder } = useParentCapture();
  const [showArchive, setShowArchive] = useState(false);

  const isEmpty = grouped.length === 0 && archived.length === 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: T.bg }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.h1, { color: T.text }]}>{t('thisWeek.title')}</Text>
        <TouchableOpacity
          style={[styles.captureBtn, { backgroundColor: T.accent }]}
          onPress={() => navigation.navigate('ParentCapture')}
        >
          <Text style={styles.captureBtnText}>{t('thisWeek.capture')}</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: T.text }]}>{t('thisWeek.emptyTitle')}</Text>
          <Text style={[styles.emptySub, { color: T.textMuted }]}>{t('thisWeek.emptySub')}</Text>
        </View>
      ) : null}

      {grouped.map(({ bucket, items }) => (
        <View key={bucket} style={styles.section}>
          <Text style={[styles.bucket, { color: T.textMuted }]}>
            {t(`thisWeek.bucket.${bucket}`)}
          </Text>
          {items.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              onToggleReminder={() => toggleReminder(it.id)}
              onDone={() => markDone(it.id)}
            />
          ))}
        </View>
      ))}

      {archived.length > 0 ? (
        <View style={styles.section}>
          <TouchableOpacity onPress={() => setShowArchive((s) => !s)}>
            <Text style={[styles.archiveToggle, { color: T.textMuted }]}>
              {t('thisWeek.archive', { count: archived.length })} {showArchive ? '▾' : '▸'}
            </Text>
          </TouchableOpacity>
          {showArchive
            ? archived.map((it) => (
                <ItemCard key={it.id} item={it} muted onDone={() => markDone(it.id)} />
              ))
            : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const ItemCard: React.FC<{
  item: ParentItem;
  muted?: boolean;
  onToggleReminder?: () => void;
  onDone: () => void;
}> = ({ item, muted, onToggleReminder, onDone }) => {
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: T.card, borderColor: T.cardBorder, opacity: muted ? 0.6 : 1 },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: T.text }]}>{item.title}</Text>
        <View style={[styles.chip, { borderColor: T.cardBorder }]}>
          <Text style={[styles.chipText, { color: T.textMuted }]}>
            {t(`capture.type.${item.type}`)}
          </Text>
        </View>
      </View>

      <View style={styles.metaLine}>
        {item.dueDate ? (
          <Text style={[styles.meta, { color: T.textMuted }]}>
            {item.dueDate}
            {item.dueTime ? ` · ${item.dueTime}` : ''}
          </Text>
        ) : null}
        {item.recurrence ? (
          <Text style={[styles.meta, { color: T.textMuted }]}>{item.recurrence}</Text>
        ) : null}
        {item.owner === 'child' && item.childName ? (
          <Text style={[styles.meta, { color: T.accent }]}>
            {t('thisWeek.handedTo', { name: item.childName })}
          </Text>
        ) : null}
      </View>

      {item.bring.length > 0 ? (
        <Text style={[styles.meta, { color: T.textMuted }]}>
          {t('capture.bring')}: {item.bring.join(', ')}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        {onToggleReminder ? (
          <TouchableOpacity onPress={onToggleReminder}>
            <Text style={[styles.action, { color: item.reminderOptIn ? T.accent : T.textMuted }]}>
              {item.reminderOptIn ? t('thisWeek.reminderOn') : t('thisWeek.reminderOff')}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onDone} style={styles.doneBtn}>
          <Text style={[styles.action, { color: T.success }]}>{t('thisWeek.done')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 52, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  h1: { fontSize: 22, fontWeight: '800' },
  captureBtn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  captureBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  section: { marginBottom: 18 },
  bucket: { fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', marginRight: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontSize: 11, fontWeight: '600' },
  metaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 2 },
  meta: { fontSize: 12 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 12 },
  action: { fontSize: 13, fontWeight: '600' },
  doneBtn: { marginLeft: 'auto' },
  archiveToggle: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
});
