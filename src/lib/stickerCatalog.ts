/**
 * stickerCatalog — the shared set of parent→child affirmation stickers.
 *
 * Backend: `public.stickers` table (already provisioned with RLS — parents
 * insert, children read + mark is_seen). The `sticker_type` column stores the
 * `key` below as text; the emoji is presentation-only and lives client-side so
 * we can restyle without a migration. 'heart' is the legacy Lovable value, so
 * it stays first/default for continuity with existing rows.
 *
 * Used by:
 *   - Parent picker  → ParentDashboardScreen sticker modal
 *   - Child display  → IncomingStickerModal
 */

export interface StickerDef {
  key: string;
  emoji: string;
}

export const STICKER_CATALOG: StickerDef[] = [
  { key: 'heart',   emoji: '❤️' },
  { key: 'star',    emoji: '⭐' },
  { key: 'fire',    emoji: '🔥' },
  { key: 'trophy',  emoji: '🏆' },
  { key: 'muscle',  emoji: '💪' },
  { key: 'clap',    emoji: '👏' },
  { key: 'party',   emoji: '🎉' },
  { key: 'rocket',  emoji: '🚀' },
];

const EMOJI_BY_KEY: Record<string, string> = STICKER_CATALOG.reduce(
  (acc, s) => { acc[s.key] = s.emoji; return acc; },
  {} as Record<string, string>,
);

/** Resolve a stored sticker_type to its emoji, falling back to ❤️ for
 *  unknown/legacy values so the child never sees a blank bubble. */
export function emojiForStickerType(type: string | null | undefined): string {
  if (!type) return '❤️';
  return EMOJI_BY_KEY[type] ?? '❤️';
}
