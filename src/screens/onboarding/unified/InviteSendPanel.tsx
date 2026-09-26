/**
 * InviteSendPanel — the "send {name} the invite" block on UStep8_Complete.
 *
 * Why (Adi's web run 2026-09-26): the parent chose how the child will use BUFF,
 * then the Complete screen showed only a family code — no link, no send button,
 * no word on where the code goes. The join link already existed. Sending now
 * happens here, with the child's name and what happens on their side, shaped
 * by the chosen access path (UX review 2026-09-26, copy approved by Adi):
 *   - own_phone   → share sheet (the parent picks the app); Copy link
 *   - home_device → email first (the home computer is reached by email, not
 *                   WhatsApp); Share another way; Copy link
 *   - tonight     → calm "tonight works", link waits on the dashboard; Send now
 * Where there is no share sheet (desktop browsers without navigator.share) the
 * parent picks WhatsApp / Email / Copy (InviteChooser). The family code stays
 * as the fallback. Neither the share sheet nor mailto reports a real send, so
 * the confirmation is "Sent? Nice." — honest, no modal.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { PARENT_THEME as T } from '../../../theme';
import { buildJoinUrl } from '../../../lib/buffConfig';
import { shareInvite } from '../../../lib/shareInvite';
import { hasShareSheet, openInviteEmail } from '../../../lib/inviteSend';
import { logOnboardingEvent, type InviteMethod } from '../../../lib/onboardingFunnel';
import InviteChooser from '../../../components/InviteChooser';

export type InviteSendMode = 'own_phone' | 'home_device' | 'tonight';

interface Props {
  mode: InviteSendMode;
  childName: string;
  gender?: string;
  code: string;
  familyId?: string | null;
  childId?: string;
  onSent: () => void;
}

export default function InviteSendPanel({ mode: initialMode, childName, gender, code, familyId, childId, onSent }: Props) {
  const { t } = useTranslation();
  const [mode, setMode]       = useState<InviteSendMode>(initialMode);
  const [sent, setSent]       = useState(false);
  const [chooser, setChooser] = useState(false);
  const [copied, setCopied]   = useState(false);

  const g       = gender === 'girl' ? '_f' : '_m';
  const joinUrl = buildJoinUrl(code);
  const message = t(`onboarding.invite.message${g}`, { name: childName, joinUrl, code });
  const subject = t('onboarding.invite.emailSubject', { name: childName });

  const markSent = (method: InviteMethod) => {
    void logOnboardingEvent({ familyId, eventType: 'invite_sent', method, childId });
    setSent(true);
    onSent();
  };

  // Share sheet where the platform has one; otherwise the parent picks the app.
  const share = async () => {
    if (!hasShareSheet()) { setChooser(true); return; }
    const shown = await shareInvite(message);
    if (shown) markSent('share'); else setChooser(true);
  };

  const email = () => { openInviteEmail(subject, message); markSent('email'); };

  const copy = async () => {
    try { await Clipboard.setStringAsync(joinUrl); } catch { /* non-fatal */ }
    setCopied(true);
    markSent('copy');
  };

  const copyLabel = copied ? t('onboarding.invite.linkCopied') : t('onboarding.invite.copyLink');

  let title: string;
  let hint: string | null = t(`onboarding.invite.childSideHint${g}`, { name: childName });
  let primary: { label: string; onPress: () => void } | null;
  let secondaries: { key: string; label: string; onPress: () => void }[];

  if (mode === 'tonight') {
    title = t('onboarding.invite.tonightTitle');
    hint = t('onboarding.invite.tonightSub');
    primary = null;
    secondaries = [{ key: 'send-now', label: t('onboarding.invite.tonightSendNow'), onPress: () => setMode('own_phone') }];
  } else if (mode === 'home_device') {
    title = t('onboarding.invite.homeTitle');
    hint = t(`onboarding.invite.homeHint${g}`, { name: childName });
    primary = { label: t('onboarding.invite.homePrimary'), onPress: email };
    secondaries = [
      { key: 'share', label: t('onboarding.invite.homeShareOther'), onPress: () => { void share(); } },
      { key: 'copy',  label: copyLabel, onPress: () => { void copy(); } },
    ];
  } else {
    title = t('onboarding.invite.phoneTitle', { name: childName });
    primary = { label: t('onboarding.invite.phonePrimary', { name: childName }), onPress: () => { void share(); } };
    secondaries = [{ key: 'copy', label: copyLabel, onPress: () => { void copy(); } }];
  }

  return (
    <View style={styles.card} testID={`invite-panel-${mode}`}>
      <Text style={styles.title}>{title}</Text>

      {sent ? (
        <View style={styles.sentWrap}>
          <Text style={styles.sent} testID="invite-sent">{t(`onboarding.invite.sentConfirm${g}`, { name: childName })}</Text>
          {primary && (
            <TouchableOpacity testID="invite-send-again" onPress={primary.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.link}>{t('onboarding.invite.sendAgain')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : primary && (
        <TouchableOpacity testID="invite-primary" style={styles.primaryBtn} onPress={primary.onPress} activeOpacity={0.85}>
          <Text style={styles.primaryText}>{primary.label}</Text>
        </TouchableOpacity>
      )}

      {hint && <Text style={styles.hint}>{hint}</Text>}

      {!chooser && secondaries.map((s) => (
        <TouchableOpacity key={s.key} testID={`invite-${s.key}`} style={styles.secondaryBtn} onPress={s.onPress} activeOpacity={0.8}>
          <Text style={styles.link}>{s.label}</Text>
        </TouchableOpacity>
      ))}

      {chooser && (
        <InviteChooser message={message} subject={subject} copyText={joinUrl} onSent={markSent} />
      )}

      <View style={styles.codeWrap}>
        <Text style={styles.codeLabel}>{t('onboarding.invite.codeFallbackLabel')}</Text>
        <Text style={styles.code} testID="invite-code">{code}</Text>
        <Text style={styles.codeHint}>{t('onboarding.invite.codeFallbackHint')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:         { width: '100%', backgroundColor: T.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: T.accent },
  title:        { color: T.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  primaryBtn:   { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  sentWrap:     { alignItems: 'center', paddingVertical: 6 },
  sent:         { color: '#047857', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  hint:         { color: T.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 10 },
  secondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  link:         { color: T.accent, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  codeWrap:     { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.cardBorder, alignItems: 'center' },
  codeLabel:    { color: T.textMuted, fontSize: 12 },
  code:         { color: T.accent, fontSize: 22, fontWeight: '900', letterSpacing: 5, marginVertical: 4 },
  codeHint:     { color: T.textMuted, fontSize: 12, textAlign: 'center' },
});
