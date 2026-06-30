import { Platform, type ViewStyle } from 'react-native';

/**
 * Web-only: constrain an auth content column to a readable width and centre it.
 * No-op on native — phones are already narrower than any maxWidth we'd pick, so
 * native layouts stay byte-for-byte identical.
 *
 * Spread onto a screen's existing centred inner container:
 *   <View style={[styles.inner, webAuthColumn(440)]}>
 */
export const webAuthColumn = (maxWidth = 440): ViewStyle | null =>
  Platform.OS === 'web' ? { width: '100%', maxWidth, alignSelf: 'center' } : null;
