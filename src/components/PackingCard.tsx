import { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
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

/** JS weekday index (0 = Sunday) of a YYYY-MM-DD string, parsed at local noon. */
function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getDay();
}

interface Props {
  childId: string | null;
  /**
   * Initial state of the "tomorrow" section. The ציוד tab passes `true` (the
   * child came here to pack); the HQ dashboards leave it `false` so tomorrow
   * folds under a signpost row and today's tasks stay above the fold. When
   * today has nothing to pack, tomorrow opens regardless. Not persisted —
   * the card opens the same way every time (tomorrow-pack-inconsistency Q3/Q6).
   */
  defaultTomorrowExpanded?: boolean;
}

/**
 * Child-facing "what to pack" surface — the ONE packing surface, hosted by the
 * HQ dashboards (Mint/Gamer) and by the ציוד tab. Shows TODAY and TOMORROW,
 * each merging school-timetable gear with activities (clubs). Theme-aware,
 * body-double copy, the CHILD checks items off. NO progress counter — a
 * half-done list is never a miss (BUFF_VALUES Pillar 2).
 *
 * Today is the contained, dominant block (filled pill + accent rail);
 * tomorrow is a quieter, collapsible block whose header names the weekday
 * and, while collapsed, the first thing on tomorrow — content, never a count.
 * See docs/sessions/tomorrow-pack-inconsistency/SPEC.md §3 D2.
 */
