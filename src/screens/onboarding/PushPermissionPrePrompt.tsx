/**
 * PushPermissionPrePrompt — explains push value before the OS dialog.
 *
 * Source SPEC: docs/sessions/fcm-push-notifications/SPEC.md § Phase 2 (parent path).
 *                                                       § Phase 6 (kid path — uses `audience='kid'`)
 *
 * Per OQ-A4: a pre-prompt screen frames the OS permission dialog. Cold prompts
 * get denied ~40-60%; just-in-time + pre-prompt acceptance is ~75% (Google
 * UX research). The screen explains the value in the user's voice:
 *   - Parent voice (Coach, declarative, per IN-2026-05-17-01)
 *   - Kid voice (friend, body-doubling, per IN-2026-05-19-03)
 *
 * The OS permission dialog only fires ONCE. If the user declines, we cannot
 * re-prompt without sending them to system settings. The pre-prompt protects
 * that one chance.
 */

import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type PushPromptAudience = 'parent' | 'kid';

interface Props {
  visible: boolean;
  audience: PushPromptAudience;
  /** Called when user taps the primary CTA. Caller should call usePushRegistration.register(). */
  onAccept: () => void;
  /** Called when user taps "maybe later". Caller dismisses + remembers to re-prompt later. */
  onDecline: () => void;
  /** Display name (used in kid voice — "{buddy_name} רוצה להזכיר..."). Defaults to BUDDY's default. */
  buddyName?: string;
}

export const PushPermissionPrePrompt: React.FC<Props> = ({
  visible,
  audience,
  onAccept,
  onDecline,
  buddyName,
}) => {
  const { t } = useTranslation();

  // Voice differs by audience. Keys live in src/i18n/{he,en}.json.
  const titleKey = audience === 'parent' ? 'pushPrePrompt.parent.title' : 'pushPrePrompt.kid.title';
  const bodyKey = audience === 'parent' ? 'pushPrePrompt.parent.body' : 'pushPrePrompt.kid.body';
  const ctaKey = audience === 'parent' ? 'pushPrePrompt.parent.cta' : 'pushPrePrompt.kid.cta';
  const dismissKey =
    audience === 'parent' ? 'pushPrePrompt.parent.dismiss' : 'pushPrePrompt.kid.dismiss';

  const interpolation = audience === 'kid' && buddyName ? { name: buddyName } : undefined;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onDecline}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t(titleKey)}</Text>
          <Text style={styles.body}>{t(bodyKey, interpolation)}</Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onAccept}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{t(ctaKey)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDecline}
            accessibilityRole="button"
          >
            <Text style={styles.dismissButtonText}>{t(dismissKey)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 54, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1636',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#4a4258',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#7c6f97',
    fontSize: 14,
  },
});
