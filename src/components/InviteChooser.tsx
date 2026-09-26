/**
 * InviteChooser — "How do you want to send it?" WhatsApp / Email / Copy link.
 *
 * Shown instead of a share sheet where the platform has none (desktop browsers
 * without `navigator.share`), so the parent still chooses the app — the child
 * on a home computer is usually reached by email, not WhatsApp. Native always
 * has the OS share sheet and never renders this.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { PARENT_THEME as T } from '../theme';
import { openInviteEmail, openInviteWhatsApp } from '../lib/inviteSend';
import type { InviteMethod } from '../lib/onboardingFunnel';

interface Props {
  message: string;
  subject: string;
  /** What "Copy link" puts on the clipboard. */
  copyText: string;
  onSent: (method: InviteMethod) => void;
}

export default function InviteChooser({ message, subject, copyText, onSent }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await Clipboard.setStringAsync(copyText); } catch { /* non-fatal */ }
    setCopied(true);
    onSent('copy');
  };

  const options: { key: InviteMethod; label: string; onPress: () => void }[] = [
    { key: 'whatsapp', label: t('onboarding.invite.viaWhatsApp'), onPress: () => { openInviteWhatsApp(message); onSent('whatsapp'); } },
    { key: 'email',    label: t('onboarding.invite.viaEmail'),    onPress: () => { openInviteEmail(subject, message); onSent('email'); } },
    { key: 'copy',     label: copied ? t('onboarding.invite.linkCopied') : t('onboarding.invite.copyLink'), onPress: () => { void copy(); } },
  ];

  return (
    <View style={styles.wrap} testID="invite-chooser">
      <Text style={styles.title}>{t('onboarding.invite.chooserTitle')}</Text>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          testID={`invite-via-${o.key}`}
          style={styles.option}
          onPress={o.onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { width: '100%', marginTop: 8 },
  title:      { color: T.text, fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  option:     { borderWidth: 1, borderColor: T.cardBorder, backgroundColor: T.card, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  optionText: { color: T.accent, fontSize: 14, fontWeight: '600' },
});
