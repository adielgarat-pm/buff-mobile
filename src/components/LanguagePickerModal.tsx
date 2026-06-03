/**
 * LanguagePickerModal — the language-choice sheet.
 *
 * Shared by the auth-screen globe trigger (LanguagePicker) and the in-app
 * Settings "Language" rows (parent + child). Selecting a language closes the
 * sheet and delegates to LanguageContext.setLanguage(), which handles
 * persistence, i18n, and the he↔en RTL restart prompt.
 */
import { Modal, Pressable, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { PASTEL_MODE as T } from '../theme/modes';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LanguagePickerModal({ visible, onClose }: Props) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t('language.pickerTitle')}</Text>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const info   = LANGUAGE_LABELS[lang];
            const active = lang === language;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.option, active && styles.optionActive]}
                onPress={async () => {
                  onClose();
                  await setLanguage(lang);
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
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
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    // Warm deep-violet scrim (brand) instead of pure-black.
    backgroundColor: 'rgba(26,22,54,0.45)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  sheet: {
    backgroundColor: T.card,
    borderRadius:    20,
    padding:         24,
    width:           220,
    gap:             4,
    borderWidth:     1,
    borderColor:     T.cardBorder,
  },
  sheetTitle: {
    color:        T.text,
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
    backgroundColor: 'rgba(124,58,237,0.10)',
  },
  optionLabel: {
    flex:       1,
    color:      T.text,
    fontSize:   16,
    fontWeight: '500',
  },
  optionLabelActive: {
    color:      T.accent,
    fontWeight: '700',
  },
  check: {
    color:    T.accent,
    fontSize: 16,
  },
});
