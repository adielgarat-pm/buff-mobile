/**
 * AnchorRecoveryPromptModal — full-screen modal that surfaces when one or
 * more kids have been inactive for 5+ days and a new `anchor_recovery`
 * notification is unread.
 *
 * Source SPEC: docs/sessions/anchor-recovery/SPEC.md § Phase 2 (Parent
 * Prompt UI).
 *
 * Pillar 2 (Positive Coaching) safety:
 *   - Title and body use OQ9 Option C — normalizing framing ("כולנו
 *     צריכים התחלה חדשה לפעמים"), no failure language, no time-elapsed
 *     reference, no "missed" or "inactive" tokens.
 *   - Position: parent as helper, not rescuer.
 *
 * Pillar 3 (Independence-Building):
 *   - Parent dismiss is one click and respected (no re-prompt today).
 *   - The kid never sees this modal.
 *
 * Phase 2 wiring: the Vibe and Meds CTAs LOG ONLY. Actual task creation
 * lands in Phase 3.
 */
import {
  Modal, SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';
import type { AnchorRecoveryNotification } from '../../hooks/useAnchorRecoveryPrompts';

export interface AnchorRecoveryPromptModalProps {
  visible:    boolean;
  prompts:    AnchorRecoveryNotification[];
  /** Called when parent taps "Add Vibe Check" for a specific kid.
   *  Phase 2: logs only. Phase 3: creates a Vibe Check task row. */
  onAddVibe:  (childId: string, childName: string) => void;
  /** Called when parent taps "Add Medication reminder" for a specific kid.
   *  Phase 2: logs only. Phase 3: creates a standalone meds task row. */
  onAddMeds:  (childId: string, childName: string) => void;
  /** Called when parent dismisses without picking either CTA. */
  onDismiss:  () => void;
}

export default function AnchorRecoveryPromptModal({
  visible, prompts, onAddVibe, onAddMeds, onDismiss,
}: AnchorRecoveryPromptModalProps) {
  const { t } = useTranslation();

  // Defensive — modal only renders when there's at least one prompt
  if (prompts.length === 0) return null;

  const isMultiKid = prompts.length > 1;
  const firstChild = prompts[0];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title — Pillar-2 safe framing per OQ9 Option C */}
          <Text style={[styles.title, { color: T.text }]}>
            {t('anchorRecovery.title')}
          </Text>

          {/* Body — names the kid (singular) or refers to "them" (multi) */}
          <Text style={[styles.body, { color: T.textMuted }]}>
            {isMultiKid
              ? t('anchorRecovery.body.multi')
              : t('anchorRecovery.body.single', { name: firstChild.child_name })}
          </Text>

          {/* Per-kid card with two CTAs */}
          {prompts.map(p => (
            <View
              key={p.id}
              style={[styles.childCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}
            >
              {isMultiKid && (
                <Text style={[styles.childName, { color: T.text }]}>{p.child_name}</Text>
              )}

              <TouchableOpacity
                style={[styles.ctaPrimary, { backgroundColor: T.accent }]}
                onPress={() => onAddVibe(p.child_id, p.child_name)}
                accessibilityRole="button"
                accessibilityLabel={t('anchorRecovery.cta.vibe.a11y', { name: p.child_name })}
              >
                <Text style={styles.ctaPrimaryText}>{t('anchorRecovery.cta.vibe')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ctaSecondary, { borderColor: T.accent }]}
                onPress={() => onAddMeds(p.child_id, p.child_name)}
                accessibilityRole="button"
                accessibilityLabel={t('anchorRecovery.cta.meds.a11y', { name: p.child_name })}
              >
                <Text style={[styles.ctaSecondaryText, { color: T.accent }]}>
                  {t('anchorRecovery.cta.meds')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Dismiss — text link at bottom, low visual weight */}
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissBtn}
            accessibilityRole="button"
            accessibilityLabel={t('anchorRecovery.dismiss')}
          >
            <Text style={[styles.dismissText, { color: T.textMuted }]}>
              {t('anchorRecovery.dismiss')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  content:     { padding: 24, paddingTop: 80, paddingBottom: 40 },
  title:       { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  body:        { fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  childCard:   {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  childName:   { fontSize: 17, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  ctaPrimary:  {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaPrimaryText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctaSecondary: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  ctaSecondaryText: { fontSize: 15, fontWeight: '600' },
  dismissBtn:  {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  dismissText: { fontSize: 14, fontWeight: '600' },
});
