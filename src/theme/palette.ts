/**
 * BUFF master colour palette — the single source of truth for every hex value.
 *
 * Mirrors docs/BUFF_BRAND.md §7.2 ("The Color Palette — Master"). When the brand
 * doc changes, change it here; never hand-type a hex in a screen. Mode objects in
 * `modes.ts` compose these tokens into per-surface themes.
 *
 * Forbidden in BUFF (BUFF_BRAND §7.2): pure #000000 (too cold), #39FF14 neon green,
 * cold near-blacks like #0F0F1A, bright primary blues/oranges (Joon/Goally territory).
 */

// ─── Primary — Violet family ──────────────────────────────────────────────────

/** Splash bg, dark canvases (Gamer Mode), deep text on light. Warm deep-violet — NOT cold near-black. */
export const VIOLET_DEEP = '#1a1636';
/** Primary actions, brand surface, logo body. */
export const VIOLET_PRIMARY = '#8b5cf6';
/** Gamer accent, hover/pressed states, light-canvas primary CTAs. */
export const VIOLET_ACCENT = '#7C3AED';
/** Secondary text, muted highlights. Low contrast on light — use only for accents, not body text. */
export const VIOLET_SOFT = '#A78BFA';
/** Pastel Mode canvas, light-context logo bg. */
export const LAVENDER_BG = '#F4F0FA';

// ─── Accent — Lime / Mint family ──────────────────────────────────────────────

/** Logo lightning bolt — the "dopamine trigger" colour. Logo-only per §7.7. */
export const LIME_BOLT = '#A8E63E';
/** Success states, BUFFs balance positive, completion. */
export const MINT_SUCCESS = '#7DDFAB';

// ─── Neutral ──────────────────────────────────────────────────────────────────

/** Text on dark, cards on Gamer Mode. */
export const WHITE = '#FFFFFF';
/** Parent Mode canvas, cards on Pastel. */
export const OFF_WHITE = '#FAFAFA';
/** Body text on light — deep violet, softer than black. */
export const GRAY_TEXT = '#1a1636';
/** Secondary / muted text on light surfaces. */
export const GRAY_MUTED = '#6B5B8A';
/** Card / divider outline on light (lavender-tinted). */
export const LAVENDER_BORDER = '#E2DAF2';
/** Card surface on light. */
export const CARD_WHITE = '#FFFFFF';
/** Destructive only — rare. */
export const ALERT_RED = '#FF3131';
