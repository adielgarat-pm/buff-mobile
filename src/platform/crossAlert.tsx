/**
 * crossAlert (native) — thin pass-through to React Native's `Alert.alert`.
 *
 * On iOS/Android this is byte-for-byte the existing behavior: the OS dialog,
 * unchanged. The web counterpart (`crossAlert.web.tsx`) renders an in-app modal
 * instead, because react-native-web's `Alert.alert` is a no-op (`static
 * alert() {}` — verified in RN-Web 0.21.2), which silently swallowed every
 * alert/confirm on web.
 *
 * Metro resolves `crossAlert.web.tsx` on web and this file on native; tsc
 * resolves this base file. Call sites import `{ crossAlert }` and get the right
 * implementation per platform — no `Platform.OS` branching at the call site.
 *
 * A thin wrapper (not `export const crossAlert = Alert.alert`) is used
 * deliberately to avoid any `this`/binding surprise on native.
 */
import { Alert } from 'react-native';

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

/**
 * Signature-compatible with RN's `Alert.alert(title, message?, buttons?, options?)`.
 * Forwarded with rest args (not named params) so the call arity to `Alert.alert`
 * is preserved exactly — `crossAlert('x')` calls `Alert.alert('x')`, not
 * `Alert.alert('x', undefined, undefined, undefined)`. Keeps the wrapper a
 * transparent pass-through (and arity-sensitive Alert spies in tests intact).
 */
type CrossAlertArgs = [title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions];

export function crossAlert(...args: CrossAlertArgs): void {
  (Alert.alert as (...a: CrossAlertArgs) => void)(...args);
}

/**
 * No host is needed on native — `Alert.alert` renders the OS dialog directly.
 * Mounted unconditionally at the app root; renders nothing on native.
 */
export function AlertHost(): null {
  return null;
}
