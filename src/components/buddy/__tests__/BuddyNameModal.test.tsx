/**
 * Tests for BuddyNameModal — name / rename buddy.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { BuddyNameModal } from '../BuddyNameModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('BuddyNameModal', () => {
  test('pre-fills the input with currentName when provided', () => {
    const { getByDisplayValue } = render(
      <BuddyNameModal
        visible
        currentName="Sparky"
        defaultName="STORMY"
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByDisplayValue('Sparky')).toBeTruthy();
  });

  test('renders empty input with defaultName placeholder when currentName is null', () => {
    const { getByLabelText } = render(
      <BuddyNameModal
        visible
        currentName={null}
        defaultName="STORMY"
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = getByLabelText('buddy-name-input');
    expect(input.props.value).toBe('');
    expect(input.props.placeholder).toBe('STORMY');
  });

  test('Save with typed text calls onSave with the trimmed name', () => {
    const onSave = jest.fn();
    const { getByText, getByLabelText } = render(
      <BuddyNameModal
        visible
        currentName={null}
        defaultName="STORMY"
        onSave={onSave}
        onCancel={jest.fn()}
      />
    );

    fireEvent.changeText(getByLabelText('buddy-name-input'), '  Sparky  ');
    fireEvent.press(getByText('buddy.nameModal.save'));

    expect(onSave).toHaveBeenCalledWith('Sparky');
  });

  test('Save with empty input calls onSave(null) — not empty string', () => {
    const onSave = jest.fn();
    const { getByText } = render(
      <BuddyNameModal
        visible
        currentName=""
        defaultName="LUNA"
        onSave={onSave}
        onCancel={jest.fn()}
      />
    );

    fireEvent.press(getByText('buddy.nameModal.save'));
    expect(onSave).toHaveBeenCalledWith(null);
  });

  test('Save with whitespace-only input also calls onSave(null)', () => {
    const onSave = jest.fn();
    const { getByText, getByLabelText } = render(
      <BuddyNameModal
        visible
        currentName={null}
        defaultName="ECHO"
        onSave={onSave}
        onCancel={jest.fn()}
      />
    );

    fireEvent.changeText(getByLabelText('buddy-name-input'), '   ');
    fireEvent.press(getByText('buddy.nameModal.save'));

    expect(onSave).toHaveBeenCalledWith(null);
  });

  test('Cancel calls onCancel', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <BuddyNameModal
        visible
        currentName="Sparky"
        defaultName="STORMY"
        onSave={jest.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.press(getByText('buddy.nameModal.cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
