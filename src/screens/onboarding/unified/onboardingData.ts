/**
 * Shared constants for the unified onboarding flow.
 * All user-facing labels reference i18n keys (t('onboarding.goal.calmMornings'), etc.)
 */

export type AgeGroup = '6-8' | '9-11' | '12-14' | '15-18';
export type Gender   = 'boy' | 'girl' | 'other';

export interface OnboardingOption {
  id:    string;
  emoji: string;
  labelKey: string; // i18n key
}

// ── Goals & Challenges by age group ──────────────────────────────────────────
// Section 3 reuses the same options as Section 2 (per spec).

export const OPTIONS_BY_AGE: Record<AgeGroup, OnboardingOption[]> = {
  '6-8': [
    { id: 'calm_mornings',    emoji: '☀️', labelKey: 'onboarding.opt.calmMornings'        },
    { id: 'homework_reading', emoji: '📚', labelKey: 'onboarding.opt.homeworkReading'      },
    { id: 'getting_ready',    emoji: '🎒', labelKey: 'onboarding.opt.gettingReady'         },
    { id: 'screen_time',      emoji: '📵', labelKey: 'onboarding.opt.lessScreenTime'       },
    { id: 'confidence',       emoji: '💪', labelKey: 'onboarding.opt.buildingConfidence'   },
  ],
  '9-11': [
    { id: 'morning_routine',      emoji: '☀️', labelKey: 'onboarding.opt.morningRoutine'       },
    { id: 'homework_focus',       emoji: '📚', labelKey: 'onboarding.opt.homeworkFocus'         },
    { id: 'organisation',         emoji: '🎒', labelKey: 'onboarding.opt.organisation'          },
    { id: 'screen_balance',       emoji: '📵', labelKey: 'onboarding.opt.screenBalance'         },
    { id: 'confidence_friends',   emoji: '💪', labelKey: 'onboarding.opt.confidenceFriends'     },
  ],
  '12-14': [
    { id: 'homework_grades',  emoji: '📚', labelKey: 'onboarding.opt.homeworkGrades'       },
    { id: 'organisation',     emoji: '🎒', labelKey: 'onboarding.opt.organisation'         },
    { id: 'screen_limits',    emoji: '📵', labelKey: 'onboarding.opt.screenLimits'         },
    { id: 'time_management',  emoji: '⏰', labelKey: 'onboarding.opt.timeManagement'       },
    { id: 'independence',     emoji: '💪', labelKey: 'onboarding.opt.independence'         },
  ],
  '15-18': [
    { id: 'academic_perf',        emoji: '📚', labelKey: 'onboarding.opt.academicPerf'         },
    { id: 'planning_org',         emoji: '🧠', labelKey: 'onboarding.opt.planningOrg'          },
    { id: 'social_media',         emoji: '📵', labelKey: 'onboarding.opt.socialMedia'          },
    { id: 'self_management',      emoji: '⏰', labelKey: 'onboarding.opt.selfManagement'       },
    { id: 'life_independence',    emoji: '🌱', labelKey: 'onboarding.opt.lifeIndependence'     },
  ],
};

// ── Motivators ────────────────────────────────────────────────────────────────

export const MOTIVATORS: OnboardingOption[] = [
  { id: 'gaming_tech',         emoji: '🎮', labelKey: 'onboarding.mot.gamingTech'         },
  { id: 'movement_sports',     emoji: '⚡', labelKey: 'onboarding.mot.movementSports'     },
  { id: 'creative',            emoji: '🎨', labelKey: 'onboarding.mot.creative'           },
  { id: 'social_family',       emoji: '❤️', labelKey: 'onboarding.mot.socialFamily'       },
  { id: 'privileges_rewards',  emoji: '🌟', labelKey: 'onboarding.mot.privilegesRewards'  },
];

// ── Mission quick-picks by main challenge ─────────────────────────────────────

export const MISSION_PICKS: Record<string, string[]> = {
  calm_mornings:      ['Brush teeth before school', 'Get dressed before breakfast', 'Be ready 5 minutes early'],
  homework_reading:   ['Read for 15 minutes', '15-minute homework session', 'No screens until homework is done'],
  getting_ready:      ['Pack bag the night before', 'Lay out clothes the night before', 'Breakfast before screens'],
  screen_time:        ['No phone during dinner', 'Phone away by 9 PM', '30-minute screen break after school'],
  confidence:         ['Say one kind thing to someone', 'Try something new today', 'Write one win in your journal'],
  morning_routine:    ['Up on first alarm', 'Breakfast before phone', 'Bag packed before bed'],
  homework_focus:     ['Start homework within 30 min of getting home', 'One task at a time', 'Phone in another room while studying'],
  organisation:       ['Check planner every morning', 'Pack bag the night before', 'Put everything back in its place'],
  screen_balance:     ['Hour of activity before screens', 'Screen-free dinner', 'Charge phone outside bedroom at night'],
  confidence_friends: ['Reach out to one friend', 'Join a new activity this week', 'Share how you feel with one person'],
  homework_grades:    ['30-minute focused study session', 'No phone during homework', 'Review notes same day as lessons'],
  screen_limits:      ['Phone away by 10 PM', 'No phone first 30 min of day', 'Social media only after tasks done'],
  time_management:    ['Plan tomorrow the night before', 'Set a timer for tasks', 'Morning check-in with calendar'],
  independence:       ['Complete one chore without being asked', 'Make your own lunch', 'Decide on tomorrow\'s outfit tonight'],
  academic_perf:      ['Review notes within 24 hours', 'Weekly review on Sunday', 'Ask one question in class'],
  planning_org:       ['Weekly planner on Sunday', 'Daily top-3 priorities list', 'Deadline tracker in phone'],
  social_media:       ['No social media before noon', 'Delete one app for a week', 'Screen-free Sunday morning'],
  self_management:    ['Morning intention — one sentence', 'End-of-day review', 'Say no to one distraction per day'],
  life_independence:  ['Cook one meal per week', 'Manage weekly allowance', 'Book your own appointment'],
};

