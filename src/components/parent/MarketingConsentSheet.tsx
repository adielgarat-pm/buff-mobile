/**
 * MarketingConsentSheet — the one-time email opt-in ask.
 *
 * Shown once to a parent who was never asked (the Google-OAuth path skips the
 * signup checkbox entirely). See `useMarketingConsentAsk` for the gating rules.
 *
 * Copy: reuses `auth.marketingConsent` verbatim — the exact sentence the
 * signup checkbox already shows, already translated. Asking the same question
 * in two different wordings would make the two consents legally different
 * things.
 *
 * Pillar 2 (Positive Coaching):
 *   - Both answers are ordinary buttons. "No" is not smaller, greyer, or
 *     phrased as a loss ("no thanks, I don't want tips") — that pattern shames
 *     the person choosing it.
 *   - No urgency, no counter, no "you'll miss out".
 *
 * Pillar 3 (Independence):
 *   - Declining is final and respected. The sheet never returns.
 */
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';
import { useRTLStyles } from '../../contexts/LanguageContext';

export interface MarketingConsentSheetProps {
  visible: boolean;
  /** true = opted in, false = declined. Both are final. */
  onAnswer: (consented: boolean) => void;
  /** Disables both buttons while the answer is being written. */
  saving?: boolean;
}

export default function MarketingConsentSheet({
  visible, onAnswer, saving = false,
}: MarketingConsentSheetProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTLStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // No onRequestClose dismissal path: a back-press that silently closes
      // this would leave the parent un-asked forever without an answer being
      // recorded. Android back is routed to the explicit decline instead.
      onRequestClose={() => { if (!saving) onAnswer(false); }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('consent.askTitle')}
          </Text>

          <Text style={[styles.body, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('auth.marketingConsent')}
          </Text>

          <Text style={[styles.note, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('consent.askNote')}
          </Text>

          <TouchableOpacity
            testID="consent-yes"
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={() => onAnswer(true)}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>{t('consent.askYes')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="consent-no"
            style={[styles.secondaryBtn, saving && styles.btnDisabled]}
            onPress={() => onAnswer(false)}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>{t('consent.askNo')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'center',
    padding:         24,
  },
  card: {
    backgroundColor: T.card,
    borderRadius:    18,
    padding:         22,
  },
  title: {
    color:        T.text,
    fontSize:     18,
    fontWeight:   '800',
    marginBottom: 10,
  },
  body: {
    color:        T.text,
    fontSize:     15,
    lineHeight:   22,
    marginBottom: 10,
  },
  note: {
    color:        T.textMuted,
    fontSize:     13,
    lineHeight:   19,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: T.accent,
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      'center',
  },
  primaryBtnText: {
    color:      '#ffffff',
    fontSize:   16,
    fontWeight: '700',
  },
  // Deliberately the same size and hit area as the primary button — only the
  // fill differs. A decline must never be the harder thing to tap.
  secondaryBtn: {
    marginTop:       10,
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     T.cardBorder,
  },
  secondaryBtnText: {
    color:      T.text,
    fontSize:   16,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.6 },
});
