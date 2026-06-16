/**
 * RecommendationCard — the parent dashboard's single "Recommended now" card.
 *
 * Source plan: spec-typed-toucan (Insights → Action Engine).
 *
 * Renders one recommendation from `useParentRecommendations` in the prime
 * insight slot. Calm, non-blocking (replaces the interruptive Anchor Recovery
 * modal): icon + tag, title, one-line rationale, a single primary CTA, and a
 * low-weight dismiss link.
 *
 * Pillar 2: copy keys are neutral/forward-looking; no alarming color — the card
 * uses the standard card surface, the accent lives only on the CTA.
 * Pillar 1/3: the CTA is a single optional action the parent chooses; the kid
 * is never forced.
 *
 * Copy: `recommendations.<i18nKey>.{title,description,cta}` in en + he, with
 * `{{name}}` interpolation. Child-reaching CTAs (sticker) follow the body-double
 * voice — no rewards/tasks/BUFFs/count language.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';
import type { Recommendation } from '../../utils/recommendationEngine';

interface Props {
  recommendation: Recommendation;
  /** Fired when the parent taps the primary CTA. No-op when ctaType==='none'
   *  (the button is not rendered). */
  onCta:     () => void;
  /** Fired when the parent dismisses the card for this session. */
  onDismiss: () => void;
}

export default function RecommendationCard({ recommendation, onCta, onDismiss }: Props) {
  const { t } = useTranslation();
  const { i18nKey, icon, ctaType, childName } = recommendation;

  const base = `recommendations.${i18nKey}`;
  const showCta = ctaType !== 'none';

  return (
    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <Text style={[styles.tag, { color: T.textMuted }]}>
        {icon} {t('recommendations.tag')}{childName ? ` · ${childName}` : ''}
      </Text>

      <Text style={[styles.title, { color: T.text }]}>
        {t(`${base}.title`, { name: childName })}
      </Text>

      <Text style={[styles.desc, { color: T.textMuted }]}>
        {t(`${base}.description`, { name: childName })}
      </Text>

      {showCta && (
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: T.accent }]}
          onPress={onCta}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{t(`${base}.cta`, { name: childName })}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onDismiss}
        style={styles.dismissBtn}
        accessibilityRole="button"
        accessibilityLabel={t('recommendations.dismiss')}
      >
        <Text style={[styles.dismissText, { color: T.textMuted }]}>
          {t('recommendations.dismiss')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  tag:      { fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  title:    { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  desc:     { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  cta:      { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  dismissBtn:  { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, marginTop: 4 },
  dismissText: { fontSize: 13, fontWeight: '600' },
});
