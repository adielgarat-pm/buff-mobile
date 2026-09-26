/**
 * Bell row for the evening child-invite reminder (migration 059): the copy
 * follows the access path the parent chose (entity_name).
 */
import { render } from '@testing-library/react-native';
import { NotificationRow } from '../NotificationRow';
import type { FeedNotification } from '../../../hooks/useNotificationsFeed';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => (vars?.name ? `${key}(${vars.name})` : key),
    i18n: { language: 'en' },
  }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const row = (entity_name: string): FeedNotification => ({
  id: 'n1', family_id: 'f1', parent_id: 'p1', type: 'child_invite_reminder',
  child_id: 'c1', child_name: 'Noa', entity_id: null, entity_name,
  is_read: false, created_at: new Date().toISOString(),
});

it('home computer → "open BUFF together"', () => {
  const { getByText } = render(<NotificationRow notification={row('home_device')} onPress={jest.fn()} />);
  expect(getByText('notificationFeed.row.child_invite_reminder_home(Noa)')).toBeTruthy();
});

it('own phone → "the invite is ready to send"', () => {
  const { getByText } = render(<NotificationRow notification={row('own_phone')} onPress={jest.fn()} />);
  expect(getByText('notificationFeed.row.child_invite_reminder_phone(Noa)')).toBeTruthy();
});
