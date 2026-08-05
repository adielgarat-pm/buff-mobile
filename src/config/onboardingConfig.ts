export const ONBOARDING_CONFIG = {
  DEFAULT_BUFF_VALUE:   20,   // BUFFs per task (used when tasks not yet saved)
  DEFAULT_TASKS_COUNT:  3,    // tasks shown in preview
  DEFAULT_REWARDS_COUNT: 2,   // fallback reward count when no motivator has picks (rewards otherwise scale with motivators)
  CARD_STAGGER_MS:      50,   // animation delay between cards (ms)
  REWARD_DAYS: {
    small:  3,
    medium: 7,
    large:  14,
  },
  REWARD_CREDITS_RATIO: 0.7,  // 70% of max daily BUFFs × days
  MONEY_REWARD_DAYS:    5,    // BUFFs→cash anchor: 5 weekdays × 70% of daily BUFFs (pocket-money pace)
} as const;
