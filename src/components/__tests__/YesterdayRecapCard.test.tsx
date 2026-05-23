/**
 * Tests for YesterdayRecapCard — read-only per-child summary on the Parent
 * Dashboard's "Yesterday" section.
 *
 * Pillar 2 stake: this component MUST NOT render counts-of-failure framing.
 * The tests below assert positive behaviors AND negative behaviors (banned
 * strings absent from the render output, regardless of recap data shape).
 */

import { render, fireEvent } from '@testing-library/react-native';
import YesterdayRecapCard from '../YesterdayRecapCard';
import type { ChildYesterdayRecap } from '../../utils/yesterdayRecapUtils';

// Identity translator — tests assert on keys, not localized strings.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const TASK = {
  taskId:   't1',
  title:    'Brush teeth',
  time:     '07:00',
  category: 'self-care',
  icon:     null,
};

const makeRecap = (overrides: Partial<ChildYesterdayRecap> = {}): ChildYesterdayRecap => ({
  childId:        'child-a',
  tasks:          [{ ...TASK, completed: true }, { ...TASK, taskId: 't2', title: 'Backpack', completed: false }],
  totalScheduled: 2,
  totalCompleted: 1,
  ...overrides,
});

describe('YesterdayRecapCard', () => {
  describe('collapsed (default)', () => {
    test('shows child name, avatar, and summary chip', () => {
      const recap = makeRecap();
      const { getByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );

      expect(getByText('Matan')).toBeTruthy();
      expect(getByText('🚀')).toBeTruthy();
      // Summary key from the i18n contract
      expect(getByText('yesterdayRecap.summary')).toBeTruthy();
    });

    test('shows chevron ▾ when collapsed', () => {
      const { getByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={makeRecap()} />,
      );
      expect(getByText('▾')).toBeTruthy();
    });

    test('does NOT render the task list', () => {
      const { queryByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={makeRecap()} />,
      );
      expect(queryByText('Brush teeth')).toBeNull();
      expect(queryByText('Backpack')).toBeNull();
    });
  });

  describe('expanded (after press)', () => {
    test('shows each task row with title and time after expanding', () => {
      const { getByText, getAllByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={makeRecap()} />,
      );

      // Tap the header (the role=button area). Press the name text to bubble up.
      fireEvent.press(getByText('Matan'));

      expect(getByText('Brush teeth')).toBeTruthy();
      expect(getByText('Backpack')).toBeTruthy();
      // Both tasks happen to share the time string in the fixture (intentional —
      // verifies multiple rows render the same time without crashing).
      expect(getAllByText('07:00')).toHaveLength(2);
    });

    test('shows chevron ▴ after expansion', () => {
      const { getByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={makeRecap()} />,
      );
      fireEvent.press(getByText('Matan'));
      expect(getByText('▴')).toBeTruthy();
    });

    test('renders ✓ for completed and ○ for not-marked tasks', () => {
      const recap = makeRecap();
      const { getByText, getAllByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      fireEvent.press(getByText('Matan'));

      // One completed (t1) → one ✓ ; one not-marked (t2) → one ○
      expect(getAllByText('✓')).toHaveLength(1);
      expect(getAllByText('○')).toHaveLength(1);
    });

    test('NEVER renders ✗ or red-X variants (Pillar 2)', () => {
      const recap = makeRecap();
      const { getByText, queryByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      fireEvent.press(getByText('Matan'));

      // Pillar 2 anchor: unmarked tasks must use ○ (neutral), not ✗ or X.
      expect(queryByText('✗')).toBeNull();
      expect(queryByText('X')).toBeNull();
    });
  });

  describe('all-complete state (totalCompleted === totalScheduled)', () => {
    test('renders the celebration line after expanding', () => {
      const recap = makeRecap({
        tasks:          [{ ...TASK, completed: true }, { ...TASK, taskId: 't2', completed: true }],
        totalScheduled: 2,
        totalCompleted: 2,
      });
      const { getByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      fireEvent.press(getByText('Matan'));

      expect(getByText('yesterdayRecap.allComplete')).toBeTruthy();
    });

    test('does NOT render the conversation tip when all complete', () => {
      const recap = makeRecap({
        tasks:          [{ ...TASK, completed: true }],
        totalScheduled: 1,
        totalCompleted: 1,
      });
      const { getByText, queryByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      fireEvent.press(getByText('Matan'));

      // PhilosophyTip uses the tipKey itself as the text in our mock
      expect(queryByText('yesterdayRecap.tipConversation')).toBeNull();
    });

    test('renders ALL ✓ symbols (no ○) when fully complete', () => {
      const recap = makeRecap({
        tasks:          [
          { ...TASK, completed: true },
          { ...TASK, taskId: 't2', completed: true },
          { ...TASK, taskId: 't3', completed: true },
        ],
        totalScheduled: 3,
        totalCompleted: 3,
      });
      const { getByText, getAllByText, queryByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      fireEvent.press(getByText('Matan'));

      expect(getAllByText('✓')).toHaveLength(3);
      expect(queryByText('○')).toBeNull();
    });
  });

  describe('zero-marked state (Pillar 2 softening per SPEC §2)', () => {
    test('uses the softened "zeroMarked" key, NOT a "0 of N" summary', () => {
      const recap = makeRecap({
        tasks:          [
          { ...TASK, completed: false },
          { ...TASK, taskId: 't2', completed: false },
        ],
        totalScheduled: 2,
        totalCompleted: 0,
      });
      const { getByText, queryByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );

      // Softened phrase used in the collapsed header
      expect(getByText('yesterdayRecap.zeroMarked')).toBeTruthy();
      // The "X of Y" template MUST NOT appear when zero marked
      expect(queryByText('yesterdayRecap.summary')).toBeNull();
    });
  });

  describe('defensive — totalScheduled = 0', () => {
    test('renders nothing (caller should filter, but card is defensive)', () => {
      const recap = makeRecap({
        tasks:          [],
        totalScheduled: 0,
        totalCompleted: 0,
      });
      const { toJSON } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      expect(toJSON()).toBeNull();
    });
  });

  describe('snapshot — locked render shapes', () => {
    test('collapsed mixed-completion', () => {
      const { toJSON } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={makeRecap()} />,
      );
      expect(toJSON()).toMatchSnapshot();
    });

    test('expanded all-complete', () => {
      const recap = makeRecap({
        tasks:          [{ ...TASK, completed: true }],
        totalScheduled: 1,
        totalCompleted: 1,
      });
      const { toJSON, getByText } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      fireEvent.press(getByText('Matan'));
      expect(toJSON()).toMatchSnapshot();
    });

    test('collapsed zero-marked', () => {
      const recap = makeRecap({
        tasks:          [
          { ...TASK, completed: false },
          { ...TASK, taskId: 't2', completed: false },
        ],
        totalScheduled: 2,
        totalCompleted: 0,
      });
      const { toJSON } = render(
        <YesterdayRecapCard childName="Matan" childAvatar="🚀" recap={recap} />,
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
