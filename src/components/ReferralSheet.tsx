/**
 * ReferralSheet — "Invite a friend" bottom-sheet modal.
 *
 * Share flow (all messaging apps, not WhatsApp-only):
 *   Android → native Share sheet (Share.share from react-native)
 *   Web     → navigator.share (native sheet on mobile) if available,
 *             else direct wa.me link as a desktop fallback
 *
 * Grant: both families get 14 days premium (top-up, max 14 days ahead).
 */
import { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Share, Platform, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PARENT_THEME as T } from '../theme';
import { useReferral } from '../hooks/useReferral';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const REFERRAL_BASE_URL = 'https://buffadhd.com/join?ref=';

export default function ReferralSheet({ visible, onClose }: Props) {
  const { t }                                     = useTranslation();
  const { code, completedCount, loading, error }  = useReferral();
  const [copied, setCopied]                       = useState(false);

  const referralUrl = code ? `${REFERRAL_BASE_URL}${code}` : null;

  const shareMessage = referralUrl
    ? t('referral.whatsappMessage', { url: referralUrl })
    : '';

  const handleShare = async () => {
    if (!referralUrl) return;
    if (Platform.OS === 'web') {
      // Prefer the native share sheet (all messaging apps) on mobile web.
      const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
        | { share?: (data: { text?: string; url?: string; title?: string }) => Promise<void> }
        | undefined;
      if (nav?.share) {
        try {
          await nav.share({ text: shareMessage, url: referralUrl });
          return;
        } catch (err) {
          // User dismissed the native sheet — respect that, don't pop wa.me.
          if (err instanceof Error && err.name === 'AbortError') return;
          // Genuine share failure → fall through to the wa.me fallback below.
        }
      }
      // Desktop fallback: WhatsApp Web (no navigator.share available there).
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      window.open(waUrl, '_blank');
    } else {
      // Android/iOS: OS share sheet already lists every messaging app.
      await Share.share({ message: shareMessage });
    }
  };

  const handleCopyLink = async () => {
    if (!referralUrl) return;
    await Clipboard.setStringAsync(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color={T.textMuted} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('referral.title')}</Text>
        <Text style={styles.sub}>{t('referral.sub')}</Text>

        {/* Success banner — shown on every open when at least one friend joined */}
        {completedCount > 0 && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerTitle}>{t('referral.sheetBannerTitle')}</Text>
            <Text style={styles.successBannerSub}>{t('referral.sheetBannerSub')}</Text>
          </View>
        )}

        {/* Link box */}
        <View style={styles.linkBox}>
          {loading ? (
            <ActivityIndicator color={T.accent} />
          ) : error ? (
            <Text style={styles.errorText}>{t('referral.loadError')}</Text>
          ) : (
            <Text style={styles.linkText} numberOfLines={1}>{referralUrl}</Text>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, (!referralUrl || loading) && styles.btnDisabled]}
          onPress={handleShare}
          disabled={!referralUrl || loading}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.btnPrimaryText}>{t('referral.shareCta')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary, (!referralUrl || loading) && styles.btnDisabled]}
          onPress={handleCopyLink}
          disabled={!referralUrl || loading}
          activeOpacity={0.85}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={T.accent} />
          <Text style={styles.btnSecondaryText}>
            {copied ? t('referral.copied') : t('referral.copyLink')}
          </Text>
        </TouchableOpacity>

        {/* Stats row — label + pill */}
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>{t('referral.statsLabel')}</Text>
          <View style={[styles.statsPill, completedCount > 0 && styles.statsPillActive]}>
            <Text style={[styles.statsPillText, completedCount > 0 && styles.statsPillTextActive]}>
              {t('referral.stats', { count: completedCount })}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: T.cardBorder,
    marginBottom: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 20, right: 20,
    padding: 4,
  },
  title: {
    fontSize: 20, fontWeight: '700', color: T.text,
    textAlign: 'center', marginBottom: 8,
  },
  sub: {
    fontSize: 14, color: T.textMuted,
    textAlign: 'center', lineHeight: 20,
    marginBottom: 20, paddingHorizontal: 8,
  },
  linkBox: {
    width: '100%',
    backgroundColor: T.card,
    borderRadius: 10,
    borderWidth: 1, borderColor: T.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  linkText: { color: T.accent, fontSize: 13, fontWeight: '500' },
  errorText: { color: '#DC2626', fontSize: 13 },
  btn: {
    width: '100%', borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 10,
  },
  btnPrimary:      { backgroundColor: T.accent },
  btnSecondary:    { backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder },
  btnDisabled:     { opacity: 0.4 },
  btnPrimaryText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondaryText:{ color: T.accent, fontWeight: '600', fontSize: 15 },
  successBanner:      { width: '100%', backgroundColor: '#EEEDFE', borderRadius: 10, borderWidth: 1, borderColor: '#AFA9EC', padding: 12, marginBottom: 16, alignItems: 'center' },
  successBannerTitle: { color: '#3C3489', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  successBannerSub:   { color: '#534AB7', fontSize: 13 },

  statsRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  statsLabel:          { color: T.textMuted, fontSize: 13 },
  statsPill:           { backgroundColor: T.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: T.cardBorder },
  statsPillActive:     { backgroundColor: '#EEEDFE', borderColor: '#AFA9EC' },
  statsPillText:       { color: T.textMuted, fontSize: 12, fontWeight: '500' },
  statsPillTextActive: { color: '#534AB7' },
});
