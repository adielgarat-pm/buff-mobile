/**
 * ReferralSheet — "Invite a friend" bottom-sheet modal.
 *
 * Share flow:
 *   Android → native Share sheet (Share.share from react-native)
 *   Web     → navigator.share if available, else direct wa.me link
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

  const handleWhatsApp = async () => {
    if (!referralUrl) return;
    if (Platform.OS === 'web') {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      window.open(waUrl, '_blank');
    } else {
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
          onPress={handleWhatsApp}
          disabled={!referralUrl || loading}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.btnPrimaryText}>{t('referral.shareWhatsapp')}</Text>
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

        {/* Stats */}
        <Text style={styles.stats}>
          {t('referral.stats', { count: completedCount })}
        </Text>
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
  btnPrimary:      { backgroundColor: '#25D366' },
  btnSecondary:    { backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder },
  btnDisabled:     { opacity: 0.4 },
  btnPrimaryText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondaryText:{ color: T.accent, fontWeight: '600', fontSize: 15 },
  stats: {
    marginTop: 8, color: T.textMuted, fontSize: 13,
  },
});
