/**
 * LowPowerBanner — soft, calm strip shown above the dashboard task list
 * when the kid is in Low Power Mode.
 *
 * Per SPEC § Decisions OQ2: no "broken" or shame-implying treatment;
 * explicit acknowledgement of the kid's state in a positive tone.
 *
 * Self-conditional: renders null when not low-power. Caller just mounts
 * <LowPowerBanner /> unconditionally and the banner appears/disappears
 * with the context value.
 */
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import { useLowPower } from '../contexts/LowPowerContext';

export interface LowPowerBannerPalette {
  bg:     string;
  border: string;
  text:   string;
}

export interface LowPowerBannerProps {
  palette: LowPowerBannerPalette;
}

export default function LowPowerBanner({ palette }: LowPowerBannerProps) {
  const { t } = useTranslation();
  const { isLowPower } = useLowPower();

  if (!isLowPower) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>
        {t('lowPower.banner')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
