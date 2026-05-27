/**
 * Tests for BuddyHero — shared buddy character visual.
 *
 * Covers: silhouette fallback when no PNG asset, capybara skin selection,
 * × close button visibility tied to onClose prop, press wrapper tied to
 * onPress prop, both interactions invoke their handlers.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { BuddyHero } from '../BuddyHero';

describe('BuddyHero', () => {
  test('renders without onClose / onPress — no interactive elements', () => {
    const { queryByTestId } = render(
      <BuddyHero size="dashboard" skinId="wolf" level={2} />,
    );

    expect(queryByTestId('buddy-hero-container')).toBeTruthy();
    expect(queryByTestId('buddy-hero-close')).toBeNull();
    expect(queryByTestId('buddy-hero-press')).toBeNull();
  });

  test('renders × close button when onClose is provided', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <BuddyHero size="dashboard" skinId="wolf" level={3} onClose={onClose} />,
    );

    const closeBtn = getByTestId('buddy-hero-close');
    fireEvent.press(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders pressable wrapper when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <BuddyHero size="screen" skinId="capybara" level={1} onPress={onPress} />,
    );

    fireEvent.press(getByTestId('buddy-hero-press'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('accepts both onPress and onClose — × button still triggers onClose', () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = render(
      <BuddyHero size="dashboard" skinId="wolf" level={5} onPress={onPress} onClose={onClose} />,
    );

    fireEvent.press(getByTestId('buddy-hero-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders emoji from PET_SKINS for a known skin (panda)', () => {
    const { getByTestId } = render(
      <BuddyHero size="screen" skinId="panda" level={2} />,
    );
    expect(getByTestId('buddy-hero-container')).toBeTruthy();
    expect(getByTestId('buddy-hero-emoji').props.children).toBe('🐼');
  });

  test('renders emoji for heroic skins (tiger, shark, dragon)', () => {
    const tiger = render(<BuddyHero size="dashboard" skinId="tiger" level={1} />);
    expect(tiger.getByTestId('buddy-hero-emoji').props.children).toBe('🐯');

    const shark = render(<BuddyHero size="dashboard" skinId="shark" level={3} />);
    expect(shark.getByTestId('buddy-hero-emoji').props.children).toBe('🦈');

    const dragon = render(<BuddyHero size="dashboard" skinId="epic_dragon" level={5} />);
    expect(dragon.getByTestId('buddy-hero-emoji').props.children).toBe('🐉');
  });

  test('handles null skinId (fresh child) — defaults to wolf silhouette', () => {
    const { getByTestId, queryByTestId } = render(
      <BuddyHero size="dashboard" skinId={null} level={1} />,
    );
    expect(getByTestId('buddy-hero-container')).toBeTruthy();
    expect(queryByTestId('buddy-hero-emoji')).toBeNull();
  });
});
