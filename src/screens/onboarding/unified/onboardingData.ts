/**
 * Shared constants for the unified onboarding flow.
 * All user-facing labels reference i18n keys (t('onboarding.opt.*'), etc.)
 * Task/reward titles are bilingual I18nString objects.
 */
import { ONBOARDING_CONFIG } from '../../../config/onboardingConfig';

// ── Bilingual string type ──────────────────────────────────────────────────────

export type I18nString = { en: string; he: string };

// ── Core types ────────────────────────────────────────────────────────────────

export type AgeGroup  = '6-8' | '9-11' | '12-14' | '15-18';
export type Gender    = 'boy' | 'girl' | 'other';
export type RewardSize = 'small' | 'medium' | 'large';

export interface OnboardingOption {
  id:       string;
  emoji:    string;
  labelKey: string; // i18n key
}

/** When in the day a starter task naturally belongs (drives its clock time). */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface StarterTask {
  id:         string;
  title:      I18nString;
  buff_value: number;
  timeOfDay:  TimeOfDay;
}

export interface RewardItem {
  id:    string;
  title: I18nString;
  emoji: string;
  size:  RewardSize;
}

// ── Goals & Challenges by age group ──────────────────────────────────────────

export const OPTIONS_BY_AGE: Record<AgeGroup, OnboardingOption[]> = {
  '6-8': [
    { id: 'calm_mornings',    emoji: '☀️', labelKey: 'onboarding.opt.calmMornings'      },
    { id: 'homework_reading', emoji: '📚', labelKey: 'onboarding.opt.homeworkReading'    },
    { id: 'getting_ready',    emoji: '🎒', labelKey: 'onboarding.opt.gettingReady'       },
    { id: 'screen_time',      emoji: '📵', labelKey: 'onboarding.opt.lessScreenTime'     },
    { id: 'confidence',       emoji: '💪', labelKey: 'onboarding.opt.buildingConfidence' },
  ],
  '9-11': [
    { id: 'morning_routine',    emoji: '☀️', labelKey: 'onboarding.opt.morningRoutine'    },
    { id: 'homework_focus',     emoji: '📚', labelKey: 'onboarding.opt.homeworkFocus'     },
    { id: 'organisation',       emoji: '🎒', labelKey: 'onboarding.opt.organisation'      },
    { id: 'screen_balance',     emoji: '📵', labelKey: 'onboarding.opt.screenBalance'     },
    { id: 'confidence_friends', emoji: '💪', labelKey: 'onboarding.opt.confidenceFriends' },
  ],
  '12-14': [
    { id: 'homework_focus_adv', emoji: '📚', labelKey: 'onboarding.opt.homeworkFocusAdv' },
    { id: 'organisation',       emoji: '🎒', labelKey: 'onboarding.opt.organisation'     },
    { id: 'screen_limits',      emoji: '📵', labelKey: 'onboarding.opt.screenLimits'     },
    { id: 'time_management',    emoji: '⏰', labelKey: 'onboarding.opt.timeManagement'   },
    { id: 'independence',       emoji: '💪', labelKey: 'onboarding.opt.independence'     },
  ],
  '15-18': [
    { id: 'academic_perf',      emoji: '📚', labelKey: 'onboarding.opt.academicPerf'      },
    { id: 'planning_org',       emoji: '🧠', labelKey: 'onboarding.opt.planningOrg'       },
    { id: 'social_media',       emoji: '📵', labelKey: 'onboarding.opt.socialMedia'       },
    { id: 'self_management',    emoji: '⏰', labelKey: 'onboarding.opt.selfManagement'    },
    { id: 'life_independence',  emoji: '🌱', labelKey: 'onboarding.opt.lifeIndependence'  },
  ],
};

// ── Motivators ────────────────────────────────────────────────────────────────

