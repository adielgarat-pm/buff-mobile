import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Phase, getPhaseForTime, PHASES } from '../types/phase';
import type { TaskCategory } from '../types/task';
import type { InsightFraming } from '../utils/insightFraming';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskInsight {
  taskId:         string;
  taskTitle:      string;
  phase:          Phase;
  /** tasks.category — used by the Insights screen to trigger tips by category
   *  (language-agnostic) instead of fragile title-keyword matching. */
  category:       TaskCategory | null;
  completionRate: number;
  totalDays:      number;
  completedDays:  number;
}

/** Per-category completion, for the Insights screen's targeted tips (Layer C).
 *  `rate` is the avg completion % across that category's tasks; null when the
 *  family has no task in that category. */
export type CategoryStats = Partial<Record<TaskCategory, { rate: number; count: number }>>;

export interface PhaseInsight {
  phase:               Phase;
  phaseLabel:          string;
  phaseIcon:           string;
  avgCompletionRate:   number;
  taskCount:           number;
  lowPerformingTasks:  TaskInsight[];
}

export interface InsightCard {
  id:              string;
  type:            'phase' | 'task' | 'general';
  severity:        'info' | 'suggestion' | 'attention';
  /** Copy lives in i18n at `insights.<i18nKey>.{title,description,suggestion}`. */
  i18nKey:         string;
  strategyType?:   'environmental' | 'task-based' | 'self-regulation';
  icon:            string;
  relatedPhase?:   Phase;
  completionRate?: number;
}

// ─── Templates ───────────────────────────────────────────────────────────────
// Copy (title/description/suggestion) is in src/i18n/{en,he}.json under
// `insights.<id>.*` so it follows the active UI language via t().

