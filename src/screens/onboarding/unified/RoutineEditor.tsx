/**
 * RoutineEditor — the editable routine in the Step 5 preview
 * (pkg/anchor-routine-onboarding M3).
 *
 * UStep5 saves the starter tasks on mount, so every edit here writes to the
 * ALREADY-SAVED rows (scoped by id + assigned_to). Nothing the child has done
 * can be lost: their first completion only happens on the next step (UStep6).
 *
 * Edits: tap a title to rename · shift the whole routine ±15 min · remove a step
 * (down to MIN_ROUTINE_STEPS) · switch the moment (replaces the steps with that
 * moment's routine). Optimistic; on any write failure we reload the rows from
 * the DB so the screen never shows something that isn't saved.
 */
import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../../theme';
import { supabase } from '../../../integrations/supabase/client';
import { logOnboardingEvent } from '../../../lib/onboardingFunnel';
import type { GeneratedTask, RoutineMoment } from './starterTasks';
import {
  type RoutineRow, SHIFT_STEP_MIN, MAX_TITLE_LEN,
  canRemove, cleanTitle, shiftRoutine, sortByTime, startTime,
} from './routineEdit';

const MOMENTS: RoutineMoment[] = ['morning', 'afternoon', 'evening'];

interface Props {
  familyId: string | null;
  childId: string;
  initialRows: RoutineRow[];
  /** null when the generator fell back to the mixed list — no moment chips. */
  initialMoment: RoutineMoment | null;
  isRTL: boolean;
  /** Regenerate the routine for another moment (same child inputs). */
  regenerate: (moment: RoutineMoment) => GeneratedTask[];
  /** Map generated tasks to insertable task rows (same shape as UStep5's insert). */
  buildTaskRows: (tasks: GeneratedTask[]) => Record<string, unknown>[];
}

