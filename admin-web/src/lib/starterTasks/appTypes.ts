// Shim that de-couples the copied starter-task engine from the React Native app.
//
// SOURCE OF TRUTH: src/screens/onboarding/unified/starterTasks/ in the mobile
// app. These files are a VERBATIM copy so the admin can reconstruct the set of
// tasks offered at onboarding (the DB has no flag marking onboarding-origin
// tasks). Only the cross-package imports are redirected here. If the app's task
// library or generator policy changes, re-copy the engine + this shim.
//
// Mirrors:
//   - src/screens/onboarding/unified/onboardingData.ts (AgeGroup/Gender/I18nString)
//   - src/types/task.ts (TaskCategory)
//   - src/config/onboardingConfig.ts (ONBOARDING_CONFIG)

export type I18nString = { en: string; he: string }
export type AgeGroup = '6-8' | '9-11' | '12-14' | '15-18'
export type Gender = 'boy' | 'girl' | 'other'

export type TaskCategory =
  | 'learning'
  | 'organization'
  | 'self-care'
  | 'responsibility'
  | 'movement'

export const ONBOARDING_CONFIG = {
  DEFAULT_BUFF_VALUE: 20,
  DEFAULT_TASKS_COUNT: 3,
  DEFAULT_REWARDS_COUNT: 2,
  CARD_STAGGER_MS: 50,
  REWARD_DAYS: { small: 3, medium: 7, large: 14 },
  REWARD_CREDITS_RATIO: 0.7,
  MONEY_REWARD_DAYS: 5,
} as const
