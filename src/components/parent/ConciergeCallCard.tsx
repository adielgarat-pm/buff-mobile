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
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PARENT_THEME as T } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useMode } from '../../contexts/ModeContext';
import { supabase } from '../../integrations/supabase/client';
import { COUNTED_SOURCES_FILTER } from '../../lib/firstWinTelemetry';
import {
  CONCIERGE_LINK_KEY, dismissConcierge, isConciergeDismissed, logConciergeSeen,
  openConcierge, shouldShowDashboardOffer,
} from '../../lib/concierge';

interface Props {
  /** created_at of the family's children (from useChildrenDashboard). */
  childCreatedAts: readonly (string | null)[];
  /** The resume-handoff banner is showing and already carries the offer. */
  suppressed?: boolean;
}

export const ConciergeCallCard: React.FC<Props> = ({ childCreatedAts, suppressed = false }) => {
  const { t } = useTranslation();
  const { familyId } = useAuth();
  const { isChildPreview } = useMode();
  const [hasFirstWin, setHasFirstWin] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(true); // hidden until storage answers

  useEffect(() => {
    let alive = true;
    if (!familyId) return;
    void isConciergeDismissed(familyId).then((d) => { if (alive) setDismissed(d); });
    void (async () => {
      try {
        const { count, error } = await supabase
          .from('daily_progress')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .eq('completed', true)
          .is('revoked_at', null)
          .or(COUNTED_SOURCES_FILTER);
        // Unknown (error) stays null → card stays hidden.
        if (alive && !error && count != null) setHasFirstWin(count > 0);
      } catch { /* stay hidden */ }
    })();
    return () => { alive = false; };
  }, [familyId]);

  const url = t(CONCIERGE_LINK_KEY);
  const visible = shouldShowDashboardOffer({
    url, isChildPreview, childCreatedAts, hasFirstWin, dismissed, suppressed,
  });

  useEffect(() => {
    if (visible) logConciergeSeen(familyId, 'dashboard');
  }, [visible, familyId]);

  if (!visible) return null;

  const onPick = () => { openConcierge({ url, placement: 'dashboard', familyId }); };
  const onNotNow = () => { setDismissed(true); void dismissConcierge(familyId); };

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
