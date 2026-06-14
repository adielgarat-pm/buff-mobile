import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChildTheme } from '../contexts/ThemeContext';
import { useActivities } from '../hooks/useActivities';
import { buildPackingGroups } from '../lib/activities/packing';
import { TEMPLATE_BY_ID } from '../lib/packingTemplates/catalog';
import type { RootStackParamList } from '../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Child-facing "what to pack today" surface (SPEC §"Child-facing packing").
 * Theme-aware (Mint/Gamer), body-double copy, the CHILD checks items off.
 * NO progress counter — a half-done list is never a miss. Reached from a
 * dashboard; does not touch ChildTabs.
 */
export default function PackingCard({ childId }: { childId: string | null }) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const T = useChildTheme();
  const date = todayISO();
  const { activities } = useActivities(childId);

  const groups = useMemo(
    () => (childId ? buildPackingGroups(activities, childId, date) : []),
    [activities, childId, date],
  );

  // ── Per-day, per-child check-off state (ephemeral, AsyncStorage) ────────────
  const storeKey = childId ? `buff_packing_${childId}_${date}` : null;
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!storeKey) return;
      try {
        const raw = await AsyncStorage.getItem(storeKey);
        if (!cancelled && raw) setChecked(new Set(JSON.parse(raw) as string[]));
        else if (!cancelled) setChecked(new Set());
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [storeKey]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (storeKey) AsyncStorage.setItem(storeKey, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, [storeKey]);

  if (!childId) return null;

  const allItems = groups.flatMap((g) => g.items.map((it) => `${g.title}::${it}`));
  const allPacked = allItems.length > 0 && allItems.every((id) => checked.has(id));

  return (
    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border, shadowColor: T.shadow }]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: T.foreground }]}>{t('camp.cardTitle')}</Text>
          <Text style={[styles.sub, { color: T.mutedForeground }]}>{t('camp.cardSub')}</Text>
        </View>
        <Ionicons name="bag-handle-outline" size={22} color={T.primary} />
      </View>

      {groups.length === 0 ? (
        <Text style={[styles.empty, { color: T.mutedForeground }]}>{t('camp.empty')}</Text>
      ) : (
        groups.map((g, gi) => {
          const icon = (g.templateId && TEMPLATE_BY_ID[g.templateId]?.icon) || 'sparkles-outline';
          return (
            <View key={`${g.title}-${gi}`} style={[styles.group, { borderColor: T.border }]}>
              <View style={styles.groupHead}>
                <Ionicons name={icon as any} size={16} color={T.mutedForeground} />
                <Text style={[styles.groupTitle, { color: T.foreground }]}>
                  {g.title}{g.time ? ` · ${g.time}` : ''}
                </Text>
              </View>
              {g.items.map((it, ii) => {
                const id = `${g.title}::${it}`;
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
        })
      )}

      {allPacked && <Text style={[styles.packed, { color: T.success }]}>{t('camp.allPacked')}</Text>}

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
  group: { borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  groupTitle: { fontSize: 13, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  itemLabel: { fontSize: 14, flex: 1 },
  packed: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  addMine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, minHeight: 44 },
  addMineText: { fontSize: 13, fontWeight: '600' },
});
