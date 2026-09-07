/**
 * TeenTaskModal — teen self-authors / edits / deletes their own task
 * (pkg/teen-autonomy, D1). Shared by Gamer + Mint task screens, themed via the
 * same `SuggestPalette` shape as ChildSuggest.
 *
 * Deliberately has NO credits field: the teen owns WHAT the task is, the parent
 * governs its BUFFs value (D2). The server stamps child-authored credits to 0 on
 * insert AND update (migration 058), so a teen can never move the economy.
 *
 * Two modes, chosen by the `task` prop:
 *   - create (task == null)  → onCreate(input)
 *   - edit   (task provided)  → onSave(id, patch)  + onDelete(id)
 * Delete leaves any BUFFs already earned banked (Adi 2026-09-01).
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

type TimeKey = 'morning' | 'afternoon' | 'evening';

// Time-of-day presets → an HH:MM the phase logic understands. Keeps the modal
// simple + cross-platform (no fragile native time picker) for the MVP.
const TIME_PRESETS: { key: TimeKey; time: string }[] = [
  { key: 'morning',   time: '08:00' },
  { key: 'afternoon', time: '15:00' },
  { key: 'evening',   time: '19:00' },
];

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/** Map an existing HH:MM back to the nearest preset bucket (edit mode). */
function timeToKey(time: string | undefined): TimeKey {
  const h = Number((time ?? '15:00').split(':')[0]);
  if (Number.isNaN(h)) return 'afternoon';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export interface TeenTaskModalProps {
  visible: boolean;
  palette: SuggestPalette;
  /** The task being edited, or null/undefined for create mode. */
  task?: Task | null;
  onClose: () => void;
  /** Create mode. Resolves when persisted. */
  onCreate?: (input: Omit<Task, 'id' | 'completed' | 'completedAt'>) => Promise<void>;
  /** Edit mode. Persist a patch to the existing task. */
  onSave?: (id: string, patch: Partial<Task>) => Promise<void>;
  /** Edit mode. Delete the task. */
  onDelete?: (id: string) => Promise<void>;
}

export function TeenTaskModal({
  visible, palette, task, onClose, onCreate, onSave, onDelete,
}: TeenTaskModalProps) {
  const { t } = useTranslation();
  const isEdit = !!task;

  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState<TaskCategory>('responsibility');
  const [timeKey, setTimeKey]   = useState<TimeKey>('afternoon');
  const [saving, setSaving]     = useState(false);
  // Track which task the fields were seeded from, so opening the modal on a
  // different task (or switching to create) re-seeds without a useEffect.
  const [seededFor, setSeededFor] = useState<string | null | undefined>(undefined);

  const seedKey = task?.id ?? null;
  if (visible && seededFor !== seedKey) {
    setTitle(task?.title ?? '');
    setCategory(task?.category ?? 'responsibility');
    setTimeKey(task ? timeToKey(task.time) : 'afternoon');
    setSaving(false);
    setSeededFor(seedKey);
  }

  const close = () => { setSeededFor(undefined); onClose(); };

  const handleSubmit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const time = TIME_PRESETS.find(p => p.key === timeKey)!.time;
    try {
      if (isEdit && onSave && task) {
        await onSave(task.id, { title: title.trim(), time, category });
      } else if (onCreate) {
        await onCreate({
          title:        title.trim(),
          time,
          category,
          credits:      0,           // server-governed; parent prices it later
          scheduleDays: EVERY_DAY,
        });
      }
    } catch {
      setSaving(false);
      crossAlert('', t('common.errorGeneric', { defaultValue: 'Something went wrong' }));
      return;
    }
    setSeededFor(undefined);
    onClose();
  };

  const doDelete = async () => {
    if (!onDelete || !task) return;
    setSaving(true);
    try {
      await onDelete(task.id);
    } catch {
      setSaving(false);
      crossAlert('', t('common.errorGeneric', { defaultValue: 'Something went wrong' }));
      return;
    }
    setSeededFor(undefined);
    onClose();
  };

  const handleDelete = () => {
    if (!isEdit || !onDelete || !task || saving) return;
    crossAlert(
      t('teenTask.delete.confirmTitle', { defaultValue: 'Delete this task?' }),
      t('teenTask.delete.confirmBody', { defaultValue: 'It will be removed from your list.' }),
      [
        { text: t('childSuggest.modal.cancel'), style: 'cancel' },
        {
          text: t('teenTask.modal.delete', { defaultValue: 'Delete task' }),
          style: 'destructive',
          onPress: () => { void doDelete(); },
        },
      ],
    );
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
            {isEdit
              ? t('teenTask.modal.editHeading', { defaultValue: 'Edit task' })
              : t('teenTask.modal.heading', { defaultValue: 'New task' })}
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: palette.inputBg, color: palette.text, borderColor: palette.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('teenTask.modal.titlePlaceholder', { defaultValue: 'What do you want to do?' })}
            placeholderTextColor={palette.textMuted}
            maxLength={60}
            autoFocus={!isEdit}
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
            onPress={handleSubmit}
            disabled={!title.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color={palette.accentText} />
              : <Text style={[styles.submitText, { color: palette.accentText }]}>
                  {isEdit
                    ? t('teenTask.modal.save', { defaultValue: 'Save' })
                    : t('teenTask.modal.create', { defaultValue: 'Add it' })}
                </Text>}
          </TouchableOpacity>

          {isEdit && onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Text style={styles.deleteText}>
                {t('teenTask.modal.delete', { defaultValue: 'Delete task' })}
              </Text>
            </TouchableOpacity>
          )}

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
  deleteBtn:  { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  cancelBtn:  { paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  cancelText: { fontSize: 14, fontWeight: '600' },
});
