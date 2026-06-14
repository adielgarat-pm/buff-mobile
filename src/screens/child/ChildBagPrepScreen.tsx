/**
 * ChildBagPrepScreen — "My Gear" / pack-your-backpack (child side)
 *
 * Closes the loop: parent enters equipment per lesson (TimetableScreen) →
 * child sees what to pack for tomorrow here.
 *
 * Resolves tomorrow's weekday, reads timetable[tomorrow], and renders the
 * per-lesson equipment as a checkable list. Checked state persists locally
 * per child + target date (AsyncStorage) and resets naturally each day.
 *
 * Body-double voice only — no rewards / counts / "you forgot" framing
 * (BUFF_VALUES Pillar 1 & 2). The reserved *Credits / bonus / points i18n
 * keys are intentionally NOT used.
 *
 * Sources are modelled as PackSource[] so future equipment sources
 * (activities, camp lists — owned by another stream) can be appended later.
 * Only the school-timetable source is implemented here.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useChildTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useTimetable } from '../../hooks/useTimetable';
import type { WeekDay, PeriodInfo } from '../../types/timetable';

// ─── Tomorrow resolution ────────────────────────────────────────────────────
// JS getDay(): 0 = Sunday … 6 = Saturday. Saturday has no school weekday.
const WEEKDAY_BY_JS: (WeekDay | undefined)[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', undefined,
];

// ─── Source model (extensible) ──────────────────────────────────────────────
interface PackItem {
  id:       string;   // stable per item — used as the AsyncStorage check key
  label:    string;   // what to pack, e.g. "art folder"
  subject?: string;   // the lesson it came from (school source)
}
interface PackSource {
  key:   'school';    // future: 'activity' | 'camp' (other stream)
  items: PackItem[];
}

/** Split a comma-separated equipment string into individual items. */
function splitEquipment(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/[,،]/).map(s => s.trim()).filter(Boolean);
}

