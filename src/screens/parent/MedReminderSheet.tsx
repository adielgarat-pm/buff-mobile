/**
 * MedReminderSheet — bottom sheet that lets a parent add a standalone
 * medication-reminder anchor for a child. Opened from the Anchor Recovery
 * prompt's "Add medication reminder" CTA (pkg/anchor-recovery Phase 3),
 * replacing the Phase-2 log-only handler.
 *
 * Smart-default sheet (Adi 2026-06-14 — supersedes locked OQ4 "auto-add,
 * no form"): defaults pre-filled (morning 07:30, all 7 days) so a
 * low-bandwidth parent can add in one tap, but timing is adjustable because
 * medication timing is personal. Morning dose by default; optional evening
 * (before-bed) dose (P3-2). No medication name collected — generic
 * child-facing label only (P3-3, Pillar 2 children's-app PII discipline).
 *
 * Each enabled dose inserts one `tasks` row (category 'self-care', 5 credits,
 * is_system_generated=true) per the locked OQ6 contract.
 *
 * See docs/sessions/anchor-recovery/PHASE3_PLAN.md.
 */
import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { PARENT_THEME as T } from '../../theme';
import { supabase } from '../../integrations/supabase/client';

const MORNING_DEFAULT = '07:30';
const EVENING_DEFAULT = '20:00';
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function hhmmToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 7, Number.isFinite(m) ? m : 30, 0, 0);
  return d;
}
function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface MedReminderSheetProps {
  visible: boolean;
  childId: string | null;
  childName: string;
  familyId: string | null;
  onClose: () => void;
  /** Called after a successful insert. Parent shows the confirmation toast. */
  onSaved: (childName: string) => void;
}

