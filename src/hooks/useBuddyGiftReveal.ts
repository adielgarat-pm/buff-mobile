/**
 * useBuddyGiftReveal — orchestrates the open-a-gift flow shared by the Gamer
 * "Me & Buddy" (5A) and "My Stats" (5B) screens.
 *
 * Two-phase modal:
 *   1. confirm  — a gift is selected but not yet opened (revealedColor === null)
 *   2. revealed — the RPC succeeded; revealedColor holds the unlocked color
 *
 * On confirm it calls the `useGift` mutator from useChildBuddyGifts, then
 * refetches both the gift list and the relationship (theme color + pending
 * flag live on the relationship, not the gift list).
 *
 * Source SPEC: docs/sessions/buddy-gift-loop/SPEC.md §2 Phase B-2.
 */
import { useState, useCallback } from 'react';
import type { BuddyGift } from '../types/buddy';
import type { UseGiftResult } from './useChildBuddyGifts';

interface Args {
  useGift: (giftId: string) => Promise<{ error: Error | null; result: UseGiftResult | null }>;
  refetchGifts: () => Promise<void> | void;
  refetchRelationship: () => Promise<void> | void;
}

export interface BuddyGiftModalProps {
  visible: boolean;
  gift: BuddyGift | null;
  revealedColor: string | null;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function useBuddyGiftReveal({ useGift, refetchGifts, refetchRelationship }: Args) {
  const [gift, setGift]                   = useState<BuddyGift | null>(null);
  const [revealedColor, setRevealedColor] = useState<string | null>(null);
  const [busy, setBusy]                   = useState(false);

  const open = useCallback((g: BuddyGift) => {
    if (g.is_used) return;
    setGift(g);
    setRevealedColor(null);
    setBusy(false);
  }, []);

  const close = useCallback(() => {
    setGift(null);
    setRevealedColor(null);
    setBusy(false);
  }, []);

  const onConfirm = useCallback(async () => {
    if (!gift || busy) return;
    setBusy(true);
    const { error, result } = await useGift(gift.id);
    setBusy(false);
    if (error || !result?.success) {
      // Failed open (e.g. already used elsewhere) — just close; server truth
      // is restored by the refetch below.
      await Promise.all([refetchGifts(), refetchRelationship()]);
      close();
      return;
    }
    setRevealedColor(result.theme_color ?? null);
    await Promise.all([refetchGifts(), refetchRelationship()]);
  }, [gift, busy, useGift, refetchGifts, refetchRelationship, close]);

  const modalProps: BuddyGiftModalProps = {
    visible: gift !== null,
    gift,
    revealedColor,
    busy,
    onConfirm,
    onClose: close,
  };

  return { open, modalProps };
}
