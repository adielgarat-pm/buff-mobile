/**
 * InstallNudge (web) — PWA install banner registered with the Nudge Manager.
 *
 * Modes (SPEC §2.1):
 *   install    → banner + Chrome "Install" button (Android / desktop Chrome)
 *   ios-safari → banner + expandable 3-step Share → Add to Home Screen card
 *   ios-other  → banner only (text tells user to open in Safari)
 *
 * The component manages its own per-session dismiss state; calling
 * markNudgeDismissed() starts the persistent 7-day global cooldown so the
 * nudge won't re-appear across sessions either.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  registerNudge,
  markNudgeDismissed,
} from '../../lib/nudges/nudgeManager';
import { NUDGE_PRIORITY } from '../../lib/nudges/types';
import { getDeferredInstallPrompt } from '../../lib/setupPwa.web';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { PARENT_THEME as T } from '../../theme';
import { classifyInstallTarget } from '../../lib/installTarget.web';
import GetTheAppCta from './GetTheAppCta.web';

// ─── Banner component ─────────────────────────────────────────────────────────

interface BannerProps {
  onDismiss: () => void;
}

function InstallNudgeBanner({ onDismiss }: BannerProps) {
  const { t } = useTranslation();
  const { mode, promptInstall } = useInstallPrompt();
  const [showCard, setShowCard] = useState(false);

  if (mode === 'hidden') return null;

  return (
    <View style={[styles.container, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      {/* Header row: text + dismiss */}
      <View style={styles.headerRow}>
        <Text style={[styles.text, { color: T.text }]}>
          {mode === 'ios-other' ? t('install.iosOtherText') : t('install.bannerText')}
        </Text>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={[styles.closeText, { color: T.textMuted }]}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Android / desktop Chrome → native install prompt */}
      {mode === 'install' && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: T.accent }]}
          onPress={() => void promptInstall()}
        >
          <Text style={styles.btnText}>{t('install.androidButton')}</Text>
        </TouchableOpacity>
      )}

      {/* iOS Safari → expand the 3-step instruction card */}
      {mode === 'ios-safari' && (
        <>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: T.accent }]}
            onPress={() => setShowCard((v) => !v)}
          >
            <Text style={styles.btnText}>
              {showCard ? t('install.iosGotIt') : t('install.iosSafariHow')}
            </Text>
          </TouchableOpacity>
          {showCard && (
            <View style={styles.stepsCard}>
              <Text style={[styles.step, { color: T.text }]}>{t('install.iosStep1')}</Text>
              <Text style={[styles.step, { color: T.text }]}>{t('install.iosStep2')}</Text>
              <Text style={[styles.step, { color: T.text }]}>{t('install.iosStep3')}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ─── Registration hook ────────────────────────────────────────────────────────

/**
 * Register the install nudge with the Nudge Manager. Call once in the parent
 * dashboard. The onDismiss callback is called so the dashboard can pass
 * suppressed=true to the manager, hiding the slot for the rest of the session.
 */
export function useInstallNudgeRegistration(onDismiss: () => void): void {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    // Native "get the app" nudge — outranks the PWA one below, so on android-web
    // the single dashboard slot offers the retaining native app. iOS/desktop have
    // no native app, so this is not eligible there and the PWA nudge wins.
    registerNudge({
      id: 'install-native',
      priority: NUDGE_PRIORITY['install-native'],
      eligible: (): boolean => {
        try {
          const { target } = classifyInstallTarget();
          return target === 'android-play' || target === 'native-installed';
        } catch {
          return false;
        }
      },
      render: () => (
        <GetTheAppCta placement="dashboard-nudge" onDismiss={() => onDismissRef.current()} />
      ),
    });

    registerNudge({
      id: 'install',
      priority: NUDGE_PRIORITY.install,
      eligible: (): boolean => {
        // Only for web (window.matchMedia exists in RN but matchMedia itself
        // is not defined — setupPwa.web is never imported on native so this
        // branch never executes on native bundles).
        try {
          if (window.matchMedia('(display-mode: standalone)').matches) return false;
          const ua = navigator.userAgent;
          if (/iphone|ipad|ipod/i.test(ua)) return true; // ios-safari or ios-other
          return getDeferredInstallPrompt() !== null; // Android / desktop Chrome
        } catch {
          return false;
        }
      },
      render: () => (
        <InstallNudgeBanner
          onDismiss={() => {
            void markNudgeDismissed();
            onDismissRef.current();
          }}
        />
      ),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    paddingLeft: 10,
  },
  closeText: {
    fontSize: 22,
    lineHeight: 22,
  },
  btn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepsCard: {
    marginTop: 12,
    gap: 6,
  },
  step: {
    fontSize: 13,
    lineHeight: 19,
  },
});
