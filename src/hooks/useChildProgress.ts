import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types/task';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTodayKey = () => new Date().toISOString().split('T')[0];

// ─── useChildProgress — all children's daily summary ──────────────────────────

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
        .eq('role', 'child');

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

            // lesson_progress is optional — silently skip if the table is unavailable
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

            const tasksTotal     = tasksData?.length || 0;
            const tasksCompleted = tasksData?.filter(t => completedTaskIds.has(t.id)).length || 0;
            const taskCredits    = tasksData
              ?.filter(t => completedTaskIds.has(t.id))
              .reduce((sum, t) => sum + (t.credits || 0), 0) || 0;

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
              avatar:            child.avatar || '🚀',
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
              avatar:            child.avatar || '🚀',
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
      .channel('children-progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_progress'  }, () => fetchChildrenProgress())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_progress' }, () => fetchChildrenProgress())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_vault'    }, () => fetchChildrenProgress())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [familyId, fetchChildrenProgress]);

  return { childrenProgress, loading, refetch: fetchChildrenProgress };
}

// ─── useChildData — full task/timetable/rewards data for one child ─────────────

export function useChildData(childId: string | null) {
  const { familyId } = useAuth();
  const [tasks,               setTasks]               = useState<Task[]>([]);
  const [totalBalance,        setTotalBalance]         = useState(0);
  const [dailyGoal,           setDailyGoal]            = useState(100);
  const [schoolQuestEnabled,  setSchoolQuestEnabled]   = useState(true);
  const [schoolEndTime,       setSchoolEndTime]        = useState<string | null>(null);
  const [loading,             setLoading]              = useState(true);

  const todayKey = getTodayKey();

  const fetchChildData = useCallback(async () => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
    }

    try {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .eq('assigned_to', childId)
        .order('time');

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
        scheduleDays: t.schedule_days || [0, 1, 2, 3, 4],
      }));

      setTasks(mappedTasks);
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

  // ── Task completion ───────────────────────────────────────────────────────

  const completeTask = useCallback(async (taskId: string) => {
    if (!familyId || !childId) return;

    const now = new Date();
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: true, completedAt: now } : t
    ));

    await supabase.from('daily_progress').upsert(
      { family_id: familyId, child_id: childId, date: todayKey, task_id: taskId, completed: true },
      { onConflict: 'family_id,child_id,date,task_id' }
    );
  }, [familyId, childId, todayKey]);

  const uncompleteTask = useCallback(async (taskId: string) => {
    if (!familyId || !childId) return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
    ));

    await supabase.from('daily_progress').upsert(
      { family_id: familyId, child_id: childId, date: todayKey, task_id: taskId, completed: false },
      { onConflict: 'family_id,child_id,date,task_id' }
    );
  }, [familyId, childId, todayKey]);

  // ── Task CRUD ─────────────────────────────────────────────────────────────

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'completed' | 'completedAt'>) => {
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
        schedule_days: task.scheduleDays || [0, 1, 2, 3, 4],
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
        scheduleDays: data.schedule_days || [0, 1, 2, 3, 4],
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

    await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
  }, [familyId]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!familyId) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  }, [familyId]);

  // ── Vault ─────────────────────────────────────────────────────────────────

  const updateTotalBalance = useCallback(async (balance: number) => {
    if (!familyId || !childId) return;

    setTotalBalance(balance);

    const { data: existing } = await supabase
      .from('credit_vault')
      .select('id')
      .eq('family_id', familyId)
      .eq('child_id', childId)
      .maybeSingle();

    if (existing) {
      await supabase.from('credit_vault').update({ total_balance: balance }).eq('id', existing.id);
    } else {
      await supabase.from('credit_vault').insert({ family_id: familyId, child_id: childId, total_balance: balance });
    }
  }, [familyId, childId]);

  return {
    tasks,
    totalBalance,
    dailyGoal,
    schoolQuestEnabled,
    schoolEndTime,
    loading,
    completeTask,
    uncompleteTask,
    addTask,
    updateTask,
    deleteTask,
    updateTotalBalance,
    refetch: fetchChildData,
  };
}
