/**
 * RateBuffSheet — the shared "Rate BUFF" flow (both platforms, both entries:
 * the always-on Settings row and the passive dashboard nudge).
 *
 * One unified screen (no sentiment gate):
 *   rate ──submit──▶ store (Android: offer Google Play to everyone) ──▶ done
 *                └── thanks (web / no store destination)            ──▶ done
 *
 * The parent picks a real 1–5★ rating, optionally writes a note, and explicitly
 * ticks whether we may publish it. Consent → the review enters moderation and can
 * become a public testimonial; no consent → it stays private and only reaches the
 * team via the Admin board. Publishing is the parent's choice, not a sentiment
 * filter, so an unhappy rating is never blocked from the store and a happy one is
 * never published without permission (SPEC §4.2; autonomy, Pillar 3).
 *
 * The Google Play CTA (Android only, via the platform-split highIntentDestination)
 * is offered to *everyone* after submit — showing the store link universally is
 * compliant, whereas gating it by star count is the review-gating Google forbids.
 * The unconditional native OS review card (RateNudge) remains the real public
 * rating driver; this sheet writes our first-party review.
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
import { getHighIntentCta } from '../../lib/rateBuff/highIntentDestination';

type Phase = 'rate' | 'store' | 'thanks';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after a rating is submitted (the nudge marks itself done). */
  onSubmitted?: () => void;
}

export default function RateBuffSheet({ visible, onClose, onSubmitted }: Props) {
  const { t, i18n } = useTranslation();
  const { profile, familyId } = useAuth();

  const [phase, setPhase] = useState<Phase>('rate');
  const [stars, setStars] = useState(0); // 0 = nothing picked yet (submit disabled)
  const [text, setText] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  // The Modal stays mounted (only `visible` toggles), so re-seed on each open —
  // otherwise the same instance would keep the previous flow's state.
  useEffect(() => {
    if (visible) {
      setPhase('rate');
      setStars(0);
      setText('');
      setConsent(false);
      setBusy(false);
    }
  }, [visible]);

  const close = () => {
    onClose();
  };

  const submit = async () => {
    if (stars < 1 || !profile) return;
    setBusy(true);
    const { error } = await submitReview({
      rating: stars,
      text,
      displayName: profile.display_name,
      familyId: familyId ?? null,
      userId: profile.user_id,
      lang: i18n.language,
      consentToPublish: consent,
    });
    setBusy(false);
    if (error) return;
    void markRated();
    onSubmitted?.();
    // Offer the store to everyone where a destination exists (Android); else thank.
    setPhase(getHighIntentCta() != null ? 'store' : 'thanks');
  };

  const openStore = () => {
    const cta = getHighIntentCta();
    if (cta) void Linking.openURL(cta.url);
    close();
  };

  const cta = getHighIntentCta();
  const canSubmit = stars >= 1 && !busy;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
          <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Text style={[styles.closeText, { color: T.textMuted }]}>×</Text>
          </TouchableOpacity>

          {/* ── Rate: stars (required) + note + publish consent ── */}
          {phase === 'rate' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.title')}</Text>
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
                style={[styles.input, styles.inputTall, { color: T.text, borderColor: T.cardBorder }]}
                placeholder={t('rate.placeholder')}
                placeholderTextColor={T.textMuted}
                value={text}
                onChangeText={setText}
                multiline
              />

              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setConsent((c) => !c)}
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              >
                <Ionicons
                  name={consent ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={consent ? T.accent : T.textMuted}
                />
                <Text style={[styles.consentText, { color: T.textMuted }]}>{t('rate.consent')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnWide, { backgroundColor: T.accent, opacity: canSubmit ? 1 : 0.5 }]}
                onPress={submit}
                disabled={!canSubmit}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('rate.submit')}</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Store CTA (Android) — offered to everyone after submit ── */}
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

          {/* ── Plain thanks (web / no store destination) ── */}
          {phase === 'thanks' && (
            <>
              <Text style={[styles.title, { color: T.text }]}>{t('rate.thanksTitle')}</Text>
              <Text style={[styles.body, { color: T.textMuted }]}>{t('rate.thanksBody')}</Text>
              <TouchableOpacity style={[styles.btn, styles.btnWide, { backgroundColor: T.accent }]} onPress={close}>
                <Text style={styles.btnText}>{t('rate.done')}</Text>
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
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  star: { marginHorizontal: 4 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 48, marginBottom: 14, textAlignVertical: 'top' },
  inputTall: { minHeight: 96 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  consentText: { flex: 1, fontSize: 13, lineHeight: 18 },
  btn: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnWide: { width: '100%' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skip: { marginTop: 12, alignItems: 'center' },
  skipText: { fontSize: 13 },
});
