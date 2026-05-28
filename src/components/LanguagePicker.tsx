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
import { useLanguage } from '../contexts/LanguageContext';
import LanguagePickerModal from './LanguagePickerModal';

export default function LanguagePicker() {
  const { isRTL } = useLanguage();
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
        accessibilityLabel="Change language"
        accessibilityRole="button"
      >
        <Ionicons name="globe-outline" size={20} color="#A78BFA" />
      </TouchableOpacity>

      <LanguagePickerModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position:        'absolute',
    backgroundColor: 'rgba(167,139,250,0.12)',
    width:           36,
    height:          36,
    borderRadius:    18,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
});
