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
});
