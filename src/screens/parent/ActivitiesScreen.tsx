import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  SafeAreaView, Modal, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
// Platform-split date/time controls: native OS pickers on Android/iOS, browser
// <input type="date"> / <input type="time"> on web — a direct DateTimePicker
// import renders NOTHING on web (dead controls).
import DateField from '../../components/DateField';
import TimeField from '../../components/TimeField';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { PARENT_THEME as T } from '../../theme';
import { pickLang } from '../../lib/i18nString';
import { useActivities } from '../../hooks/useActivities';
import {
  ACTIVITY_WEEKDAYS, ACTIVITY_WEEKDAY_LABELS,
  type ActivityWeekday, type Activity, type NewActivity,
} from '../../types/activities';
import { PACKING_TEMPLATE_LIBRARY, TEMPLATE_BY_ID } from '../../lib/packingTemplates/catalog';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList, 'Activities'>;

interface ChildRow { id: string; displayName: string; avatar: string; }

interface GearItem { key: string; label: string; checked: boolean; }

const ICON_FALLBACK = 'sparkles-outline' as const;

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export default function ActivitiesScreen() {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { familyId } = useAuth();
  const { isRTL, rowDirection, textAlign } = useRTLStyles();
  const lang = i18n.language;

  const [children, setChildren] = useState<ChildRow[]>([]);
  const [childLoading, setChildLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  // ── Children roster (mirrors ManageChildrenScreen) ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!familyId) { setChildren([]); setChildLoading(false); return; }
      setChildLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar, created_at')
        .eq('family_id', familyId)
        .eq('role', 'child')
        .eq('is_deleted', false)   // exclude soft-deleted children (mirror ManageChildrenScreen)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) { console.warn('[Activities] children fetch:', error.message); setChildren([]); }
      else {
        const rows = (data ?? []).map((c) => ({
          id: c.id, displayName: c.display_name ?? '—', avatar: c.avatar ?? '🚀',
        }));
        setChildren(rows);
        setSelectedChild((prev) => prev ?? rows[0]?.id ?? null);
      }
      setChildLoading(false);
    })();
    return () => { cancelled = true; };
  }, [familyId]);

  const { activities, loading, addActivity, updateActivity, archiveActivity, approveActivity } = useActivities(selectedChild);
  const visible = useMemo(() => activities.filter((a) => a.status === 'active'), [activities]);
  const proposed = useMemo(() => activities.filter((a) => a.status === 'proposed'), [activities]);

  // ── Add / edit modal state ──────────────────────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [step, setStep] = useState<'template' | 'form'>('template');
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [scheduleKind, setScheduleKind] = useState<'recurring' | 'oneoff'>('recurring');
  const [weekday, setWeekday] = useState<ActivityWeekday>('sunday');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [gear, setGear] = useState<GearItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [savingForm, setSavingForm] = useState(false);

  const resetForm = () => {
    setEditing(null); setStep('template'); setTitle(''); setTemplateId(null);
    setScheduleKind('recurring'); setWeekday('sunday'); setDate(null); setTime(null);
    setGear([]); setNewItem('');
  };

  const openAdd = () => { resetForm(); setEditorOpen(true); };

  const openEdit = (a: Activity) => {
    setEditing(a);
    setTitle(a.title);
    setTemplateId(a.templateId);
    setScheduleKind(a.schedule.kind);
    if (a.schedule.kind === 'recurring') setWeekday(a.schedule.weekdays[0] ?? 'sunday'); // Phase 1 bridge — multi-select in Phase 2
    else setDate(new Date(`${a.schedule.date}T12:00:00`));
    setTime(a.time);
    setGear(a.equipment.map((label, i) => ({ key: `e${i}`, label, checked: true })));
    setStep('form');
    setEditorOpen(true);
  };

  const pickTemplate = (id: string | null) => {
    setTemplateId(id);
    if (id) {
      const tpl = TEMPLATE_BY_ID[id];
      setTitle(pickLang(tpl.title, lang));
      setScheduleKind(tpl.defaultSchedule);
      setGear(tpl.items.map((it) => ({ key: it.id, label: pickLang(it.label, lang), checked: it.defaultApplies })));
    } else {
      setTitle(''); setGear([]);
    }
    setStep('form');
  };

  const addGearItem = () => {
    const label = newItem.trim();
    if (!label) return;
    setGear((g) => [...g, { key: `n${g.length}-${label}`, label, checked: true }]);
    setNewItem('');
  };

  const buildSchedule = (): NewActivity['schedule'] =>
    scheduleKind === 'recurring'
      ? { kind: 'recurring', weekdays: [weekday] } // Phase 1 bridge — multi-select in Phase 2
      : { kind: 'oneoff', date: toISODate(date ?? new Date()) };

  const canSave = title.trim().length > 0 && (scheduleKind === 'recurring' || !!date);

  const onSave = async () => {
    if (!selectedChild || !canSave) return;
    setSavingForm(true);
    const equipment = gear.filter((g) => g.checked).map((g) => g.label);
    const payload: NewActivity = {
      childId: selectedChild,
      title: title.trim(),
      templateId,
      schedule: buildSchedule(),
      time,
      equipment,
    };
    const ok = editing
      ? await updateActivity(editing.id, payload)
      : await addActivity(payload);
    setSavingForm(false);
    if (ok) { setEditorOpen(false); resetForm(); }
  };

  const onDelete = async () => {
    if (!editing) return;
    const ok = await archiveActivity(editing.id);
    if (ok) { setEditorOpen(false); resetForm(); }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const scheduleLabel = (a: Activity): string => {
    if (a.schedule.kind === 'recurring') {
      // Phase 1 bridge — shows the first day only; full multi-day label in Phase 2.
      const first = a.schedule.weekdays[0] ?? 'sunday';
      const day = ACTIVITY_WEEKDAY_LABELS[first][lang.startsWith('he') ? 'he' : 'en'];
      return `${t('activities.recurringEvery', { day })}${a.time ? ` · ${a.time}` : ''}`;
    }
    return `${a.schedule.date}${a.time ? ` · ${a.time}` : ''}`;
  };
  const iconFor = (a: Activity) =>
    (a.templateId && TEMPLATE_BY_ID[a.templateId]?.icon) || ICON_FALLBACK;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: rowDirection, borderBottomColor: T.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={[styles.chevron, { color: T.text }]}>{isRTL ? '›' : '‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: T.text }]}>{t('activities.pageTitle')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: T.textMuted, textAlign }]}>{t('activities.subtitle')}</Text>

        {/* Child chips */}
        {!childLoading && children.length > 1 && (
          <View style={[styles.chipRow, { flexDirection: rowDirection }]}>
            {children.map((c) => {
              const on = c.id === selectedChild;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedChild(c.id)}
                  style={[styles.chip, { borderColor: on ? T.accent : T.cardBorder, backgroundColor: on ? T.accent : 'transparent' }]}
                >
                  <Text style={[styles.chipText, { color: on ? '#fff' : T.textMuted }]}>{c.avatar} {c.displayName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Child-proposed activities awaiting approval (Feature C) */}
        {proposed.length > 0 && (
          <View style={styles.proposedWrap}>
            <Text style={[styles.proposedHead, { color: T.textMuted, textAlign }]}>{t('activities.proposedSection')}</Text>
            {proposed.map((a) => (
              <View key={a.id} style={[styles.proposedCard, { backgroundColor: T.card, borderColor: T.accent }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: T.text, textAlign }]}>{a.title}</Text>
                  <Text style={[styles.cardWhen, { color: T.textMuted, textAlign }]}>{scheduleLabel(a)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.approveBtn, { backgroundColor: T.accent }]}
                  onPress={() => approveActivity(a.id)}
                >
                  <Text style={styles.approveText}>{t('activities.approve')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {(loading || childLoading) ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={T.accent} size="large" /></View>
        ) : visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={40} color={T.textMuted} />
            <Text style={[styles.emptyTitle, { color: T.text }]}>{t('activities.empty')}</Text>
            <Text style={[styles.emptyHint, { color: T.textMuted }]}>{t('activities.emptyHint')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}
                onPress={() => openEdit(a)}
                activeOpacity={0.7}
              >
                <View style={[styles.cardHead, { flexDirection: rowDirection }]}>
                  <Ionicons name={iconFor(a) as any} size={18} color={T.accent} />
                  <Text style={[styles.cardTitle, { color: T.text, textAlign }]}>{a.title}</Text>
                  <Text style={[styles.chevron, { color: T.textMuted }]}>{isRTL ? '‹' : '›'}</Text>
                </View>
                <Text style={[styles.cardWhen, { color: T.textMuted, textAlign }]}>{scheduleLabel(a)}</Text>
                {a.equipment.length > 0 && (
                  <View style={[styles.gearChips, { flexDirection: rowDirection }]}>
                    {a.equipment.map((e, i) => (
                      <View key={i} style={[styles.gearChip, { backgroundColor: T.bg, borderColor: T.cardBorder }]}>
                        <Text style={[styles.gearChipText, { color: T.text }]}>{e}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Add */}
        {!childLoading && selectedChild && (
          <TouchableOpacity style={[styles.addBtn, { borderColor: T.accent }]} onPress={openAdd}>
            <Text style={[styles.addBtnText, { color: T.accent }]}>{t('activities.add')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add / edit modal */}
      <Modal visible={editorOpen} animationType="slide" transparent onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: T.bg }]}>
            <View style={[styles.sheetHead, { flexDirection: rowDirection, borderBottomColor: T.cardBorder }]}>
              <TouchableOpacity
                onPress={() => (step === 'form' && !editing ? setStep('template') : setEditorOpen(false))}
                style={styles.iconBtn}
              >
                <Text style={[styles.chevron, { color: T.text }]}>{isRTL ? '›' : '‹'}</Text>
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: T.text }]}>
                {step === 'template' ? t('activities.step.template') : t('activities.step.gear')}
              </Text>
              <Text style={[styles.stepDots, { color: T.textMuted }]}>{step === 'template' ? '1/2' : '2/2'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
              {step === 'template' ? (
                <>
                  <TouchableOpacity
                    style={[styles.tplRow, { borderColor: T.accent, borderWidth: 2 }]}
                    onPress={() => pickTemplate(null)}
                  >
                    <Ionicons name="create-outline" size={20} color={T.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tplTitle, { color: T.text, textAlign }]}>{t('activities.template.blank')}</Text>
                      <Text style={[styles.tplHint, { color: T.textMuted, textAlign }]}>{t('activities.template.blankHint')}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.sectionLabel, { color: T.textMuted, textAlign }]}>{t('activities.section.summer')}</Text>
                  {PACKING_TEMPLATE_LIBRARY.map((tpl) => (
                    <TouchableOpacity
                      key={tpl.id}
                      style={[styles.tplRow, { borderColor: T.cardBorder }]}
                      onPress={() => pickTemplate(tpl.id)}
                    >
                      <Ionicons name={tpl.icon as any} size={20} color={T.textMuted} />
                      <Text style={[styles.tplTitle, { color: T.text, flex: 1, textAlign }]}>{pickLang(tpl.title, lang)}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  {/* Title */}
                  <Text style={[styles.fieldLabel, { color: T.textMuted, textAlign }]}>{t('activities.titleLabel')}</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('activities.titlePlaceholder')}
                    placeholderTextColor={T.textMuted}
                    style={[styles.input, { color: T.text, borderColor: T.cardBorder, backgroundColor: T.card, textAlign }]}
                  />

                  {/* Schedule toggle */}
                  <View style={[styles.toggleRow, { flexDirection: rowDirection }]}>
                    {(['oneoff', 'recurring'] as const).map((k) => {
                      const on = scheduleKind === k;
                      return (
                        <TouchableOpacity
                          key={k}
                          style={[styles.toggle, { backgroundColor: on ? T.accent : 'transparent', borderColor: on ? T.accent : T.cardBorder }]}
                          onPress={() => setScheduleKind(k)}
                        >
                          <Text style={[styles.toggleText, { color: on ? '#fff' : T.textMuted }]}>
                            {k === 'oneoff' ? t('activities.scheduleOneoff') : t('activities.scheduleRecurring')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {scheduleKind === 'recurring' ? (
                    <View style={[styles.dayRow, { flexDirection: rowDirection }]}>
                      {ACTIVITY_WEEKDAYS.map((d) => {
                        const on = d === weekday;
                        return (
                          <TouchableOpacity
                            key={d}
                            style={[styles.dayPill, { backgroundColor: on ? T.accent : T.card, borderColor: on ? T.accent : T.cardBorder }]}
                            onPress={() => setWeekday(d)}
                          >
                            <Text style={[styles.dayPillText, { color: on ? '#fff' : T.text }]}>
                              {ACTIVITY_WEEKDAY_LABELS[d][lang.startsWith('he') ? 'he' : 'en']}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <DateField
                      value={date}
                      onChange={setDate}
                      placeholder={t('activities.pickDate')}
                      locale={lang}
                      style={[styles.input, styles.dateBtn, { borderColor: T.cardBorder, backgroundColor: T.card }]}
                      textStyle={{ color: date ? T.text : T.textMuted, fontSize: 14 }}
                      testID="activity-date-field"
                    />
                  )}

                  {/* Time (optional) */}
                  <Text style={[styles.fieldLabel, { color: T.textMuted, textAlign, marginTop: 10 }]}>
                    {t('activities.timeOptional')}
                  </Text>
                  <TimeField
                    value={time ?? ''}
                    onChange={setTime}
                    style={[styles.input, styles.timeField, { borderColor: T.cardBorder, backgroundColor: T.card }]}
                    textStyle={{ color: time ? T.text : T.textMuted, fontSize: 14 }}
                    accessibilityLabel={t('activities.timeOptional')}
                    testID="activity-time-field"
                  />

                  {/* Gear checklist */}
                  <Text style={[styles.fieldLabel, { color: T.textMuted, textAlign, marginTop: 16 }]}>{t('activities.step.gear')}</Text>
                  <Text style={[styles.tplHint, { color: T.textMuted, textAlign }]}>{t('activities.gearHint')}</Text>
                  {gear.map((g, idx) => (
                    <TouchableOpacity
                      key={g.key}
                      style={[styles.gearRow, { flexDirection: rowDirection }]}
                      onPress={() => setGear((arr) => arr.map((x, i) => (i === idx ? { ...x, checked: !x.checked } : x)))}
                    >
                      <Ionicons
                        name={g.checked ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={g.checked ? T.accent : T.textMuted}
                      />
                      <Text style={[styles.gearLabel, { color: g.checked ? T.text : T.textMuted, textAlign }]}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={[styles.addItemRow, { flexDirection: rowDirection }]}>
                    <TextInput
                      value={newItem}
                      onChangeText={setNewItem}
                      placeholder={t('activities.itemPlaceholder')}
                      placeholderTextColor={T.textMuted}
                      onSubmitEditing={addGearItem}
                      style={[styles.input, { flex: 1, color: T.text, borderColor: T.cardBorder, backgroundColor: T.card, textAlign }]}
                    />
                    <TouchableOpacity onPress={addGearItem} style={styles.addItemBtn}>
                      <Text style={[styles.addBtnText, { color: T.accent }]}>{t('activities.addItem')}</Text>
                    </TouchableOpacity>
                  </View>

                  {editing && (
                    <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
                      <Text style={styles.deleteText}>{t('activities.remove')}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>

            {step === 'form' && (
              <View style={[styles.sheetFoot, { borderTopColor: T.cardBorder }]}>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: canSave ? T.accent : T.cardBorder }]}
                  disabled={!canSave || savingForm}
                  onPress={onSave}
                >
                  {savingForm
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.saveText}>{t('activities.save')}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  chevron: { fontSize: 26, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 13, marginBottom: 14 },
  chipRow: { flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12 },
  cardHead: { alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  cardWhen: { fontSize: 12, marginTop: 4 },
  gearChips: { flexWrap: 'wrap', gap: 6, marginTop: 8 },
  gearChip: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1 },
  gearChipText: { fontSize: 12 },
  addBtn: { marginTop: 16, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { fontSize: 14, fontWeight: '600' },
  proposedWrap: { gap: 8, marginBottom: 16 },
  proposedHead: { fontSize: 12, fontWeight: '600' },
  proposedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  approveBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  approveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', gap: 8, marginTop: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyHint: { fontSize: 13 },
  loadingWrap: { alignItems: 'center', marginTop: 48 },
  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  sheetHead: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  stepDots: { fontSize: 13, width: 40, textAlign: 'center' },
  sheetBody: { padding: 16, gap: 10 },
  tplRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  tplTitle: { fontSize: 14, fontWeight: '600' },
  tplHint: { fontSize: 11, marginTop: 2 },
  sectionLabel: { fontSize: 12, marginTop: 6, marginBottom: 2 },
  fieldLabel: { fontSize: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  dateBtn: { justifyContent: 'space-between', marginTop: 10 },
  timeField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 0 },
  toggleRow: { gap: 8, marginTop: 12 },
  toggle: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  toggleText: { fontSize: 13, fontWeight: '600' },
  dayRow: { flexWrap: 'wrap', gap: 6, marginTop: 10 },
  dayPill: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  dayPillText: { fontSize: 12, fontWeight: '600' },
  gearRow: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  gearLabel: { flex: 1, fontSize: 14 },
  addItemRow: { alignItems: 'center', gap: 8, marginTop: 8 },
  addItemBtn: { paddingHorizontal: 8, paddingVertical: 10 },
  deleteBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
  deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  sheetFoot: { padding: 12, borderTopWidth: 1 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
