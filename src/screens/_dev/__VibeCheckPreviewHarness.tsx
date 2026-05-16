/**
 * __VibeCheckPreviewHarness — dev-only preview component for the
 * Daily Vibe Check modal in BOTH themes.
 *
 * NOT shipped. Used during pkg/daily-vibe-check Phase 2 Chunk 2a
 * to capture screenshots before wiring the real flow.
 *
 * To render it, temporarily swap `<RootNavigator />` for
 * `<__VibeCheckPreviewHarness />` inside `AppContent` in App.tsx.
 * Run `npm run web`, screenshot, revert App.tsx.
 *
 * Stays committed as a convenience for future visual-review of the
 * modal in isolation; delete in Phase 5 closeout if unused.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import VibeCheckScreen from '../child/VibeCheckScreen';

type Theme = 'mint' | 'gamer';

export default function __VibeCheckPreviewHarness() {
  const [theme, setTheme]     = useState<Theme>('mint');
  const [visible, setVisible] = useState(true);
  const [lastEvent, setLastEvent] = useState<string>('—');

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.controls}>
        <Text style={styles.heading}>VibeCheck preview</Text>
        <Text style={styles.sub}>Phase 2 Chunk 2a — dev-only harness</Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, theme === 'mint'  && styles.btnActive]}
            onPress={() => setTheme('mint')}
          ><Text style={styles.btnText}>Pastel</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, theme === 'gamer' && styles.btnActive]}
            onPress={() => setTheme('gamer')}
          ><Text style={styles.btnText}>Gamer</Text></TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.reopen]}
          onPress={() => { setVisible(true); setLastEvent('reopened'); }}
        ><Text style={styles.btnText}>Re-open modal</Text></TouchableOpacity>

        <Text style={styles.event}>last event: {lastEvent}</Text>
      </ScrollView>

      <VibeCheckScreen
        visible={visible}
        themeOverride={theme}
        onSelect={(level, type) => {
          setLastEvent(`selected level=${level} type=${type}`);
          setVisible(false);
        }}
        onDismiss={() => {
          setLastEvent('dismissed');
          setVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#0F0F1A' },
  controls: { padding: 24, paddingTop: 80, gap: 16 },
  heading:  { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub:      { color: '#9CA3AF', fontSize: 13 },
  row:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 10, backgroundColor: '#1F2937',
    borderWidth: 1, borderColor: '#374151',
    alignItems: 'center',
  },
  btnActive: { backgroundColor: '#5B3FAF', borderColor: '#A78BFA' },
  reopen:    { backgroundColor: '#0EA5E9', borderColor: '#38BDF8' },
  btnText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  event:     { color: '#FDE68A', fontSize: 12, marginTop: 8 },
});
