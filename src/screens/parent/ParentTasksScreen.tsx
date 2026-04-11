/**
 * Parent Tasks — Zen Mode
 * Shows all tasks grouped by child and stage. Parents can manage missions here.
 */
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { PARENT_THEME as T } from '../../theme';
import { MOCK_CHILDREN, MOCK_TASKS_PARENT } from '../../mock/data';

const STAGES = ['Morning', 'School', 'Afternoon', 'Evening'] as const;

export default function ParentTasksScreen() {
  const [selectedChild, setSelectedChild] = useState(MOCK_CHILDREN[0].id);

  const childTasks = MOCK_TASKS_PARENT.filter((t) => t.childId === selectedChild);

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.text }]}>Tasks</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: T.accent }]}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Child selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
        {MOCK_CHILDREN.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setSelectedChild(c.id)}
            style={[styles.childTab, selectedChild === c.id && { backgroundColor: T.accent }]}
          >
            <Text style={styles.childTabEmoji}>{c.avatar}</Text>
            <Text style={[styles.childTabName, { color: selectedChild === c.id ? '#fff' : T.textMuted }]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {STAGES.map((stage) => {
          const stageTasks = childTasks.filter((t) => t.stage === stage);
          if (!stageTasks.length) return null;
          return (
            <View key={stage} style={styles.stageSection}>
              <Text style={[styles.stageLabel, { color: T.textMuted }]}>{stage}</Text>
              {stageTasks.map((task) => (
                <View key={task.id} style={[styles.taskRow, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                  <View style={[styles.checkCircle, task.done && { backgroundColor: T.success, borderColor: T.success }]}>
                    {task.done && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, { color: task.done ? T.textMuted : T.text }]}>
                      {task.title}
                    </Text>
                    <Text style={[styles.taskMeta, { color: T.textMuted }]}>{task.time} · {task.points} Buffs</Text>
                  </View>
                  <TouchableOpacity>
                    <Text style={{ color: T.textMuted, fontSize: 18 }}>⋯</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  title:         { fontSize: 24, fontWeight: '700' },
  addBtn:        { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText:    { color: '#fff', fontWeight: '600', fontSize: 14 },
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
});