export const MOTIVATORS: OnboardingOption[] = [
  { id: 'gaming',      emoji: '🎮', labelKey: 'onboarding.mot.gamingTech'        },
  { id: 'sports',      emoji: '⚡', labelKey: 'onboarding.mot.movementSports'    },
  { id: 'creative',    emoji: '🎨', labelKey: 'onboarding.mot.creative'          },
  { id: 'social',      emoji: '❤️', labelKey: 'onboarding.mot.socialFamily'      },
  { id: 'privileges',  emoji: '🌟', labelKey: 'onboarding.mot.privilegesRewards' },
];

// ── Mission quick-picks by main challenge (kept for reference) ────────────────

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
  homework_focus_adv: ['30-minute focused study session', 'No phone during homework', 'One subject at a time — no multitasking'],
  screen_limits:      ['Phone away by 10 PM', 'No phone first 30 min of day', 'Social media only after tasks done'],
  time_management:    ['Plan tomorrow the night before', 'Set a timer for tasks', 'Morning check-in with calendar'],
  independence:       ['Complete one chore without being asked', 'Make your own lunch', "Decide on tomorrow's outfit tonight"],
  academic_perf:      ['Review notes within 24 hours', 'Weekly review on Sunday', 'Ask one question in class'],
  planning_org:       ['Weekly planner on Sunday', 'Daily top-3 priorities list', 'Deadline tracker in phone'],
  social_media:       ['No social media before noon', 'Delete one app for a week', 'Screen-free Sunday morning'],
  self_management:    ['Morning intention — one sentence', 'End-of-day review', 'Say no to one distraction per day'],
  life_independence:  ['Cook one meal per week', 'Manage weekly allowance', 'Book your own appointment'],
};

// ── Starter tasks by challenge (3 per challenge, bilingual, time-of-day aware) ──
//
// Built from docs/sessions/onboarding-starter-tasks/STARTER_TASK_TABLE.md (v1.1).
// Each challenge ID maps to its age group (per OPTIONS_BY_AGE) and gets the 3
// age-appropriate tasks from the table. `timeOfDay` drives the clock time at
// INSERT (see UStep5_Preview), replacing the old positional assignment.
// `task.id` is a React key only — it is NOT written to the DB, so the same id
// may recur across challenges (e.g. a shared task).

const V = ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE;

