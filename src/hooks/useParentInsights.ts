import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Phase, getPhaseForTime, PHASES } from '../types/phase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskInsight {
  taskId:         string;
  taskTitle:      string;
  phase:          Phase;
  completionRate: number;
  totalDays:      number;
  completedDays:  number;
}

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
  const [insights,      setInsights]      = useState<InsightCard[]>([]);
  const [phaseInsights, setPhaseInsights] = useState<PhaseInsight[]>([]);
  const [loading,       setLoading]       = useState(true);

  const analyzeCompletionPatterns = useCallback(async () => {
    if (!familyId || !childId) {
      setLoading(false);
      return;
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
          completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
          totalDays,
          completedDays,
        };
      });

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

  return { insights, phaseInsights, loading, refetch: analyzeCompletionPatterns };
}
