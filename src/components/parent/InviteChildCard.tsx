/**
 * InviteChildCard — family-level "invite a child" card on the Parent Dashboard.
 *
 * Surface for the family join code. The code otherwise lives only at
 * end-of-onboarding + Settings → Account, and parents couldn't find it
 * post-onboarding (Noa/Leia bug, 2026-05-27, see IN-2026-05-27-02).
 * Family-scoped, not per-child: one code joins any kid.
 *
 * Share is cross-platform via `shareInvite` (OS sheet on native, Web Share
 * API on web) — the previous inline `Share.share()` was a silent no-op on the
 * web PWA, exactly the cohort this card exists for. A browser with no share
 * sheet gets a WhatsApp / Email / Copy choice (InviteChooser) — the child on
 * the home computer is reached by email, not WhatsApp (2026-09-26). If the
 * share sheet fails outright, we fall back to copying the full invite message
 * to the clipboard and confirming via crossAlert, so the tap is never
 * invisible.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { PARENT_THEME as T } from '../../theme';
import { buildJoinUrl } from '../../lib/buffConfig';
import { shareInvite } from '../../lib/shareInvite';
import { hasShareSheet } from '../../lib/inviteSend';
import { crossAlert } from '../../platform';
import InviteChooser from '../InviteChooser';

interface Props {
  /** Family join code (from useAuth). Parent renders nothing while null. */
  familyShortCode: string;
}

export default function InviteChildCard({ familyShortCode }: Props) {
  const { t } = useTranslation();
  const [codeCopied, setCodeCopied] = useState(false);
  const [chooser, setChooser] = useState(false);

  const joinUrl = buildJoinUrl(familyShortCode);
  const message = t('inviteCard.shareMessage', { code: familyShortCode, joinUrl });

  const handleShare = async () => {
    if (!hasShareSheet()) { setChooser(true); return; }
    // Cross-platform share. Never throws; resolves false only when no share
    // surface appeared.
    const shared = await shareInvite(message);
    if (!shared) {
      // Visible fallback: put the full invite message on the clipboard and
      // say so — a tap must never be a silent no-op on the activation path.
      try {
        await Clipboard.setStringAsync(message);
        crossAlert(t('inviteCard.shareFallbackTitle'), t('inviteCard.shareFallbackBody'));
      } catch (err) {
        console.warn('[InviteChildCard] clipboard fallback failed:', err);
      }
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(familyShortCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <View style={[styles.inviteCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
      <Text style={[styles.inviteTitle, { color: T.text }]}>{t('inviteCard.title')}</Text>
      <Text style={[styles.inviteMicrocopy, { color: T.textMuted }]}>{t('inviteCard.microcopy')}</Text>

      <Text style={[styles.inviteCodeLabel, { color: T.textMuted }]}>{t('inviteCard.codeLabel')}</Text>
      <View style={[styles.inviteCodeBox, { backgroundColor: T.accent }]}>
        <Text style={styles.inviteCodeText}>{familyShortCode}</Text>
      </View>

      <View style={styles.inviteBtnRow}>
        <TouchableOpacity
          testID="invite-card-share"
          style={[styles.inviteShareBtn, { backgroundColor: T.accent }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Text style={styles.inviteShareBtnText}>{t('inviteCard.shareBtn')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="invite-card-copy"
          style={[styles.inviteCopyBtn, { borderColor: T.cardBorder }]}
          onPress={handleCopyCode}
          activeOpacity={0.85}
        >
          <Text style={[styles.inviteCopyBtnText, { color: T.accent }]}>
            {codeCopied ? t('inviteCard.copiedBtn') : t('inviteCard.copyBtn')}
          </Text>
        </TouchableOpacity>
      </View>

      {chooser && (
        <InviteChooser
          message={message}
          subject={t('inviteCard.emailSubject')}
          copyText={joinUrl}
          onSent={() => { /* the chooser shows its own copied state */ }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inviteCard:        { borderRadius: 16, padding: 18, marginTop: 4, marginBottom: 18, borderWidth: 1 },
  inviteTitle:       { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  inviteMicrocopy:   { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  inviteCodeLabel:   { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  inviteCodeBox:     { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', marginBottom: 14 },
  inviteCodeText:    { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 6 },
  inviteBtnRow:      { flexDirection: 'row', gap: 10 },
  inviteShareBtn:    { flex: 2, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  inviteShareBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
  inviteCopyBtn:     { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  inviteCopyBtnText: { fontSize: 14, fontWeight: '600' },
});
