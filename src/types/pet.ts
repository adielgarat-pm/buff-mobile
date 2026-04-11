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
  if (days >= 3)  return 'hatchling';
  return 'egg';
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
  evolution_stage:           'egg',
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

/** Action Heroes path — default for Gamer theme */
export const HEROIC_SKINS: Record<string, PetSkinDef> = {
  tiger:       { type: 'emoji', emoji: '🐯', nameKey: 'pet.skin.tiger',       unlockAt: 0,  path: 'heroic' },
  wolf:        { type: 'emoji', emoji: '🐺', nameKey: 'pet.skin.wolf',        unlockAt: 5,  path: 'heroic' },
  shark:       { type: 'emoji', emoji: '🦈', nameKey: 'pet.skin.shark',       unlockAt: 15, path: 'heroic' },
  epic_dragon: { type: 'emoji', emoji: '🐉', nameKey: 'pet.skin.epic_dragon', unlockAt: 30, path: 'heroic' },
};

export const PET_SKINS: Record<string, PetSkinDef> = {
  ...SWEET_SKINS,
  ...HEROIC_SKINS,
};

/** First skin unlocked for a given theme */
export function getDefaultSkin(theme: ChildThemeName): string {
  return theme === 'gamer' ? 'tiger' : 'puppy';
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
