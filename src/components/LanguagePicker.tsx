/**
 * LanguagePicker — compact globe button for auth screens.
 *
 * Shows a globe icon (universal language-switch affordance) so the trigger
 * stays square and never gets clipped on narrow mobile screens. Tapping opens
 * the shared LanguagePickerModal.
 */
import { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { VIOLET_ACCENT } from '../theme/palette';
import LanguagePickerModal from './LanguagePickerModal';

export default function LanguagePicker() {
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button — flips to top-left for RTL */}
      <TouchableOpacity
        style={[
          styles.trigger,
          isRTL ? { left: 16 } : { right: 16 },
          { top: (insets.top || 16) + 8 },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityLabel={t('a11y.changeLanguage')}
        accessibilityRole="button"
      >
        <Ionicons name="globe-outline" size={20} color={VIOLET_ACCENT} />
      </TouchableOpacity>

      <LanguagePickerModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position:        'absolute',
    // Stronger lavender tint so the globe reads on the light Pastel canvas.
    backgroundColor: 'rgba(124,58,237,0.10)',
    width:           36,
    height:          36,
    borderRadius:    18,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
});
