/**
 * RateBuffSheet — the shared "Rate BUFF" flow (both platforms, both entries:
 * the always-on Settings row and the passive dashboard nudge).
 *
 * Flow (SPEC §3):
 *   gate ──Yes──▶ rate ──submit──▶ (≥4★ & store CTA) store ──▶ done
 *    │                         └──(<4★)──▶ thanks ──▶ done
 *    └──Not really──▶ feedback ──submit──▶ contact (WhatsApp / email) ──▶ done
 *
 * The sentiment gate is compliant: happy raters are *offered* the store, never
 * forced; unhappy raters get a private channel + a human contact line, and are
 * never blocked from the public store (SPEC §4.2).
 */
import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { PARENT_THEME as T } from '../../theme';
import { submitReview } from '../../lib/rateBuff/submitReview';
import { markRated } from '../../lib/rateBuff/rateEligibility';
import { isHighIntent } from '../../lib/rateBuff/reviewStatus';
import { getHighIntentCta } from '../../lib/rateBuff/highIntentDestination';
import { openSupportContact } from '../../lib/rateBuff/contactSupport';

type Phase = 'gate' | 'rate' | 'feedback' | 'store' | 'thanks' | 'contact';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after a rating/feedback is submitted (nudge marks itself done). */
  onSubmitted?: () => void;
  /**
   * Phase to open at. Default 'gate' (the "Rate BUFF" entry, web). The Settings
   * "Send feedback" row opens at 'feedback' — the un-gated private channel that
   * is always available, never a sentiment filter in front of the rating.
   */
  initialPhase?: Phase;
}

export default function RateBuffSheet({ visible, onClose, onSubmitted, initialPhase = 'gate' }: Props) {
  const { t, i18n } = useTranslation();
  const { profile, familyId } = useAuth();

  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPhase(initialPhase);
    setStars(5);
    setText('');
    setBusy(false);
  };

  // The Modal stays mounted (only `visible` toggles), so re-seed the phase on
  // each open — otherwise the same instance would keep the previous flow's phase.
  useEffect(() => {
    if (visible) {
      setPhase(initialPhase);
      setStars(5);
      setText('');
      setBusy(false);
    }
  }, [visible, initialPhase]);

  const close = () => {
    reset();
    onClose();
  };

  const persist = async (rating: number): Promise<boolean> => {
    if (!profile) return false;
    setBusy(true);
    const { error } = await submitReview({
      rating,
      text,
      displayName: profile.display_name,
      familyId: familyId ?? null,
      userId: profile.user_id,
      lang: i18n.language,
    });
    setBusy(false);
    if (!error) {
      void markRated();
      onSubmitted?.();
      return true;
    }
    return false;
  };

  const submitRating = async () => {
    const ok = await persist(stars);
    if (!ok) return;
    // Happy + a store destination exists → offer it; else just thank them.
    if (isHighIntent(stars) && getHighIntentCta() != null) setPhase('store');
    else setPhase('thanks');
  };

  const submitFeedback = async () => {
    // Low-intent: store as a low rating (private), then offer the contact line.
    const ok = await persist(2);
    if (!ok) return;
    setPhase('contact');
  };

  const openStore = () => {
    const cta = getHighIntentCta();
    if (cta) void Linking.openURL(cta.url);
    close();
  };

  const openContact = () => {
    const prefill = `${t('rate.contactPrefill')}\n\n${text}`.trim();
    void openSupportContact(prefill);
    close();
  };

  const cta = getHighIntentCta();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
          <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Text style={[styles.closeText, { color: T.textMuted }]}>×</Text>
          </TouchableOpacity>

          {/* ── Gate ───────────────────────────────────────────── */}
          {phase === 'gate' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.gateTitle')}</Text>
              <View style={styles.gateRow}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: T.accent }]} onPress={() => setPhase('rate')}>
                  <Text style={styles.btnText}>{t('rate.gateYes')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGhost, { borderColor: T.cardBorder }]} onPress={() => setPhase('feedback')}>
                  <Text style={[styles.btnGhostText, { color: T.text }]}>{t('rate.gateNo')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Happy: stars + optional note ───────────────────── */}
          {phase === 'rate' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.happyTitle')}</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setStars(n)} hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                    <Ionicons
                      name={n <= stars ? 'star' : 'star-outline'}
                      size={34}
                      color={n <= stars ? '#F5B301' : T.textMuted}
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { color: T.text, borderColor: T.cardBorder }]}
                placeholder={t('rate.happyPlaceholder')}
                placeholderTextColor={T.textMuted}
                value={text}
                onChangeText={setText}
                multiline
              />
              <TouchableOpacity style={[styles.btn, styles.btnWide, { backgroundColor: T.accent }]} onPress={submitRating} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('rate.submit')}</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Unhappy: feedback ──────────────────────────────── */}
          {phase === 'feedback' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.feedbackTitle')}</Text>
              <TextInput
                style={[styles.input, styles.inputTall, { color: T.text, borderColor: T.cardBorder }]}
                placeholder={t('rate.feedbackPlaceholder')}
                placeholderTextColor={T.textMuted}
                value={text}
                onChangeText={setText}
                multiline
                autoFocus
              />
              <TouchableOpacity style={[styles.btn, styles.btnWide, { backgroundColor: T.accent }]} onPress={submitFeedback} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('rate.submit')}</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Store CTA (happy, Android) ─────────────────────── */}
          {phase === 'store' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.thanksTitle')}</Text>
              <Text style={[styles.body, { color: T.textMuted }]}>{t('rate.storeCtaTitle')}</Text>
              <TouchableOpacity style={[styles.btn, styles.btnWide, { backgroundColor: T.accent }]} onPress={openStore}>
                <Text style={styles.btnText}>{cta ? t(cta.labelKey) : t('rate.submit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={close} style={styles.skip}>
                <Text style={[styles.skipText, { color: T.textMuted }]}>{t('rate.maybeLater')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Plain thanks (happy, no store dest e.g. web) ───── */}
          {phase === 'thanks' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.thanksTitle')}</Text>
              <TouchableOpacity style={[styles.btn, styles.btnWide, { backgroundColor: T.accent }]} onPress={close}>
                <Text style={styles.btnText}>{t('rate.done')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Contact line (unhappy) ─────────────────────────── */}
          {phase === 'contact' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.feedbackThanks')}</Text>
              <TouchableOpacity style={[styles.btn, styles.btnWide, { backgroundColor: T.accent }]} onPress={openContact}>
                <Text style={styles.btnText}>{t('rate.contactButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={close} style={styles.skip}>
                <Text style={[styles.skipText, { color: T.textMuted }]}>{t('rate.done')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 18, borderWidth: 1, padding: 22, paddingTop: 26 },
  closeBtn: { position: 'absolute', top: 8, right: 12, zIndex: 2 },
  closeText: { fontSize: 26, lineHeight: 26 },
  title: { fontSize: 19, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  gateRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  star: { marginHorizontal: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 48, marginBottom: 14, textAlignVertical: 'top' },
  inputTall: { minHeight: 96 },
  btn: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnWide: { width: '100%' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnGhost: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20, borderWidth: 1, alignItems: 'center' },
  btnGhostText: { fontSize: 15, fontWeight: '600' },
  skip: { marginTop: 12, alignItems: 'center' },
  skipText: { fontSize: 13 },
});
