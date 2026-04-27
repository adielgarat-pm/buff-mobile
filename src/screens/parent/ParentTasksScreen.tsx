/**
 * Parent Tasks
 * Shows all tasks grouped by phase for the selected child.
 * Data comes from Supabase via useChildrenDashboard + useChildData.
 */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useChildData } from '../../hooks/useChildProgress';
import { PHASES, type Phase } from '../../types/phase';
import PhilosophyTip from '../../components/PhilosophyTip';

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
  const { children, loading: childrenLoading } = useChildrenDashboard();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Auto-select first child once the list loads
  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].childId);
    }
  }, [children, selectedChildId]);

  const { tasks, loading: tasksLoading } = useChildData(selectedChildId);

  const isLoading = childrenLoading || (!!selectedChildId && tasksLoading);

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.text }]}>{t('parentTasks.title')}</Text>
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

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.centered}>
          <PhilosophyTip tipKey="tips.firstTask" dismissible />
          <Text style={{ color: T.textMuted }}>{t('parentTasks.empty')}</Text>
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
                  <View key={task.id} style={[styles.taskRow, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                    <View style={[styles.checkCircle, task.completed && { backgroundColor: T.success, borderColor: T.success }]}>
                      {task.completed && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, { color: task.completed ? T.textMuted : T.text }]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskMeta, { color: T.textMuted }]}>
                        {task.time} · {task.credits} Buffs
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  title:         { fontSize: 24, fontWeight: '700' },
  childSelector: { paddingHorizontal: 16, marginBottom: 8, maxHeight: 60 },
  childTab:      { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, backgroundColor: '#F3F4F6', gap: 6 },
  childTabEmoji: { fontSize: 16 },
  childTabName:  { fontSize: 14, fontWeight: '600' },
  content:       { padding: 20, paddingTop: 8 },
  stageSection:  { marginBottom: 20 },
  stageLabel:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  taskRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12 },
  checkCircle:   { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  taskTitle:     { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  taskMeta:      { fontSize: 12 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
