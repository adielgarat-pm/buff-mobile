/**
 * Tests for PetDisplay — the Pastel HQ pet card.
 *
 * Pillar 3 stake (ux-pet-rename): naming the buddy is an ownership moment.
 * The card used to hard-code `'Buddy'` (PetDisplay.tsx TODO), so a child who
 * renamed their buddy in Settings never saw the new name on HQ — the rename
 * looked broken. These tests lock in the fix: the card renders the child's
 * chosen `buddy_name` when set, and falls back to the TRANSLATED default
 * (`pet.defaultName`, not an English literal) when it isn't.
 */

import { render } from '@testing-library/react-native';
import { PetDisplay } from '../PetDisplay';

// Identity translator — returns the key so assertions can target i18n keys.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Theme palette resolves each key to its own name so no real theme is needed.
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme:      () => ({ themeName: 'mint' }),
  useChildTheme: () => new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

// Deterministic pet state — hatched (not egg), loaded, awake.
jest.mock('../../hooks/usePetState', () => ({
  usePetState: () => ({
    petState: {
      level: 1,
      experience: 0,
      energy_level: 80,
      current_skin: 'puppy',
      last_interaction: null,
      evolution_stage: 'hatchling',
      evolution_days_count: 3,
      daily_streak: 1,
      rest_cards_balance: 0,
      last_task_completion_date: null,
    },
    isResting: false,
    loading: false,
    onTaskCompleted: jest.fn(),
    recordInteraction: jest.fn(),
    changeSkin: jest.fn(),
    evolutionProgress: 40,
  }),
}));

// The skin-picker modal is out of scope here.
jest.mock('../PetSkinPicker', () => () => null);

describe('PetDisplay — buddy name (Pillar 3, ownership)', () => {
  test('renders the child\'s chosen buddy name when set', () => {
    const { getByText, queryByText } = render(
      <PetDisplay childName="Emi" buddyName="Sparky" />,
    );
    expect(getByText('Sparky')).toBeTruthy();
    expect(queryByText('pet.defaultName')).toBeNull();
    expect(queryByText('Buddy')).toBeNull(); // old hard-coded literal is gone
  });

  test('falls back to the translated default when no name is set (null)', () => {
    const { getByText, queryByText } = render(
      <PetDisplay childName="Emi" buddyName={null} />,
    );
    expect(getByText('pet.defaultName')).toBeTruthy();
    expect(queryByText('Buddy')).toBeNull();
  });

  test('falls back to the translated default when the prop is omitted', () => {
    const { getByText } = render(<PetDisplay childName="Emi" />);
    expect(getByText('pet.defaultName')).toBeTruthy();
  });
});
