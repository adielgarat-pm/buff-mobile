/**
 * ConciergeCallCard — dashboard offer of a 15-minute setup call with Adi
 * (pkg/concierge-call). Rendering rules live in lib/concierge.ts
 * (shouldShowDashboardOffer): parent-only, no first win yet, first
 * CONCIERGE_WINDOW_DAYS after the first child was created, not dismissed.
 *
 * "First win" uses the same counted sources as the First Win metric
 * (lib/firstWinTelemetry.ts COUNTED_SOURCES_FILTER), so the card and the metric
 * can never disagree about who has started.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { useConciergeState } from '../../hooks/useConciergeState';
import {
  CONCIERGE_LINK_KEY, logConciergeSeen, openConcierge, shouldShowDashboardOffer,
} from '../../lib/concierge';

interface Props {
  /** created_at of the family's children (from useChildrenDashboard). */
  childCreatedAts: readonly (string | null)[];
  /**
   * The resume-handoff banner is showing (true) and already carries the offer,
   * or hasn't decided yet (null) — both hide the card, so it never flashes
   * before the banner appears.
   */
  suppressed?: boolean | null;
  /** Changes when the dashboard refetches (children array identity) → re-check the first win. */
  refreshKey?: unknown;
}

export const ConciergeCallCard: React.FC<Props> = ({ childCreatedAts, suppressed = false, refreshKey }) => {
  const hiddenByBanner = suppressed !== false;
  const { t } = useTranslation();
  const { familyId } = useAuth();
  const { isChildPreview } = useMode();
  const { hasFirstWin, dismissed, dismiss } = useConciergeState(familyId, refreshKey);

  const url = t(CONCIERGE_LINK_KEY);
  const visible = shouldShowDashboardOffer({
    url, isChildPreview, childCreatedAts, hasFirstWin, dismissed, suppressed: hiddenByBanner,
  });

  useEffect(() => {
    if (visible) logConciergeSeen(familyId, 'dashboard');
  }, [visible, familyId]);

  if (!visible) return null;

  const onPick = () => { openConcierge({ url, placement: 'dashboard', familyId }); };
  const onNotNow = dismiss;

  return (
    <View testID="concierge-card" style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <View style={styles.row}>
        <Text style={styles.emoji}>📞</Text>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: T.text }]}>{t('concierge.cardTitle')}</Text>
          <Text style={[styles.sub, { color: T.textMuted }]}>{t('concierge.cardBody')}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          testID="concierge-pick"
          onPress={onPick}
          style={[styles.primary, { backgroundColor: T.accent }]}
          activeOpacity={0.85}
          accessibilityRole="link"
          accessibilityHint={t('concierge.opensBrowserHint')}
        >
          <Text style={styles.primaryText}>{t('concierge.cardCta')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="concierge-dismiss"
          onPress={onNotNow}
          style={styles.secondary}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryText, { color: T.textMuted }]}>{t('concierge.cardDismiss')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  emoji: { fontSize: 24, marginRight: 12 },
  textCol: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  primary: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondary: { paddingVertical: 10, paddingHorizontal: 12 },
  secondaryText: { fontWeight: '600', fontSize: 14 },
});
