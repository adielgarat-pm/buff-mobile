/**
 * Tests for PhaseView — the child's per-phase task list.
 *
 * i18n stake (ux-i18n-sweep): the "Tasks" section header and the empty-state
 * copy used to be hard-coded English, so Hebrew-locale kids saw English on
 * their main task list. These tests lock in that both strings go through
 * i18next (t('phaseView.tasksHeader') / t('phaseView.empty')) and that both
 * catalogs actually carry the keys — with the empty state in warm, buddy
 * voice (Pillar 2: inviting, never scolding).
 */

import { render } from '@testing-library/react-native';
import { PhaseView } from '../PhaseView';
import type { Task } from '../../types/task';

import en from '../../i18n/en.json';
import he from '../../i18n/he.json';

// Identity translator — components render the KEY, so assertions prove the
// string is routed through i18next rather than hard-coded.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Theme palette resolves each key to its own name.
jest.mock('../../contexts/ThemeContext', () => ({
  useChildTheme: () => new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

// Deterministic scheduling: every task is visible today.
jest.mock('../../lib/taskScheduling', () => ({
  isTaskVisibleOn: () => true,
  toDateKey: () => '2026-07-11',
}));

// Child components are out of scope here — stub to keep the render shallow.
jest.mock('../PhaseProgressCircle', () => ({
  PhaseProgressCircle: () => null,
}));
jest.mock('../PhaseTaskCard', () => ({
  PhaseTaskCard: () => null,
}));

const noop = () => {};

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Pack backpack',
  time: '07:00', // 06:00–09:00 → morning phase
  category: 'organization',
  credits: 10,
  completed: false,
  ...overrides,
});

describe('PhaseView i18n', () => {
  it('renders the translated section header (no hard-coded "Tasks")', () => {
    const { getByText, queryByText } = render(
      <PhaseView
        phase="morning"
        tasks={[makeTask()]}
        onCompleteTask={noop}
        onUncompleteTask={noop}
      />,
    );
    expect(getByText('phaseView.tasksHeader')).toBeTruthy();
    expect(queryByText('Tasks')).toBeNull();
  });

  it('renders the translated empty state (no hard-coded English)', () => {
    const { getByText, queryByText } = render(
      <PhaseView
        phase="morning"
        tasks={[]}
        onCompleteTask={noop}
        onUncompleteTask={noop}
      />,
    );
    expect(getByText('phaseView.empty')).toBeTruthy();
    expect(queryByText('No tasks for this phase')).toBeNull();
  });

  it('both catalogs carry the PhaseView keys, empty state in buddy voice', () => {
    const enCatalog = en as Record<string, string>;
    const heCatalog = he as Record<string, string>;
    for (const key of ['phaseView.tasksHeader', 'phaseView.empty']) {
      expect(enCatalog[key]).toBeTruthy();
      expect(heCatalog[key]).toBeTruthy();
    }
    // Warm buddy voice, not a bare "no tasks" shrug (Pillar 2).
    expect(enCatalog['phaseView.empty']).toContain('💙');
    expect(heCatalog['phaseView.empty']).toContain('💙');
  });
});
