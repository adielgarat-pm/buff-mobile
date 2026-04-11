/**
 * Parent Dashboard — Zen Mode
 * Shows an overview of all children's progress today + an insight card.
 */
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { PARENT_THEME as T } from '../../theme';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useParentInsights } from '../../hooks/useParentInsights';

export default function ParentDashboardScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { enterChildPreview } = useMode();

  const { children, loading: childrenLoading } = useChildrenDashboard();

  // Use first child for insights
  const firstChildId = children[0]?.childId ?? null;
  const { insights, loading: insightsLoading } = useParentInsights(firstChildId);
  const topInsight = insights[0] ?? null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: T.bg }]}
      contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: T.textMuted }]}>{t('dashboard.goodMorning')}</Text>
          <Text style={[styles.name, { color: T.text }]}>{profile?.display_name ?? t('parent.overview')} 👋</Text>
        </View>
        <TouchableOpacity style={styles.previewBtn} onPress={enterChildPreview}>
          <Text style={styles.previewBtnText}>👶 {t('overview.viewAsChild')}</Text>
        </TouchableOpacity>
      </View>

      {/* Insight card */}
      {insightsLoading ? (
        <View style={[styles.insightCard, { backgroundColor: T.accent, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : topInsight ? (
        <View style={[styles.insightCard, { backgroundColor: T.accent }]}>
          <Text style={styles.insightTag}>{topInsight.icon} {t('parent.insights')}</Text>
          <Text style={styles.insightStat}>
            {topInsight.completionRate !== undefined ? `${topInsight.completionRate}%` : '—'}
          </Text>
          <Text style={styles.insightLabel}>{topInsight.title}</Text>
          <Text style={styles.insightDesc}>{topInsight.description}</Text>
          <Text style={styles.insightTip}>💬 {topInsight.suggestion}</Text>
        </View>
      ) : (
        <View style={[styles.insightCard, { backgroundColor: T.accent }]}>
          <Text style={styles.insightTag}>📊 {t('parent.insights')}</Text>
          <Text style={styles.insightStat}>—</Text>
          <Text style={styles.insightLabel}>{t('dashboard.noInsightData')}</Text>
          <Text style={styles.insightTip}>💬 {t('dashboard.keepLogging')}</Text>
        </View>
      )}

      {/* Children cards */}
      <Text style={[styles.sectionTitle, { color: T.textMuted }]}>{t('dashboard.today')}</Text>

      {childrenLoading ? (
        <ActivityIndicator color={T.accent} style={{ marginTop: 20 }} />
      ) : children.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
          <Text style={[styles.emptyText, { color: T.textMuted }]}>{t('parent.noChildren')}</Text>
        </View>
      ) : (
        children.map(child => {
          const pct    = child.tasksTotal > 0 ? Math.round((child.tasksCompleted / child.tasksTotal) * 100) : 0;
          const atGoal = pct >= 70;
          return (
            <View key={child.childId} style={[styles.childCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
              <View style={styles.childHeader}>
                <Text style={styles.childAvatar}>{child.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.childName, { color: T.text }]}>{child.displayName}</Text>
                  <Text style={[styles.childSub, { color: T.textMuted }]}>
                    {child.tasksCompleted}/{child.tasksTotal} {t('overview.tasks')} · ⚡ {child.totalBalance.toLocaleString()} {t('parentSettings.buffPoints')}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: atGoal ? '#ECFDF5' : '#FEF3C7' }]}>
                  <Text style={{ color: atGoal ? T.success : '#D97706', fontSize: 12, fontWeight: '700' }}>
                    {pct}%
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[styles.barTrack, { backgroundColor: T.cardBorder }]}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: atGoal ? T.success : T.accentLight }]} />
              </View>
              <View style={styles.goalRow}>
                <Text style={[styles.goalText, { color: T.textMuted }]}>{t('weeklyGoal.goal70')}</Text>
                <View style={styles.goalMark} />
              </View>

              {/* Quick actions */}
              <View style={styles.childActions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: T.cardBorder }]}>
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>{t('dashboard.bonus')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: T.cardBorder }]}>
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>🎴 {t('sticker.send')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  content:       { padding: 20, paddingTop: 52, paddingBottom: 32 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting:      { fontSize: 14 },
  name:          { fontSize: 22, fontWeight: '700' },
  previewBtn:    { backgroundColor: '#F3E8FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  previewBtnText: { color: '#6D28D9', fontSize: 13, fontWeight: '600' },
  insightCard:   { borderRadius: 16, padding: 18, marginBottom: 24, minHeight: 80 },
  insightTag:    { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 },
  insightStat:   { color: '#fff', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  insightLabel:  { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  insightDesc:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 10 },
  insightTip:    { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontStyle: 'italic' },
  sectionTitle:  { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  emptyCard:     { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center' },
  emptyText:     { fontSize: 14 },
  childCard:     { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  childHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  childAvatar:   { fontSize: 30, marginRight: 12 },
  childName:     { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  childSub:      { fontSize: 13 },
  badge:         { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  barTrack:      { height: 6, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  barFill:       { height: '100%', borderRadius: 3 },
  goalRow:       { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 14 },
  goalText:      { fontSize: 11 },
  goalMark:      { width: 2, height: 8, backgroundColor: '#E5E7EB', marginLeft: 4 },
  childActions:  { flexDirection: 'row', gap: 10 },
  actionBtn:     { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
});