const INSIGHT_TEMPLATES: Record<string, Omit<InsightCard, 'id' | 'completionRate'>> = {
  'morning-low': {
    type: 'phase', severity: 'suggestion', icon: '🌅', relatedPhase: 'morning',
    i18nKey: 'morning-low', strategyType: 'environmental',
  },
  'school-low': {
    type: 'phase', severity: 'suggestion', icon: '📚', relatedPhase: 'school',
    i18nKey: 'school-low', strategyType: 'self-regulation',
  },
  'afternoon-low': {
    type: 'phase', severity: 'suggestion', icon: '📖', relatedPhase: 'afternoon',
    i18nKey: 'afternoon-low', strategyType: 'self-regulation',
  },
  'evening-low': {
    type: 'phase', severity: 'suggestion', icon: '🌙', relatedPhase: 'evening',
    i18nKey: 'evening-low', strategyType: 'environmental',
  },
  'medication-low': {
    type: 'task', severity: 'attention', icon: '💊',
    i18nKey: 'medication-low', strategyType: 'environmental',
  },
  'hygiene-low': {
    type: 'task', severity: 'suggestion', icon: '🚿',
    i18nKey: 'hygiene-low', strategyType: 'environmental',
  },
  'homework-low': {
    type: 'task', severity: 'suggestion', icon: '📝',
    i18nKey: 'homework-low', strategyType: 'task-based',
  },
  'positive-streak': {
    type: 'general', severity: 'info', icon: '⭐',
    i18nKey: 'positive-streak',
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useParentInsights(childId: string | null) {
  const { familyId } = useAuth();
  const [insights,       setInsights]       = useState<InsightCard[]>([]);
  const [phaseInsights,  setPhaseInsights]  = useState<PhaseInsight[]>([]);
  const [categoryStats,  setCategoryStats]  = useState<CategoryStats>({});
  const [cachedFraming,  setCachedFraming]  = useState<InsightFraming | null>(null);
  const [loading,        setLoading]        = useState(true);

  // Try to read a pre-computed insight from child_insights (written by pg_cron).
  // Returns true when a valid cached row was found so the caller can skip the
  // expensive real-time computation.
  const fetchCachedInsight = useCallback(async (): Promise<boolean> => {
    if (!childId) return false;
    const { data, error } = await supabase
      .from('child_insights')
      .select('weekly, tip, smart_insight, window_end, tier')
      .eq('child_id', childId)
      .maybeSingle();
    if (error || !data) return false;

    // Treat the cache as stale if it was computed more than 8 days ago
    // (handles the case where a child was inactive all week and the cron
    // still ran but with 0 data — we want a fresh read once they return).
    const windowEnd = new Date(data.window_end);
    const ageMs = Date.now() - windowEnd.getTime();
    if (ageMs > 8 * 24 * 60 * 60 * 1000) return false;

    setCachedFraming({
      weekly: data.weekly as InsightFraming['weekly'],
      tip:    data.tip    as InsightFraming['tip'],
    });
    return true;
  }, [childId]);

  const analyzeCompletionPatterns = useCallback(async () => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
    }

    // Cache hit → skip the heavy 3-query real-time computation.
    // Phase/category breakdowns are still computed live for the detail rows
    // (highlight cards, weekly map) — only the framing + tip come from cache.
    const hit = await fetchCachedInsight();
    if (hit) {
      // Still need phase/category data for the Highlights + weekly map sections.
      // Fall through but don't regenerate the framing.
    }

    try {
      // Last 7 days
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyId)
        .or(`assigned_to.is.null,assigned_to.eq.${childId}`);

      if (!tasksData || tasksData.length === 0) {
        setLoading(false);
        return;
      }

      const { data: progressData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('family_id', familyId)
        .in('date', dates)
        .or(`child_id.is.null,child_id.eq.${childId}`);

      // No progress data yet (brand-new child) — insights would all show 0%,
      // so return empty and let the dashboard show the "unlock after 3 days" card.
      if (!progressData || progressData.length === 0) {
        setLoading(false);
        return;
      }

      // Per-task completion rates
      const taskInsights: TaskInsight[] = tasksData.map(task => {
        const taskProgress   = progressData?.filter(p => p.task_id === task.id) || [];
        const completedDays  = taskProgress.filter(p => p.completed).length;
        const totalDays      = Math.min(dates.length, 5);
        return {
          taskId:         task.id,
          taskTitle:      task.title,
          phase:          getPhaseForTime(task.time),
          category:       (task.category ?? null) as TaskCategory | null,
          completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
          totalDays,
          completedDays,
        };
      });

      // Per-category averages (Layer C targeted tips, by category not keyword).
      const catStats: CategoryStats = {};
      const byCategory = new Map<TaskCategory, TaskInsight[]>();
      for (const ti of taskInsights) {
        if (!ti.category) continue;
        const arr = byCategory.get(ti.category) ?? [];
        arr.push(ti);
        byCategory.set(ti.category, arr);
      }
      byCategory.forEach((arr, cat) => {
        catStats[cat] = {
          rate:  arr.reduce((s, t) => s + t.completionRate, 0) / arr.length,
          count: arr.length,
        };
      });
      setCategoryStats(catStats);

      // Group by phase
      const phaseData: PhaseInsight[] = PHASES.map(phase => {
        const phaseTasks = taskInsights.filter(t => t.phase === phase.id);
        const avgRate    = phaseTasks.length > 0
          ? phaseTasks.reduce((sum, t) => sum + t.completionRate, 0) / phaseTasks.length
          : 100;
        return {
          phase:              phase.id,
          phaseLabel:         phase.label,
          phaseIcon:          phase.icon,
          avgCompletionRate:  avgRate,
          taskCount:          phaseTasks.length,
          lowPerformingTasks: phaseTasks.filter(t => t.completionRate < 50),
        };
      });

      setPhaseInsights(phaseData);

      const generated: InsightCard[] = [];

      // Phase-level insights
      phaseData.forEach(phase => {
        if (phase.avgCompletionRate < 50 && phase.taskCount > 0) {
          const tmpl = INSIGHT_TEMPLATES[`${phase.phase}-low`];
          if (tmpl) generated.push({ ...tmpl, id: `insight-${phase.phase}`, completionRate: Math.round(phase.avgCompletionRate) });
        }
      });

      // Medication
      const medTasks = taskInsights.filter(t =>
        t.taskTitle.toLowerCase().includes('med') || t.taskTitle.includes('תרופ')
      );
      if (medTasks.length > 0 && medTasks.some(t => t.completionRate < 60)) {
        const tmpl = INSIGHT_TEMPLATES['medication-low'];
        if (tmpl) generated.push({ ...tmpl, id: 'insight-medication',
          completionRate: Math.round(medTasks.reduce((s, t) => s + t.completionRate, 0) / medTasks.length) });
      }

      // Hygiene
      const hygTasks = taskInsights.filter(t =>
        t.taskTitle.toLowerCase().includes('shower') ||
        t.taskTitle.includes('מקלחת') ||
        t.taskTitle.toLowerCase().includes('hygiene')
      );
      if (hygTasks.length > 0 && hygTasks.some(t => t.completionRate < 50)) {
        const tmpl = INSIGHT_TEMPLATES['hygiene-low'];
        if (tmpl) generated.push({ ...tmpl, id: 'insight-hygiene',
          completionRate: Math.round(hygTasks.reduce((s, t) => s + t.completionRate, 0) / hygTasks.length) });
      }

      // Homework
      const hwTasks = taskInsights.filter(t =>
        t.taskTitle.toLowerCase().includes('homework') ||
        t.taskTitle.toLowerCase().includes('study') ||
        t.taskTitle.includes('שיעורי בית') ||
        t.taskTitle.includes('למידה')
      );
      if (hwTasks.length > 0 && hwTasks.some(t => t.completionRate < 50)) {
        const tmpl = INSIGHT_TEMPLATES['homework-low'];
        if (tmpl) generated.push({ ...tmpl, id: 'insight-homework',
          completionRate: Math.round(hwTasks.reduce((s, t) => s + t.completionRate, 0) / hwTasks.length) });
      }

      // Positive streak
      const overallRate = taskInsights.length > 0
        ? taskInsights.reduce((s, t) => s + t.completionRate, 0) / taskInsights.length
        : 0;
      if (overallRate >= 70 && generated.length === 0) {
        generated.push({ ...INSIGHT_TEMPLATES['positive-streak'], id: 'insight-positive', completionRate: Math.round(overallRate) });
      }

      setInsights(generated.slice(0, 5));
    } catch (err) {
      console.error('Error analyzing insights:', err);
    } finally {
      setLoading(false);
    }
  }, [familyId, childId]);

  useEffect(() => {
    analyzeCompletionPatterns();
  }, [analyzeCompletionPatterns]);

  return { insights, phaseInsights, categoryStats, cachedFraming, loading, refetch: analyzeCompletionPatterns };
}
