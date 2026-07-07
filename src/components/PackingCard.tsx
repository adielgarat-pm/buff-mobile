import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChildTheme } from '../contexts/ThemeContext';
import { useActivities } from '../hooks/useActivities';
import { useTimetable } from '../hooks/useTimetable';
import { buildPackingGroups } from '../lib/activities/packing';
import { buildTimetableGroups } from '../lib/packing/fromTimetable';
import { TEMPLATE_BY_ID } from '../lib/packingTemplates/catalog';
import type { PackingGroup } from '../types/activities';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** `base` (YYYY-MM-DD) shifted by `days`, parsed at local noon (no TZ slip). */
function isoShift(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days, 12, 0, 0);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

/**
 * Child-facing "what to pack" surface (SPEC §"Child-facing packing").
 * Shows TODAY and TOMORROW in one card (D2), each merging the school timetable
 * gear (D1) with activities. Theme-aware (Mint/Gamer), body-double copy, the
 * CHILD checks items off. NO progress counter — a half-done list is never a
 * miss. Reached from a dashboard; does not touch ChildTabs.
 */
export default function PackingCard({ childId }: { childId: string | null }) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const T = useChildTheme();
  const today = todayISO();
  const tomorrow = isoShift(today, 1);
  const { activities } = useActivities(childId);
  const { timetable } = useTimetable(childId);

  // Both sources, one surface (D1). School groups come first — on a camp/school
  // day that gear is the main thing the child carries.
  const buildFor = useCallback(
    (iso: string): PackingGroup[] => (childId
      ? [...buildTimetableGroups(timetable, iso), ...buildPackingGroups(activities, childId, iso)]
      : []),
    [activities, timetable, childId],
  );
  const todayGroups = useMemo(() => buildFor(today), [buildFor, today]);
  const tomorrowGroups = useMemo(() => buildFor(tomorrow), [buildFor, tomorrow]);

  // ── Per-day, per-child check-off (ephemeral, AsyncStorage) ──────────────────
  // The item id embeds its date so today's "hat" and tomorrow's "hat" are
  // independent, and each day persists under its own key (so gear ticked
  // tonight is still ticked tomorrow, and each key resets when its day passes).
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const keyFor = (iso: string) => (childId ? `buff_packing_${childId}_${iso}` : null);
  const idFor = (iso: string, g: PackingGroup, it: string) => `${iso}::${g.source}::${g.title}::${it}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keys = [keyFor(today), keyFor(tomorrow)].filter(Boolean) as string[];
      if (keys.length === 0) return;
      try {
        const pairs = await AsyncStorage.multiGet(keys);
        if (cancelled) return;
        const set = new Set<string>();
        for (const [, raw] of pairs) {
          if (raw) for (const id of JSON.parse(raw) as string[]) set.add(id);
        }
        setChecked(set);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [childId, today, tomorrow]);

  const toggle = useCallback((id: string) => {
    const iso = id.slice(0, 10);
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      const key = childId ? `buff_packing_${childId}_${iso}` : null;
      if (key) {
        const subset = [...next].filter((x) => x.startsWith(`${iso}::`));
        AsyncStorage.setItem(key, JSON.stringify(subset)).catch(() => {});
      }
      return next;
    });
  }, [childId]);

  if (!childId) return null;

  const nothing = todayGroups.length === 0 && tomorrowGroups.length === 0;

  const renderSection = (iso: string, label: string, groups: PackingGroup[]) => {
    if (groups.length === 0) return null;
    const ids = groups.flatMap((g) => g.items.map((it) => idFor(iso, g, it)));
    const sectionPacked = ids.length > 0 && ids.every((id) => checked.has(id));
    return (
      <View key={iso}>
        <Text style={[styles.sectionLabel, { color: T.mutedForeground }]}>{label}</Text>
        {groups.map((g, gi) => {
          const icon = g.source === 'school'
            ? 'book-outline'
            : (g.templateId && TEMPLATE_BY_ID[g.templateId]?.icon) || 'sparkles-outline';
          return (
            <View key={`${g.source}-${g.title}-${gi}`} style={[styles.group, { borderColor: T.border }]}>
              <View style={styles.groupHead}>
                <Ionicons name={icon as any} size={16} color={T.mutedForeground} />
                <Text style={[styles.groupTitle, { color: T.foreground }]}>
                  {g.title}{g.time ? ` · ${g.time}` : ''}
                </Text>
              </View>
              {g.items.map((it, ii) => {
                const id = idFor(iso, g, it);
                const on = checked.has(id);
                return (
                  <TouchableOpacity key={ii} style={styles.item} onPress={() => toggle(id)} activeOpacity={0.7}>
                    <Ionicons
                      name={on ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={on ? T.success : T.mutedForeground}
                    />
                    <Text style={[styles.itemLabel, { color: on ? T.mutedForeground : T.foreground }]}>{it}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        {sectionPacked && <Text style={[styles.packed, { color: T.success }]}>{t('camp.allPacked')}</Text>}
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border, shadowColor: T.shadow }]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: T.foreground }]}>{t('camp.cardTitle')}</Text>
          <Text style={[styles.sub, { color: T.mutedForeground }]}>{t('camp.cardSub')}</Text>
        </View>
        <Ionicons name="bag-handle-outline" size={22} color={T.primary} />
      </View>

      {nothing ? (
        <Text style={[styles.empty, { color: T.mutedForeground }]}>{t('camp.empty')}</Text>
      ) : (
        <>
          {renderSection(today, t('camp.today'), todayGroups)}
          {renderSection(tomorrow, t('camp.tomorrow'), tomorrowGroups)}
        </>
      )}

      <TouchableOpacity style={styles.addMine} onPress={() => navigation.navigate('ChildAddActivity')} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color={T.primary} />
        <Text style={[styles.addMineText, { color: T.primary }]}>{t('camp.addMine')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 1 },
  empty: { fontSize: 13, paddingVertical: 10, textAlign: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 2 },
  group: { borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  groupTitle: { fontSize: 13, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  itemLabel: { fontSize: 14, flex: 1 },
  packed: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  addMine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, minHeight: 44 },
  addMineText: { fontSize: 13, fontWeight: '600' },
});
