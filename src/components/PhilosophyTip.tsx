import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

interface PhilosophyTipProps {
  tipKey: string;
  dismissible?: boolean;
}

export default function PhilosophyTip({ tipKey, dismissible = false }: PhilosophyTipProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!dismissible) { setChecked(true); return; }
    AsyncStorage.getItem(`tip_dismissed_${tipKey}`).then(val => {
      if (val === 'true') setDismissed(true);
      setChecked(true);
    });
  }, [tipKey, dismissible]);

  const handleDismiss = async () => {
    await AsyncStorage.setItem(`tip_dismissed_${tipKey}`, 'true');
    setDismissed(true);
  };

  if (!checked || dismissed) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>💡</Text>
      <Text style={styles.text}>{t(tipKey)}</Text>
      {dismissible && (
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f5f0ff', borderWidth: 1, borderColor: '#c8bef5', borderRadius: 10, padding: 12, gap: 8, marginBottom: 16 },
  icon:  { fontSize: 16, lineHeight: 20 },
  text:  { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 19 },
  close: { fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
});
