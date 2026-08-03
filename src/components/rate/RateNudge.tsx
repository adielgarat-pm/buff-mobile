/**
 * RateNudge — the "rate BUFF" prompt, registered once from the parent dashboard.
 * Platform-split BEHAVIOUR behind one hook (CLAUDE.md Parity rule):
 *
 *   • Native (Android / iOS): NO banner. When the retention gate passes, fire the
 *     OS in-app review card automatically (expo-store-review, via the
 *     platform-split requestNativeReview). Both stores forbid a sentiment
 *     question or a CTA button in front of the native card, so there is none —
 *     it just fires on a positive moment (the dashboard) for retained users.
 *
 *   • Web (no OS review API): keep the passive banner + RateBuffSheet, which
 *     writes to our first-party `reviews` table (the compliant high-intent action
 *     on web — no third-party review link gated by sentiment).
 *
 * The Nudge Manager still guarantees the web banner never co-appears with the
 * install banner (install priority 20 > rate 10) and respects the 7-day global
 * cooldown. Rate has its own 90-day local cooldown + retention gate either way
 * (rateEligibility.ts).
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
import { requestNativeReview } from '../../lib/rateBuff/requestNativeReview';
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

/** Shared retention gate (7 days, 3 sessions, 90-day local cooldown). */
async function evaluateRateEligible(): Promise<boolean> {
  const stored = await readRateEligibility();
  return isRateEligible({
    ...stored,
    isInstalledContext: isInstalledContext(),
    now: Date.now(),
  });
}

// ─── Banner (web only) ──────────────────────────────────────────────────────────

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

interface RateNudgeOptions {
  /** False during view-as-child preview → never fire a store review for a kid. */
  enabled?: boolean;
  /**
   * The happy-moment signal (pkg/rate-happy-moment): true when the parent is
   * looking at evidence of a winning yesterday (hasWinningYesterday). The ask
   * fires ONLY while this is true — never on a neutral or bad day. Loads async
   * with the recaps, so the native effect reacts to it turning true.
   */
  positiveMoment?: boolean;
}

/**
 * Wire the rate prompt from the parent dashboard. Pass `enabled: !isChildPreview`
 * so the native auto-prompt never fires while a parent is viewing as the child,
 * and `positiveMoment` (hasWinningYesterday) so it only fires on a genuine win.
 * The onDismiss callback only matters on web (it suppresses the banner slot).
 */
export function useRateNudgeRegistration(
  onDismiss: () => void,
  opts: RateNudgeOptions = {},
): void {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const enabledRef = useRef(opts.enabled ?? true);
  enabledRef.current = opts.enabled ?? true;
  const positiveMoment = opts.positiveMoment ?? false;
  const positiveMomentRef = useRef(positiveMoment);
  positiveMomentRef.current = positiveMoment;
  // The session counter must bump once per mount regardless of what kind of
  // day yesterday was — the retention clock is independent of the happy gate.
  const seenRecordedRef = useRef(false);
  // At most one native invoke per mount, even if positiveMoment flickers.
  const nativeFiredRef = useRef(false);

  // ── Native: fire the OS review card when the happy moment arrives ──
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    (async () => {
      if (!enabledRef.current) return; // view-as-child → don't ask a kid to rate
      if (!seenRecordedRef.current) {
        seenRecordedRef.current = true;
        await recordRateNudgeSeen(Date.now());
      }
      // Recaps load async; this effect re-runs when positiveMoment turns true.
      if (!positiveMoment || nativeFiredRef.current || cancelled) return;
      const eligible = await evaluateRateEligible();
      if (!eligible || cancelled) return;
      nativeFiredRef.current = true;
      const fired = await requestNativeReview();
      // We can't observe whether the OS actually showed the card (quota is
      // opaque). Starting the 90-day cooldown on a successful invoke is the
      // best-practice "don't pester" behaviour.
      if (fired) await recordRateNudgeDismissed(Date.now());
    })();
    return () => {
      cancelled = true;
    };
  }, [positiveMoment]);

  // ── Web: register the passive banner with the Nudge Manager ──
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    void recordRateNudgeSeen(Date.now());
    registerNudge({
      id: 'rate',
      priority: NUDGE_PRIORITY.rate,
      // Same unified signal as native, split action (Parity rule): the banner
      // only competes for the slot on a winning morning-after.
      eligible: async () => positiveMomentRef.current && (await evaluateRateEligible()),
      render: () => <RateNudgeBanner onDismiss={() => onDismissRef.current()} />,
    });
  }, []); // once per mount
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
