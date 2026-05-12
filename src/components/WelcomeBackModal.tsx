/**
 * WelcomeBackModal — child-facing modal after a pause or absence.
 *
 * Shows once when the child opens the app and either:
 *   1. A pause was just lifted (pause_mode_active transitioned true→false)
 *   2. The child has been inactive for >3 days (last_child_activity stale)
 *
 * Copy (Pillar 2 — Positive Coaching):
 *   - "Hey, you're back!"
 *   - "Let's start fresh today."
 *   - Single CTA: "Let's go"
 *   - NO missed-days counter, NO catch-up, NO shame.
 *
 * Source SPEC: docs/sessions/pause-mode/SPEC.md §Phases / Phase 4
 *
 * Trigger mechanism:
 *   ChildDashboardScreen calls useWelcomeBack() — a tiny hook (in this
 *   file) that watches pause state and last_child_activity, plus an
 *   AsyncStorage flag so the modal only shows once per resume cycle.
 */
import { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '../hooks/useAppSettings';
import { useChildTheme } from '../contexts/ThemeContext';

const SHOWN_FLAG_KEY = (familyId: string) => `buff_welcome_back_shown_${familyId}`;
const ABSENCE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Hook that decides whether to show the Welcome Back modal.
 * Returns { visible, dismiss } — caller renders <WelcomeBackModal />
 * and binds these.
 */
export function useWelcomeBack() {
  const { isPauseActive, lastChildActivity, settings, recordChildActivity } = useAppSettings();
  const [visible, setVisible] = useState(false);
  const prevPausedRef         = useRef<boolean | null>(null);
  const checkedRef            = useRef(false);

  useEffect(() => {
    if (!settings?.family_id) return;
    if (checkedRef.current) return; // run once per mount

    (async () => {
      try {
        const flagKey = SHOWN_FLAG_KEY(settings.family_id);
        const lastShown = await AsyncStorage.getItem(flagKey);

        // Compute trigger conditions
        const justResumed =
          prevPausedRef.current === true && !isPauseActive;

        let absenceTriggered = false;
        if (lastChildActivity) {
          const sinceActivity = Date.now() - new Date(lastChildActivity).getTime();
          absenceTriggered = sinceActivity > ABSENCE_THRESHOLD_MS;
        }

        const shouldShow = (justResumed || absenceTriggered) && !lastShown;

        if (shouldShow) {
          setVisible(true);
        }

        // Always record activity (this also resets the absence timer)
        await recordChildActivity();
        checkedRef.current = true;
      } catch (err) {
        console.warn('[useWelcomeBack] check error (non-fatal):', err);
      }
    })();

    prevPausedRef.current = isPauseActive;
  }, [settings?.family_id, isPauseActive, lastChildActivity, recordChildActivity]);

  const dismiss = async () => {
    setVisible(false);
    if (settings?.family_id) {
      await AsyncStorage.setItem(SHOWN_FLAG_KEY(settings.family_id), new Date().toISOString());
    }
  };

  return { visible, dismiss };
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function WelcomeBackModal({ visible, onDismiss }: Props) {
  const { t } = useTranslation();
  const T     = useChildTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={[styles.title, { color: T.foreground }]}>
            {t('welcomeBack.title')}
          </Text>
          <Text style={[styles.subtitle, { color: T.mutedForeground }]}>
            {t('welcomeBack.subtitle')}
          </Text>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: T.primary }]}
            onPress={onDismiss}
          >
            <Text style={[styles.ctaText, { color: T.primaryForeground }]}>
              {t('welcomeBack.cta')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  emoji:    { fontSize: 56, marginBottom: 12 },
  title:    { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  cta:      { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  ctaText:  { fontSize: 16, fontWeight: '700' },
});
