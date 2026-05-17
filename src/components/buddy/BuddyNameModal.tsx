/**
 * BuddyNameModal — name / rename the buddy.
 *
 * Centered fade-in modal. TextInput pre-filled with the current name
 * (or empty with the skin-default as placeholder). Empty input on Save
 * passes `null` to onSave — the screen reverts display to default.
 *
 * Source SPEC: docs/sessions/teen-ui-with-buddy-character/SPEC.md
 *              (Architectural Decision 10: name editable from day 0)
 */
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const COLORS = {
  surfaceHigh: '#3D3556',
  canvas:      '#1a1636',
  text:        '#FFFFFF',
  muted:       '#A78BFA',
  faint:       'rgba(255,255,255,0.50)',
  border:      'rgba(255,255,255,0.10)',
  lime:        '#A8E63E',
} as const;

interface Props {
  visible: boolean;
  currentName: string | null;
  defaultName: string;
  onSave: (name: string | null) => void;
  onCancel: () => void;
}

export const BuddyNameModal: FC<Props> = ({
  visible,
  currentName,
  defaultName,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentName ?? '');

  useEffect(() => {
    if (visible) {
      setValue(currentName ?? '');
    }
  }, [visible, currentName]);

  const handleSave = () => {
    const trimmed = value.trim();
    onSave(trimmed.length === 0 ? null : trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('buddy.nameModal.title')}</Text>

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={defaultName}
            placeholderTextColor={COLORS.faint}
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel="buddy-name-input"
          />

          <Text style={styles.hint}>{t('buddy.nameModal.hint')}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.buttonOutlineText}>{t('buddy.nameModal.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonFilled]}
              onPress={handleSave}
              accessibilityRole="button"
            >
              <Text style={styles.buttonFilledText}>{t('buddy.nameModal.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         24,
  },
  card: {
    width:           '100%',
    maxWidth:        340,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius:    16,
    padding:         24,
  },
  title: {
    color:      COLORS.text,
    fontSize:   18,
    fontWeight: '700',
    textAlign:  'center',
    marginBottom: 16,
  },
  input: {
    height:           44,
    paddingHorizontal: 12,
    borderRadius:     8,
    backgroundColor:  COLORS.canvas,
    color:            COLORS.text,
    fontSize:         16,
    borderWidth:      1,
    borderColor:      COLORS.border,
    marginBottom:     8,
  },
  hint: {
    color:      COLORS.muted,
    fontSize:   12,
    textAlign:  'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap:           12,
  },
  button: {
    flex:           1,
    height:         44,
    borderRadius:   10,
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
    fontSize:   15,
    fontWeight: '700',
  },
  buttonFilled: {
    backgroundColor: COLORS.lime,
  },
  buttonFilledText: {
    color:      COLORS.canvas,
    fontSize:   15,
    fontWeight: '700',
  },
});
