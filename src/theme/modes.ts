/**
 * BUFF mode themes — composed from the master palette (palette.ts).
 *
 * Three modes, one coherent system (docs/BUFF_BRAND.md §7.4–§7.6):
 *   PASTEL  — light lavender. Auth + onboarding + young-kid (Pastel Mode canvas).
 *   PARENT  — light off-white. The in-app parent (Zen Mode) experience.
 *   GAMER   — warm deep-violet dark. RESERVED for the Teen Gamer in-app mode only.
 *
 * LIGHT is home base for the whole parent + onboarding + auth journey; DARK is the
 * teen Gamer exception. Every object mirrors the same token shape as the legacy
 * PARENT_THEME in theme/index.ts, so screens can drop one in interchangeably.
 *
 * NOTE: the runtime child Gamer theme still lives in contexts/ThemeContext.tsx
 * (per-child, persisted). GAMER here is the brand-canonical reference used by
 * static surfaces; it is intentionally NOT wired into ThemeContext by this package.
 */
import {
  VIOLET_DEEP,
  VIOLET_PRIMARY,
  VIOLET_ACCENT,
  VIOLET_SOFT,
  LAVENDER_BG,
  MINT_SUCCESS,
  WHITE,
  OFF_WHITE,
  GRAY_TEXT,
  GRAY_MUTED,
  LAVENDER_BORDER,
} from './palette';

export interface ModeTheme {
  canvas:     string; // screen background
  card:       string; // card / surface background
  cardBorder: string; // dividers, card outlines
  text:       string; // primary body text
  textMuted:  string; // secondary / placeholder text
  accent:     string; // primary interactive colour (buttons, highlights)
  accentSoft: string; // secondary / decorative accent
  success:    string; // completion / success states
}

// ─── Pastel — auth, onboarding, young-kid (BUFF_BRAND §7.4) ────────────────────

export const PASTEL_MODE: ModeTheme = {
  canvas:     LAVENDER_BG,      // #F4F0FA
  card:       WHITE,            // #FFFFFF cards on lavender
  cardBorder: LAVENDER_BORDER,  // #E2DAF2
  text:       GRAY_TEXT,        // #1a1636 — body text on light
  textMuted:  GRAY_MUTED,       // #6B5B8A
  accent:     VIOLET_ACCENT,    // #7C3AED — primary action
  accentSoft: VIOLET_SOFT,      // #A78BFA — secondary accent (NOT body text)
  success:    MINT_SUCCESS,     // #7DDFAB
};

// ─── Parent — in-app Zen Mode (BUFF_BRAND §7.6) ───────────────────────────────

export const PARENT_MODE: ModeTheme = {
  canvas:     OFF_WHITE,        // #FAFAFA — "morning coffee" calm
  card:       WHITE,            // #FFFFFF
  cardBorder: LAVENDER_BORDER,  // #E2DAF2
  text:       GRAY_TEXT,        // #1a1636
  textMuted:  GRAY_MUTED,       // #6B5B8A
  accent:     VIOLET_ACCENT,    // #7C3AED
  accentSoft: VIOLET_SOFT,      // #A78BFA
  success:    MINT_SUCCESS,     // #7DDFAB
};

// ─── Gamer — teen in-app only, brand-canonical reference (BUFF_BRAND §7.5) ─────

export const GAMER_MODE: ModeTheme = {
  canvas:     VIOLET_DEEP,      // #1a1636 — deep violet-navy, NOT pure black
  card:       '#2D2546',        // computed darker violet for layering (§7.5)
  cardBorder: 'rgba(255,255,255,0.12)', // 1px outline at ~12% white (§7.5)
  text:       WHITE,            // #FFFFFF on dark canvas
  textMuted:  VIOLET_SOFT,      // #A78BFA
  accent:     VIOLET_PRIMARY,   // #8b5cf6 — full-opacity primary action
  accentSoft: VIOLET_SOFT,      // #A78BFA
  success:    MINT_SUCCESS,     // #7DDFAB
};

export type ModeName = 'pastel' | 'parent' | 'gamer';

export const MODES: Record<ModeName, ModeTheme> = {
  pastel: PASTEL_MODE,
  parent: PARENT_MODE,
  gamer:  GAMER_MODE,
};
