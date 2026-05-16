/**
 * Tests for BuddyToggleModal — hide/show confirmation per Stitch 03 design.
 */
import { render, fireEvent } from '@testing-library/react-native';
import { BuddyToggleModal } from '../BuddyToggleModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('BuddyToggleModal', () => {
  test('renders Hide mode title, subtitle, bullets, and CTAs', () => {
    const { getByText } = render(
      <BuddyToggleModal
        visible
        mode="hide"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByText('buddy.toggleModal.hide.title')).toBeTruthy();
    expect(getByText('buddy.toggleModal.hide.subtitle')).toBeTruthy();
    expect(getByText('buddy.toggleModal.bullet1')).toBeTruthy();
    expect(getByText('buddy.toggleModal.bullet2')).toBeTruthy();
    expect(getByText('buddy.toggleModal.bullet3')).toBeTruthy();
    expect(getByText('buddy.toggleModal.hide.keepCta')).toBeTruthy();
    expect(getByText('buddy.toggleModal.hide.confirmCta')).toBeTruthy();
  });

  test('renders Show mode with show-specific copy', () => {
    const { getByText } = render(
      <BuddyToggleModal
        visible
        mode="show"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByText('buddy.toggleModal.show.title')).toBeTruthy();
    expect(getByText('buddy.toggleModal.show.subtitle')).toBeTruthy();
    expect(getByText('buddy.toggleModal.show.keepCta')).toBeTruthy();
    expect(getByText('buddy.toggleModal.show.confirmCta')).toBeTruthy();
  });

  test('confirm CTA fires onConfirm', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <BuddyToggleModal visible mode="hide" onConfirm={onConfirm} onCancel={jest.fn()} />
    );

    fireEvent.press(getByText('buddy.toggleModal.hide.confirmCta'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('keep CTA fires onCancel', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <BuddyToggleModal visible mode="hide" onConfirm={jest.fn()} onCancel={onCancel} />
    );

    fireEvent.press(getByText('buddy.toggleModal.hide.keepCta'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('does not render any text when visible=false', () => {
    const { queryByText } = render(
      <BuddyToggleModal
        visible={false}
        mode="hide"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(queryByText('buddy.toggleModal.hide.title')).toBeNull();
  });
});
