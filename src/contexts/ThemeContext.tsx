/**
 * ThemeContext — per-child colour theme system.
 *
 * Two child themes:
 *   'mint'  — light, soft, kid-friendly (theme-child-playful)
 *   'gamer' — dark, cyan neon, energetic (theme-child-gamer)
 *
 * Persisted to AsyncStorage under 'buff_child_theme'.
 * Default: 'mint'.
 *
 * Set during ChildOnboarding, changeable via ChildCommandCenter (Settings).
 * Parent screens are not affected — they read PARENT_THEME from theme/index.ts.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChildThemeName = 'mint' | 'gamer';

/** Per-category mission colours — differ between mint and gamer. */
export interface CategoryColors {
  learning:       string; // 📚  academic tasks
  organization:   string; // 📋  time management / planning
  selfCare:       string; // 🧘  hygiene, nutrition, medication
  responsibility: string; // 🏠  home chores & independence
  movement:       string; // 🏃  exercise & body
}

/** Full set of colour tokens available inside child screens. */
export interface ChildThemeColors {
  // ── Core semantic ──────────────────────────────────────────────────────────
  background:        string; // page/screen background
  foreground:        string; // primary text
  card:              string; // card / surface background
  primary:           string; // main interactive colour (buttons, highlights)
  primaryForeground: string; // text on top of primary
  accent:            string; // secondary interactive / decorative
  muted:             string; // subtle background (tags, chips)
  mutedForeground:   string; // secondary / placeholder text
  border:            string; // dividers, card outlines
  // ── Semantic states ────────────────────────────────────────────────────────
  success:           string; // completion, ignition ✅
  warning:           string; // caution ⚠️
  // ── BUFF-specific tokens ───────────────────────────────────────────────────
  buff:              string; // ⚡ Buffs currency colour
  streak:            string; // 🔥 streak counter colour
  reward:            string; // ⭐ shop / reward colour
  shadow:            string; // rgba — card shadow / neon glow
  // ── Tab bar (derived) ──────────────────────────────────────────────────────
  tabBar:            string;
  tabBarBorder:      string;
  tabBarActive:      string; // active icon / label
  tabBarInactive:    string; // inactive icon / label
  // ── Mission categories ─────────────────────────────────────────────────────
  categories:        CategoryColors;
  // ── Shape ──────────────────────────────────────────────────────────────────
  radius:            number; // default borderRadius
  // ── Meta ───────────────────────────────────────────────────────────────────
  name:              ChildThemeName;
  statusBar:         'light' | 'dark'; // StatusBar style for this theme
}

// ─── Mint theme (theme-child-playful) ────────────────────────────────────────
// Light, soft purple — kid-friendly and calming.

const MINT: ChildThemeColors = {
  name:              'mint',
  statusBar:         'dark',

  // CSS source: hsl(142,77%,93%) → #DCFCE7  (but the spec says background = #DCFCE7)
  // We use the spec hex values directly.
  background:        '#DCFCE7',
  foreground:        '#2D3142',
  card:              '#FFFFFF',
  primary:           '#E9D5FF', // hsl(270,67%,92%)
  primaryForeground: '#5B3FAF', // hsl(258,50%,40%)
  accent:            '#C084FC', // hsl(258,73%,76%)
  muted:             '#D1FAE5', // hsl(142,40%,90%)
  mutedForeground:   '#606672', // hsl(220,9%,40%)
  border:            '#BBF7D0', // hsl(142,30%,85%)

  success:           '#34D399', // hsl(156,64%,55%)
  warning:           '#F59E0B', // hsl(38,70%,60%)

  buff:              '#C084FC', // hsl(258,73%,76%) — matches accent
  streak:            '#F87171', // hsl(0,80%,75%)
  reward:            '#C084FC', // hsl(258,73%,76%)
  shadow:            'rgba(192, 132, 252, 0.2)',

  tabBar:            '#FFFFFF',
  tabBarBorder:      '#BBF7D0',
  tabBarActive:      '#5B3FAF',
  tabBarInactive:    '#606672',

  categories: {
    learning:       '#818CF8', // soft indigo — school/academic
    organization:   '#67E8F9', // soft cyan   — planning
    selfCare:       '#F9A8D4', // soft pink   — hygiene/health
    responsibility: '#FCD34D', // soft amber  — chores/home
    movement:       '#6EE7B7', // soft emerald — exercise
  },

  radius: 16,
};

// ─── Gamer theme (theme-child-gamer) ─────────────────────────────────────────
// Dark, cyan neon — energetic and game-like.

const GAMER: ChildThemeColors = {
  name:              'gamer',
  statusBar:         'light',

  background:        '#171C2E', // hsl(230,25%,12%)
  foreground:        '#DDE3EC', // hsl(210,20%,90%)
  card:              '#1E2436', // hsl(230,20%,16%)
  primary:           '#22D3EE', // hsl(185,80%,55%) — cyan
  primaryForeground: '#111827', // hsl(230,25%,10%)
  accent:            '#A855F7', // hsl(270,70%,65%) — purple
  muted:             '#252B3B', // hsl(230,15%,20%)
  mutedForeground:   '#7F8EA3', // hsl(210,10%,55%)
  border:            '#2A3145', // hsl(230,15%,22%)

  success:           '#22C55E', // hsl(145,80%,50%)
  warning:           '#F59E0B', // hsl(38,80%,55%)

  buff:              '#22D3EE', // hsl(185,80%,55%) — cyan = primary
  streak:            '#F97316', // hsl(15,90%,60%)  — orange
  reward:            '#A855F7', // hsl(270,70%,65%) — purple = accent
  shadow:            'rgba(34, 211, 238, 0.3)', // neon cyan glow

  tabBar:            '#171C2E', // matches background for full-bleed look
  tabBarBorder:      '#2A3145',
  tabBarActive:      '#22D3EE',
  tabBarInactive:    '#7F8EA3',

  categories: {
    learning:       '#22D3EE', // cyan  (= primary)
    organization:   '#A855F7', // purple (= accent)
    selfCare:       '#EC4899', // neon pink
    responsibility: '#F97316', // orange (= streak)
    movement:       '#22C55E', // neon green (= success)
  },

  radius: 16,
};

// ─── Theme lookup ─────────────────────────────────────────────────────────────

export const CHILD_THEMES: Record<ChildThemeName, ChildThemeColors> = {
  mint:  MINT,
  gamer: GAMER,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'buff_child_theme';

interface ThemeContextType {
  theme:     ChildThemeColors;
  themeName: ChildThemeName;
  setTheme:  (name: ChildThemeName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ChildThemeName>('mint');

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'mint' || stored === 'gamer') {
        setThemeNameState(stored);
      }
    });
  }, []);

  const setTheme = useCallback(async (name: ChildThemeName) => {
    setThemeNameState(name);
    await AsyncStorage.setItem(STORAGE_KEY, name);
  }, []);

  const theme = CHILD_THEMES[themeName];

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Primary hook — use inside any child screen or component. */
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/**
 * Convenience shortcut when you only need the colour tokens.
 *
 * @example
 *   const T = useChildTheme();
 *   <View style={{ backgroundColor: T.background }} />
 */
export function useChildTheme(): ChildThemeColors {
  return useTheme().theme;
}
