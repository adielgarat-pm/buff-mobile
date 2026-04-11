/**
 * Parent Rewards — Zen Mode
 * Parents configure the reward catalog that children spend Buffs on.
 * Buff balances are real data from Supabase via useChildrenDashboard.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { PARENT_THEME as T } from '../../theme';
import { MOCK_REWARDS_PARENT } from '../../mock/data';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';

export default function ParentRewardsScreen() {
  const { children, loading } = useChildrenDashboard();

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.text }]}>Rewards</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: T.accent }]}>
          <Text style={styles.addBtnText}>+ Add Reward</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sub, { color: T.textMuted }]}>
        Children spend Buffs here — collaborative goal-setting, not control.
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        {MOCK_REWARDS_PARENT.map((reward) => (
          <View key={reward.id} style={[styles.rewardCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
            <Text style={styles.rewardIcon}>{reward.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rewardTitle, { color: T.text }]}>{reward.title}</Text>
              <Text style={[styles.rewardDesc, { color: T.textMuted }]}>{reward.description}</Text>
            </View>
            <View style={styles.rewardRight}>
              <View style={[styles.costBadge, { backgroundColor: '#F3E8FF' }]}>
                <Text style={[styles.costText, { color: T.accent }]}>{reward.cost} B</Text>
              </View>
              <TouchableOpacity style={{ marginTop: 6 }}>
                <Text style={{ color: T.textMuted, fontSize: 18 }}>⋯</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Buff balances — real data */}
        <View style={[styles.summaryCard, { backgroundColor: T.accent }]}>
          <Text style={styles.summaryTitle}>⚡ Buff Balances</Text>
          {loading ? (
            <ActivityIndicator color="rgba(255,255,255,0.8)" />
          ) : children.length === 0 ? (
            <Text style={styles.summaryEmpty}>No children yet</Text>
          ) : (
            children.map(child => (
              <View key={child.childId} style={styles.summaryRow}>
                <Text style={styles.summaryEmoji}>{child.avatar}</Text>
                <Text style={styles.summaryName}>{child.displayName}</Text>
                <Text style={styles.summaryAmount}>{child.totalBalance.toLocaleString()} Buffs</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 8 },
  title:        { fontSize: 24, fontWeight: '700' },
  addBtn:       { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnText:   { color: '#fff', fontWeight: '600', fontSize: 14 },
  sub:          { paddingHorizontal: 20, fontSize: 13, marginBottom: 16 },
  content:      { padding: 20, paddingTop: 8 },
  rewardCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, gap: 12 },
  rewardIcon:   { fontSize: 30 },
  rewardTitle:  { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rewardDesc:   { fontSize: 13 },
  rewardRight:  { alignItems: 'flex-end' },
  costBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  costText:     { fontWeight: '700', fontSize: 13 },
  summaryCard:  { borderRadius: 16, padding: 16, marginTop: 8 },
  summaryTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 12 },
  summaryEmpty: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryEmoji: { fontSize: 20, marginRight: 10 },
  summaryName:  { color: 'rgba(255,255,255,0.8)', fontSize: 15, flex: 1 },
  summaryAmount: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
