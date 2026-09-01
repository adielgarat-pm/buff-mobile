/**
 * TeenTaskModal — teen self-authors a task directly (pkg/teen-autonomy, D1).
 * Shared by Gamer + Mint task screens, themed via the same `SuggestPalette`
 * shape as ChildSuggest so each aesthetic keeps its look.
 *
 * Deliberately has NO credits field: the teen owns WHAT the task is, the parent
 * governs its BUFFs value (D2). The server stamps child-authored credits to 0
 * until the parent prices it (migration 058) — the copy says so plainly.
 *
 * Phase 1 = create only. Edit/delete of own tasks arrives in Phase 2.
 */
import { useState } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SuggestPalette } from './ChildSuggest';
import type { Task, TaskCategory } from '../../types/task';
import { crossAlert } from '../../platform';

const CATEGORIES: TaskCategory[] = [
  'learning', 'organization', 'self-care', 'responsibility', 'movement',
];

// Time-of-day presets → an HH:MM the phase logic understands. Keeps the modal
// simple + cross-platform (no fragile native time picker) for the MVP; a teen
// can still land a task in the right part of their day.
const TIME_PRESETS: { key: 'morning' | 'afternoon' | 'evening'; time: string }[] = [
  { key: 'morning',   time: '08:00' },
  { key: 'afternoon', time: '15:00' },
  { key: 'evening',   time: '19:00' },
];

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export interface TeenTaskModalProps {
  visible: boolean;
  palette: SuggestPalette;
  onClose: () => void;
  /** Persist the new task. Resolves when done; the modal handles its own state. */
  onCreate: (input: Omit<Task, 'id' | 'completed' | 'completedAt'>) => Promise<void>;
}

export function TeenTaskModal({ visible, palette, onClose, onCreate }: TeenTaskModalProps) {
  const { t } = useTranslation();
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState<TaskCategory>('responsibility');
  const [timeKey, setTimeKey]   = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [saving, setSaving]     = useState(false);

  const reset = () => {
    setTitle(''); setCategory('responsibility'); setTimeKey('afternoon'); setSaving(false);
  };
  const close = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const time = TIME_PRESETS.find(p => p.key === timeKey)!.time;
    try {
      await onCreate({
        title:        title.trim(),
        time,
        category,
        credits:      0,           // server-governed; parent prices it later
        scheduleDays: EVERY_DAY,
      });
    } catch {
      setSaving(false);
      crossAlert('', t('common.errorGeneric', { defaultValue: 'Something went wrong' }));
      return;
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: palette.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
          <Text style={[styles.heading, { color: palette.text }]}>
            {t('teenTask.modal.heading', { defaultValue: 'New task' })}
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: palette.inputBg, color: palette.text, borderColor: palette.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('teenTask.modal.titlePlaceholder', { defaultValue: 'What do you want to do?' })}
            placeholderTextColor={palette.textMuted}
            maxLength={60}
            autoFocus
          />

          {/* When */}
          <Text style={[styles.label, { color: palette.textMuted }]}>
            {t('teenTask.modal.whenLabel', { defaultValue: 'When' })}
          </Text>
          <View style={styles.chipRow}>
            {TIME_PRESETS.map(p => {
              const on = p.key === timeKey;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.chip, { borderColor: palette.border },
                    on ? { backgroundColor: palette.accent } : { backgroundColor: palette.inputBg }]}
                  onPress={() => setTimeKey(p.key)}
                >
                  <Text style={[styles.chipText, { color: on ? palette.accentText : palette.text }]}>
                    {t(`teenTask.time.${p.key}`, { defaultValue: p.key })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Category */}
          <Text style={[styles.label, { color: palette.textMuted }]}>
            {t('teenTask.modal.categoryLabel', { defaultValue: 'Kind' })}
          </Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(c => {
              const on = c === category;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, { borderColor: palette.border },
                    on ? { backgroundColor: palette.accent } : { backgroundColor: palette.inputBg }]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, { color: on ? palette.accentText : palette.text }]}>
                    {t(`category.${c}`, { defaultValue: c })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* BUFFs note — the teen owns the task, the parent sets its value */}
          <Text style={[styles.note, { color: palette.textMuted }]}>
            {t('teenTask.modal.creditsNote', { defaultValue: 'Your parent sets the BUFFs for this.' })}
          </Text>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: palette.accent }, (!title.trim() || saving) && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={!title.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color={palette.accentText} />
              : <Text style={[styles.submitText, { color: palette.accentText }]}>
                  {t('teenTask.modal.create', { defaultValue: 'Add it' })}
                </Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={close}>
            <Text style={[styles.cancelText, { color: palette.textMuted }]}>
              {t('childSuggest.modal.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  heading:    { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  label:      { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input:      { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12 },
  chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip:       { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText:   { fontSize: 13, fontWeight: '700' },
  note:       { fontSize: 12, marginTop: 2, marginBottom: 14, fontStyle: 'italic' },
  submitBtn:  { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 15, fontWeight: '800' },
  cancelBtn:  { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
