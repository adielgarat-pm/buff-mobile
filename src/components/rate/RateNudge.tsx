/**
 * RateNudge — the passive "rate BUFF" banner, registered with the shared Nudge
 * Manager (src/lib/nudges). The rate analogue of InstallNudge, but NOT platform-
 * split: rating works on both Android (→ Play) and installed web (→ in-house).
 *
 * The Manager guarantees this never co-appears with the install banner (install
 * priority 20 > rate 10) and never re-appears within 7 days of any nudge dismiss
 * (global cooldown). On top of that, rate has its own 90-day local cooldown and
 * only fires for retained users (SPEC §4.3, rateEligibility.ts).
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { registerNudge, markNudgeDismissed } from '../../lib/nudges/nudgeManager';
import { NUDGE_PRIORITY } from '../../lib/nudges/types';
import { PARENT_THEME as T } from '../../theme';
import {
  isRateEligible,
  readRateEligibility,
  recordRateNudgeSeen,
  recordRateNudgeDismissed,
} from '../../lib/rateBuff/rateEligibility';
import RateBuffSheet from './RateBuffSheet';

/** Native build, or web running as an installed standalone PWA. */
function isInstalledContext(): boolean {
  if (Platform.OS !== 'web') return true;
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

interface BannerProps {
  onDismiss: () => void;
}

function RateNudgeBanner({ onDismiss }: BannerProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const dismiss = () => {
    void recordRateNudgeDismissed(Date.now());
    void markNudgeDismissed();
    onDismiss();
  };

  return (
    <View style={[styles.container, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <View style={styles.row}>
        <Text style={[styles.text, { color: T.text }]}>{t('rate.bannerText')}</Text>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={[styles.closeText, { color: T.textMuted }]}>×</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.btn, { backgroundColor: T.accent }]} onPress={() => setSheetOpen(true)}>
        <Text style={styles.btnText}>{t('rate.bannerCta')}</Text>
      </TouchableOpacity>

      <RateBuffSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmitted={() => {
          // A rating/feedback was given → clear the slot (don't ask again).
          void markNudgeDismissed();
          onDismiss();
        }}
      />
    </View>
  );
}

// ─── Registration hook ──────────────────────────────────────────────────────────

/**
 * Register the rate nudge with the Nudge Manager. Call once in the parent
 * dashboard, beside useInstallNudgeRegistration. The onDismiss callback lets the
 * dashboard suppress the slot for the rest of the session.
 */
export function useRateNudgeRegistration(onDismiss: () => void): void {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    void recordRateNudgeSeen(Date.now());
    registerNudge({
      id: 'rate',
      priority: NUDGE_PRIORITY.rate,
      eligible: async (): Promise<boolean> => {
        const stored = await readRateEligibility();
        return isRateEligible({
          ...stored,
          isInstalledContext: isInstalledContext(),
          now: Date.now(),
        });
      },
      render: () => <RateNudgeBanner onDismiss={() => onDismissRef.current()} />,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  text: { flex: 1, fontSize: 14, lineHeight: 20 },
  closeBtn: { paddingLeft: 10 },
  closeText: { fontSize: 22, lineHeight: 22 },
  btn: { marginTop: 10, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