export default function MedReminderSheet({
  visible, childId, childName, familyId, onClose, onSaved,
}: MedReminderSheetProps) {
  const { t } = useTranslation();
  const { textAlign, rowDirection } = useRTLStyles();

  const [morningTime, setMorningTime] = useState(MORNING_DEFAULT);
  const [showMorning, setShowMorning] = useState(false);
  const [eveningOn, setEveningOn]     = useState(false);
  const [eveningTime, setEveningTime] = useState(EVENING_DEFAULT);
  const [showEvening, setShowEvening] = useState(false);
  const [days, setDays]               = useState<number[]>(ALL_DAYS);
  const [saving, setSaving]           = useState(false);

  const toggleDay = (d: number) =>
    setDays((arr) => (arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort((a, b) => a - b)));

  const resetState = () => {
    setMorningTime(MORNING_DEFAULT);
    setEveningOn(false);
    setEveningTime(EVENING_DEFAULT);
    setDays(ALL_DAYS);
    setShowMorning(false);
    setShowEvening(false);
    setSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = async () => {
    if (!childId || !familyId || saving || days.length === 0) return;
    setSaving(true);

    const base = {
      family_id: familyId,
      assigned_to: childId,
      category: 'self-care',
      credits: 5,
      schedule_days: days,
      is_system_generated: true,
      icon: '💊',
    };

    const rows = eveningOn
      ? [
          { ...base, title: t('medReminder.taskTitle.morning'), time: morningTime },
          { ...base, title: t('medReminder.taskTitle.evening'), time: eveningTime },
        ]
      : [{ ...base, title: t('medReminder.taskTitle'), time: morningTime }];

    const { error } = await supabase.from('tasks').insert(rows as never);

    if (error) {
      if (__DEV__) console.error('[anchor-recovery] meds insert error:', error.message);
      setSaving(false);
      return; // keep the sheet open so the parent can retry
    }

    const savedName = childName;
    resetState();
    onSaved(savedName);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: T.bg }]}>
          <View style={styles.grabber} />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
              <View style={[styles.iconCircle, { backgroundColor: T.accentLight + '33' }]}>
                <Text style={styles.iconGlyph}>💊</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: T.text, textAlign }]}>
                  {t('medReminder.title')}
                </Text>
                <Text style={[styles.subtitle, { color: T.textMuted, textAlign }]}>
                  {t('medReminder.subtitle', { name: childName })}
                </Text>
              </View>
            </View>

            {/* Morning time */}
            <Text style={[styles.label, { color: T.textMuted, textAlign }]}>
              {t('medReminder.morningLabel')}
            </Text>
            <TouchableOpacity
              style={[styles.timeRow, { borderColor: T.cardBorder, flexDirection: rowDirection }]}
              onPress={() => setShowMorning(true)}
              accessibilityRole="button"
            >
              <Text style={[styles.timeRowLabel, { color: T.text }]}>{t('medReminder.morning')}</Text>
              <Text style={[styles.timeRowValue, { color: T.text }]}>{morningTime}</Text>
            </TouchableOpacity>
            {showMorning && (
              <DateTimePicker
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                value={hhmmToDate(morningTime)}
                onChange={(e: DateTimePickerEvent, sel?: Date) => {
                  if (Platform.OS === 'android') setShowMorning(false);
                  if (e.type === 'set' && sel) setMorningTime(toHHMM(sel));
                  if (e.type === 'dismissed') setShowMorning(false);
                }}
              />
            )}

            {/* Evening dose — opt-in */}
            {!eveningOn ? (
              <TouchableOpacity
                style={styles.addEveningBtn}
                onPress={() => setEveningOn(true)}
                accessibilityRole="button"
              >
                <Text style={[styles.addEveningText, { color: T.accent, textAlign }]}>
                  + {t('medReminder.addEvening')}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={[styles.eveningHeader, { flexDirection: rowDirection }]}>
                  <Text style={[styles.label, { color: T.textMuted, marginTop: 0 }]}>
                    {t('medReminder.evening')}
                  </Text>
                  <TouchableOpacity onPress={() => setEveningOn(false)} accessibilityRole="button">
                    <Text style={[styles.removeEvening, { color: T.textMuted }]}>
                      {t('medReminder.removeEvening')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.timeRow, { borderColor: T.cardBorder, flexDirection: rowDirection }]}
                  onPress={() => setShowEvening(true)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.timeRowLabel, { color: T.text }]}>{t('medReminder.evening')}</Text>
                  <Text style={[styles.timeRowValue, { color: T.text }]}>{eveningTime}</Text>
                </TouchableOpacity>
                {showEvening && (
                  <DateTimePicker
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    value={hhmmToDate(eveningTime)}
                    onChange={(e: DateTimePickerEvent, sel?: Date) => {
                      if (Platform.OS === 'android') setShowEvening(false);
                      if (e.type === 'set' && sel) setEveningTime(toHHMM(sel));
                      if (e.type === 'dismissed') setShowEvening(false);
                    }}
                  />
                )}
              </>
            )}

            {/* Days */}
            <Text style={[styles.label, { color: T.textMuted, textAlign }]}>
              {t('medReminder.daysLabel')}
            </Text>
            <View style={[styles.dayRow, { flexDirection: rowDirection }]}>
              {DAY_KEYS.map((key, idx) => {
                const on = days.includes(idx);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.dayChip,
                      { borderColor: T.cardBorder },
                      on && { backgroundColor: T.accent, borderColor: T.accent },
                    ]}
                    onPress={() => toggleDay(idx)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.dayChipText, { color: on ? '#fff' : T.textMuted }]}>
                      {t(`day.short.${key}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: T.textMuted, textAlign }]}>
              {t('medReminder.daysHint')}
            </Text>

            {/* Privacy reassurance */}
            <View style={[styles.privacyBox, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
              <Text style={[styles.privacyText, { color: T.textMuted, textAlign }]}>
                🔒  {t('medReminder.privacy')}
              </Text>
            </View>

            {/* Child preview */}
            <Text style={[styles.previewLabel, { color: T.textMuted, textAlign }]}>
              {t('medReminder.preview', { name: childName })}
            </Text>
            <View style={[styles.previewCard, { borderColor: T.cardBorder, flexDirection: rowDirection }]}>
              <Text style={styles.previewGlyph}>💊</Text>
              <Text style={[styles.previewTitle, { color: T.text }]}>
                {eveningOn ? t('medReminder.taskTitle.morning') : t('medReminder.taskTitle')}
              </Text>
              <Text style={[styles.previewTime, { color: T.textMuted }]}>{morningTime}</Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: T.accent }, days.length === 0 && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || days.length === 0}
              accessibilityRole="button"
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>{t('medReminder.save')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn} accessibilityRole="button">
              <Text style={[styles.cancelText, { color: T.textMuted }]}>{t('medReminder.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(38,33,92,0.45)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  grabber:    { width: 36, height: 4, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.15)', alignSelf: 'center', marginTop: 10 },
  content:    { padding: 20, paddingBottom: 28 },
  headerRow:  { alignItems: 'center', gap: 10, marginBottom: 4 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconGlyph:  { fontSize: 20 },
  headerText: { flex: 1 },
  title:      { fontSize: 18, fontWeight: '700' },
  subtitle:   { fontSize: 13, marginTop: 2 },
  label:      { fontSize: 13, marginTop: 18, marginBottom: 8 },
  timeRow:    { alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  timeRowLabel: { fontSize: 15 },
  timeRowValue: { fontSize: 18, fontWeight: '700' },
  addEveningBtn: { paddingVertical: 10, marginTop: 8 },
  addEveningText: { fontSize: 14, fontWeight: '600' },
  eveningHeader: { alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  removeEvening: { fontSize: 13, fontWeight: '600' },
  dayRow:     { justifyContent: 'space-between', gap: 6 },
  dayChip:    { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  dayChipText: { fontSize: 13, fontWeight: '600' },
  hint:       { fontSize: 12, marginTop: 8 },
  privacyBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 16 },
  privacyText: { fontSize: 12, lineHeight: 18 },
  previewLabel: { fontSize: 12, marginTop: 18, marginBottom: 6 },
  previewCard: { alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 },
  previewGlyph: { fontSize: 18 },
  previewTitle: { fontSize: 14, flex: 1 },
  previewTime: { fontSize: 12 },
  saveBtn:    { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn:  { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
