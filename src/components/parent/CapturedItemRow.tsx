/**
 * CapturedItemRow — one row in the capture confirm card.
 *
 * Lets the parent set ownership (me / a child), see confidence + what's missing,
 * and discard. No alarm colors (Pillar 2). Part of the gated parent-capture
 * feature — see docs/sessions/parent-capture/.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import type {
  CaptureConfidence,
  FamilyChild,
  ParsedItem,
} from '../../types/parentCapture';

export interface ReviewEntry {
  parsed: ParsedItem;
  owner: 'parent' | 'child';
  childId: string | null;
  discarded: boolean;
}

interface Props {
  entry: ReviewEntry;
  children: FamilyChild[];
  onChange: (changes: Partial<Omit<ReviewEntry, 'parsed'>>) => void;
}

const CONFIDENCE_COLOR: Record<CaptureConfidence, string> = {
  high: T.success,
  medium: T.gold,
  low: T.textMuted,
};

export const CapturedItemRow: React.FC<Props> = ({ entry, children, onChange }) => {
  const { t } = useTranslation();
  const { parsed, owner, childId, discarded } = entry;

  if (discarded) {
    return (
      <View style={[styles.row, styles.discardedRow, { borderColor: T.cardBorder }]}>
        <Text style={[styles.discardedText, { color: T.textMuted }]} numberOfLines={1}>
          {parsed.title}
        </Text>
        <TouchableOpacity onPress={() => onChange({ discarded: false })}>
          <Text style={[styles.link, { color: T.accent }]}>{t('capture.undo')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.row, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <View style={styles.headerLine}>
        <View style={[styles.dot, { backgroundColor: CONFIDENCE_COLOR[parsed.confidence] }]} />
        <Text style={[styles.title, { color: T.text }]}>{parsed.title}</Text>
      </View>

      <View style={styles.metaLine}>
        <View style={[styles.chip, { borderColor: T.cardBorder }]}>
          <Text style={[styles.chipText, { color: T.textMuted }]}>
            {t(`capture.type.${parsed.type}`)}
          </Text>
        </View>
        {parsed.dueDate ? (
          <Text style={[styles.meta, { color: T.textMuted }]}>
            {parsed.dueDate}
            {parsed.dueTime ? ` · ${parsed.dueTime}` : ''}
          </Text>
        ) : null}
        {parsed.recurrence ? (
          <Text style={[styles.meta, { color: T.textMuted }]}>{parsed.recurrence}</Text>
        ) : null}
      </View>

      {parsed.bring.length > 0 ? (
        <Text style={[styles.meta, { color: T.textMuted }]}>
          {t('capture.bring')}: {parsed.bring.join(', ')}
        </Text>
      ) : null}

      {parsed.missing ? (
        <Text style={[styles.missing, { color: T.gold }]}>
          {t('capture.needsYou')}: {parsed.missing}
        </Text>
      ) : null}

      {/* Owner picker: me / a child */}
      <View style={styles.ownerRow}>
        <OwnerPill
          label={t('capture.owner.me')}
          active={owner === 'parent'}
          onPress={() => onChange({ owner: 'parent', childId: null })}
        />
        {children.map((c) => (
          <OwnerPill
            key={c.id}
            label={c.displayName}
            active={owner === 'child' && childId === c.id}
            onPress={() => onChange({ owner: 'child', childId: c.id })}
          />
        ))}
        <TouchableOpacity style={styles.discardBtn} onPress={() => onChange({ discarded: true })}>
          <Text style={[styles.link, { color: T.textMuted }]}>{t('capture.discard')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const OwnerPill: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.pill,
      { borderColor: active ? T.accent : T.cardBorder, backgroundColor: active ? T.accent : 'transparent' },
    ]}
  >
    <Text style={[styles.pillText, { color: active ? '#fff' : T.textMuted }]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  discardedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderStyle: 'dashed',
  },
  discardedText: { flex: 1, fontSize: 14, textDecorationLine: 'line-through', marginRight: 10 },
  headerLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  metaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  chipText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12 },
  missing: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  ownerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 12, fontWeight: '600', maxWidth: 120 },
  discardBtn: { marginLeft: 'auto', paddingVertical: 6 },
  link: { fontSize: 12, fontWeight: '600' },
});
