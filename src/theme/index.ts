/**
 * BUFF static theme tokens.
 *
 * PARENT_THEME — used by all parent (Zen Mode) screens. Static; never changes.
 *
 * Child theme tokens live in ThemeContext.tsx (dynamic, per-child, persisted).
 * Import `useChildTheme()` from contexts/ThemeContext in child screens.
 */

// ─── Parent (Zen Mode) ────────────────────────────────────────────────────────

export const PARENT_THEME = {
  bg:           '#FAFAFA',
  card:         '#FFFFFF',
  cardBorder:   '#E5E7EB',
  accent:       '#6D28D9',
  accentLight:  '#8B5CF6',
  text:         '#1F2937',
  textMuted:    '#9CA3AF',
  success:      '#059669',
  gold:         '#D97706',
  tabBar:       '#FFFFFF',
  tabBarBorder: '#E5E7EB',
} as const;

export type ParentTheme = typeof PARENT_THEME;

// ─── Brand token system (color-consolidation) ─────────────────────────────────
// palette.ts = master hex constants (BUFF_BRAND §7.2).
// modes.ts   = composed per-surface themes (Pastel / Parent / Gamer, §7.4–§7.6).
export * from './palette';
export {
  PASTEL_MODE,
  PARENT_MODE,
  GAMER_MODE,
  MODES,
  type ModeTheme,
  type ModeName,
} from './modes';

// Re-export child theme types so callers can import from one place if needed.
export type { ChildThemeName, ChildThemeColors, CategoryColors } from '../contexts/ThemeContext';
