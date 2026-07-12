/**
 * Parent Tasks
 * Shows all tasks grouped by phase for the selected child.
 * Data comes from Supabase via useChildrenDashboard + useChildData.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { crossAlert } from '../../platform';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { PARENT_THEME as T } from '../../theme';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useChildData } from '../../hooks/useChildProgress';
import { useSubscription, FREE_TASK_LIMIT } from '../../hooks/useSubscription';
import { usePendingSuggestions, type ChildSuggestion } from '../../hooks/useChildSuggestions';
import { PendingSuggestions } from '../../components/parent/PendingSuggestions';
import { HeaderActions } from '../../components/parent/HeaderActions';
import { PHASES, type Phase } from '../../types/phase';
import PhilosophyTip from '../../components/PhilosophyTip';
import { DayScheduleToggles } from '../../components/DayScheduleToggles';
import { DuplicateToChildModal } from '../../components/parent/DuplicateToChildModal';
import type { Task } from '../../types/task';
// Platform-split time control ("HH:MM" in/out): native OS picker on Android/iOS,
// browser <input type="time"> on web — a direct DateTimePicker import renders
// NOTHING on web, leaving every task stuck at the 16:00 default (dead control).
import TimeField from '../../components/TimeField';
import { useRTLStyles } from '../../contexts/LanguageContext';
import { guardedSheetClose } from '../../utils/sheetDismissGuard';
import { supabase } from '../../integrations/supabase/client';
import type { RootStackParamList } from '../../navigation/types';
import type { AgeGroup, Gender } from '../onboarding/unified/onboardingData';

const STAGE_IDS: Phase[] = ['morning', 'school', 'afternoon', 'evening'];

const stageForTime = (time: string): Phase => {
  const [h] = time.split(':').map(Number);
  if (h < 9)  return 'morning';
  if (h < 14) return 'school';
  if (h < 18) return 'afternoon';
  return 'evening';
};

export default function ParentTasksScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { familyId } = useAuth();
  const { isSubscribed } = useSubscription();
  const { children, loading: childrenLoading } = useChildrenDashboard();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Auto-select first child once the list loads
  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].childId);
    }
  }, [children, selectedChildId]);

  const { tasks, loading: tasksLoading, refetch, updateTask, deleteTask } = useChildData(selectedChildId);

  const {
    suggestions,
    markApproved,
    markDiscussing,
    refetch: refetchSuggestions,
  } = usePendingSuggestions(selectedChildId);

  // Task modal — serves three modes:
  //  • approve: opened from a child suggestion (approvingId set)
  //  • edit:    opened by tapping an existing task row (editingId set)
  //  • create:  opened from the "+ Add Task" button (both null)
  // The parent always sets time + Buffs so the economy stays in their hands;
  // category defaults to 'responsibility' and the task runs every day.
  const [approveOpen, setApproveOpen]       = useState(false);
  const [approvingId, setApprovingId]       = useState<string | null>(null);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [approveTitle, setApproveTitle]     = useState('');
  const [approveTime, setApproveTime]       = useState('16:00');
  const [approveCredits, setApproveCredits] = useState('10');
  const [approveDays, setApproveDays]        = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  // Set when editing a one-time (dated) task: visibility ignores scheduleDays
  // for dated tasks (isTaskVisibleOn short-circuits on dueDate), so the day
  // chips — and especially the "paused" hint — would lie for them.
  const [editingDueDate, setEditingDueDate]  = useState<string | null>(null);
  const [approveSaving, setApproveSaving]   = useState(false);
  // Snapshot of the form as it was OPENED (create/approve/edit) — a backdrop
  // tap on an unchanged form still closes instantly, but once the parent has
  // typed/edited anything the dismissal asks confirm-discard (sheetDismissGuard).
  const [openedSnapshot, setOpenedSnapshot] = useState('');
  const [dupTask, setDupTask] = useState<Task | null>(null);
  const { rowDirection } = useRTLStyles();

  const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

  // Canonical string form of the modal's editable fields, used to compare the
  // current form against the state it opened with (order-stable arrays).
  const formSnapshot = (title: string, time: string, credits: string, days: number[]) =>
    JSON.stringify([title, time, credits, days]);

  // Tasks created via the empty-state CTA land back here while this tab is still
  // mounted — useChildData has no focus/realtime refetch, so re-pull on focus.
  useFocusEffect(
    useCallback(() => {
      if (selectedChildId) { refetch(); refetchSuggestions(); }
    }, [selectedChildId, refetch, refetchSuggestions])
  );

  const handleOpenAddTask = () => {
    if (!selectedChildId) return;
    // Freemium gate: free families get up to FREE_TASK_LIMIT tasks per child.
    // The next task is the universal upgrade moment — every family hits it,
    // regardless of how many children they have (see monetization-model SPEC).
    if (!isSubscribed && tasks.length >= FREE_TASK_LIMIT) {
      navigation.navigate('Paywall', { childName: selectedChildName });
      return;
    }
    setApprovingId(null);
    setEditingId(null);
    setApproveTitle('');
    setApproveTime('16:00');
    setApproveCredits('10');
    setApproveDays(ALL_DAYS);
    setEditingDueDate(null);
    setOpenedSnapshot(formSnapshot('', '16:00', '10', ALL_DAYS));
    setApproveOpen(true);
  };

  const handleApproveSuggestion = (s: ChildSuggestion) => {
    setApprovingId(s.id);
    setEditingId(null);
    setApproveTitle(s.title);
    setApproveTime('16:00');
    setApproveCredits('10');
    setApproveDays(ALL_DAYS);
    setEditingDueDate(null);
    setOpenedSnapshot(formSnapshot(s.title, '16:00', '10', ALL_DAYS));
    setApproveOpen(true);
  };

  const handleEditTask = (task: { id: string; title: string; time: string; credits: number; scheduleDays?: number[]; dueDate?: string }) => {
    const days = Array.isArray(task.scheduleDays) ? task.scheduleDays : ALL_DAYS;
    setApprovingId(null);
    setEditingId(task.id);
    setApproveTitle(task.title);
    setApproveTime(task.time);
    setApproveCredits(String(task.credits));
    setApproveDays(days);
    setEditingDueDate(task.dueDate ?? null);
    setOpenedSnapshot(formSnapshot(task.title, task.time, String(task.credits), days));
    setApproveOpen(true);
  };

  const handleLetsTalk = async (s: ChildSuggestion) => {
    await markDiscussing(s.id);
  };

  const closeTaskModal = () => {
    setApproveOpen(false);
    setApprovingId(null);
    setEditingId(null);
  };

  // Backdrop tap / Android back: instant close when nothing changed, but a
  // typed/edited form asks confirm-discard instead of silently losing it.
  const taskModalDirty =
    formSnapshot(approveTitle, approveTime, approveCredits, approveDays) !== openedSnapshot;
  const requestCloseTaskModal = () =>
    guardedSheetClose({ dirty: taskModalDirty, close: closeTaskModal, t });

  const handleDeleteTask = () => {
    if (!editingId) return;
    const id = editingId;
    crossAlert(
      t('parentTasks.editModal.deleteConfirmTitle'),
      t('parentTasks.editModal.deleteConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTask(id);
            await refetch();
            closeTaskModal();
          },
        },
      ],
    );
  };

  // Copy this task to one or more other children (one fresh row each, same
  // schedule/category/credits).
  const handleDuplicateTask = async (targetChildIds: string[]) => {
    if (!familyId || !dupTask) return;
    const tk = dupTask;
    const rows = targetChildIds.map(cid => ({
      family_id:         familyId,
      assigned_to:       cid,
      title:             tk.title,
      time:              tk.time,
      category:          tk.category,
      credits:           tk.credits,
      schedule_days:     tk.scheduleDays ?? [0, 1, 2, 3, 4, 5, 6],
      hide_on_weekend:   tk.hideOnWeekend ?? false,
      icon:              tk.icon ?? null,
      description:       tk.description ?? null,
      proposed_by_child: false,
    }));
    const { error } = await supabase.from('tasks').insert(rows as never);
    if (error) {
      console.error('[ParentTasks] duplicate error:', error.message);
      crossAlert(t('common.error'), t('common.errorGeneric'));
      return;
    }
    await refetch();
  };

  const handleConfirmTask = async () => {
    if (!selectedChildId || !familyId || approveSaving) return;
    const title = approveTitle.trim();
    if (!title) return;
    const credits = parseInt(approveCredits, 10) || 10;

    setApproveSaving(true);

    // Edit mode — update the existing task in place. A one-time (dated) task
    // keeps its dueDate semantics: scheduleDays is not written for it (the
    // chips are hidden in the modal and visibility ignores them anyway).
    if (editingId) {
      await updateTask(editingId, editingDueDate
        ? { title, time: approveTime, credits }
        : { title, time: approveTime, credits, scheduleDays: approveDays });
      await refetch();
      setApproveSaving(false);
      closeTaskModal();
      return;
    }

    // Create / approve mode — insert a new task.
    const { data, error } = await supabase.from('tasks').insert({
      family_id:         familyId,
      assigned_to:       selectedChildId,
      title,
      time:              approveTime,
      category:          'responsibility',
      credits,
      schedule_days:     approveDays,
      proposed_by_child: !!approvingId,
    } as never).select('id').single();

    if (!error && data && approvingId) {
      await markApproved(approvingId, (data as { id: string }).id);
      await refetchSuggestions();
    }
    if (!error) await refetch();
    setApproveSaving(false);

    if (error) {
      console.error('[ParentTasks] task insert error:', error.message);
      crossAlert(t('common.error'), t('common.errorGeneric'));
      return;
    }

    closeTaskModal();
  };

  const selectedChild = children.find((c) => c.childId === selectedChildId);
  const selectedChildName = selectedChild?.displayName ?? '';

  const handleSetupTasks = async () => {
    if (!selectedChildId) return;

    // The child's stored age group drives the challenge options on UStep2. It
    // lives in pro_settings (not exposed by the dashboard hook), so fetch it.
    const { data } = await supabase
      .from('profiles')
      .select('pro_settings')
      .eq('id', selectedChildId)
      .single();

    const pro = ((data?.pro_settings ?? {}) as unknown) as {
      age_group?: AgeGroup; gender?: Gender; birth_date?: string;
    };

    if (pro.age_group) {
      navigation.navigate('UStep2_Goal', {
        childName:       selectedChildName,
        ageGroup:        pro.age_group,
        gender:          pro.gender     ?? undefined,
        birthDate:       pro.birth_date ?? undefined,
        existingChildId: selectedChildId,
      });
    } else {
      // No stored age — collect it in UStep1 first, then continue the flow.
      navigation.navigate('UStep1', {
        existingChildId: selectedChildId,
        prefillName:     selectedChildName,
      });
    }
  };

  const isLoading = childrenLoading || (!!selectedChildId && tasksLoading);

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.text }]}>{t('parentTasks.title')}</Text>
        <HeaderActions
          onAction={handleOpenAddTask}
          actionDisabled={!selectedChildId}
          actionA11yLabel={t('parentTasks.addBtn')}
        />
      </View>

      {/* Child selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
        {children.map((c) => {
          const selected = c.childId === selectedChildId;
          return (
            <TouchableOpacity
              key={c.childId}
              onPress={() => setSelectedChildId(c.childId)}
              style={[styles.childTab, selected && { backgroundColor: T.accent }]}
            >
              <Text style={styles.childTabEmoji}>{c.avatar}</Text>
              <Text style={[styles.childTabName, { color: selected ? '#fff' : T.textMuted }]}>
                {c.displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Child's task ideas awaiting a deal */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsWrap}>
          <PendingSuggestions
            suggestions={suggestions}
            kind="task"
            childName={selectedChildName}
            onApprove={handleApproveSuggestion}
            onLetsTalk={handleLetsTalk}
          />
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.centered}>
          <PhilosophyTip tipKey="tips.firstTask" dismissible />
          {selectedChildId ? (
            <>
              <Text style={[styles.emptyTitle, { color: T.text }]}>
                {t('parentTasks.emptyTitle', { name: selectedChildName })}
              </Text>
              <Text style={[styles.emptyBody, { color: T.textMuted }]}>
                {t('parentTasks.emptyBody')}
              </Text>
              <TouchableOpacity
                style={[styles.setupCta, { backgroundColor: T.accent }]}
                onPress={handleSetupTasks}
                activeOpacity={0.85}
              >
                <Text style={styles.setupCtaText}>
                  {t('parentTasks.setupCta', { name: selectedChildName })}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ color: T.textMuted }}>{t('parentTasks.empty')}</Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {STAGE_IDS.map((stage) => {
            const stageTasks = tasks.filter((t) => stageForTime(t.time) === stage);
            if (!stageTasks.length) return null;
            const phaseConfig = PHASES.find(p => p.id === stage)!;
            const stageLabel = i18n.language === 'he' ? phaseConfig.shortLabelHe : phaseConfig.shortLabel;
            return (
              <View key={stage} style={styles.stageSection}>
                <Text style={[styles.stageLabel, { color: T.textMuted }]}>{stageLabel}</Text>
                {stageTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskRow, { backgroundColor: T.card, borderColor: T.cardBorder }]}
                    onPress={() => handleEditTask(task)}
                    activeOpacity={0.7}
                  >
                    {/* Status-only indicator — the row opens the edit sheet; the
                        parent never completes a task here, so this reads as status,
                        not a tappable checkbox. */}
                    {task.completed ? (
                      <View style={[styles.statusDone, { backgroundColor: T.success }]}>
                        <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.statusPending}>
                        <View style={[styles.statusDot, { backgroundColor: T.textMuted }]} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, { color: task.completed ? T.textMuted : T.text }]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskMeta, { color: T.textMuted }]}>
                        {t('parentTasks.taskMeta', { time: task.time, credits: task.credits })}
                      </Text>
                    </View>
                    {children.length > 1 && (
                      <TouchableOpacity
                        onPress={() => setDupTask(task)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.copyBtn}
                        accessibilityRole="button"
                        accessibilityLabel={t('duplicate.copyTask')}
                      >
                        <Text style={styles.copyIcon}>📋</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.editChevron, { color: T.textMuted }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Approve-task modal ("Yes, let's do it") ──────────────────────── */}
      <Modal
        visible={approveOpen}
        transparent
        animationType="slide"
        onRequestClose={requestCloseTaskModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior="padding"
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={requestCloseTaskModal}
            testID="task-modal-backdrop"
          />
          <View style={[styles.sheet, { backgroundColor: T.card }]}>
            <Text style={[styles.sheetTitle, { color: T.text }]}>
              {editingId
                ? t('parentTasks.editModal.title')
                : approvingId
                  ? t('childSuggest.approve.taskHeading')
                  : t('parentTasks.addModal.title')}
            </Text>

            <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('childSuggest.approve.titleLabel')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={approveTitle}
              onChangeText={setApproveTitle}
              maxLength={60}
            />

            <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('childSuggest.approve.timeLabel')}</Text>
            <TimeField
              value={approveTime}
              onChange={setApproveTime}
              style={[styles.timeRow, { backgroundColor: T.bg, borderColor: T.cardBorder, flexDirection: rowDirection }]}
              textStyle={[styles.timeValue, { color: T.text }]}
              accessibilityLabel={t('childSuggest.approve.timeLabel')}
              testID="task-time-field"
            />

            <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('childSuggest.approve.creditsLabel')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={approveCredits}
              onChangeText={v => setApproveCredits(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={5}
              selectTextOnFocus
            />

            {editingDueDate ? (
              <Text style={[styles.inputLabel, { color: T.textMuted }]}>
                {t('parentTasks.oneTimeHint', { date: editingDueDate })}
              </Text>
            ) : (
              <>
                <Text style={[styles.inputLabel, { color: T.textMuted }]}>{t('parentTasks.daysLabel')}</Text>
                <DayScheduleToggles selectedDays={approveDays} onChange={setApproveDays} />
                {approveDays.length === 0 && (
                  <Text style={styles.daysPausedHint}>{t('parentTasks.daysPausedHint')}</Text>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: T.accent }, (approveSaving || !approveTitle.trim()) && { opacity: 0.6 }]}
              onPress={handleConfirmTask}
              disabled={approveSaving || !approveTitle.trim()}
            >
              {approveSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmText}>
                    {editingId
                      ? t('parentTasks.editModal.confirm')
                      : approvingId
                        ? t('childSuggest.approve.confirm')
                        : t('parentTasks.addModal.confirm')}
                  </Text>}
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDeleteTask}
                disabled={approveSaving}
              >
                <Text style={styles.deleteText}>{t('parentTasks.editModal.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DuplicateToChildModal
        visible={!!dupTask}
        onClose={() => setDupTask(null)}
        children={children}
        currentChildId={selectedChildId}
        itemType="task"
        itemTitle={dupTask?.title ?? ''}
        onDuplicate={handleDuplicateTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  title:         { fontSize: 24, fontWeight: '700' },
  editChevron:   { fontSize: 22, fontWeight: '400', marginLeft: 4 },
  copyBtn:       { padding: 4, marginLeft: 4 },
  copyIcon:      { fontSize: 18 },
  childSelector: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 60 },
  childTab:      { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, backgroundColor: '#F3F4F6', gap: 6 },
  childTabEmoji: { fontSize: 16 },
  childTabName:  { fontSize: 14, fontWeight: '600' },
  content:       { padding: 20, paddingTop: 8 },
  stageSection:  { marginBottom: 20 },
  stageLabel:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  taskRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12 },
  statusDone:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusPending: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  statusDot:     { width: 8, height: 8, borderRadius: 4, opacity: 0.5 },
  taskTitle:     { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  taskMeta:      { fontSize: 12 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  emptyBody:     { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  setupCta:      { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  setupCtaText:  { color: '#fff', fontSize: 15, fontWeight: '700' },

  suggestionsWrap: { paddingHorizontal: 20, paddingTop: 4 },

  // Approve-task modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle:    { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  inputLabel:    { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input:         { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  timeRow:       { alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  timeValue:     { fontSize: 16, fontWeight: '700', writingDirection: 'ltr' },
  daysPausedHint:{ color: '#B45309', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  confirmBtn:    { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  confirmText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtn:     { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  deleteText:    { color: '#DC2626', fontSize: 14, fontWeight: '600' },
});
