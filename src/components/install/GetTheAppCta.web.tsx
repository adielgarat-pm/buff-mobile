/**
 * GetTheAppCta (web) — the native-install CTA surface.
 * See docs/sessions/web-to-native-cta/SPEC.md §3 / §4.7.
 *
 * WEB-ONLY, ADDITIVE. Renders per visitor class (installTarget). Never renders
 * for standalone/ios-pwa/desktop in v1, never on native (this is the .web split),
 * and the caller is responsible for not mounting it in child / View-as-Child
 * sessions (that guard lives at the mount sites, chunk 1c).
 *
 * Phase 1: per-session dismiss only. Persistent cooldown/impression-cap and the
 * nudge-manager coexistence are added at the mount sites (eligibility module).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../../theme';
import {
  classifyInstallTarget,
  buildPlayInstallUrl,
  type InstallTarget,
} from '../../lib/installTarget.web';
import { BUFF_URLS } from '../../lib/buffConfig';
import { logInstallCtaEvent, type CtaPlacement } from '../../lib/installCtaTelemetry.web';
import {
  isInstallCtaEligible,
  recordInstallCtaImpression,
  recordInstallCtaDismiss,
} from '../../lib/installCtaEligibility.web';

export interface GetTheAppCtaProps {
  placement: CtaPlacement;
  onDismiss?: () => void;
}

// Correct Android intent breakout: the intent `package` is the Play Store app
// (com.android.vending), NOT our app. Used to escape in-app webviews.
const ANDROID_INTENT_URL =
  'intent://play.google.com/store/apps/details?id=com.buffapp.mobile#Intent;scheme=https;package=com.android.vending;end';

/** One stable id per browser session, for anonymous entry→install attribution. */
function getOrCreateCtaId(): string {
  try {
    const KEY = 'buff_install_cta_id';
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'invalid';
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return 'invalid';
  }
}

interface Variant {
  headline: string;
  body?: string;
  primaryLabel?: string;
  primaryAction?: () => void;
  showKeepBrowsing?: boolean;
  showCopy?: boolean;
}

export default function GetTheAppCta({ placement, onDismiss }: GetTheAppCtaProps) {
  const { t } = useTranslation();
  const info = useMemo(() => classifyInstallTarget(), []);
  const [target, setTarget] = useState<InstallTarget>(info.target);
  const [dismissed, setDismissed] = useState(false);
  const [eligible, setEligible] = useState<boolean | null>(null); // null = evaluating
  const [copied, setCopied] = useState(false);
  const ctaId = useMemo(getOrCreateCtaId, []);
  const impressionLogged = useRef(false);

  // Async upgrade android-play → native-installed. Never a render gate.
  useEffect(() => {
    let alive = true;
    info
      .resolveInstalledState()
      .then((r) => alive && setTarget(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [info]);

  // Persistent eligibility (global cooldown + impression cap + once-ever
  // post-signup). Fail-open on error is handled inside isInstallCtaEligible.
  useEffect(() => {
    let alive = true;
    isInstallCtaEligible(placement)
      .then((e) => alive && setEligible(e))
      .catch(() => alive && setEligible(true));
    return () => {
      alive = false;
    };
  }, [placement]);

  // v1 renders only for android + ios-inapp-webview classes.
  const isRenderTarget =
    target === 'android-play' ||
    target === 'native-installed' ||
    target === 'android-inapp-webview' ||
    target === 'ios-inapp-webview';
  const visible = eligible === true && !dismissed && isRenderTarget;

  useEffect(() => {
    if (visible && !impressionLogged.current) {
      impressionLogged.current = true;
      void recordInstallCtaImpression(placement); // bumps cap / stamps once-ever
      logInstallCtaEvent('impression', placement, target, ctaId);
    }
  }, [visible, placement, target, ctaId]);

  if (!visible) return null;

  const dismiss = () => {
    void recordInstallCtaDismiss(); // starts the shared 7-day global cooldown
    logInstallCtaEvent('dismiss', placement, target, ctaId);
    setDismissed(true);
    onDismiss?.();
  };
  const openPlay = () => {
    logInstallCtaEvent('click', placement, target, ctaId);
    Linking.openURL(buildPlayInstallUrl(ctaId, placement)).catch(() => {});
  };
  const openInstalled = () => {
    logInstallCtaEvent('open_installed', placement, target, ctaId);
    // v1: verified App Links not shipped yet → the store listing shows "Open".
    Linking.openURL(BUFF_URLS.playStoreInstall).catch(() => {});
  };
  const openIntent = () => {
    logInstallCtaEvent('click', placement, target, ctaId);
    try {
      window.location.href = ANDROID_INTENT_URL;
    } catch {
      /* noop */
    }
  };
  const copyLink = () => {
    try {
      void navigator.clipboard?.writeText(buildPlayInstallUrl(ctaId, placement));
      setCopied(true);
    } catch {
      /* noop */
    }
  };

  const isPostSignup = placement === 'post-signup';

  const variant: Variant = (() => {
    switch (target) {
      case 'native-installed':
        return {
          headline: t('install.getApp.entryText'),
          primaryLabel: t('install.getApp.openButton'),
          primaryAction: openInstalled,
        };
      case 'android-inapp-webview':
        return {
          headline: t('install.getApp.inAppTitle'),
          body: t('install.getApp.inAppInstruction'),
          primaryLabel: t('install.getApp.playButton'),
          primaryAction: openIntent,
          showCopy: true,
        };
      case 'ios-inapp-webview':
        return { headline: t('install.getApp.iosInApp') };
      case 'android-play':
      default:
        return {
          headline: isPostSignup ? t('install.getApp.postSignupTitle') : t('install.getApp.entryText'),
          body: isPostSignup ? t('install.getApp.postSignupBody') : undefined,
          primaryLabel: t('install.getApp.playButton'),
          primaryAction: openPlay,
          showKeepBrowsing: isPostSignup,
        };
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: T.text }]}>{variant.headline}</Text>
        <TouchableOpacity
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel={t('install.getApp.dismissLabel')}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.closeBtn}
        >
          <Text style={[styles.closeText, { color: T.textMuted }]}>×</Text>
        </TouchableOpacity>
      </View>

      {variant.body ? <Text style={[styles.body, { color: T.textMuted }]}>{variant.body}</Text> : null}

      {variant.primaryLabel && variant.primaryAction ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: T.accent }]}
          onPress={variant.primaryAction}
          accessibilityRole="button"
          accessibilityLabel={variant.primaryLabel}
        >
          <Text style={styles.btnText}>{variant.primaryLabel}</Text>
        </TouchableOpacity>
      ) : null}

      {variant.showCopy ? (
        <TouchableOpacity onPress={copyLink} accessibilityRole="button" style={styles.linkBtn}>
          <Text style={[styles.linkText, { color: T.accent }]}>
            {copied ? t('install.getApp.copied') : t('install.getApp.copyLink')}
          </Text>
        </TouchableOpacity>
      ) : null}

      {variant.showKeepBrowsing ? (
        <TouchableOpacity onPress={dismiss} accessibilityRole="button" style={styles.linkBtn}>
          <Text style={[styles.linkText, { color: T.textMuted }]}>{t('install.getApp.keepBrowsing')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  closeBtn: { paddingLeft: 10 },
  closeText: { fontSize: 22, lineHeight: 22 },
  btn: { marginTop: 12, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  linkBtn: { marginTop: 10, alignSelf: 'flex-start' },
  linkText: { fontSize: 13, fontWeight: '600' },
});
