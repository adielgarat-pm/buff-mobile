import { useState, useEffect, useCallback, useContext } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { ModeContext } from '../contexts/ModeContext';
import { Task } from '../types/task';
import { isOffRoutineActive, isTaskInActivePlan } from '../utils/offRoutineUtils';
import { applyTaskCompletionToPet } from './usePetState';
import { emitConfetti } from '../lib/confetti';
import { localDayKey } from '../lib/dayKey';

// ג”€ג”€ג”€ Types ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

export interface ChildProgress {
  childId:             string;
  displayName:         string;
  avatar:              string;
  todayEarned:         number;
  dailyGoal:           number;
  tasksCompleted:      number;
  tasksTotal:          number;
  lessonsCompleted:    number;
  lessonsTotal:        number;
  totalBalance:        number;
  schoolQuestEnabled:  boolean;
  restCardsBalance:    number;
}

// ג”€ג”€ג”€ Helpers ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

// Local calendar day — the daily loop rolls at the child's local midnight,
// not UTC (see src/lib/dayKey.ts / audit C1). Read + write both use this.
const getTodayKey = () => localDayKey();

// ג”€ג”€ג”€ useChildProgress ג€” all children's daily summary ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

export function useChildProgress() {
  const { familyId } = useAuth();
  const [childrenProgress, setChildrenProgress] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChildrenProgress = useCallback(async () => {
    if (!familyId) {
      setChildrenProgress([]);
      setLoading(false);
      return;
    }

    const todayKey = getTodayKey();

    try {
      const { data: children, error: childrenErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('family_id', familyId)
        .eq('role', 'child')
        .eq('is_deleted', false);

      if (childrenErr) {
        console.error('Error fetching children profiles:', childrenErr.message);
        setChildrenProgress([]);
        setLoading(false);
        return;
      }

      if (!children || children.length === 0) {
        setChildrenProgress([]);
        setLoading(false);
        return;
      }

      const progressList = await Promise.all(
        children.map(async child => {
          try {
            const [
              { data: tasksData,    error: tasksErr },
              { data: progressData, error: progressErr },
              { data: childVaultData },
            ] = await Promise.all([
              supabase.from('tasks').select('*').eq('family_id', familyId).eq('assigned_to', child.id),
              supabase.from('daily_progress').select('*').eq('family_id', familyId).eq('date', todayKey).eq('child_id', child.id),
              supabase.from('credit_vault').select('total_balance').eq('family_id', familyId).eq('child_id', child.id).maybeSingle(),
            ]);

            if (tasksErr)    console.warn(`tasks query failed for ${child.id}:`, tasksErr.message);
            if (progressErr) console.warn(`daily_progress query failed for ${child.id}:`, progressErr.message);

            // lesson_progress is optional ג€” silently skip if the table is unavailable
            let lessonProgressData: { completed: boolean; credits?: number }[] = [];
            try {
              const { data, error } = await supabase
                .from('lesson_progress')
                .select('completed, credits')
                .eq('family_id', familyId)
                .eq('date', todayKey)
                .eq('child_id', child.id);
              if (!error && data) lessonProgressData = data;
            } catch { /* lesson_progress table may not exist */ }

            // Vault: child-specific first, fallback to family-wide
            let vaultBalance = childVaultData?.total_balance || 0;
            if (!childVaultData) {
              const { data: familyVaultData } = await supabase
                .from('credit_vault').select('total_balance')
                .eq('family_id', familyId).is('child_id', null).maybeSingle();
              vaultBalance = familyVaultData?.total_balance || 0;
            }

            const completedTaskIds = new Set(
              progressData?.filter(p => p.completed).map(p => p.task_id) || []
            );

            // Off-routine partition (mirrors useChildData): count only the tasks
            // the child is actually expected to do right now, so off-routine rows
            // never inflate tasksTotal as phantom incompletes on a normal day.
            const visibleTasks = (tasksData ?? []).filter(t =>
              isTaskInActivePlan(t.is_off_routine, child.off_routine_until)
            );

            const tasksTotal     = visibleTasks.length;
            const tasksCompleted = visibleTasks.filter(t => completedTaskIds.has(t.id)).length;
            const taskCredits    = visibleTasks
              .filter(t => completedTaskIds.has(t.id))
              .reduce((sum, t) => sum + (t.credits || 0), 0);

            const schoolQuestEnabled = child.school_quest_enabled ?? true;
            const lessonsTotal       = schoolQuestEnabled ? 8 : 0;
            const lessonsCompleted   = schoolQuestEnabled ? lessonProgressData.filter(l => l.completed).length : 0;
            const lessonCredits      = schoolQuestEnabled
              ? lessonProgressData.filter(l => l.completed).reduce((sum, l) => sum + (l.credits || 10), 0)
              : 0;

            const petState         = child.pet_state as Record<string, unknown> | null;
            const restCardsBalance = (petState?.rest_cards_balance as number) ?? 1;

            return {
              childId:           child.id,
              displayName:       child.display_name,
              avatar:            child.avatar || 'נ€',
              todayEarned:       taskCredits + lessonCredits,
              dailyGoal:         child.daily_goal || 100,
              tasksCompleted,
              tasksTotal,
              lessonsCompleted,
              lessonsTotal,
              totalBalance:      vaultBalance,
              schoolQuestEnabled,
              restCardsBalance,
            };
          } catch (childErr) {
            console.warn(`Failed to load progress for child ${child.id}:`, childErr);
            // Return a safe default so other children still render
            return {
              childId:           child.id,
              displayName:       child.display_name,
              avatar:            child.avatar || 'נ€',
              todayEarned: 0, dailyGoal: 100,
              tasksCompleted: 0, tasksTotal: 0,
              lessonsCompleted: 0, lessonsTotal: 0,
              totalBalance: 0, schoolQuestEnabled: true, restCardsBalance: 1,
            };
          }
        })
      );

      setChildrenProgress(progressList);
    } catch (err) {
      console.error('Error fetching children progress:', err);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchChildrenProgress();
  }, [fetchChildrenProgress]);

  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`children-progress-${familyId}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress'  }, () => fetchChildrenProgress())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress' }, () => fetchChildrenProgress())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_vault'    }, () => fetchChildrenProgress())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, fetchChildrenProgress]);

  return { childrenProgress, loading, refetch: fetchChildrenProgress };
}

// ג”€ג”€ג”€ useChildData ג€” full task/timetable/rewards data for one child ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

export function useChildData(childId: string | null) {
  const { familyId, profile } = useAuth();
  // Read the mode null-safely (useMode() throws outside a provider; some unit
  // tests render child screens without one). Drives daily_progress.source in
  // completeTask below.
  const isChildPreview = useContext(ModeContext)?.isChildPreview ?? false;
  const [tasks,               setTasks]               = useState<Task[]>([]);
  const [totalBalance,        setTotalBalance]         = useState(0);
  const [dailyGoal,           setDailyGoal]            = useState(100);
  const [schoolQuestEnabled,  setSchoolQuestEnabled]   = useState(true);
  const [schoolEndTime,       setSchoolEndTime]        = useState<string | null>(null);
  const [offRoutineActive,    setOffRoutineActive]     = useState(false);
  const [loading,             setLoading]              = useState(true);

  const todayKey = getTodayKey();

  const fetchChildData = useCallback(async () => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
    }

    try {
      const { data: tasksData, error: tasksQueryErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .eq('assigned_to', childId)
        .order('time');

      console.log(
        '[useChildData] raw tasks from Supabase:',
        'count=', tasksData?.length ?? 0,
        'error=', tasksQueryErr?.message ?? 'none',
        '\nrows=', JSON.stringify(
          (tasksData ?? []).map(t => ({
            id:            t.id,
            title:         t.title,
            time:          t.time,
            category:      t.category,
            schedule_days: t.schedule_days,
            assigned_to:   t.assigned_to,
            credits:       t.credits,
          })),
          null, 2
        )
      );

      const { data: progressData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .eq('date', todayKey)
        .eq('child_id', childId);

      const { data: vaultData } = await supabase
        .from('credit_vault')
        .select('*')
        .eq('family_id', familyId)
        .eq('child_id', childId)
        .maybeSingle();

      const { data: childProfile } = await supabase
        .from('profiles')
        .select('daily_goal, school_quest_enabled, school_end_time')
        .eq('id', childId)
        .single();

      // Off-routine flag in its OWN query ג€” decoupled from the combined select
      // above so it stays correct even if that select fails on an optional column.
      const { data: offRow } = await supabase
        .from('profiles')
        .select('off_routine_until')
        .eq('id', childId)
        .maybeSingle();

      const completedTaskIds = new Set(
        progressData?.filter(p => p.completed).map(p => p.task_id) || []
      );

      const completedAtMap = new Map<string, string>(
        progressData
          ?.filter(p => p.completed && p.updated_at)
          .map(p => [p.task_id as string, p.updated_at as string]) || []
      );

      const mappedTasks: Task[] = (tasksData || []).map(t => ({
        id:           t.id,
        title:        t.title,
        time:         t.time,
        category:     t.category as Task['category'],
        credits:      t.credits,
        description:  t.description || undefined,
        icon:         t.icon || undefined,
        completed:    completedTaskIds.has(t.id),
        completedAt:  completedAtMap.has(t.id) ? new Date(completedAtMap.get(t.id)!) : undefined,
        assignedTo:   t.assigned_to || undefined,
        strategyId:   t.strategy_id || undefined,
        // Preserve an explicit [] (parent paused the task ג†’ hidden); only
        // null/undefined falls back to every-day. Mirrors taskSchedule.ts.
        scheduleDays: Array.isArray(t.schedule_days)
                        ? t.schedule_days
                        : [0, 1, 2, 3, 4, 5, 6],
        hideOnWeekend: t.hide_on_weekend ?? false,
        isOffRoutine:  t.is_off_routine ?? false,
        dueDate:      t.due_date ?? undefined,
        createdByChild: t.created_by_child ?? false,
      }));

      // Off-routine partition (single source of truth for all child screens):
      // when the child's off-routine day is active, show ONLY off-routine tasks;
      // otherwise show ONLY routine tasks. The per-screen scheduleDays/hideOnWeekend
      // filters then run unchanged on the already-partitioned set. Pause supersedes
      // at the screen level (screens short-circuit to PauseEmptyState before the list).
      const until = (offRow as { off_routine_until?: string | null } | null)?.off_routine_until;
      setOffRoutineActive(isOffRoutineActive(until));
      setTasks(mappedTasks.filter(t => isTaskInActivePlan(t.isOffRoutine, until)));
      setTotalBalance(vaultData?.total_balance || 0);
      setDailyGoal(childProfile?.daily_goal || 100);
      setSchoolQuestEnabled(childProfile?.school_quest_enabled ?? true);
      setSchoolEndTime(childProfile?.school_end_time || null);
    } catch (err) {
      console.error('Error fetching child data:', err);
    } finally {
      setLoading(false);
    }
  }, [familyId, childId, todayKey]);

  useEffect(() => {
    setLoading(true);
    fetchChildData();
  }, [fetchChildData]);

  // Live task updates: parent edits (pause via schedule_days=[], time/title/day
  // changes) must reach an open child session without a restart — the
  // 2026-07-06 report: "I paused a task and it still shows for my daughter".
  // `tasks` was added to the supabase_realtime publication in migration 040;
  // RLS scopes events to the subscriber's own family, and the filter narrows
  // the stream further. (daily_progress/lesson_progress/credit_vault above are
  // NOT in the publication — those older subscriptions never fire; flagged in
  // INTEGRATION_LEARNINGS rather than silently expanded here.)
  useEffect(() => {
    if (!familyId || !childId) return;

    const channel = supabase
      .channel(`child-tasks-${childId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
        () => fetchChildData(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, childId, fetchChildData]);

  // Belt-and-suspenders: refetch when the app returns to the foreground, so an
  // own-device child whose realtime socket dropped in the background still
  // sees fresh tasks the moment they reopen the app. (AppState maps to the
  // page visibility API on web — same signal on both platforms.)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchChildData();
    });
    return () => sub.remove();
  }, [fetchChildData]);

  // ג”€ג”€ Vault ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

  // Atomic balance change via the adjust_credit_vault RPC (migration 021).
  // Replaces the old read-modify-write of total_balance, which raced: two
  // concurrent credits both read the same old value and the second clobbered
  // the first, silently losing BUFFs. The RPC does one server-side UPDATE and
  // returns the authoritative new balance. Deductions floor at 0 server-side.
  // Write errors are never swallowed ג€” an own-device child whose RLS blocks the
  // write must surface it, not silently revert on reload (IN-2026-06-06-01/02).
  const adjustBalance = useCallback(async (delta: number, reason: string) => {
    if (!childId || delta === 0) return;

    const { data, error } = await supabase.rpc('adjust_credit_vault', {
      p_child_id: childId,
      p_delta:    delta,
      p_reason:   reason,
    });

    if (error) {
      console.error('[useChildData] adjust_credit_vault failed (balance not persisted):', error);
      return;
    }
    const res = data as { ok: boolean; new_balance?: number; error?: string } | null;
    if (!res?.ok) {
      console.error('[useChildData] adjust_credit_vault rejected:', res?.error);
      return;
    }
    if (typeof res.new_balance === 'number') setTotalBalance(res.new_balance);
  }, [childId]);

  // ג”€ג”€ Task completion ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

  const completeTask = useCallback(async (taskId: string) => {
    if (!familyId || !childId) return;

    // Source of truth is the DB row, not the optimistic React state. Crediting
    // BUFFs must only happen on a real falseג†’true transition ג€” otherwise a task
    // that renders as incomplete while its daily_progress row is already
    // completed (e.g. the day-filtering divergence between child screens) lets a
    // kid re-tap the same task and bank credits on every tap. The upsert itself
    // is idempotent (unique index, migration 016) but the vault credit was not.
    const { data: existing } = await supabase
      .from('daily_progress')
      .select('completed')
      .eq('family_id', familyId).eq('child_id', childId)
      .eq('date', todayKey).eq('task_id', taskId)
      .maybeSingle();
    const wasComplete = existing?.completed === true;

    // Celebrate a real incompleteג†’complete transition (covers both Mint + Gamer
    // and every screen, since all completion funnels through here). Gated on
    // !wasComplete so a re-tap of an already-done task stays silent. Best-effort:
    // an app-root confetti burst + a "+N ג¡" reward float (BUFFs just earned).
    if (!wasComplete) {
      emitConfetti(tasks.find(t => t.id === taskId)?.credits ?? 0);
    }

    const now = new Date();
    // Optimistic UI update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: true, completedAt: now } : t
    ));

    // Actor attribution (pkg/parent-ia-and-aha Phase 1) — the AHA proxy needs to
    // know WHO completed the task. 'child_device' = an authenticated child on
    // their own device (the only value that counts as unprompted); 'view_as_child'
    // = a parent driving the child screens (never counts); 'parent' = a parent
    // marking on a parent surface. Written on completion only, never on
    // uncomplete, so an undo can't clobber the original completer's source.
    const source =
      profile?.role === 'child' ? 'child_device'
      : isChildPreview          ? 'view_as_child'
      : 'parent';

    const { error } = await supabase.from('daily_progress').upsert(
      { family_id: familyId, child_id: childId, date: todayKey, task_id: taskId, completed: true, completed_at: now.toISOString(), source },
      { onConflict: 'family_id,child_id,date,task_id' }
    );

    if (!error && !wasComplete) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await adjustBalance(task.credits, 'task_complete');
      }
      // Advance the pet/streak state on a real incompleteג†’complete transition.
      // Idempotent per day (the streak only bumps once a calendar day), so it's
      // safe to call on every completed task; an unknown task still records
      // "did something today" and accrues the minimum XP floor.
      await applyTaskCompletionToPet(task?.credits ?? 0);
    }
  }, [familyId, childId, todayKey, tasks, adjustBalance, profile?.role, isChildPreview]);

  const uncompleteTask = useCallback(async (taskId: string) => {
    if (!familyId || !childId) return;

    // Symmetric to completeTask: only debit on a real trueג†’false transition, so
    // repeated taps on an already-incomplete task can never drive the balance
    // negative or double-debit.
    const { data: existing } = await supabase
      .from('daily_progress')
      .select('completed')
      .eq('family_id', familyId).eq('child_id', childId)
      .eq('date', todayKey).eq('task_id', taskId)
      .maybeSingle();
    const wasComplete = existing?.completed === true;

    // Optimistic UI update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
    ));

    const { error } = await supabase.from('daily_progress').upsert(
      { family_id: familyId, child_id: childId, date: todayKey, task_id: taskId, completed: false, completed_at: null },
      { onConflict: 'family_id,child_id,date,task_id' }
    );

    if (!error && wasComplete) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await adjustBalance(-task.credits, 'task_uncomplete');
      }
    }
  }, [familyId, childId, todayKey, tasks, adjustBalance]);

  // ג”€ג”€ Task CRUD ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

  const addTask = useCallback(async (
    task: Omit<Task, 'id' | 'completed' | 'completedAt'>,
    // pkg/teen-autonomy: when a teen self-authors a task, pass createdByChild so
    // the row is provenance-tagged (unlocks their edit/delete affordances) and
    // the server stamp forces credits to 0 (parent prices it later). Defaults to
    // false so the parent create path is unchanged.
    opts?: { createdByChild?: boolean },
  ) => {
    if (!familyId || !childId) return;

    const { data } = await supabase
      .from('tasks')
      .insert({
        family_id:     familyId,
        assigned_to:   childId,
        title:         task.title,
        time:          task.time,
        category:      task.category,
        credits:       task.credits,
        description:   task.description,
        icon:          task.icon,
        strategy_id:   task.strategyId || null,
        schedule_days: task.scheduleDays || [0, 1, 2, 3, 4, 5, 6], // default: every day (incl. Fri+Sat)
        due_date:      task.dueDate ?? null,
        created_by_child: opts?.createdByChild ?? false,
      })
      .select()
      .single();

    if (data) {
      setTasks(prev => [...prev, {
        id:           data.id,
        title:        data.title,
        time:         data.time,
        category:     data.category as Task['category'],
        credits:      data.credits,
        description:  data.description || undefined,
        completed:    false,
        assignedTo:   data.assigned_to || undefined,
        strategyId:   data.strategy_id || undefined,
        scheduleDays: (Array.isArray(data.schedule_days) && data.schedule_days.length > 0) ? data.schedule_days : [0, 1, 2, 3, 4, 5, 6],
        dueDate:      data.due_date ?? undefined,
        createdByChild: data.created_by_child ?? false,
      }].sort((a, b) => a.time.localeCompare(b.time)));
    }
  }, [familyId, childId]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!familyId) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));

    const dbUpdates: Record<string, unknown> = {};
    if (updates.title        !== undefined) dbUpdates.title         = updates.title;
    if (updates.time         !== undefined) dbUpdates.time          = updates.time;
    if (updates.category     !== undefined) dbUpdates.category      = updates.category;
    if (updates.credits      !== undefined) dbUpdates.credits       = updates.credits;
    if (updates.description  !== undefined) dbUpdates.description   = updates.description;
    if (updates.scheduleDays !== undefined) dbUpdates.schedule_days = updates.scheduleDays;
    if (updates.dueDate      !== undefined) dbUpdates.due_date      = updates.dueDate;

    await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
  }, [familyId]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!familyId) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  }, [familyId]);

  return {
    tasks,
    totalBalance,
    dailyGoal,
    schoolQuestEnabled,
    schoolEndTime,
    offRoutineActive,
    loading,
    completeTask,
    uncompleteTask,
    addTask,
    updateTask,
    deleteTask,
    adjustBalance,
    refetch: fetchChildData,
  };
}
