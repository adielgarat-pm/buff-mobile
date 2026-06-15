/**
 * BuddyGiftModal — the open-a-gift reveal for the Gamer buddy screens.
 *
 * Two phases (driven by `revealedColor`):
 *   - confirm  (revealedColor === null): "{buddy} has something for you" + Open
 *   - revealed (revealedColor !== null): a color swatch + "a new look!" + Done
 *
 * Pure presentational — all state/RPC lives in useBuddyGiftReveal. Copy is in
 * the body-double register (a friend giving you something, never "you earned…").
 */
import type { FC } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { BuddyGiftModalProps } from '../../hooks/useBuddyGiftReveal';

const COLORS = {
  scrim:    'rgba(10,8,24,0.72)',
  surface:  '#2D2546',
  border:   'rgba(255,255,255,0.10)',
  text:     '#FFFFFF',
  muted:    '#A78BFA',
  lime:     '#A8E63E',
  canvas:   '#1a1636',
} as const;

interface Props extends BuddyGiftModalProps {
  /** The buddy's display name; falls back to a generic label when absent (5B). */
  buddyName?: string | null;
}

export const BuddyGiftModal: FC<Props> = ({
  visible,
  revealedColor,
  busy,
  onConfirm,
  onClose,
  buddyName,
}) => {
  const { t } = useTranslation();
  const name = buddyName || t('buddy.gift.fallbackName');
  const revealed = revealedColor !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.card} testID="buddy-gift-modal">
          {revealed ? (
            <>
              <View style={[styles.swatch, { backgroundColor: revealedColor ?? COLORS.lime }]}>
                <Ionicons name="sparkles" size={28} color={COLORS.canvas} />
              </View>
              <Text style={styles.title}>{t('buddy.gift.openedTitle')}</Text>
              <Text style={styles.body}>{t('buddy.gift.openedBody', { buddyName: name })}</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onClose}
                accessibilityRole="button"
                testID="buddy-gift-done"
              >
                <Text style={styles.primaryLabel}>{t('buddy.gift.doneButton')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.giftIcon}>
                <Ionicons name="gift" size={32} color={COLORS.lime} />
              </View>
              <Text style={styles.title}>{t('buddy.gift.revealTitle', { buddyName: name })}</Text>
              <Text style={styles.body}>{t('buddy.gift.revealBody')}</Text>
              <TouchableOpacity
                style={[styles.primaryBtn, busy && styles.primaryBtnBusy]}
                onPress={onConfirm}
                disabled={busy}
                accessibilityRole="button"
                testID="buddy-gift-open"
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.canvas} />
                ) : (
                  <Text style={styles.primaryLabel}>{t('buddy.gift.openButton')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                disabled={busy}
                accessibilityRole="button"
                testID="buddy-gift-later"
              >
                <Text style={styles.secondaryLabel}>{t('buddy.gift.laterButton')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  giftIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.lime,
  },
  swatch: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.lime,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 36,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnBusy: {
    opacity: 0.7,
  },
  primaryLabel: {
    color: COLORS.canvas,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
