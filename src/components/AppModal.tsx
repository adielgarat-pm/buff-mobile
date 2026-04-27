/**
 * AppModal — lightweight info/confirmation modal.
 * Replaces Alert.alert() for a consistent styled look.
 */
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PARENT_THEME as T } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  icon: string;
  message: string;
  closeLabel?: string;
}

export default function AppModal({ visible, onClose, icon, message, closeLabel = 'OK' }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: T.card }]}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.message, { color: T.text }]}>{message}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: T.accent }]} onPress={onClose}>
            <Text style={styles.btnText}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { borderRadius: 20, padding: 28, alignItems: 'center', width: '100%', maxWidth: 320, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  icon: { fontSize: 40, marginBottom: 12 },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