export function RoutineEditor({
  familyId, childId, initialRows, initialMoment, isRTL, regenerate, buildTaskRows,
}: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<RoutineRow[]>(sortByTime(initialRows));
  const [moment, setMoment] = useState<RoutineMoment | null>(initialMoment);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const logEdit = (variant: string) =>
    void logOnboardingEvent({ familyId, eventType: 'routine_edited', childId, variant });

  /** Source of truth after a failed write. */
  const reload = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, time')
      .eq('assigned_to', childId);
    if (data) setRows(sortByTime(data as RoutineRow[]));
  }, [childId]);

  const run = async (op: () => Promise<boolean>) => {
    setBusy(true);
    setErr(null);
    let ok = false;
    try {
      ok = await op();
    } catch {
      ok = false;
    }
    if (!ok) {
      setErr(t('onboarding.step5.routine.saveError'));
      await reload();
    }
    setBusy(false);
  };

  // ── rename ────────────────────────────────────────────────────────────────
  const startEdit = (row: RoutineRow) => {
    if (busy) return;
    setEditingId(row.id);
    setDraft(row.title);
  };

  const commitEdit = () => {
    const id = editingId;
    setEditingId(null);
    if (!id) return;
    const next = cleanTitle(draft);
    const prev = rows.find((r) => r.id === id);
    if (!next || !prev || next === prev.title) return;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, title: next } : r)));
    void run(async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ title: next } as never)
        .eq('id', id)
        .eq('assigned_to', childId)
        .select('id');
      const ok = !error && !!data && data.length > 0;
      if (ok) logEdit('title');
      return ok;
    });
  };

  // ── shift start time ──────────────────────────────────────────────────────
  const shift = (delta: number) => {
    const next = shiftRoutine(rows, delta);
    if (!next || busy) return;
    setRows(next);
    void run(async () => {
      const results = await Promise.all(
        next.map((r) =>
          supabase
            .from('tasks')
            .update({ time: r.time } as never)
            .eq('id', r.id)
            .eq('assigned_to', childId)
            .select('id'),
        ),
      );
      const ok = results.every((res) => !res.error && !!res.data && res.data.length > 0);
      if (ok) logEdit('time');
      return ok;
    });
  };

  // ── remove ────────────────────────────────────────────────────────────────
  const remove = (id: string) => {
    if (!canRemove(rows) || busy) return;
    setRows((rs) => rs.filter((r) => r.id !== id));
    void run(async () => {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('assigned_to', childId)
        .select('id');
      const ok = !error && !!data && data.length > 0;
      if (ok) logEdit('remove');
      return ok;
    });
  };

  // ── switch moment ─────────────────────────────────────────────────────────
  const switchMoment = (m: RoutineMoment) => {
    if (busy || m === moment) return;
    const generated = regenerate(m);
    if (generated.length === 0) return;
    const oldIds = rows.map((r) => r.id);
    setMoment(m);
    void run(async () => {
      const { data: inserted, error: insErr } = await supabase
        .from('tasks')
        .insert(buildTaskRows(generated) as never)
        .select('id, title, time');
      if (insErr || !inserted || inserted.length === 0) {
        setMoment(moment);
        return false;
      }
      // Insert first, then delete the old steps: a failure in between leaves
      // extra steps (fixable later), never a child with no tasks.
      const { error: delErr } = await supabase
        .from('tasks')
        .delete()
        .in('id', oldIds)
        .eq('assigned_to', childId);
      setRows(sortByTime(inserted as RoutineRow[]));
      if (delErr) return false;
      logEdit('moment');
      return true;
    });
  };

  const start = startTime(rows);
  const earlierOk = !!shiftRoutine(rows, -SHIFT_STEP_MIN);
  const laterOk = !!shiftRoutine(rows, SHIFT_STEP_MIN);
  const removable = canRemove(rows);
  const row = isRTL ? styles.rowReverse : null;
  const align = isRTL ? styles.textRight : null;

  return (
    <View>
      {moment && (
        <View style={[styles.chips, row]}>
          {MOMENTS.map((m) => (
            <TouchableOpacity
              key={m}
              testID={`onb5-moment-${m}`}
              accessibilityRole="button"
              accessibilityState={{ selected: m === moment, disabled: busy }}
              onPress={() => switchMoment(m)}
              disabled={busy}
              style={[styles.chip, m === moment && styles.chipOn]}
            >
              <Text style={[styles.chipText, m === moment && styles.chipTextOn]}>
                {t(`onboarding.step5.routine.moment.${m}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {start && (
        <View style={[styles.startRow, row]}>
          <TouchableOpacity
            testID="onb5-earlier"
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.step5.routine.earlier')}
            onPress={() => shift(-SHIFT_STEP_MIN)}
            disabled={!earlierOk || busy}
            style={[styles.stepBtn, (!earlierOk || busy) && styles.disabled]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.startText}>{t('onboarding.step5.routine.startsAt', { time: start })}</Text>
          <TouchableOpacity
            testID="onb5-later"
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.step5.routine.later')}
            onPress={() => shift(SHIFT_STEP_MIN)}
            disabled={!laterOk || busy}
            style={[styles.stepBtn, (!laterOk || busy) && styles.disabled]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.hint, align]}>{t('onboarding.step5.routine.hint')}</Text>

      {rows.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={[styles.cardRow, row]}>
            <Text style={styles.time}>{r.time}</Text>
            {editingId === r.id ? (
              <TextInput
                testID={`onb5-title-input-${r.id}`}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={commitEdit}
                onBlur={commitEdit}
                autoFocus
                maxLength={MAX_TITLE_LEN}
                returnKeyType="done"
                style={[styles.input, align]}
              />
            ) : (
              <TouchableOpacity
                testID={`onb5-title-${r.id}`}
                accessibilityRole="button"
                accessibilityHint={t('onboarding.step5.routine.editHint')}
                onPress={() => startEdit(r)}
                style={styles.titleBtn}
              >
                <Text style={[styles.title, align]}>{r.title}</Text>
              </TouchableOpacity>
            )}
            {removable && editingId !== r.id && (
              <TouchableOpacity
                testID={`onb5-remove-${r.id}`}
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.step5.routine.remove')}
                onPress={() => remove(r.id)}
                disabled={busy}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.remove}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {err && <Text style={[styles.err, align]}>{err}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight:  { textAlign: 'right' },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip:       { borderWidth: 1.5, borderColor: T.cardBorder, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: T.card },
  chipOn:     { borderColor: T.accent, backgroundColor: '#EDE9FE' },
  chipText:   { color: T.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: T.accent },
  startRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  stepBtn:    { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:{ color: T.accent, fontSize: 18, fontWeight: '700', lineHeight: 20 },
  disabled:   { opacity: 0.35 },
  startText:  { color: T.text, fontSize: 15, fontWeight: '600' },
  hint:       { color: T.textMuted, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  card:       { backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: T.cardBorder },
  cardRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time:       { color: T.accent, fontSize: 12, fontWeight: '700', minWidth: 42 },
  titleBtn:   { flex: 1 },
  title:      { color: T.text, fontSize: 14, fontWeight: '500' },
  input:      { flex: 1, color: T.text, fontSize: 14, borderBottomWidth: 1.5, borderBottomColor: T.accent, paddingVertical: 2 },
  remove:     { color: T.textMuted, fontSize: 20, lineHeight: 22, paddingHorizontal: 4 },
  err:        { color: '#DC2626', fontSize: 12, marginTop: 4 },
});
