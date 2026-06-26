/**
 * SosButton — header-positioned button shown only when the kid is in
 * Low Power Mode. Tap → confirmation alert → flips parent_sos_sent on
 * today's child_vibes row (notifications surface lands in Phase 4).
 *
 * Per SPEC § Decisions OQ4: parent copy stays abstract ("[Kid] needs a
 * moment") — the SPEC also doesn't expose the score. Confirmation copy
 * here mirrors that promise.
 *
 * Idempotent at the UI level: once `sosSent`, the button shows "Sent"
 * and is disabled. Re-tapping is a no-op.
 *
 * Self-conditional: renders null when !isLowPower.
 */
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLowPower } from '../contexts/LowPowerContext';
import { crossAlert } from '../platform';

export interface SosButtonPalette {
  bg:        string;
  bgSent:    string;
  border:    string;
  text:      string;
  textSent:  string;
}

export interface SosButtonProps {
  palette: SosButtonPalette;
}

export default function SosButton({ palette }: SosButtonProps) {
  const { t } = useTranslation();
  const { isLowPower, sosSent, sendSos } = useLowPower();

  if (!isLowPower) return null;

  const onPress = () => {
    if (sosSent) return;

    crossAlert(
      t('sosButton.confirmTitle'),
      t('sosButton.confirmBody'),
      [
        { text: t('sosButton.confirmCancel'), style: 'cancel' },
        {
          text: t('sosButton.confirmYes'),
          onPress: async () => {
            const { error } = await sendSos();
            if (error) {
              console.warn('[SosButton] sendSos failed:', error);
              // No surfaced error — keep the kid's surface calm. The
              // worst case is they tap again and we retry the UPDATE.
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={sosSent}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={sosSent ? t('sosButton.alreadySent') : t('sosButton.label')}
      style={[
        styles.btn,
        {
          backgroundColor: sosSent ? palette.bgSent : palette.bg,
          borderColor:     palette.border,
        },
      ]}
    >
      <Text style={[
        styles.label,
        { color: sosSent ? palette.textSent : palette.text },
      ]}>
        {sosSent ? t('sosButton.alreadySent') : t('sosButton.label')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
