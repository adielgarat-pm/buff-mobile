/**
 * Tests for BoostersCarousel — Available / Used / Locked card states.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { BoostersCarousel } from '../BoostersCarousel';
import type { BuddyGift } from '../../../types/buddy';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'day' in opts)   return `${key}|day=${opts.day}`;
      if (opts && 'level' in opts) return `${key}|level=${opts.level}`;
      return key;
    },
  }),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────
const availableGift: BuddyGift = {
  id:               'gift-avail',
  child_profile_id: 'child-1',
  gift_type:        'theme_color',
  gift_value:       'green',
  given_at_level:   2,
  given_at:         '2026-05-01T00:00:00Z',
  used_at:          null,
  is_used:          false,
  created_at:       '2026-05-01T00:00:00Z',
};

const usedGift: BuddyGift = {
  ...availableGift,
  id:         'gift-used',
  gift_type:  'double_buffs',
  given_at_level: 3,
  used_at:    '2026-05-05T00:00:00Z',
  is_used:    true,
};

describe('BoostersCarousel', () => {
  test('renders section title', () => {
    const { getByText } = render(
      <BoostersCarousel gifts={[]} currentLevel={1} />
    );
    expect(getByText('buddy.boosters.sectionTitle')).toBeTruthy();
  });

  test('renders an Available card with "Available" caption', () => {
    const { getByText } = render(
      <BoostersCarousel gifts={[availableGift]} currentLevel={3} />
    );
    expect(getByText('buddy.boosters.giftType.theme_color')).toBeTruthy();
    expect(getByText('buddy.boosters.available')).toBeTruthy();
  });

  test('renders a Used card with "Used Day X" caption', () => {
    const { getByText } = render(
      <BoostersCarousel gifts={[usedGift]} currentLevel={3} />
    );
    expect(getByText('buddy.boosters.giftType.double_buffs')).toBeTruthy();
    expect(getByText('buddy.boosters.usedOnDay|day=3')).toBeTruthy();
  });

  test('renders Locked placeholders for skip_token + reward_discount when below L4', () => {
    const { getByText } = render(
      <BoostersCarousel gifts={[]} currentLevel={3} />
    );
    expect(getByText('buddy.boosters.giftType.skip_token')).toBeTruthy();
    expect(getByText('buddy.boosters.giftType.reward_discount')).toBeTruthy();
    expect(getByText('buddy.boosters.unlockAtLevel|level=4')).toBeTruthy();
    expect(getByText('buddy.boosters.unlockAtLevel|level=5')).toBeTruthy();
  });

  test('does NOT render skip_token placeholder once the child has reached L4', () => {
    const { queryByText } = render(
      <BoostersCarousel gifts={[]} currentLevel={4} />
    );
    expect(queryByText('buddy.boosters.unlockAtLevel|level=4')).toBeNull();
    // reward_discount placeholder still shows since L5 not reached
    expect(queryByText('buddy.boosters.unlockAtLevel|level=5')).not.toBeNull();
  });

  test('pressing an Available card calls onPress with the gift', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BoostersCarousel gifts={[availableGift]} currentLevel={3} onPress={onPress} />
    );

    fireEvent.press(getByText('buddy.boosters.available'));
    expect(onPress).toHaveBeenCalledWith(availableGift);
  });
});
