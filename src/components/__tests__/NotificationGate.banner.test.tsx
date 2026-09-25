/**
 * Regression (Android run 2026-09-24): the "notifications are off" banner is
 * positioned for the parent tab bar. Shown during onboarding (no tab bar) it sat
 * on the pinned Welcome / step / Complete CTAs and swallowed their taps. It must
 * appear only on the ParentApp shell.
 */
import { render, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { setCurrentRoute } from '../../lib/currentRoute';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }) }));
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ profile: { id: 'p1', role: 'parent' } }) }));
jest.mock('../../hooks/usePushRegistration', () => ({ usePushRegistration: () => ({ permission: 'denied', register: jest.fn() }) }));
jest.mock('../../hooks/usePushPromptDismiss', () => ({ usePushPromptDismiss: () => ({ isDismissed: true, markDismissed: jest.fn(), loading: false }) }));
jest.mock('../../hooks/useKidLocalNotifications', () => ({ useKidLocalNotifications: () => undefined }));
jest.mock('../../lib/notificationHandler', () => ({ setupNotifications: () => Promise.resolve() }));
jest.mock('../../lib/pushTelemetry', () => ({ logPushStep: jest.fn() }));
jest.mock('../../screens/onboarding/PushPermissionPrePrompt', () => ({ PushPermissionPrePrompt: () => null }));

import { NotificationGate } from '../NotificationGate';

describe('NotificationGate denied banner', () => {
  const realOS = Platform.OS;
  beforeAll(() => { (Platform as { OS: string }).OS = 'android'; });
  afterAll(() => { (Platform as { OS: string }).OS = realOS; });

  it.each(['Welcome', 'UStep1', 'UStep8_Complete', 'Login'])('hidden on %s (no tab bar)', (route) => {
    act(() => setCurrentRoute(route));
    const { queryByText } = render(<NotificationGate />);
    expect(queryByText('notifSettings.deniedBanner.text')).toBeNull();
  });

  it('shown on the ParentApp shell', () => {
    act(() => setCurrentRoute('ParentApp'));
    const { getByText } = render(<NotificationGate />);
    expect(getByText('notifSettings.deniedBanner.text')).toBeTruthy();
  });

  it('appears when the parent reaches ParentApp after onboarding (route change after mount)', () => {
    act(() => setCurrentRoute('UStep8_Complete'));
    const { queryByText } = render(<NotificationGate />);
    expect(queryByText('notifSettings.deniedBanner.text')).toBeNull();
    act(() => setCurrentRoute('ParentApp'));
    expect(queryByText('notifSettings.deniedBanner.text')).toBeTruthy();
  });
});

// The route store is written from NavigationContainer.onStateChange during a
// screen transition. Subscribers must use a batched setState, not
// useSyncExternalStore (sync render mid-transition — suspected trigger of the
// Android "connectAnimatedNodeToView … does not exist" red box, 2026-09-25).
describe('currentRoute subscribers', () => {
  it('do not use useSyncExternalStore', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const src = path.join(__dirname, '..', '..');
    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) { if (f !== '__tests__' && f !== 'node_modules') walk(p); continue; }
        if (!/\.(ts|tsx)$/.test(f)) continue;
        const code = fs.readFileSync(p, 'utf8');
        if (code.includes('subscribeCurrentRoute') && /useSyncExternalStore\s*\(/.test(code)) offenders.push(path.relative(src, p));
      }
    };
    walk(src);
    expect(offenders).toEqual([]);
  });
});
