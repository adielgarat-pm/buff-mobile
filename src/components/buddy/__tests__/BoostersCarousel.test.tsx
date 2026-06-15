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
    const { getByText, getAllByText } = render(
      <BoostersCarousel gifts={[availableGift]} currentLevel={3} />
    );
    // Available gift + locked L4/L5 placeholders all use the theme_color label.
    expect(getAllByText('buddy.boosters.giftType.theme_color').length).toBeGreaterThan(0);
    expect(getByText('buddy.boosters.available')).toBeTruthy();
  });

  test('renders a Used card with the "Opened" caption', () => {
    const { getByText } = render(
      <BoostersCarousel gifts={[usedGift]} currentLevel={3} />
    );
    expect(getByText('buddy.boosters.giftType.double_buffs')).toBeTruthy();
    expect(getByText('buddy.boosters.used')).toBeTruthy();
  });

  test('renders cosmetic Locked placeholders (L4 + L5) when below L4', () => {
    const { getByText } = render(
      <BoostersCarousel gifts={[]} currentLevel={3} />
    );
    // Both locked cards are theme_color now; distinguished by their unlock level.
    expect(getByText('buddy.boosters.unlockAtLevel|level=4')).toBeTruthy();
    expect(getByText('buddy.boosters.unlockAtLevel|level=5')).toBeTruthy();
  });

  test('does NOT render the L4 placeholder once the child has reached L4', () => {
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
