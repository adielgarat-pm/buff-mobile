/**
 * Child Rewards — Gamer/Mint Mode (Shop)
 * Children spend earned Buffs on rewards configured by their parent.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useChildTheme } from '../../contexts/ThemeContext';
import { MOCK_REWARDS_CHILD, MOCK_MY_CHILD } from '../../mock/data';

export default function ChildRewardsScreen() {
  const T = useChildTheme();
  const buffs = MOCK_MY_CHILD.buffs;

  const handleClaim = (cost: number, title: string) => {
    if (buffs < cost) {
      Alert.alert(
        'Not enough Buffs yet!',
        `You need ${cost - buffs} more Buffs for "${title}". Keep going! 💪`
      );
    } else {
      Alert.alert('🎉 Claimed!', `"${title}" is yours! Your parent will get notified.`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.background }}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.primary }]}>Shop</Text>
        <View style={[styles.walletBadge, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={styles.walletIcon}>⚡</Text>
          <Text style={[styles.walletAmount, { color: T.buff }]}>{buffs.toLocaleString()}</Text>
          <Text style={[styles.walletLabel, { color: T.mutedForeground }]}>Buffs</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionLabel, { color: T.mutedForeground }]}>Available Rewards</Text>

        {MOCK_REWARDS_CHILD.map((reward) => {
          const canAfford = buffs >= reward.cost;
          return (
            <View
              key={reward.id}
              style={[
                styles.rewardCard,
                {
                  backgroundColor: T.card,
                  borderColor: canAfford ? T.primary : T.border,
                  shadowColor: canAfford ? T.shadow : 'transparent',
                },
              ]}
            >
              <Text style={styles.rewardIcon}>{reward.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rewardTitle, { color: T.foreground }]}>{reward.title}</Text>
                <Text style={[styles.rewardDesc, { color: T.mutedForeground }]}>{reward.description}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.claimBtn,
                  {
                    backgroundColor: canAfford ? T.primary : T.muted,
                    borderColor:     canAfford ? T.primary : T.border,
                  },
                ]}
                onPress={() => handleClaim(reward.cost, reward.title)}
              >
                <Text style={[styles.claimPts, { color: canAfford ? T.primaryForeground : T.mutedForeground }]}>
                  {reward.cost}⚡
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Safe Harbour reminder */}
        <View style={[styles.safeCard, { backgroundColor: T.muted, borderColor: T.border }]}>
          <Text style={styles.safeEmoji}>🏰</Text>
          <Text style={[styles.safeText, { color: T.mutedForeground }]}>
            You can only <Text style={{ color: T.success, fontWeight: '700' }}>earn</Text> Buffs — never lose them. Keep going!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:        { fontSize: 26, fontWeight: '900' },
  walletBadge:  { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, gap: 5 },
  walletIcon:   { fontSize: 16 },
  walletAmount: { fontSize: 18, fontWeight: '800' },
  walletLabel:  { fontSize: 12 },
  content:      { padding: 20, paddingTop: 4, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  rewardCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, gap: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 3 },
  rewardIcon:   { fontSize: 30 },
  rewardTitle:  { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  rewardDesc:   { fontSize: 13 },
  claimBtn:     { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  claimPts:     { fontWeight: '700', fontSize: 13 },
  safeCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12, marginTop: 8 },
  safeEmoji:    { fontSize: 24 },
  safeText:     { flex: 1, fontSize: 13, lineHeight: 18 },
});
