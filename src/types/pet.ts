import { ChildThemeName } from '../contexts/ThemeContext';

// ─── Evolution ────────────────────────────────────────────────────────────────

export type EvolutionStage = 'egg' | 'hatchling' | 'scout' | 'guardian';

/** Days-of-task-completion needed to reach each stage */
export const EVOLUTION_THRESHOLDS: Record<EvolutionStage, number> = {
  egg:       0,
  hatchling: 3,
  scout:     7,
  guardian:  13,
};

export function getEvolutionStage(days: number): EvolutionStage {
  if (days >= 13) return 'guardian';
  if (days >= 7)  return 'scout';
  // Egg stage removed per IN-2026-05-16-01 (Pillar 1/2/3 violation).
  // pkg/drop-egg-evolution-stage will fully retire the type; this is the
  // beta-readiness workaround so the child sees their character from day 0.
  return 'hatchling';
}

export function getNextEvolutionThreshold(stage: EvolutionStage): number {
  if (stage === 'egg')       return 3;
  if (stage === 'hatchling') return 7;
  if (stage === 'scout')     return 13;
  return 13; // guardian is max
}

// ─── XP / Levels ─────────────────────────────────────────────────────────────

export const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 730, 1000, 1350, 1800];
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

// ─── Pet state ────────────────────────────────────────────────────────────────

export interface PetState {
  level:                      number;
  experience:                 number;
  energy_level:               number;
  current_skin:               string;
  last_interaction:           string | null;
  evolution_stage:            EvolutionStage;
  evolution_days_count:       number;
  daily_streak:               number;
  rest_cards_balance:         number;
  last_task_completion_date:  string | null;
}

export const DEFAULT_PET_STATE: PetState = {
  level:                     1,
  experience:                0,
  energy_level:              50,
  current_skin:              'puppy',
  last_interaction:          null,
  evolution_stage:           'hatchling',
  evolution_days_count:      0,
  daily_streak:              0,
  rest_cards_balance:        1,
  last_task_completion_date: null,
};

// ─── Skins ────────────────────────────────────────────────────────────────────

export interface PetSkinDef {
  type:     'emoji';
  emoji:    string;
  nameKey:  string;
  unlockAt: number;   // evolution_days_count to unlock
  path:     'sweet' | 'heroic';
}

/** Sweet Friends path — default for Mint theme */
export const SWEET_SKINS: Record<string, PetSkinDef> = {
  puppy:      { type: 'emoji', emoji: '🐶', nameKey: 'pet.skin.puppy',      unlockAt: 0,   path: 'sweet' },
  ginger_cat: { type: 'emoji', emoji: '🐈', nameKey: 'pet.skin.ginger_cat', unlockAt: 5,   path: 'sweet' },
  rabbit:     { type: 'emoji', emoji: '🐰', nameKey: 'pet.skin.rabbit',     unlockAt: 15,  path: 'sweet' },
  panda:      { type: 'emoji', emoji: '🐼', nameKey: 'pet.skin.panda',      unlockAt: 30,  path: 'sweet' },
  capybara:   { type: 'emoji', emoji: '🦫', nameKey: 'pet.skin.capybara',   unlockAt: 50,  path: 'sweet' },
  unicorn:    { type: 'emoji', emoji: '🦄', nameKey: 'pet.skin.unicorn',    unlockAt: 100, path: 'sweet' },
};

/** Action Heroes path — default for Gamer theme.
 * Wolf is the day-0 default per BUFF_BUDDY_SYSTEM.md (Wolf "STORMY"). */
export const HEROIC_SKINS: Record<string, PetSkinDef> = {
  wolf:        { type: 'emoji', emoji: '🐺', nameKey: 'pet.skin.wolf',        unlockAt: 0,  path: 'heroic' },
  tiger:       { type: 'emoji', emoji: '🐯', nameKey: 'pet.skin.tiger',       unlockAt: 5,  path: 'heroic' },
  shark:       { type: 'emoji', emoji: '🦈', nameKey: 'pet.skin.shark',       unlockAt: 15, path: 'heroic' },
  epic_dragon: { type: 'emoji', emoji: '🐉', nameKey: 'pet.skin.epic_dragon', unlockAt: 30, path: 'heroic' },
};

export const PET_SKINS: Record<string, PetSkinDef> = {
  ...SWEET_SKINS,
  ...HEROIC_SKINS,
};

/** First skin unlocked for a given theme.
 * Gamer = Wolf (default BUDDY "STORMY" per BUFF_BUDDY_SYSTEM.md).
 * Mint  = Puppy (the sweet-path day-0 default). */
export function getDefaultSkin(theme: ChildThemeName): string {
  return theme === 'gamer' ? 'wolf' : 'puppy';
}

/** A skin definition paired with its registry id. */
export type PetSkinWithId = PetSkinDef & { id: string };

/** Returns all skins for a given theme path, in unlock order. */
export function getSkinsForTheme(theme: ChildThemeName): PetSkinWithId[] {
  const map = theme === 'gamer' ? HEROIC_SKINS : SWEET_SKINS;
  return Object.entries(map)
    .map(([id, def]) => ({ ...def, id }))
    .sort((a, b) => a.unlockAt - b.unlockAt);
}

/** True when the child has earned this skin (evolution_days_count >= unlockAt). */
export function isSkinUnlocked(skin: PetSkinDef, evolutionDays: number): boolean {
  return evolutionDays >= skin.unlockAt;
}

// ─── Stage visuals (theme-aware) ─────────────────────────────────────────────

export interface StageVisual {
  /** Badge emoji shown next to the pet name */
  badgeEmoji: string;
  /** i18n key for the stage label */
  labelKey:   string;
  /** Accent colour for the evolution ring */
  ringColor:  string;
}

export const STAGE_VISUALS: Record<ChildThemeName, Record<EvolutionStage, StageVisual>> = {
  mint: {
    egg:       { badgeEmoji: '🥚', labelKey: 'pet.stage.egg',       ringColor: '#E9D5FF' },
    hatchling: { badgeEmoji: '🐣', labelKey: 'pet.stage.hatchling', ringColor: '#C084FC' },
    scout:     { badgeEmoji: '⚡', labelKey: 'pet.stage.scout',     ringColor: '#A855F7' },
    guardian:  { badgeEmoji: '✨', labelKey: 'pet.stage.guardian',  ringColor: '#7C3AED' },
  },
  gamer: {
    egg:       { badgeEmoji: '🥚', labelKey: 'pet.stage.egg',       ringColor: '#164E63' },
    hatchling: { badgeEmoji: '🔥', labelKey: 'pet.stage.hatchling', ringColor: '#0E7490' },
    scout:     { badgeEmoji: '⚔️', labelKey: 'pet.stage.scout',     ringColor: '#06B6D4' },
    guardian:  { badgeEmoji: '🛡️', labelKey: 'pet.stage.guardian',  ringColor: '#22D3EE' },
  },
};
