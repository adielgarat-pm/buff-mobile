/**
 * Tests for LevelPill — friendship-level indicator.
 */
import { render } from '@testing-library/react-native';
import { LevelPill } from '../LevelPill';

describe('LevelPill', () => {
  test('renders "LEVEL N" text for each level', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const { getByText, unmount } = render(<LevelPill level={level} />);
      expect(getByText(`LEVEL ${level}`)).toBeTruthy();
      unmount();
    }
  });

  test('snapshot — level 1 (one filled dot)', () => {
    const { toJSON } = render(<LevelPill level={1} />);
    expect(toJSON()).toMatchSnapshot();
  });

  test('snapshot — level 3 (three filled dots)', () => {
    const { toJSON } = render(<LevelPill level={3} />);
    expect(toJSON()).toMatchSnapshot();
  });

  test('snapshot — level 5 (all filled)', () => {
    const { toJSON } = render(<LevelPill level={5} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