// ── Reward inspiration by motivator ──────────────────────────────────────────

export const REWARD_PICKS: Record<string, string[]> = {
  gaming_tech:        ['1 hour extra gaming', 'Choose a new game', 'Gaming night with friends'],
  movement_sports:    ['Extra sports session', 'New sports gear', 'Choose the family weekend activity'],
  creative:           ['Art supply of their choice', 'Creative project day', 'Music/drawing class'],
  social_family:      ['Movie night pick', 'Family outing of their choice', 'Have a friend sleep over'],
  privileges_rewards: ['Stay up 30 min later', 'Choose dinner for the family', 'Small treat from the shop'],
};

// ── Starter tasks auto-generated from mainChallenge ──────────────────────────

export interface StarterTask {
  title:    string;
  category: string;
  time:     string;
  credits:  number;
  icon:     string;
}

export const STARTER_TASKS_BY_CHALLENGE: Record<string, StarterTask[]> = {
  calm_mornings:      [{ title: 'Brush teeth & wash face', category: 'morning',   time: '07:30', credits: 10, icon: '🦷' }, { title: 'Get dressed before breakfast', category: 'morning', time: '07:15', credits: 10, icon: '👕' }],
  homework_reading:   [{ title: '15-minute reading',       category: 'learning',  time: '16:00', credits: 15, icon: '📖' }, { title: 'Homework session',              category: 'learning', time: '16:30', credits: 20, icon: '✏️' }],
  getting_ready:      [{ title: 'Pack school bag',         category: 'morning',   time: '21:00', credits: 10, icon: '🎒' }, { title: 'Breakfast before 7:30',         category: 'morning',  time: '07:00', credits: 10, icon: '🥣' }],
  screen_time:        [{ title: 'No phone during dinner',  category: 'wellness',  time: '18:00', credits: 10, icon: '📵' }, { title: 'Phone away by 9 PM',            category: 'wellness', time: '21:00', credits: 10, icon: '🌙' }],
  confidence:         [{ title: 'Share one win today',     category: 'wellness',  time: '20:00', credits: 10, icon: '⭐' }],
  morning_routine:    [{ title: 'Up on first alarm',       category: 'morning',   time: '07:00', credits: 15, icon: '⏰' }, { title: 'Ready before leaving',          category: 'morning',  time: '07:45', credits: 10, icon: '✅' }],
  homework_focus:     [{ title: 'Start homework on time',  category: 'learning',  time: '16:00', credits: 20, icon: '📚' }, { title: 'Phone away during study',       category: 'learning', time: '16:00', credits: 10, icon: '📵' }],
  organisation:       [{ title: 'Check planner',           category: 'learning',  time: '08:00', credits: 10, icon: '📋' }, { title: 'Pack bag tonight',              category: 'morning',  time: '21:00', credits: 10, icon: '🎒' }],
  screen_balance:     [{ title: 'One hour active before screens', category: 'wellness', time: '15:00', credits: 15, icon: '🏃' }, { title: 'Screen-free dinner',        category: 'wellness', time: '18:00', credits: 10, icon: '🍽️' }],
  confidence_friends: [{ title: 'Reach out to a friend',  category: 'social',    time: '16:00', credits: 15, icon: '💬' }],
  homework_grades:    [{ title: '30-min focused study',    category: 'learning',  time: '16:00', credits: 20, icon: '📚' }, { title: 'Review notes same day',         category: 'learning', time: '18:00', credits: 15, icon: '📝' }],
  screen_limits:      [{ title: 'Phone away by 10 PM',     category: 'wellness',  time: '22:00', credits: 10, icon: '📵' }, { title: 'Social media only after tasks', category: 'wellness', time: '16:00', credits: 15, icon: '✅' }],
  time_management:    [{ title: 'Plan tomorrow tonight',   category: 'learning',  time: '21:00', credits: 15, icon: '📅' }, { title: 'Top 3 daily priorities',        category: 'learning', time: '08:00', credits: 10, icon: '🎯' }],
  independence:       [{ title: 'One chore without asking', category: 'chores',   time: '17:00', credits: 15, icon: '🏠' }],
  academic_perf:      [{ title: 'Review notes within 24h', category: 'learning',  time: '17:00', credits: 20, icon: '📝' }, { title: 'Weekly review',                 category: 'learning', time: '10:00', credits: 15, icon: '📊' }],
  planning_org:       [{ title: 'Weekly planner on Sunday', category: 'learning', time: '10:00', credits: 15, icon: '📅' }, { title: 'Daily top-3 list',              category: 'learning', time: '08:00', credits: 10, icon: '🎯' }],
  social_media:       [{ title: 'No social media before noon', category: 'wellness', time: '12:00', credits: 15, icon: '📵' }],
  self_management:    [{ title: 'Morning intention',       category: 'wellness',  time: '08:00', credits: 10, icon: '🌅' }, { title: 'End-of-day review',             category: 'wellness', time: '21:00', credits: 10, icon: '📓' }],
  life_independence:  [{ title: 'Cook or help with one meal', category: 'chores', time: '18:00', credits: 20, icon: '🍳' }],
};

/** Fallback starter task when challenge ID is unknown */
export const FALLBACK_TASKS: StarterTask[] = [
  { title: 'Complete your daily routine', category: 'morning', time: '08:00', credits: 10, icon: '⭐' },
];