/** Build the school-timetable source from tomorrow's periods. */
function buildSchoolSource(periods: PeriodInfo[]): PackSource {
  const items: PackItem[] = [];
  periods.forEach((p, lessonIdx) => {
    splitEquipment(p.equipment).forEach((label, itemIdx) => {
      items.push({ id: `school:${lessonIdx}:${itemIdx}:${label}`, label, subject: p.subject });
    });
  });
  return { key: 'school', items };
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function ChildBagPrepScreen() {
  const { t }       = useTranslation();
  const T           = useChildTheme();
  const { profile } = useAuth();
  const { previewChildId } = useMode();

  const childId = previewChildId ?? profile?.id ?? null;
  const { timetable, loading } = useTimetable(childId);

  // Resolve tomorrow once per mount.
  const tomorrowDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; }, []);
  const tomorrow     = WEEKDAY_BY_JS[tomorrowDate.getDay()];
  const tomorrowPeriods = tomorrow ? (timetable[tomorrow] ?? []) : [];

  const sources  = useMemo<PackSource[]>(
    () => [buildSchoolSource(tomorrowPeriods)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(tomorrowPeriods)],
  );
  const allItems = useMemo(() => sources.flatMap(s => s.items), [sources]);
  const subjects = useMemo(
    () => Array.from(new Set(tomorrowPeriods.map(p => p.subject).filter(Boolean))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(tomorrowPeriods)],
  );

  // ── Persisted "packed" state — local per child + target date ───────────────
  const storageKey = childId ? `bagPrep:${childId}:${ymd(tomorrowDate)}` : null;
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    if (!storageKey) { setChecked(new Set()); return; }
    AsyncStorage.getItem(storageKey).then(raw => {
      if (cancelled) return;
      try { setChecked(new Set(raw ? (JSON.parse(raw) as string[]) : [])); }
      catch { setChecked(new Set()); }
    });
    return () => { cancelled = true; };
  }, [storageKey]);

  const persist = useCallback((next: Set<string>) => {
    if (storageKey) AsyncStorage.setItem(storageKey, JSON.stringify([...next])).catch(() => {});
  }, [storageKey]);

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      persist(next);
      return next;
    });
  }, [persist]);

  const markAll = useCallback(() => {
    setChecked(() => {
      const next = new Set(allItems.map(i => i.id));
      persist(next);
      return next;
    });
  }, [allItems, persist]);

  const checkedCount = allItems.filter(i => checked.has(i.id)).length;
  const allReady     = allItems.length > 0 && checkedCount === allItems.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: T.background }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  // No school tomorrow (weekend or empty timetable) → nothing to pack.
  if (!tomorrow || tomorrowPeriods.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: T.background }]}>
        <Text style={[styles.title, { color: T.foreground }]}>{t('bagPrep.title')}</Text>
        <View style={styles.centered}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={[styles.emptyTitle, { color: T.foreground }]}>{t('bagPrep.tomorrowOff')}</Text>
          <Text style={[styles.emptySub, { color: T.mutedForeground }]}>{t('bagPrep.noNeedToPack')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: T.background }]}>
      <Text style={[styles.title, { color: T.foreground }]}>{t('bagPrep.title')}</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Tomorrow's lessons */}
        {subjects.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: T.mutedForeground }]}>
              {t('bagPrep.tomorrowLessons')}
            </Text>
            <View style={styles.chipRow}>
              {subjects.map((s, i) => (
                <View key={i} style={[styles.chip, { backgroundColor: T.muted, borderColor: T.border }]}>
                  <Text style={[styles.chipText, { color: T.foreground }]}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Ready banner */}
        {allReady && (
          <View style={[styles.readyBanner, { backgroundColor: T.success + '22', borderColor: T.success }]}>
            <Text style={[styles.readyText, { color: T.foreground }]}>{t('bagPrep.bagReady')}</Text>
          </View>
        )}

        {/* Equipment checklist */}
        <Text style={[styles.sectionLabel, { color: T.mutedForeground }]}>
          {t('bagPrep.equipmentNeeded')}
        </Text>

        {allItems.length === 0 ? (
          <Text style={[styles.emptySub, { color: T.mutedForeground, paddingHorizontal: 4 }]}>
            {t('gear.noSpecialEquipment')}
          </Text>
        ) : (
          allItems.map(item => {
            const isChecked = checked.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}
                style={[styles.itemRow, { backgroundColor: T.card, borderColor: isChecked ? T.success : T.border }]}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: isChecked ? T.success : T.border, backgroundColor: isChecked ? T.success : 'transparent' },
                ]}>
                  {isChecked && <Ionicons name="checkmark" size={16} color={T.primaryForeground} />}
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={[
                    styles.itemLabel,
                    { color: T.foreground },
                    isChecked && styles.itemLabelChecked,
                  ]}>
                    {item.label}
                  </Text>
                  {!!item.subject && (
                    <Text style={[styles.itemSubject, { color: T.mutedForeground }]}>{item.subject}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      {allItems.length > 0 && (
        <View style={[styles.footer, { borderTopColor: T.border }]}>
          <Text style={[styles.progress, { color: T.mutedForeground }]}>
            {checkedCount}/{allItems.length} {t('bagPrep.itemsReady')}
          </Text>
          <TouchableOpacity
            onPress={markAll}
            disabled={allReady}
            style={[styles.markAllBtn, { backgroundColor: allReady ? T.muted : T.primary }]}
          >
            <Text style={[styles.markAllText, { color: allReady ? T.mutedForeground : T.primaryForeground }]}>
              {allReady ? t('bagPrep.readyForTomorrow') : t('bagPrep.checkAllItems')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, paddingTop: 56 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title:       { fontSize: 22, fontWeight: '800', paddingHorizontal: 16, marginBottom: 8 },

  scroll:      { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },

  sectionLabel:{ fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 4 },

  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText:    { fontSize: 13, fontWeight: '600' },

  readyBanner: { padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 12, alignItems: 'center' },
  readyText:   { fontSize: 15, fontWeight: '700' },

  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  checkbox:    { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemTextWrap:{ flex: 1 },
  itemLabel:   { fontSize: 16, fontWeight: '600' },
  itemLabelChecked: { textDecorationLine: 'line-through', opacity: 0.6 },
  itemSubject: { fontSize: 12, marginTop: 2 },

  bigEmoji:    { fontSize: 56 },
  emptyTitle:  { fontSize: 18, fontWeight: '700' },
  emptySub:    { fontSize: 14, textAlign: 'center' },

  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1 },
  progress:    { fontSize: 14, fontWeight: '600' },
  markAllBtn:  { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24 },
  markAllText: { fontSize: 15, fontWeight: '700' },
});