export default function PackingCard({ childId, defaultTomorrowExpanded = false }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const T = useChildTheme();
  const today = todayISO();
  const tomorrow = isoShift(today, 1);
  const { activities, loading: activitiesLoading } = useActivities(childId);
  const { timetable, loading: timetableLoading } = useTimetable(childId);
  const loading = activitiesLoading || timetableLoading;

  // Both sources, one surface. School groups come first — on a school day that
  // gear is the main thing the child carries.
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
  // Re-read on every host focus: two cards (HQ + ציוד tab) can be mounted at
  // once and must converge on the same ticks without a relaunch.
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const keyFor = (iso: string) => (childId ? `buff_packing_${childId}_${iso}` : null);
  const idFor = (iso: string, g: PackingGroup, it: string) => `${iso}::${g.source}::${g.title}::${it}`;
  // Ticks made while a storage read is in flight, replayed on top of the
  // result so a fast tap right after mount/focus is never wiped by a stale read.
  const loadInFlight = useRef(false);
  const pendingDuringLoad = useRef<Map<string, boolean>>(new Map());

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const keys = [keyFor(today), keyFor(tomorrow)].filter(Boolean) as string[];
        if (keys.length === 0) return;
        loadInFlight.current = true;
        try {
          const pairs = await AsyncStorage.multiGet(keys);
          if (cancelled) return;
          const set = new Set<string>();
          for (const [, raw] of pairs) {
            if (raw) for (const id of JSON.parse(raw) as string[]) set.add(id);
          }
          for (const [id, on] of pendingDuringLoad.current) on ? set.add(id) : set.delete(id);
          setChecked(set);
        } catch { /* ignore */ } finally {
          if (!cancelled) { loadInFlight.current = false; pendingDuringLoad.current.clear(); }
        }
      })();
      return () => { cancelled = true; loadInFlight.current = false; pendingDuringLoad.current.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childId, today, tomorrow]),
  );

  const sectionIds = useCallback(
    (iso: string, groups: PackingGroup[]) => groups.flatMap((g) => g.items.map((it) => idFor(iso, g, it))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggle = useCallback((id: string, allIdsInSection: string[]) => {
    const iso = id.slice(0, 10);
    setChecked((prev) => {
      const next = new Set(prev);
      const turningOn = !next.has(id);
      turningOn ? next.add(id) : next.delete(id);
      if (loadInFlight.current) pendingDuringLoad.current.set(id, turningOn);
      const key = childId ? `buff_packing_${childId}_${iso}` : null;
      if (key) {
        const subset = [...next].filter((x) => x.startsWith(`${iso}::`));
        AsyncStorage.setItem(key, JSON.stringify(subset)).catch(() => {});
      }
      // Soft closure moment when this tick completes its whole section — the
      // same gated success haptic PhaseTaskCard uses. No confetti, no BUFFs.
      if (turningOn && allIdsInSection.every((x) => next.has(x))) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      return next;
    });
  }, [childId]);

  // ── Tomorrow collapse (ephemeral, per card instance) ────────────────────────
  // `null` = the child hasn't touched it; derive the default from the host
  // prop and from whether today has anything at all (data arrives async, so
  // the default is recomputed until the first tap).
  const [tomorrowToggled, setTomorrowToggled] = useState<boolean | null>(null);
  const tomorrowExpanded = tomorrowToggled ?? (defaultTomorrowExpanded || todayGroups.length === 0);
  const tomorrowLabel = t('childTasks.tomorrow', { day: t(`weekday.${weekdayIndex(tomorrow)}`) });

  if (!childId) return null;

  const nothing = !loading && todayGroups.length === 0 && tomorrowGroups.length === 0;

  const renderGroups = (iso: string, groups: PackingGroup[], ids: string[]) => groups.map((g, gi) => {
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
            <TouchableOpacity
              key={ii}
              style={styles.item}
              onPress={() => toggle(id, ids)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={it}
            >
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
  });

  /** Filled pill (today) or muted pill (tomorrow); turns success-styled when the section is all ticked. */
  const renderPill = (label: string, variant: 'primary' | 'muted', packed: boolean, testID: string) => {
    const bg = packed ? T.success + '22' : variant === 'primary' ? T.primary : T.muted;
    const fg = packed ? T.foreground : variant === 'primary' ? T.primaryForeground : T.mutedForeground;
    return (
      <View
        testID={testID}
        style={[styles.pill, { backgroundColor: bg }, packed && { borderWidth: 1, borderColor: T.success }]}
      >
        {packed && <Ionicons name="checkmark-circle" size={14} color={T.success} />}
        <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
      </View>
    );
  };

  const renderPacked = () => (
    <View style={styles.packedRow}>
      <Ionicons name="checkmark-circle" size={16} color={T.success} />
      <Text style={[styles.packed, { color: T.foreground }]}>{t('camp.allPacked')}</Text>
    </View>
  );

  const renderToday = () => {
    if (todayGroups.length === 0) return null;
    const ids = sectionIds(today, todayGroups);
    const packed = ids.length > 0 && ids.every((id) => checked.has(id));
    return (
      <View testID="packing-today" style={[styles.todayBlock, { borderStartColor: T.accent }]}>
        <View style={styles.sectionHead}>
          {renderPill(t('camp.today'), 'primary', packed, 'packing-today-pill')}
        </View>
        {renderGroups(today, todayGroups, ids)}
        {packed && renderPacked()}
      </View>
    );
  };

  const renderTomorrow = () => {
    if (tomorrowGroups.length === 0) return null;
    const ids = sectionIds(tomorrow, tomorrowGroups);
    const packed = ids.length > 0 && ids.every((id) => checked.has(id));
    const first = tomorrowGroups[0];
    const hint = `${first.title}${first.time ? ` · ${first.time}` : ''}`;
    return (
      <View testID="packing-tomorrow" style={[styles.tomorrowBlock, { borderTopColor: T.border }]}>
        <TouchableOpacity
          testID="packing-tomorrow-header"
          style={styles.tomorrowHead}
          onPress={() => setTomorrowToggled(!tomorrowExpanded)}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityState={{ expanded: tomorrowExpanded }}
          accessibilityLabel={tomorrowExpanded ? tomorrowLabel : `${tomorrowLabel}, ${hint}`}
        >
          {renderPill(tomorrowLabel, 'muted', packed, 'packing-tomorrow-pill')}
          {!tomorrowExpanded && (
            <Text testID="packing-tomorrow-hint" style={[styles.hint, { color: T.mutedForeground }]} numberOfLines={1}>
              {hint}
            </Text>
          )}
          <Ionicons
            name={tomorrowExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={T.mutedForeground}
          />
        </TouchableOpacity>
        {tomorrowExpanded && (
          <View testID="packing-tomorrow-body">
            {renderGroups(tomorrow, tomorrowGroups, ids)}
            {packed && renderPacked()}
          </View>
        )}
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

      {loading ? (
        <ActivityIndicator testID="packing-loading" color={T.primary} style={styles.loading} />
      ) : nothing ? (
        <Text style={[styles.empty, { color: T.mutedForeground }]}>{t('camp.empty')}</Text>
      ) : (
        <>
          {renderToday()}
          {renderTomorrow()}
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
  loading: { paddingVertical: 14 },
  empty: { fontSize: 13, paddingVertical: 10, textAlign: 'center' },
  // Today: a contained block — accent rail down the reading-start edge.
  todayBlock: { borderStartWidth: 3, paddingStart: 10, marginTop: 6 },
  // Tomorrow: quieter block below a divider; the header row is the toggle.
  tomorrowBlock: { borderTopWidth: 1, marginTop: 12, paddingTop: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  tomorrowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  hint: { flex: 1, fontSize: 12 },
  group: { borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  groupTitle: { fontSize: 13, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  itemLabel: { fontSize: 14, flex: 1 },
  packedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  packed: { fontSize: 14, fontWeight: '700' },
  addMine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, minHeight: 44 },
  addMineText: { fontSize: 13, fontWeight: '600' },
});
