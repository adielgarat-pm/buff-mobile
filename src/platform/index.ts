/**
 * src/platform — cross-platform wrappers for native-only capabilities.
 *
 * Most of the app is write-once / run-both (View/Text/Pressable/styles/logic
 * all work on Android + Web via react-native-web). Only a finite set of native
 * APIs need a per-platform split; each lives here behind one signature so
 * features just import the wrapper and get both platforms for free.
 *
 * Pattern: `x.tsx` = native impl (tsc resolves this), `x.web.tsx` = web override
 * (Metro picks it on web). The base and the `.web` override MUST share the same
 * extension — Metro resolves per-extension, so a `crossAlert.ts` base would be
 * found before it ever tries the `.tsx` where `crossAlert.web.tsx` lives, and
 * the web override would be silently ignored. Add native-only capabilities here;
 * a check script (`npm run check:no-raw-alert`) blocks importing the raw native
 * module directly so this stays the one door.
 *
 * Members:
 *   - crossAlert / AlertHost — Alert.alert replacement (RN-Web Alert is a no-op)
 */
export { crossAlert, AlertHost } from './crossAlert';
export type { AlertButton, AlertButtonStyle, AlertOptions } from './crossAlert';
