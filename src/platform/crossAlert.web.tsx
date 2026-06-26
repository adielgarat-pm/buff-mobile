/**
 * crossAlert (web) — react-native-web's `Alert.alert` is a no-op, so we render
 * an in-app modal via a singleton `AlertHost` mounted once at the app root.
 *
 * `crossAlert(...)` is callable from anywhere (event handlers AND async helpers
 * outside React), so the bridge to the mounted host is a module-level emitter
 * rather than a hook.
 *
 * Signature matches RN's `Alert.alert(title, message?, buttons?, options?)`.
 */
import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { PARENT_THEME as T } from '../theme';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertPayload {
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
}

// Module-level bridge: lets crossAlert() reach the mounted host from anywhere.
let emit: ((p: AlertPayload) => void) | null = null;

export function crossAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
): void {
  // RN shows a single "OK" button when none are provided.
  const normalized: AlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];

  if (emit) {
    emit({ title, message, buttons: normalized, options });
  } else if (typeof window !== 'undefined') {
    // Host not mounted yet (very early in startup) — degrade to the browser
    // alert rather than swallow the message, then fire the primary action.
    window.alert([title, message].filter(Boolean).join('\n\n'));
    const primary = normalized.find((b) => b.style !== 'cancel');
    primary?.onPress?.();
  }
}

/**
 * AlertHost — mount ONCE at the app root. Renders the current alert (if any)
 * as a styled modal. On native this whole file is unused (Metro picks
 * `crossAlert.ts`, whose AlertHost returns null).
 */
export function AlertHost() {
  const [current, setCurrent] = useState<AlertPayload | null>(null);

  useEffect(() => {
    emit = (p) => setCurrent(p);
    return () => {
      emit = null;
    };
  }, []);

  if (!current) return null;

  const close = () => setCurrent(null);

  const onButton = (b: AlertButton) => {
    close();
    b.onPress?.();
  };

  const onBackdrop = () => {
    if (current.options?.cancelable === false) return;
    close();
    const cancelBtn = current.buttons.find((b) => b.style === 'cancel');
    if (cancelBtn?.onPress) cancelBtn.onPress();
    else current.options?.onDismiss?.();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onBackdrop}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onBackdrop}>
        {/* Inner card swallows taps so they don't dismiss via the backdrop. */}
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => undefined}>
          {!!current.title && <Text style={styles.title}>{current.title}</Text>}
          {!!current.message && (
            <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageWrap}>
              <Text style={styles.message}>{current.message}</Text>
            </ScrollView>
          )}
          <View style={styles.btnCol}>
            {current.buttons.map((b, i) => (
              <TouchableOpacity
                key={`${b.text}-${i}`}
                style={[
                  styles.btn,
                  b.style === 'cancel' && styles.btnCancel,
                  b.style === 'destructive' && styles.btnDestructive,
                  (!b.style || b.style === 'default') && styles.btnDefault,
                ]}
                onPress={() => onButton(b)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.btnText,
                    b.style === 'cancel' && styles.btnTextCancel,
                    b.style === 'destructive' && styles.btnTextDestructive,
                  ]}
                >
                  {b.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, backgroundColor: T.card, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 17, fontWeight: '700', color: T.text, textAlign: 'center', marginBottom: 8 },
  messageScroll: { maxHeight: 240, alignSelf: 'stretch' },
  messageWrap: { paddingBottom: 4 },
  message: { fontSize: 15, lineHeight: 22, color: T.textMuted, textAlign: 'center', marginBottom: 4 },
  btnCol: { marginTop: 16, gap: 8 },
  btn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnDefault: { backgroundColor: T.accent },
  btnCancel: { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.cardBorder },
  btnDestructive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FECACA' },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnTextCancel: { color: T.textMuted },
  btnTextDestructive: { color: '#DC2626' },
});
