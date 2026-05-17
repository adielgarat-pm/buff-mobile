/**
 * BuddyToggleModal — Itay-approved Stitch 03 modal (hide/show confirmation).
 *
 * Bottom sheet over a dimmed backdrop. Same component renders both the
 * "Hide Buddy?" and "Show Buddy?" flows, parameterized by `mode`.
 * Bullets reassure Pillar 2 (no progress lost when hiding).
 *
 * Source: docs/teen-ui-design/buddy-toggle-flow/
 */
import type { FC } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const COLORS = {
  surfaceHigh: '#3D3556',
  text:        '#FFFFFF',
  muted:       '#A78BFA',
  lime:        '#A8E63E',
  canvas:      '#1a1636',
  faint:       'rgba(255,255,255,0.20)',
} as const;

interface Props {
  visible: boolean;
  mode: 'hide' | 'show';
  onConfirm: () => void;
  onCancel: () => void;
}

export const BuddyToggleModal: FC<Props> = ({ visible, mode, onConfirm, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityRole="button">
        {/* Stop press propagation by wrapping the sheet in a non-pressable view */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text style={styles.title}>{t(`buddy.toggleModal.${mode}.title`)}</Text>
          <Text style={styles.subtitle}>{t(`buddy.toggleModal.${mode}.subtitle`)}</Text>

          <View style={styles.bullets}>
            <Bullet text={t('buddy.toggleModal.bullet1')} />
            <Bullet text={t('buddy.toggleModal.bullet2')} />
            <Bullet text={t('buddy.toggleModal.bullet3')} />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.buttonOutlineText}>
                {t(`buddy.toggleModal.${mode}.keepCta`)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonFilled]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.buttonFilledText}>
                {t(`buddy.toggleModal.${mode}.confirmCta`)}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons name="checkmark" size={20} color={COLORS.lime} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor:        COLORS.surfaceHigh,
    borderTopLeftRadius:    24,
    borderTopRightRadius:   24,
    paddingHorizontal:      24,
    paddingTop:             12,
    paddingBottom:          32,
  },
  handle: {
    width:         40,
    height:        4,
    borderRadius:  2,
    backgroundColor: COLORS.faint,
    alignSelf:     'center',
    marginBottom:  24,
  },
  title: {
    color:      COLORS.text,
    fontSize:   22,
    fontWeight: '700',
    textAlign:  'center',
    marginBottom: 12,
  },
  subtitle: {
    color:      COLORS.muted,
    fontSize:   14,
    textAlign:  'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  bullets: {
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  12,
  },
  bulletText: {
    color:      COLORS.text,
    fontSize:   14,
    marginLeft: 12,
    flexShrink: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap:           12,
  },
  button: {
    flex:           1,
    height:         48,
    borderRadius:   12,
    justifyContent: 'center',
    alignItems:     'center',
  },
  buttonOutline: {
    borderWidth:    1.5,
    borderColor:    COLORS.lime,
    backgroundColor: 'transparent',
  },
  buttonOutlineText: {
    color:      COLORS.lime,
    fontSize:   16,
    fontWeight: '700',
  },
  buttonFilled: {
    backgroundColor: COLORS.lime,
  },
  buttonFilledText: {
    color:      COLORS.canvas,
    fontSize:   16,
    fontWeight: '700',
  },
});
