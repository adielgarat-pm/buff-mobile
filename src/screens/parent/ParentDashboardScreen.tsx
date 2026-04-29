/**
 * Parent Dashboard — Zen Mode
 *
 * FIX 1  — Insights empty state: shows "unlock after 3 days" when no data yet
 * FIX 2B — Greeting uses first name (display_name || email prefix || 'there')
 * FIX 3  — "+ Add Child" button; always shows paywall (isSubscribed = false)
 * FIX 4  — Bonus modal (amount + note → credit_vault + bonus_log)
 *           Send Sticker → Alert placeholder
 */
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AppModal from '../../components/AppModal';
import DisclaimerFooter from '../../components/DisclaimerFooter';
import PhilosophyTip from '../../components/PhilosophyTip';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { PARENT_THEME as T } from '../../theme';
import { useChildrenDashboard } from '../../hooks/useChildrenDashboard';
import { useParentInsights } from '../../hooks/useParentInsights';
import { useSubscription } from '../../hooks/useSubscription';
import { useUnlinkedChildren } from '../../hooks/useUnlinkedChildren';
import LinkChildModal from '../../components/LinkChildModal';
import { supabase } from '../../integrations/supabase/client';
import type { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

const QUICK_AMOUNTS = [10, 20, 50, 100];

export default function ParentDashboardScreen() {
  const navigation                         = useNavigation<Nav>();
  const { t }                              = useTranslation();
  const { profile, user, familyId }        = useAuth();
  const { enterChildPreview }              = useMode();
  const { children, loading: childrenLoading, refetch } = useChildrenDashboard();
  const { isSubscribed }                   = useSubscription();
  const { unlinked, linkable, linkChild }  = useUnlinkedChildren();
  const [linkTarget, setLinkTarget]        = useState<typeof unlinked[0] | null>(null);
  const autoLinkedRef                      = useRef(false);

  // Auto-link when possible; show modal only if no match found
  useEffect(() => {
    if (autoLinkedRef.current || unlinked.length === 0 || linkable.length === 0) return;

    const child = unlinked[0];

    // 1. Exact 1:1 match
    if (linkable.length === 1) {
      autoLinkedRef.current = true;
      linkChild(child, linkable[0].id).then(({ error }) => {
        if (!error) refetch();
        else autoLinkedRef.current = false;
      });
      return;
    }

    // 2. Multiple profiles — try name match (case-insensitive)
    const childName = child.displayName.trim().toLowerCase();
    const nameMatch = linkable.find(p =>
      p.displayName.trim().toLowerCase() === childName
    );

    if (nameMatch) {
      autoLinkedRef.current = true;
      linkChild(child, nameMatch.id).then(({ error }) => {
        if (!error) refetch();
        else autoLinkedRef.current = false;
      });
      return;
    }

    // 3. No match — open modal for parent to choose
    setLinkTarget(child);
  }, [unlinked, linkable, linkChild, refetch]);

  const firstName = profile?.display_name && !profile.display_name.includes('@')
    ? profile.display_name.split(' ')[0]
    : user?.email?.split('@')[0] ?? 'there';

  // Use first child for insights
  const firstChild    = children[0] ?? null;
  const firstChildId  = firstChild?.childId ?? null;
  const { insights, loading: insightsLoading } = useParentInsights(firstChildId);
  const topInsight = insights[0] ?? null;

  // FIX 1 — detect "not enough data yet" for the insights card
  const daysSinceChildCreated = firstChild?.created_at
    ? (Date.now() - new Date(firstChild.created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const showLockedInsights = daysSinceChildCreated < 3;
  const insightsLocked = !insightsLoading && (!topInsight || showLockedInsights);

  // ── FIX 3: paywall ──────────────────────────────────────────────────────
  const handleAddChild = () => {
    if (!isSubscribed && children.length >= 1) {
      navigation.navigate('Paywall', {
        childName: children[0]?.displayName ?? undefined,
      });
      return;
    }
    navigation.navigate('UStep1');
  };

  // ── FIX 4: bonus modal ───────────────────────────────────────────────────
  const [bonusChildId,  setBonusChildId]  = useState<string | null>(null);
  const [bonusAmount,   setBonusAmount]   = useState('20');
  const [bonusNote,     setBonusNote]     = useState('');
  const [bonusSending,  setBonusSending]  = useState(false);
  const [infoModal,     setInfoModal]     = useState<{ icon: string; message: string } | null>(null);

  const openBonus = (childId: string) => {
    setBonusChildId(childId);
    setBonusAmount('20');
    setBonusNote('');
  };

  const sendBonus = async () => {
    if (!bonusChildId || !familyId) return;
    const amount = parseInt(bonusAmount, 10);
    if (isNaN(amount) || amount < 1) return;

    setBonusSending(true);
    try {
      const child = children.find(c => c.childId === bonusChildId);
      const currentBalance = child?.totalBalance ?? 0;
      const newBalance = currentBalance + amount;

      // 1. Update credit_vault (upsert pattern)
      const { data: existing } = await supabase
        .from('credit_vault')
        .select('id')
        .eq('family_id', familyId)
        .eq('child_id', bonusChildId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('credit_vault')
          .update({ total_balance: newBalance })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('credit_vault')
          .insert({ family_id: familyId, child_id: bonusChildId, total_balance: newBalance });
      }

      // 2. Try bonus_log (non-fatal — table may not exist yet)
      try {
        await supabase.from('bonus_log').insert({
          family_id:  familyId,
          child_id:   bonusChildId,
          amount,
          note:       bonusNote.trim() || null,
          created_at: new Date().toISOString(),
        } as never);
      } catch {
        console.warn('[Dashboard] bonus_log insert skipped — table may not exist yet');
      }

      // 3. Refresh children list so balance updates immediately
      refetch();

      setBonusChildId(null);
      setInfoModal({ icon: '⚡', message: t('dashboard.bonusSent') });
    } catch (err) {
      console.error('[Dashboard] sendBonus error:', err);
    } finally {
      setBonusSending(false);
    }
  };

  // ── FIX 4: sticker placeholder ───────────────────────────────────────────
  const handleSticker = (childName: string) => {
    setInfoModal({ icon: '🎴', message: t('dashboard.stickerNotReady', { name: childName }) });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: T.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: T.textMuted }]}>
            {t('dashboard.goodMorning')}
          </Text>
          {/* FIX 2B */}
          <Text style={[styles.name, { color: T.text }]}>{firstName} 👋</Text>
        </View>
        <View style={styles.previewBtn} />
      </View>

      {/* ── Insight card ───────────────────────────────────────────────── */}
      {insightsLoading ? (
        <View style={[styles.insightCard, { backgroundColor: T.accent, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : insightsLocked ? (
        /* FIX 1 — empty / locked state */
        <TouchableOpacity
          style={[styles.insightCard, styles.insightCardLocked]}
          onPress={() => !isSubscribed
            ? navigation.navigate('Paywall', { childName: children[0]?.displayName ?? undefined })
            : undefined
          }
          activeOpacity={isSubscribed ? 1 : 0.8}
        >
          <Text style={styles.insightLockedIcon}>📊</Text>
          <Text style={styles.insightLockedTitle}>{t('dashboard.insightsLocked')}</Text>
          <Text style={styles.insightLockedHint}>{t('dashboard.insightsLockedHint')}</Text>
          {!isSubscribed && (
            <View style={styles.insightUnlockBtn}>
              <Text style={styles.insightUnlockText}>Unlock with Premium ✨</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.insightCard, { backgroundColor: T.accent }]}>
          <Text style={styles.insightTag}>{topInsight!.icon} {t('parent.insights')}</Text>
          <Text style={styles.insightStat}>
            {topInsight!.completionRate !== undefined ? `${topInsight!.completionRate}%` : '—'}
          </Text>
          <Text style={styles.insightLabel}>{topInsight!.title}</Text>
          <Text style={styles.insightDesc}>{topInsight!.description}</Text>
          <Text style={styles.insightTip}>💬 {topInsight!.suggestion}</Text>
        </View>
      )}

      <DisclaimerFooter variant="short" />

      {(children?.some(c => ((c?.tasksTotal ?? 0) - (c?.tasksCompleted ?? 0)) >= 3) ?? false) && (
        <PhilosophyTip tipKey="tips.breakItDown" dismissible />
      )}

      {/* ── Unlinked children banner ───────────────────────────────────── */}
      {unlinked.map(child => (
        <TouchableOpacity
          key={child.id}
          style={styles.unlinkBanner}
          onPress={() => setLinkTarget(child)}
          activeOpacity={0.85}
        >
          <Text style={styles.unlinkBannerText}>
            👋 <Text style={{ fontWeight: '700' }}>{child.displayName}</Text> הצטרף למשפחה — לחץ לחיבור
          </Text>
        </TouchableOpacity>
      ))}

      {/* ── Children section header + Add Child ────────────────────────── */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: T.textMuted }]}>
          {t('dashboard.today')}
        </Text>
        {/* FIX 3 */}
        <TouchableOpacity style={styles.addChildBtn} onPress={handleAddChild}>
          <Text style={[styles.addChildText, { color: T.accent }]}>
            {t('dashboard.addChild')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Children cards ─────────────────────────────────────────────── */}
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
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: T.cardBorder }]}
                  onPress={() => openBonus(child.childId)}
                >
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>{t('dashboard.bonus')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: T.cardBorder }]}
                  onPress={() => handleSticker(child.displayName)}
                >
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>🎴 {t('sticker.send')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: T.cardBorder }]}
                  onPress={() => enterChildPreview(child.childId)}
                >
                  <Text style={[styles.actionBtnText, { color: T.accent }]}>👁 {t('overview.viewAsChild')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* ── Link child modal ─────────────────────────────────────────── */}
      <LinkChildModal
        unlinkedChild={linkTarget}
        linkable={linkable}
        onLink={async (child, targetId) => {
          const result = await linkChild(child, targetId);
          if (!result.error) refetch();
          return result;
        }}
        onDismiss={() => setLinkTarget(null)}
      />

      {/* ── Info modal (replaces Alert.alert) ────────────────────────── */}
      <AppModal
        visible={!!infoModal}
        icon={infoModal?.icon ?? ''}
        message={infoModal?.message ?? ''}
        onClose={() => setInfoModal(null)}
      />

      {/* ── FIX 4: Bonus modal ────────────────────────────────────────── */}
      <Modal
        visible={!!bonusChildId}
        transparent
        animationType="slide"
        onRequestClose={() => setBonusChildId(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setBonusChildId(null)}
          />
          <View style={[styles.bonusSheet, { backgroundColor: T.card }]}>
            {/* Header */}
            <Text style={[styles.bonusTitle, { color: T.text }]}>
              {t('dashboard.bonusModalTitle')}
            </Text>
            <Text style={[styles.bonusSub, { color: T.textMuted }]}>
              {t('dashboard.bonusModalSub', {
                name: children.find(c => c.childId === bonusChildId)?.displayName ?? '',
              })}
            </Text>

            {/* Quick-amount chips */}
            <View style={styles.chipRow}>
              {QUICK_AMOUNTS.map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.chip,
                    { borderColor: T.cardBorder },
                    bonusAmount === String(amt) && { backgroundColor: T.accent, borderColor: T.accent },
                  ]}
                  onPress={() => setBonusAmount(String(amt))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: T.textMuted },
                    bonusAmount === String(amt) && { color: '#fff' },
                  ]}>
                    ⚡{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom amount input */}
            <Text style={[styles.bonusInputLabel, { color: T.textMuted }]}>
              {t('dashboard.bonusAmount')}
            </Text>
            <TextInput
              style={[styles.bonusInput, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={bonusAmount}
              onChangeText={v => setBonusAmount(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
            />

            {/* Note */}
            <Text style={[styles.bonusInputLabel, { color: T.textMuted }]}>
              {t('dashboard.bonusNote')}
            </Text>
            <TextInput
              style={[styles.bonusInput, styles.bonusNoteInput, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
              value={bonusNote}
              onChangeText={setBonusNote}
              placeholder={t('dashboard.bonusNotePlaceholder')}
              placeholderTextColor={T.textMuted}
              maxLength={120}
              multiline
            />

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.bonusConfirm, { backgroundColor: T.accent }, bonusSending && { opacity: 0.6 }]}
              onPress={sendBonus}
              disabled={bonusSending || !bonusAmount || parseInt(bonusAmount, 10) < 1}
            >
              {bonusSending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.bonusConfirmText}>{t('dashboard.bonusConfirm')}</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  content:     { padding: 20, paddingTop: 52, paddingBottom: 32 },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting:     { fontSize: 14 },
  name:         { fontSize: 22, fontWeight: '700' },
  previewBtn:   { backgroundColor: '#F3E8FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  previewBtnText: { color: '#6D28D9', fontSize: 13, fontWeight: '600' },

  // Insight card
  insightCard:       { borderRadius: 16, padding: 18, marginBottom: 24, minHeight: 80 },
  insightCardLocked: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', paddingVertical: 28 },
  insightLockedIcon:  { fontSize: 32, marginBottom: 8 },
  insightLockedTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 6 },
  insightLockedHint:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  insightUnlockBtn:    { marginTop: 12, backgroundColor: T.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7 },
  insightUnlockText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  insightTag:    { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 },
  insightStat:   { color: '#fff', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  insightLabel:  { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  insightDesc:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 10 },
  insightTip:    { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontStyle: 'italic' },

  // Unlinked child banner
  unlinkBanner:     { backgroundColor: '#EDE9FE', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: T.accent },
  unlinkBannerText: { color: T.accent, fontSize: 14, lineHeight: 20 },

  // Section row (title + Add Child)
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  addChildBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#EDE9FE' },
  addChildText: { fontSize: 12, fontWeight: '700' },

  // Child cards
  emptyCard:    { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center' },
  emptyText:    { fontSize: 14 },
  childCard:    { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  childHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  childAvatar:  { fontSize: 30, marginRight: 12 },
  childName:    { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  childSub:     { fontSize: 13 },
  badge:        { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  barTrack:     { height: 6, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 3 },
  goalRow:      { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 14 },
  goalText:     { fontSize: 11 },
  goalMark:     { width: 2, height: 8, backgroundColor: '#E5E7EB', marginLeft: 4 },
  childActions: { flexDirection: 'row', gap: 10 },
  actionBtn:    { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '600' },

  // Shared modal overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },

  // Bonus bottom sheet
  bonusSheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  bonusTitle:       { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  bonusSub:         { fontSize: 13, marginBottom: 18 },
  chipRow:          { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip:             { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  chipText:         { fontSize: 13, fontWeight: '700' },
  bonusInputLabel:  { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  bonusInput:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 14 },
  bonusNoteInput:   { height: 72, textAlignVertical: 'top' },
  bonusConfirm:     { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  bonusConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
