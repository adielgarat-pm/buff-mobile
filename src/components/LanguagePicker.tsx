/**
 * LanguagePicker — compact language button for auth screens.
 *
 * Shows current language as a text pill (EN / עב).
 * Tapping opens a Modal with text-only language options.
 */
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';

export default function LanguagePicker() {
  const { language, setLanguage, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const shortLabel = language === 'he' ? 'עב' : 'EN';

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
      >
        <Text style={styles.triggerLabel}>{shortLabel}</Text>
      </TouchableOpacity>

      {/* Modal sheet */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Language</Text>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const info   = LANGUAGE_LABELS[lang];
              const active = lang === language;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={async () => {
                    setOpen(false);
                    await setLanguage(lang);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {info.native}
                  </Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position:          'absolute',
    backgroundColor:   'rgba(167,139,250,0.12)',
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      20,
    zIndex:            10,
  },
  triggerLabel: {
    color:      '#A78BFA',
    fontSize:   13,
    fontWeight: '700',
  },

  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderRadius:    20,
    padding:         24,
    width:           220,
    gap:             4,
  },
  sheetTitle: {
    color:        '#E5E7EB',
    fontSize:     15,
    fontWeight:   '700',
    textAlign:    'center',
    marginBottom: 12,
  },
  option: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   14,
    paddingHorizontal: 12,
    borderRadius:      12,
  },
  optionActive: {
    backgroundColor: 'rgba(167,139,250,0.15)',
  },
  optionLabel: {
    flex:       1,
    color:      '#E5E7EB',
    fontSize:   16,
    fontWeight: '500',
  },
  optionLabelActive: {
    color:      '#A78BFA',
    fontWeight: '700',
  },
  check: {
    color:    '#A78BFA',
    fontSize: 16,
  },
});
