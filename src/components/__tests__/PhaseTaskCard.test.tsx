/**
 * Tests for PhaseTaskCard — the child's per-phase task card.
 *
 * Pillar 2 stake (ux-no-late-shame): a task completed OUTSIDE its phase-hours
 * window must NOT get failure framing. The old card rendered a warning icon
 * (alert-circle-outline), T.warning color, and a hard-coded English
 * "Completed at … (outside window)" — a caution badge for a kid who DID the
 * task. These tests lock in the neutral replacement: a muted, i18n'd
 * "Done at {{time}} ✓" for every completed task, identical whether the
 * completion was inside or outside the window.
 */

import { render, fireEvent } from '@testing-library/react-native';
import { PhaseTaskCard } from '../PhaseTaskCard';
import type { Task } from '../../types/task';
import { PHASES } from '../../types/phase';

// Identity-ish translator — returns the key, with interpolation values
// appended so tests can assert both the key and the injected time.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'time' in opts ? `${key}:${opts.time}` : key,
  }),
}));

// Theme palette resolves each key to its own name ('warning' → 'warning'),
// so style assertions can detect exactly WHICH palette color was used.
jest.mock('../../contexts/ThemeContext', () => ({
  useChildTheme: () => new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

// Deterministic locale for formatTime (avoids depending on real i18n state).
jest.mock('../../lib/uiLocale', () => ({
  uiLocale: () => 'en-US',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

// crossAlert mock — captures the confirm-dialog invocation so tests can
// inspect title/body keys and drive the confirm/cancel buttons.
jest.mock('../../platform', () => ({
  crossAlert: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { crossAlert } = require('../../platform') as { crossAlert: jest.Mock };

const MORNING = PHASES[0]; // 06:00–09:00 window

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Pack backpack',
  time: '07:00',
  category: 'organization',
  credits: 10,
  completed: false,
  ...overrides,
});

const noop = () => {};

/** completedAt today at the given local hour/minute. */
const todayAt = (hours: number, minutes = 0): Date => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

describe('PhaseTaskCard', () => {
  describe('completed LATE (outside the phase window) — Pillar 2', () => {
    const lateTask = makeTask({ completed: true, completedAt: todayAt(20, 15) }); // morning task done 8:15 PM

    test('renders the neutral i18n timestamp with the completion time', () => {
      const { getByText } = render(
        <PhaseTaskCard task={lateTask} phase={MORNING} onComplete={noop} onUncomplete={noop} />,
      );
      // t('phase.doneAt', { time }) → 'phase.doneAt:8:15 PM' under the mock
      expect(getByText('phase.doneAt:8:15 PM')).toBeTruthy();
    });

    test('does NOT render the warning icon or "(outside window)" text', () => {
      const { queryByText, toJSON } = render(
        <PhaseTaskCard task={lateTask} phase={MORNING} onComplete={noop} onUncomplete={noop} />,
      );
      // Icons render as <Text>{name}</Text> via the jest-setup vector-icons stub.
      expect(queryByText('alert-circle-outline')).toBeNull();
      expect(queryByText(/outside window/)).toBeNull();
      expect(queryByText(/Completed at/)).toBeNull();
      // No element anywhere in the tree uses the warning palette color.
      expect(JSON.stringify(toJSON())).not.toContain('"warning"');
    });

    test('timestamp uses the muted secondary-text color', () => {
      const { getByText } = render(
        <PhaseTaskCard task={lateTask} phase={MORNING} onComplete={noop} onUncomplete={noop} />,
      );
      const ts = getByText('phase.doneAt:8:15 PM');
      const flat = Object.assign({}, ...[ts.props.style].flat(Infinity));
      expect(flat.color).toBe('mutedForeground');
    });
  });

  describe('completed IN window — identical neutral treatment', () => {
    test('renders the same neutral timestamp (no special-casing of late tasks)', () => {
      const inWindow = makeTask({ completed: true, completedAt: todayAt(7, 30) });
      const { getByText, toJSON } = render(
        <PhaseTaskCard task={inWindow} phase={MORNING} onComplete={noop} onUncomplete={noop} />,
      );
      expect(getByText('phase.doneAt:7:30 AM')).toBeTruthy();
      expect(JSON.stringify(toJSON())).not.toContain('"warning"');
    });
  });

  describe('timestamp only when there is a completion time', () => {
    test('incomplete task shows no timestamp', () => {
      const { queryByText } = render(
        <PhaseTaskCard task={makeTask()} phase={MORNING} onComplete={noop} onUncomplete={noop} />,
      );
      expect(queryByText(/phase\.doneAt/)).toBeNull();
    });

    test('completed task without completedAt shows no timestamp', () => {
      const { queryByText } = render(
        <PhaseTaskCard
          task={makeTask({ completed: true })}
          phase={MORNING}
          onComplete={noop}
          onUncomplete={noop}
        />,
      );
      expect(queryByText(/phase\.doneAt/)).toBeNull();
    });
  });

  describe('completion path (zero added friction) + Safe Harbour uncomplete guard', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      crossAlert.mockClear();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    /** Last crossAlert call's buttons: [keep(cancel), undo(confirm)]. */
    const lastAlertButtons = () => crossAlert.mock.calls[crossAlert.mock.calls.length - 1][2];

    test('first tap on an incomplete card completes immediately — no dialog, no delay', () => {
      const onComplete = jest.fn();
      const { getByText } = render(
        <PhaseTaskCard task={makeTask()} phase={MORNING} onComplete={onComplete} onUncomplete={noop} />,
      );
      fireEvent.press(getByText('Pack backpack'));
      expect(onComplete).toHaveBeenCalledWith('t1');
      expect(crossAlert).not.toHaveBeenCalled();
    });

    test('immediate second tap after completing is ignored (post-completion lock)', () => {
      const onComplete = jest.fn();
      const onUncomplete = jest.fn();
      const { getByText, rerender } = render(
        <PhaseTaskCard task={makeTask()} phase={MORNING} onComplete={onComplete} onUncomplete={onUncomplete} />,
      );
      fireEvent.press(getByText('Pack backpack'));
      expect(onComplete).toHaveBeenCalledWith('t1');

      // Parent marks the task completed; the excited double-tap lands right after.
      rerender(
        <PhaseTaskCard
          task={makeTask({ completed: true, completedAt: new Date() })}
          phase={MORNING}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
        />,
      );
      jest.advanceTimersByTime(300); // well inside the 2s lock
      fireEvent.press(getByText('Pack backpack'));
      expect(onUncomplete).not.toHaveBeenCalled();
      expect(crossAlert).not.toHaveBeenCalled();
    });

    test('after the lock expires, tapping a completed card asks a friendly confirm (no silent uncomplete)', () => {
      const onUncomplete = jest.fn();
      const { getByText, rerender } = render(
        <PhaseTaskCard task={makeTask()} phase={MORNING} onComplete={noop} onUncomplete={onUncomplete} />,
      );
      fireEvent.press(getByText('Pack backpack')); // complete → starts the lock
      rerender(
        <PhaseTaskCard
          task={makeTask({ completed: true, completedAt: new Date() })}
          phase={MORNING}
          onComplete={noop}
          onUncomplete={onUncomplete}
        />,
      );
      jest.advanceTimersByTime(2500); // past the 2s lock
      fireEvent.press(getByText('Pack backpack'));

      expect(onUncomplete).not.toHaveBeenCalled(); // never silent
      expect(crossAlert).toHaveBeenCalledTimes(1);
      const [title, body, buttons] = crossAlert.mock.calls[0];
      expect(title).toBe('phase.undoTitle');
      expect(body).toBe('phase.undoBody');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toMatchObject({ text: 'phase.undoKeep', style: 'cancel' });
      expect(buttons[1].text).toBe('phase.undoConfirm');
    });

    test('confirming the dialog calls onUncomplete (existing flow untouched)', () => {
      const onUncomplete = jest.fn();
      const { getByText } = render(
        <PhaseTaskCard
          task={makeTask({ completed: true, completedAt: todayAt(20) })}
          phase={MORNING}
          onComplete={noop}
          onUncomplete={onUncomplete}
        />,
      );
      // Card mounted already-completed → no active lock → confirm dialog.
      fireEvent.press(getByText('Pack backpack'));
      expect(crossAlert).toHaveBeenCalledTimes(1);

      lastAlertButtons()[1].onPress(); // "Undo"
      expect(onUncomplete).toHaveBeenCalledWith('t1');
    });

    test('cancelling the dialog does NOT uncomplete', () => {
      const onUncomplete = jest.fn();
      const { getByText } = render(
        <PhaseTaskCard
          task={makeTask({ completed: true, completedAt: todayAt(20) })}
          phase={MORNING}
          onComplete={noop}
          onUncomplete={onUncomplete}
        />,
      );
      fireEvent.press(getByText('Pack backpack'));
      expect(crossAlert).toHaveBeenCalledTimes(1);

      const keep = lastAlertButtons()[0];
      keep.onPress?.(); // cancel button has no side effect
      expect(onUncomplete).not.toHaveBeenCalled();
    });
  });
});
