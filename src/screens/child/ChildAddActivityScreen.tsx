import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Platform, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { supabase } from '../../integrations/supabase/client';
import { useChildTheme } from '../../contexts/ThemeContext';
import { useActivities } from '../../hooks/useActivities';
import { childAddOptions, isTeenAgeGroup } from '../../lib/activities/childMode';
import {
  ACTIVITY_WEEKDAYS, ACTIVITY_WEEKDAY_LABELS, type ActivityWeekday, type NewActivity,
} from '../../types/activities';

function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Child-authored activity (SPEC Feature C / D7). The child adds something for
 * themselves — a one-off event like a job interview. Teen → saved active;
 * Children Mode → proposed for a parent to approve. Reached from PackingCard;
 * does not touch ChildTabs.
 */
export default function ChildAddActivityScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { previewChildId } = useMode();
  const T = useChildTheme();
  const insets = useSafeAreaInsets();
  const lang = i18n.language;

  // In View-as-Child (shared device) the auth profile is the PARENT, so the
  // acting child comes from preview mode; on an own-device child it's the
  // child's own profile. Mirrors the dashboards' childId derivation.
  const childId = previewChildId ?? profile?.id ?? null;
  const [ageGroup, setAgeGroup] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!childId) { setAgeGroup(undefined); return; }
      if (profile?.id === childId) {
        setAgeGroup((profile as any)?.pro_settings?.age_group);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('pro_settings')
        .eq('id', childId)
        .maybeSingle();
      if (!cancelled) setAgeGroup((data as any)?.pro_settings?.age_group);
    })();
    return () => { cancelled = true; };
  }, [childId, profile]);

  const teen = isTeenAgeGroup(ageGroup);

  const { addActivity, saving } = useActivities(childId);

  const [title, setTitle] = useState('');
  const [scheduleKind, setScheduleKind] = useState<'recurring' | 'oneoff'>('oneoff');
  const [weekday, setWeekday] = useState<ActivityWeekday>('sunday');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [gear, setGear] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [sent, setSent] = useState(false);

  const canSave = title.trim().length > 0 && (scheduleKind === 'recurring' || !!date);

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    setGear((g) => [...g, v]);
    setNewItem('');
  };

  const onSave = async () => {
    if (!childId || !canSave) return;
    const payload: NewActivity = {
      childId,
      title: title.trim(),
      templateId: null,
      schedule: scheduleKind === 'recurring'
        ? { kind: 'recurring', weekday }
        : { kind: 'oneoff', date: toISODate(date ?? new Date()) },
      time,
      equipment: gear,
    };
    const ok = await addActivity(payload, childAddOptions(ageGroup));
    if (ok) {
      if (teen) navigation.goBack();
      else setSent(true);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: T.background }]}>
        <Ionicons name="paper-plane-outline" size={40} color={T.primary} />
        <Text style={[styles.sentText, { color: T.foreground }]}>{t('camp.proposed')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.saveBtn, { backgroundColor: T.primary }]}>
          <Text style={[styles.saveText, { color: T.primaryForeground }]}>{t('activities.back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.background }]}>
      <View style={[styles.header, { borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={T.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: T.foreground }]}>{t('camp.addTitle')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!teen && <Text style={[styles.note, { color: T.mutedForeground }]}>{t('camp.proposeNote')}</Text>}

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('activities.titlePlaceholder')}
          placeholderTextColor={T.mutedForeground}
          style={[styles.input, { color: T.foreground, borderColor: T.border, backgroundColor: T.card }]}
        />

        <View style={styles.toggleRow}>
          {(['oneoff', 'recurring'] as const).map((k) => {
            const on = scheduleKind === k;
            return (
              <TouchableOpacity
                key={k}
                style={[styles.toggle, { backgroundColor: on ? T.primary : 'transparent', borderColor: on ? T.primary : T.border }]}
                onPress={() => setScheduleKind(k)}
              >
                <Text style={[styles.toggleText, { color: on ? T.primaryForeground : T.mutedForeground }]}>
                  {k === 'oneoff' ? t('activities.scheduleOneoff') : t('activities.scheduleRecurring')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {scheduleKind === 'recurring' ? (
          <View style={styles.dayRow}>
            {ACTIVITY_WEEKDAYS.map((d) => {
              const on = d === weekday;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayPill, { backgroundColor: on ? T.primary : T.card, borderColor: on ? T.primary : T.border }]}
                  onPress={() => setWeekday(d)}
                >
                  <Text style={[styles.dayPillText, { color: on ? T.primaryForeground : T.foreground }]}>
                    {ACTIVITY_WEEKDAY_LABELS[d][lang.startsWith('he') ? 'he' : 'en']}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TouchableOpacity style={[styles.input, styles.btnLike, { borderColor: T.border, backgroundColor: T.card }]} onPress={() => setShowDate(true)}>
            <Text style={{ color: date ? T.foreground : T.mutedForeground }}>
              {date ? date.toLocaleDateString(lang) : t('activities.pickDate')}
            </Text>
          </TouchableOpacity>
        )}
        {showDate && (
          <DateTimePicker
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            value={date ?? new Date()}
            onChange={(e: DateTimePickerEvent, sel?: Date) => {
              if (Platform.OS === 'android') setShowDate(false);
              if (e.type === 'set' && sel) setDate(sel);
              if (e.type === 'dismissed') setShowDate(false);
            }}
          />
        )}

        <TouchableOpacity style={[styles.input, styles.btnLike, { borderColor: T.border, backgroundColor: T.card }]} onPress={() => setShowTime(true)}>
          <Text style={{ color: time ? T.foreground : T.mutedForeground }}>{time ?? t('activities.timeOptional')}</Text>
        </TouchableOpacity>
        {showTime && (
          <DateTimePicker
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            value={new Date()}
            onChange={(e: DateTimePickerEvent, sel?: Date) => {
              if (Platform.OS === 'android') setShowTime(false);
              if (e.type === 'set' && sel) setTime(toHHMM(sel));
              if (e.type === 'dismissed') setShowTime(false);
            }}
          />
        )}

        <Text style={[styles.gearLabel, { color: T.mutedForeground }]}>{t('activities.step.gear')}</Text>
        {gear.map((g, i) => (
          <View key={i} style={styles.gearRow}>
            <Ionicons name="ellipse" size={8} color={T.primary} />
            <Text style={[styles.gearItem, { color: T.foreground }]}>{g}</Text>
            <TouchableOpacity onPress={() => setGear((arr) => arr.filter((_, j) => j !== i))}>
              <Ionicons name="close" size={18} color={T.mutedForeground} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addItemRow}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            placeholder={t('activities.itemPlaceholder')}
            placeholderTextColor={T.mutedForeground}
            style={[styles.input, { flex: 1, color: T.foreground, borderColor: T.border, backgroundColor: T.card }]}
          />
          <TouchableOpacity onPress={addItem} style={styles.addItemBtn}>
            <Ionicons name="add" size={22} color={T.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.foot, { borderTopColor: T.border, paddingBottom: Math.max(12, insets.bottom) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: canSave ? T.primary : T.border }]}
          disabled={!canSave || saving}
          onPress={onSave}
        >
          {saving
            ? <ActivityIndicator color={T.primaryForeground} />
            : <Text style={[styles.saveText, { color: T.primaryForeground }]}>{t('activities.save')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 14 },
  sentText: { fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  body: { padding: 16, gap: 10 },
  note: { fontSize: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  btnLike: { justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  toggle: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  toggleText: { fontSize: 13, fontWeight: '600' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayPill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  dayPillText: { fontSize: 12, fontWeight: '600' },
  gearLabel: { fontSize: 12, marginTop: 14 },
  gearRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  gearItem: { flex: 1, fontSize: 14 },
  addItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  addItemBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  foot: { padding: 12, borderTopWidth: 1 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', paddingHorizontal: 24 },
  saveText: { fontSize: 15, fontWeight: '700' },
});
