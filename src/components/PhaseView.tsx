import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Phase, PhaseConfig, getPhaseConfig, getSmartPhaseForTime } from '../types/phase';
import { Task } from '../types/task';
import { PhaseProgressCircle } from './PhaseProgressCircle';
import { PhaseTaskCard } from './PhaseTaskCard';
import { useChildTheme } from '../contexts/ThemeContext';
import { isTaskVisibleToday } from '../utils/taskSchedule';

interface Props {
  phase:          Phase;
  tasks:          Task[];
  /** School end time in HH:MM format, e.g. "14:00". Null = default 14:00. */
  schoolEndTime?: string | null;
  /** False on weekends or when school quest is disabled. */
  isSchoolDay?:   boolean;
  /** True on weekend days (Sat always; Fri unless friday_enabled). Hides hideOnWeekend tasks. */
  isWeekend?:     boolean;
  onCompleteTask:   (id: string) => void;
  onUncompleteTask: (id: string) => void;
  /** Passed through to PhaseTaskCard — disables haptics when false. */
  hapticsEnabled?:  boolean;
}

export function PhaseView({
  phase,
  tasks,
  schoolEndTime   = null,
  isSchoolDay     = true,
  isWeekend       = false,
  onCompleteTask,
  onUncompleteTask,
  hapticsEnabled  = true,
}: Props) {
  const T           = useChildTheme();
  const phaseConfig = getPhaseConfig(phase);

  // Day-visibility (schedule day + weekend hide) via the shared rule, then
  // bucket into this phase using the same getSmartPhaseForTime logic as the web app.
  const phaseTasks = useMemo(() => {
    return tasks.filter(task =>
      isTaskVisibleToday(task, !!isWeekend) &&
      getSmartPhaseForTime(task.time, schoolEndTime, isSchoolDay) === phase,
    );
  }, [tasks, phase, schoolEndTime, isSchoolDay, isWeekend]);

  const completedTasks  = phaseTasks.filter(t => t.completed);
  const earnedCredits   = completedTasks.reduce((sum, t) => sum + t.credits, 0);
  const totalCredits    = phaseTasks.reduce((sum, t) => sum + t.credits, 0);

  return (
    <View style={[styles.container, { backgroundColor: T.background }]}>
      {/* Progress circle */}
      <View style={styles.circleWrap}>
        <PhaseProgressCircle
          phase={phaseConfig}
          completed={completedTasks.length}
          total={phaseTasks.length}
          earnedCredits={earnedCredits}
          totalCredits={totalCredits}
        />
      </View>

      {/* Task list */}
      {phaseTasks.length > 0 ? (
        <View style={styles.taskList}>
          <Text style={[styles.sectionLabel, { color: T.mutedForeground }]}>Tasks</Text>
          {phaseTasks.map(task => (
            <PhaseTaskCard
              key={task.id}
              task={task}
              phase={phaseConfig}
              onComplete={onCompleteTask}
              onUncomplete={onUncompleteTask}
              hapticsEnabled={hapticsEnabled}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{phaseConfig.icon}</Text>
          <Text style={[styles.emptyText, { color: T.mutedForeground }]}>
            No tasks for this phase
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  circleWrap:   { alignItems: 'center', paddingVertical: 20 },
  taskList:     { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  emptyState:   { alignItems: 'center', paddingTop: 48 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 15 },
});
