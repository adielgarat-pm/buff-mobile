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
  title:           string;
  titleHe:         string;
  description:     string;
  descriptionHe:   string;
  suggestion:      string;
  suggestionHe:    string;
  strategyType?:   'environmental' | 'task-based' | 'self-regulation';
  icon:            string;
  relatedPhase?:   Phase;
  completionRate?: number;
}

// ─── Templates ───────────────────────────────────────────────────────────────

const INSIGHT_TEMPLATES: Record<string, Omit<InsightCard, 'id' | 'completionRate'>> = {
  'morning-low': {
    type: 'phase', severity: 'suggestion', icon: '🌅', relatedPhase: 'morning',
    title: 'Morning Routine Challenge', titleHe: 'אתגר בשגרת הבוקר',
    description: 'Morning tasks have been challenging lately. This is very common with ADHD - mornings require a lot of transitions.',
    descriptionHe: 'משימות הבוקר היו מאתגרות לאחרונה. זה נפוץ מאוד עם ADHD - בקרים דורשים הרבה מעברים.',
    suggestion: 'Try an "Environmental Strategy": Pick out clothes and pack the bag together the night before.',
    suggestionHe: 'נסו "אסטרטגיה סביבתית": הכינו בגדים ותיק יחד בערב שלפני.',
    strategyType: 'environmental',
  },
  'school-low': {
    type: 'phase', severity: 'suggestion', icon: '📚', relatedPhase: 'school',
    title: 'School Day Focus', titleHe: 'ריכוז ביום הלימודים',
    description: 'School day completion is lower than usual. Sustained attention during long school hours is genuinely hard.',
    descriptionHe: 'השלמת יום הלימודים נמוכה מהרגיל. קשב מתמשך במהלך שעות לימוד ארוכות זה באמת קשה.',
    suggestion: 'Ask your child: "Which lesson feels hardest? What would make it 10% easier?"',
    suggestionHe: 'שאלו את הילד: "איזה שיעור מרגיש הכי קשה? מה יכול להקל ב-10%?"',
    strategyType: 'self-regulation',
  },
  'afternoon-low': {
    type: 'phase', severity: 'suggestion', icon: '📖', relatedPhase: 'afternoon',
    title: 'Afternoon Transition', titleHe: 'מעבר אחר הצהריים',
    description: 'Afternoons show lower task completion. After a full school day, executive function is often depleted.',
    descriptionHe: 'אחר הצהריים מראים השלמת משימות נמוכה יותר. אחרי יום לימודים מלא, התפקוד הניהולי מותש.',
    suggestion: 'Build in a "Recharge Window" before homework — 20–30 minutes of physical activity or a snack.',
    suggestionHe: 'הכניסו "חלון טעינה" לפני שיעורי בית. 20-30 דקות פעילות גופנית או חטיף יכולים לעזור.',
    strategyType: 'self-regulation',
  },
  'evening-low': {
    type: 'phase', severity: 'suggestion', icon: '🌙', relatedPhase: 'evening',
    title: 'Evening Wind-Down', titleHe: 'רגיעת הערב',
    description: 'Evening routines are showing some struggles. Transitioning to bedtime can be hard when the brain is still buzzing.',
    descriptionHe: 'שגרת הערב מראה כמה קשיים. מעבר לשינה יכול להיות קשה כשהמוח עדיין פעיל.',
    suggestion: 'Create a predictable "Shutdown Ritual": Same order every night — shower → meds → relaxation.',
    suggestionHe: 'צרו "טקס סגירה" צפוי: אותו סדר כל ערב (מקלחת ← תרופות ← הרגעה).',
    strategyType: 'environmental',
  },
  'medication-low': {
    type: 'task', severity: 'attention', icon: '💊',
    title: 'Medication Consistency', titleHe: 'עקביות בתרופות',
    description: 'Medication tasks have been missed recently. Consistency is key for effectiveness.',
    descriptionHe: 'משימות תרופות הוחמצו לאחרונה. עקביות היא המפתח ליעילות.',
    suggestion: 'Link medication to a fixed anchor habit — right after brushing teeth works well.',
    suggestionHe: 'קשרו את התרופות להרגל עוגן קבוע (למשל מיד אחרי צחצוח שיניים).',
    strategyType: 'environmental',
  },
  'hygiene-low': {
    type: 'task', severity: 'suggestion', icon: '🚿',
    title: 'Hygiene Routine Support', titleHe: 'תמיכה בשגרת היגיינה',
    description: 'Hygiene tasks like showering have been challenging. Sensory sensitivities can make these harder.',
    descriptionHe: 'משימות היגיינה כמו מקלחת היו מאתגרות. רגישויות חושיות יכולות להקשות.',
    suggestion: 'Same time, same order. Let your child choose their own soap/shampoo for a sense of control.',
    suggestionHe: 'אותה שעה, אותו סדר. תנו לילד לבחור סבון/שמפו משלו לתחושת שליטה.',
    strategyType: 'environmental',
  },
  'homework-low': {
    type: 'task', severity: 'suggestion', icon: '📝',
    title: 'Homework Initiation', titleHe: 'התחלת שיעורי בית',
    description: 'Starting homework has been difficult. Task initiation is one of the biggest Executive Functioning challenges.',
    descriptionHe: 'התחלת שיעורי בית הייתה קשה. התחלת משימות היא אחד האתגרים הגדולים של תפקודים ניהוליים.',
    suggestion: 'Use the 15-minute rule: commit to just 15 minutes. Starting is always the hardest part.',
    suggestionHe: 'השתמשו בכלל 15 הדקות: התחייבו רק ל-15 דקות. ברגע שמתחילים, המומנטום נבנה.',
    strategyType: 'task-based',
  },
  'positive-streak': {
    type: 'general', severity: 'info', icon: '⭐',
    title: 'Great Progress! 🎉', titleHe: 'התקדמות מצוינת! 🎉',
    description: 'Completion rates have been strong this week. The strategies are working!',
    descriptionHe: 'שיעורי ההשלמה היו חזקים השבוע. האסטרטגיות עובדות!',
    suggestion: 'Celebrate this win together! Ask what\'s been helping and reinforce those patterns.',
    suggestionHe: 'חגגו את ההצלחה יחד! שאלו מה עזר וחזקו את הדפוסים האלה.',
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
