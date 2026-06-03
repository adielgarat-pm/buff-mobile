/**
 * IncomingStickerModal — celebratory full-screen reveal of a parent→child
 * sticker. Tap anywhere to dismiss (which marks it seen).
 *
 * Theme-agnostic: rendered as an overlay above both the Pastel and Gamer
 * dashboards, so it carries its own warm palette rather than reading the
 * active child theme. Copy is parent-affirmation (Pillar 2, Positive
 * Coaching) — this is explicitly the parent's voice, not BUDDY's.
 */
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { emojiForStickerType } from '../../lib/stickerCatalog';
import type { IncomingSticker } from '../../hooks/useIncomingSticker';

interface Props {
  sticker: IncomingSticker | null;
  onDismiss: () => void;
}

export default function IncomingStickerModal({ sticker, onDismiss }: Props) {
  const { t } = useTranslation();
  if (!sticker) return null;

  const message = sticker.message?.trim() || t('sticker.fromParent');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{t('sticker.received')}</Text>
          <Text style={styles.emoji}>{emojiForStickerType(sticker.sticker_type)}</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.dismiss}>{t('sticker.tapToDismiss')}</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 14, 45, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 8,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 96,
    marginVertical: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1636',
    textAlign: 'center',
    lineHeight: 28,
  },
  dismiss: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 24,
    textAlign: 'center',
  },
});
