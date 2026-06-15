/**
 * Tests for useBuddyGiftReveal — the open-a-gift orchestration shared by 5A/5B.
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBuddyGiftReveal } from '../useBuddyGiftReveal';
import type { BuddyGift } from '../../types/buddy';

const gift: BuddyGift = {
  id: 'gift-1',
  child_profile_id: 'child-1',
  gift_type: 'theme_color',
  gift_value: null,
  given_at_level: 3,
  given_at: '2026-06-15T00:00:00Z',
  used_at: null,
  is_used: false,
  created_at: '2026-06-15T00:00:00Z',
};

function setup(useGiftImpl: jest.Mock) {
  const refetchGifts = jest.fn().mockResolvedValue(undefined);
  const refetchRelationship = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() =>
    useBuddyGiftReveal({ useGift: useGiftImpl as never, refetchGifts, refetchRelationship }),
  );
  return { result, refetchGifts, refetchRelationship };
}

describe('useBuddyGiftReveal', () => {
  test('starts hidden', () => {
    const { result } = setup(jest.fn());
    expect(result.current.modalProps.visible).toBe(false);
    expect(result.current.modalProps.revealedColor).toBeNull();
  });

  test('open() shows the confirm phase for an unused gift', () => {
    const { result } = setup(jest.fn());
    act(() => result.current.open(gift));
    expect(result.current.modalProps.visible).toBe(true);
    expect(result.current.modalProps.gift?.id).toBe('gift-1');
    expect(result.current.modalProps.revealedColor).toBeNull();
  });

  test('open() ignores an already-used gift', () => {
    const { result } = setup(jest.fn());
    act(() => result.current.open({ ...gift, is_used: true }));
    expect(result.current.modalProps.visible).toBe(false);
  });

  test('confirm → reveals the color + refetches both sources', async () => {
    const useGift = jest.fn().mockResolvedValue({
      error: null,
      result: { success: true, theme_color: '#7C5CFF', pending_remaining: 0 },
    });
    const { result, refetchGifts, refetchRelationship } = setup(useGift);

    act(() => result.current.open(gift));
    await act(async () => { await result.current.modalProps.onConfirm(); });

    expect(useGift).toHaveBeenCalledWith('gift-1');
    await waitFor(() => expect(result.current.modalProps.revealedColor).toBe('#7C5CFF'));
    expect(refetchGifts).toHaveBeenCalled();
    expect(refetchRelationship).toHaveBeenCalled();
  });

  test('confirm failure closes the modal and refetches truth', async () => {
    const useGift = jest.fn().mockResolvedValue({
      error: new Error('already_used'),
      result: { success: false, reason: 'already_used' },
    });
    const { result, refetchRelationship } = setup(useGift);

    act(() => result.current.open(gift));
    await act(async () => { await result.current.modalProps.onConfirm(); });

    expect(result.current.modalProps.visible).toBe(false);
    expect(refetchRelationship).toHaveBeenCalled();
  });

  test('onClose resets everything', () => {
    const { result } = setup(jest.fn());
    act(() => result.current.open(gift));
    act(() => result.current.modalProps.onClose());
    expect(result.current.modalProps.visible).toBe(false);
    expect(result.current.modalProps.revealedColor).toBeNull();
  });
});