export const STARTER_TASKS_BY_CHALLENGE: Record<string, StarterTask[]> = {
  // ── 6-8 ──────────────────────────────────────────────────────────────────
  calm_mornings: [
    { id: 'brush_teeth',    title: { en: 'Brush teeth & wash face',     he: 'לצחצח שיניים ולשטוף פנים' }, buff_value: V, timeOfDay: 'morning' },
    { id: 'breakfast_meds', title: { en: 'Breakfast before meds',       he: 'ארוחת בוקר לפני כדור'      }, buff_value: V, timeOfDay: 'morning' },
    { id: 'clothes_eve',    title: { en: "Lay out tomorrow's clothes",  he: 'להכין בגדים לבוקר'        }, buff_value: V, timeOfDay: 'evening' },
  ],
  getting_ready: [
    { id: 'get_ready',   title: { en: 'Get ready & leave on time',  he: 'להתארגן ולצאת בזמן'       }, buff_value: V, timeOfDay: 'morning' },
    { id: 'brush_teeth', title: { en: 'Brush teeth & wash face',    he: 'לצחצח שיניים ולשטוף פנים' }, buff_value: V, timeOfDay: 'morning' },
    { id: 'clothes_eve', title: { en: "Lay out tomorrow's clothes", he: 'להכין בגדים לבוקר'        }, buff_value: V, timeOfDay: 'evening' },
  ],
  homework_reading: [
    { id: 'hw_before_screen', title: { en: 'Homework before screens',                he: 'שיעורי בית לפני מסך'             }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'hw_same_time',     title: { en: 'Do homework at the same time each day',  he: 'לעשות שיעורים באותו זמן כל יום' }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'hw_easy_first',    title: { en: 'Start with the easiest task',            he: 'להתחיל מהמטלה הקלה'              }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  screen_time: [
    { id: 'read_15',            title: { en: 'Read for 15 minutes',           he: 'לקרוא 15 דקות'                }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'screens_off_bed',    title: { en: 'Screens off 30 min before bed', he: 'מסכים כבויים 30 דקות לפני שינה' }, buff_value: V, timeOfDay: 'evening' },
    { id: 'screen_after_tasks', title: { en: 'Screen time only after tasks',  he: 'זמן מסך רק אחרי משימות'        }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  confidence: [
    { id: 'compliment',  title: { en: 'Give myself a compliment',       he: 'לתת לעצמי מחמאה'        }, buff_value: V, timeOfDay: 'morning' },
    { id: 'kind_friend', title: { en: 'Do something kind for a friend',  he: 'לעשות מעשה טוב לחבר/ה' }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'write_win',   title: { en: 'Write one win from today',        he: 'לכתוב הצלחה אחת מהיום'  }, buff_value: V, timeOfDay: 'evening' },
  ],
  // ── 9-11 ─────────────────────────────────────────────────────────────────
  morning_routine: [
    { id: 'up_alarm',       title: { en: 'Up on the first alarm',       he: 'לקום עם הצלצול הראשון' }, buff_value: V, timeOfDay: 'morning' },
    { id: 'breakfast_meds', title: { en: 'Breakfast before meds',       he: 'ארוחת בוקר לפני כדור'  }, buff_value: V, timeOfDay: 'morning' },
    { id: 'clothes_eve',    title: { en: "Lay out tomorrow's clothes",  he: 'להכין בגדים לבוקר'    }, buff_value: V, timeOfDay: 'evening' },
  ],
  homework_focus: [
    { id: 'hw_sprint',    title: { en: '15-min focused homework sprint',        he: 'ספרינט שיעורים של 15 דקות'      }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'hw_no_phone',  title: { en: 'No phone during homework',              he: 'בלי טלפון בזמן שיעורים'         }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'hw_same_time', title: { en: 'Do homework at the same time each day', he: 'לעשות שיעורים באותו זמן כל יום' }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  organisation: [
    { id: 'pack_bag',        title: { en: 'Pack your own bag per the timetable', he: 'לסדר תיק לבד לפי המערכת'        }, buff_value: V, timeOfDay: 'evening' },
    { id: 'check_timetable', title: { en: 'Check the timetable in the morning',  he: 'לבדוק את מערכת השעות בבוקר'    }, buff_value: V, timeOfDay: 'morning' },
    { id: 'write_tomorrow',  title: { en: "Write tomorrow's tasks before bed",  he: 'לכתוב את משימות מחר לפני השינה' }, buff_value: V, timeOfDay: 'evening' },
  ],
  organisation_memory: [
    { id: 'pack_bag',        title: { en: 'Pack your own bag per the timetable', he: 'לסדר תיק לבד לפי המערכת'        }, buff_value: V, timeOfDay: 'evening' },
    { id: 'check_timetable', title: { en: 'Check the timetable in the morning',  he: 'לבדוק את מערכת השעות בבוקר'    }, buff_value: V, timeOfDay: 'morning' },
    { id: 'write_tomorrow',  title: { en: "Write tomorrow's tasks before bed",  he: 'לכתוב את משימות מחר לפני השינה' }, buff_value: V, timeOfDay: 'evening' },
  ],
  screen_balance: [
    { id: 'no_phone_meals',     title: { en: 'No phone during meals',         he: 'בלי טלפון בזמן ארוחות'          }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'screens_off_bed',    title: { en: 'Screens off 30 min before bed', he: 'מסכים כבויים 30 דקות לפני שינה' }, buff_value: V, timeOfDay: 'evening' },
    { id: 'screen_after_tasks', title: { en: 'Screen time only after tasks',  he: 'זמן מסך רק אחרי משימות'         }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  confidence_friends: [
    { id: 'compliment',  title: { en: 'Give myself a compliment',      he: 'לתת לעצמי מחמאה'        }, buff_value: V, timeOfDay: 'morning' },
    { id: 'kind_friend', title: { en: 'Do something kind for a friend', he: 'לעשות מעשה טוב לחבר/ה' }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'say_hi',      title: { en: 'Say hi to someone new',         he: 'להגיד שלום למישהו חדש'  }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  social_friendships: [
    { id: 'kind_friend', title: { en: 'Do something kind for a friend', he: 'לעשות מעשה טוב לחבר/ה' }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'say_hi',      title: { en: 'Say hi to someone new',         he: 'להגיד שלום למישהו חדש'  }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'write_win',   title: { en: 'Write one win from today',      he: 'לכתוב הצלחה אחת מהיום'  }, buff_value: V, timeOfDay: 'evening' },
  ],
  // ── 12-14 ────────────────────────────────────────────────────────────────
  homework_focus_adv: [
    { id: 'hw_sprint',      title: { en: '15-min focused homework sprint', he: 'ספרינט שיעורים של 15 דקות' }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'hw_no_phone',    title: { en: 'No phone during homework',       he: 'בלי טלפון בזמן שיעורים'    }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'hw_one_subject', title: { en: 'One subject at a time',          he: 'מקצוע אחד בכל פעם'         }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  screen_limits: [
    { id: 'no_phone_meals',   title: { en: 'No phone during meals',         he: 'בלי טלפון בזמן ארוחות'          }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'screens_off_bed',  title: { en: 'Screens off 30 min before bed', he: 'מסכים כבויים 30 דקות לפני שינה' }, buff_value: V, timeOfDay: 'evening' },
    { id: 'no_social_school', title: { en: 'No social media before school', he: 'בלי רשתות חברתיות לפני בית ספר' }, buff_value: V, timeOfDay: 'morning' },
  ],
  time_management: [
    { id: 'prio_3',       title: { en: "Write today's 3 priorities", he: 'לכתוב 3 עדיפויות להיום'  }, buff_value: V, timeOfDay: 'morning' },
    { id: 'timer_25',     title: { en: '25-min timer for a task',    he: 'טיימר של 25 דקות למשימה' }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'plan_tonight', title: { en: 'Plan tomorrow tonight',      he: 'לתכנן את מחר הערב'        }, buff_value: V, timeOfDay: 'evening' },
  ],
  independence: [
    { id: 'solve_problem', title: { en: 'Solve a small problem yourself',      he: 'לפתור בעיה קטנה לבד'    }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'wake_self',     title: { en: 'Wake up on your own',                 he: 'להתעורר לבד'            }, buff_value: V, timeOfDay: 'morning' },
    { id: 'pack_bag',      title: { en: 'Pack your own bag per the timetable', he: 'לסדר תיק לבד לפי המערכת' }, buff_value: V, timeOfDay: 'evening' },
  ],
  // ── 15-18 ────────────────────────────────────────────────────────────────
  academic_perf: [
    { id: 'study_30',     title: { en: '30 min of focused studying',        he: '30 דקות לימוד ממוקד'              }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'hw_no_phone',  title: { en: 'No phone during homework',          he: 'בלי טלפון בזמן שיעורים'           }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'review_today', title: { en: "Go over today's material — 10 min", he: 'לעבור על מה שלמדת היום — 10 דקות' }, buff_value: V, timeOfDay: 'evening' },
  ],
  planning_org: [
    { id: 'braindump',  title: { en: "Brain dump — write down what's on your mind", he: 'לרוקן את הראש — לכתוב מה שמטריד' }, buff_value: V, timeOfDay: 'evening' },
    { id: 'top3',       title: { en: "Today's top-3 list",                          he: 'רשימת 3 הדברים החשובים להיום'  }, buff_value: V, timeOfDay: 'morning' },
    { id: 'break_task', title: { en: 'Break a big task into steps',                 he: 'לפרק משימה גדולה לצעדים'       }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  focus_planning: [
    { id: 'braindump',  title: { en: "Brain dump — write down what's on your mind", he: 'לרוקן את הראש — לכתוב מה שמטריד' }, buff_value: V, timeOfDay: 'evening' },
    { id: 'top3',       title: { en: "Today's top-3 list",                          he: 'רשימת 3 הדברים החשובים להיום'  }, buff_value: V, timeOfDay: 'morning' },
    { id: 'break_task', title: { en: 'Break a big task into steps',                 he: 'לפרק משימה גדולה לצעדים'       }, buff_value: V, timeOfDay: 'afternoon' },
  ],
  social_media: [
    { id: 'no_social_school', title: { en: 'No social media before school', he: 'בלי רשתות חברתיות לפני בית ספר' }, buff_value: V, timeOfDay: 'morning' },
    { id: 'phonefree_hour',   title: { en: 'Phone-free hour before sleep',  he: 'שעה ללא טלפון לפני שינה'        }, buff_value: V, timeOfDay: 'evening' },
    { id: 'screens_off_bed',  title: { en: 'Screens off 30 min before bed', he: 'מסכים כבויים 30 דקות לפני שינה' }, buff_value: V, timeOfDay: 'evening' },
  ],
  self_management: [
    { id: 'prio_3',    title: { en: "Write today's 3 priorities",     he: 'לכתוב 3 עדיפויות להיום'  }, buff_value: V, timeOfDay: 'morning' },
    { id: 'timer_25',  title: { en: '25-min timer for a task',        he: 'טיימר של 25 דקות למשימה' }, buff_value: V, timeOfDay: 'afternoon' },
    { id: 'sumup_day', title: { en: 'Sum up the day in one sentence', he: 'לסכם את היום במשפט אחד'  }, buff_value: V, timeOfDay: 'evening' },
  ],
  life_independence: [
    { id: 'make_breakfast',   title: { en: 'Make your own breakfast',             he: 'להכין ארוחת בוקר לבד'   }, buff_value: V, timeOfDay: 'morning' },
    { id: 'pack_bag',         title: { en: 'Pack your own bag per the timetable', he: 'לסדר תיק לבד לפי המערכת' }, buff_value: V, timeOfDay: 'evening' },
    { id: 'manage_allowance', title: { en: 'Manage your weekly allowance',        he: 'לנהל דמי כיס שבועיים'    }, buff_value: V, timeOfDay: 'afternoon' },
  ],
};

/** Fallback when challenge ID has no matching tasks */
export const FALLBACK_TASKS: StarterTask[] = [
  { id: 'fallback_1', title: { en: 'Complete your daily routine', he: 'להשלים את השגרה היומית' }, buff_value: ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE, timeOfDay: 'morning' },
];

// ── Reward picks by motivator → age group ────────────────────────────────────

export const REWARD_PICKS: Record<string, Record<AgeGroup, RewardItem[]>> = {
  gaming: {
    '6-8':   [
      { id: 'gm_1', title: { en: 'Game Night with Mom/Dad',                     he: 'ערב משחקים עם אמא/אבא'             }, emoji: '🎮', size: 'medium' },
      { id: 'gm_2', title: { en: 'Special sports outing — bowling or mini golf', he: 'יציאה ספורטיבית מיוחדת'            }, emoji: '🎳', size: 'medium' },
    ],
    '9-11':  [
      { id: 'gm_3', title: { en: 'Gaming tournament night — invite a friend',   he: 'ערב טורניר גיימינג עם חבר'         }, emoji: '🎮', size: 'large'  },
      { id: 'gm_4', title: { en: 'New game or in-game upgrade',                 he: 'משחק חדש או שדרוג במשחק'           }, emoji: '🎮', size: 'medium' },
    ],
    '12-14': [
      { id: 'gm_4', title: { en: 'New game or in-game upgrade',                 he: 'משחק חדש או שדרוג במשחק'           }, emoji: '🎮', size: 'medium' },
      { id: 'gm_5', title: { en: 'Extended gaming night — you pick the game',   he: 'ערב גיימינג מורחב — אתה בוחר'     }, emoji: '🎮', size: 'large'  },
    ],
    '15-18': [
      { id: 'gm_5', title: { en: 'Extended gaming night — you pick the game',   he: 'ערב גיימינג מורחב — אתה בוחר'     }, emoji: '🎮', size: 'large'  },
      { id: 'gm_4', title: { en: 'New game or in-game upgrade',                 he: 'משחק חדש או שדרוג במשחק'           }, emoji: '🎮', size: 'medium' },
    ],
  },
  sports: {
    '6-8':   [
      { id: 'sp_1', title: { en: 'Special sports outing — bowling or mini golf', he: 'יציאה ספורטיבית מיוחדת'           }, emoji: '⚽', size: 'medium' },
      { id: 'sp_2', title: { en: 'Game Night with Mom/Dad',                      he: 'ערב משחקים עם אמא/אבא'            }, emoji: '🎮', size: 'medium' },
    ],
    '9-11':  [
      { id: 'sp_3', title: { en: 'Be the coach for a day',                       he: 'להיות המאמן ליום אחד'             }, emoji: '⚽', size: 'medium' },
      { id: 'sp_4', title: { en: 'Chef for a night or pick a takeout',           he: 'שף לערב אחד או לבחור משלוח'       }, emoji: '🍕', size: 'medium' },
    ],
    '12-14': [
      { id: 'sp_5', title: { en: 'Buy a sports item (agreed budget)',            he: 'לקנות פריט ספורט (תקציב מוסכם)'  }, emoji: '⚽', size: 'large'  },
      { id: 'sp_4', title: { en: 'Chef for a night or pick a takeout',           he: 'שף לערב אחד או לבחור משלוח'       }, emoji: '🍕', size: 'medium' },
    ],
    '15-18': [
      { id: 'sp_5', title: { en: 'Buy a sports item (agreed budget)',            he: 'לקנות פריט ספורט (תקציב מוסכם)'  }, emoji: '⚽', size: 'large'  },
      { id: 'sp_4', title: { en: 'Chef for a night or pick a takeout',           he: 'שף לערב אחד או לבחור משלוח'       }, emoji: '🍕', size: 'medium' },
    ],
  },
  creative: {
    '6-8':   [
      { id: 'cr_1', title: { en: 'Art supply shopping spree',               he: 'קנייה חופשית של ציוד יצירה'         }, emoji: '🎨', size: 'medium' },
      { id: 'cr_2', title: { en: 'Make something together with a parent',   he: 'ליצור משהו יחד עם הורה'             }, emoji: '🎨', size: 'medium' },
    ],
    '9-11':  [
      { id: 'cr_2', title: { en: 'Make something together with a parent',   he: 'ליצור משהו יחד עם הורה'             }, emoji: '🎨', size: 'medium' },
      { id: 'cr_1', title: { en: 'Art supply shopping spree',               he: 'קנייה חופשית של ציוד יצירה'         }, emoji: '🎨', size: 'medium' },
    ],
    '12-14': [
      { id: 'cr_3', title: { en: 'Choose a creative project',              he: 'לבחור פרויקט יצירתי'                }, emoji: '🎨', size: 'medium' },
      { id: 'cr_4', title: { en: 'Buy a craft or art item (set budget)',   he: 'לקנות חומרי יצירה (תקציב קבוע)'    }, emoji: '🎨', size: 'large'  },
    ],
    '15-18': [
      { id: 'cr_4', title: { en: 'Buy a craft or art item (set budget)',   he: 'לקנות חומרי יצירה (תקציב קבוע)'    }, emoji: '🎨', size: 'large'  },
      { id: 'cr_3', title: { en: 'Choose a creative project',             he: 'לבחור פרויקט יצירתי'                }, emoji: '🎨', size: 'medium' },
    ],
  },
  social: {
    '6-8':   [
      { id: 'so_1', title: { en: 'Special playdate — you choose the activity', he: 'פלייידייט מיוחד — אתה בוחר הפעילות' }, emoji: '👫', size: 'medium' },
      { id: 'so_2', title: { en: 'Family movie night',                         he: 'ערב סרט משפחתי'                      }, emoji: '🍿', size: 'small'  },
    ],
    '9-11':  [
      { id: 'so_2', title: { en: 'Family movie night',                         he: 'ערב סרט משפחתי'                      }, emoji: '🍿', size: 'small'  },
      { id: 'so_3', title: { en: 'Pajama party — 2 friends + movie',           he: "מסיבת פיג'מות — 2 חברות + סרט"      }, emoji: '🎉', size: 'large'  },
    ],
    '12-14': [
      { id: 'so_3', title: { en: 'Pajama party — 2 friends + movie',           he: "מסיבת פיג'מות — 2 חברות + סרט"      }, emoji: '🎉', size: 'large'  },
      { id: 'so_2', title: { en: 'Family movie night',                         he: 'ערב סרט משפחתי'                      }, emoji: '🍿', size: 'small'  },
    ],
    '15-18': [
      { id: 'so_3', title: { en: 'Pajama party — 2 friends + movie',           he: "מסיבת פיג'מות — 2 חברות + סרט"      }, emoji: '🎉', size: 'large'  },
      { id: 'so_4', title: { en: 'Extended curfew by 30 minutes',              he: 'הארכת שעת חזרה ב-30 דקות'           }, emoji: '🌙', size: 'medium' },
    ],
  },
  privileges: {
    '6-8':   [
      { id: 'pr_1', title: { en: 'Late night pass',                  he: 'כרטיס שינה מאוחרת'                 }, emoji: '🌙',   size: 'small'  },
      { id: 'pr_2', title: { en: 'Chef for a night',                 he: 'שף לערב אחד'                       }, emoji: '🍕',   size: 'medium' },
    ],
    '9-11':  [
      { id: 'pr_3', title: { en: 'Chef for a night or pick a takeout', he: 'שף לערב אחד או לבחור משלוח'     }, emoji: '🍕🥡', size: 'medium' },
      { id: 'so_2', title: { en: 'Family movie night',                 he: 'ערב סרט משפחתי'                  }, emoji: '🍿',   size: 'small'  },
    ],
    '12-14': [
      { id: 'pr_3', title: { en: 'Chef for a night or pick a takeout', he: 'שף לערב אחד או לבחור משלוח'     }, emoji: '🍕🥡', size: 'medium' },
      { id: 'so_2', title: { en: 'Family movie night',                 he: 'ערב סרט משפחתי'                  }, emoji: '🍿',   size: 'small'  },
    ],
    '15-18': [
      { id: 'pr_3', title: { en: 'Chef for a night or pick a takeout', he: 'שף לערב אחד או לבחור משלוח'     }, emoji: '🍕🥡', size: 'medium' },
      { id: 'pr_4', title: { en: 'Convert BUFFs to money',             he: 'להמיר BUFFs לכסף'               }, emoji: '💰',   size: 'large'  },
    ],
  },
};

/** Safe fallback rewards when motivator/ageGroup combo isn't found */
export const FALLBACK_REWARDS: RewardItem[] = [
  { id: 'fb_r1', title: { en: 'Family movie night', he: 'ערב סרט משפחתי' }, emoji: '🍿', size: 'small' },
  { id: 'fb_r2', title: { en: 'Chef for a night',   he: 'שף לערב אחד'    }, emoji: '🍕', size: 'medium' },
];

// ── Credit calculators ────────────────────────────────────────────────────────

/** Calculate reward credits based on actual task buff_values */
export function calcRewardCredits(
  tasks: { buff_value: number }[],
  size: RewardSize,
): number {
  const maxDailyBuffs = tasks.reduce((sum, t) => sum + (t.buff_value ?? 0), 0);
  const days = ONBOARDING_CONFIG.REWARD_DAYS[size];
  return Math.round(ONBOARDING_CONFIG.REWARD_CREDITS_RATIO * maxDailyBuffs * days);
}

/** Fallback when tasks are not yet saved */
export function calcRewardCreditsDefault(size: RewardSize): number {
  const maxDailyBuffs =
    ONBOARDING_CONFIG.DEFAULT_TASKS_COUNT * ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE;
  const days = ONBOARDING_CONFIG.REWARD_DAYS[size];
  return Math.round(ONBOARDING_CONFIG.REWARD_CREDITS_RATIO * maxDailyBuffs * days);
}
