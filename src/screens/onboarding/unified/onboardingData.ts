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

export interface StarterTask {
  id:         string;
  title:      I18nString;
  buff_value: number;
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

// ── Starter tasks by challenge (3 per challenge, bilingual) ──────────────────

const V = ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE;

export const STARTER_TASKS_BY_CHALLENGE: Record<string, StarterTask[]> = {
  morning_routine: [
    { id: 'mr_1', title: { en: 'Brush teeth & wash face',          he: 'לצחצח שיניים ולשטוף פנים'          }, buff_value: V },
    { id: 'mr_2', title: { en: 'Pack school bag the night before', he: 'לארוז את התיק בערב'                 }, buff_value: V },
    { id: 'mr_3', title: { en: 'Be ready to leave on time',        he: 'להיות מוכן לצאת בזמן'              }, buff_value: V },
  ],
  homework_focus: [
    { id: 'hf_1', title: { en: '15-minute focused homework sprint', he: 'ספרינט שיעורי בית של 15 דקות'     }, buff_value: V },
    { id: 'hf_2', title: { en: 'No phone during homework time',     he: 'בלי טלפון בזמן שיעורי בית'        }, buff_value: V },
    { id: 'hf_3', title: { en: 'One subject at a time',             he: 'מקצוע אחד בכל פעם'                }, buff_value: V },
  ],
  organisation_memory: [
    { id: 'om_1', title: { en: 'Set out clothes the night before',  he: 'להכין בגדים בערב'                  }, buff_value: V },
    { id: 'om_2', title: { en: 'Check school bag checklist',        he: 'לבדוק רשימת תיק בית ספר'           }, buff_value: V },
    { id: 'om_3', title: { en: "Write tomorrow's tasks before bed", he: 'לכתוב משימות למחר לפני השינה'      }, buff_value: V },
  ],
  organisation: [
    { id: 'om_1', title: { en: 'Set out clothes the night before',  he: 'להכין בגדים בערב'                  }, buff_value: V },
    { id: 'om_2', title: { en: 'Check school bag checklist',        he: 'לבדוק רשימת תיק בית ספר'           }, buff_value: V },
    { id: 'om_3', title: { en: "Write tomorrow's tasks before bed", he: 'לכתוב משימות למחר לפני השינה'      }, buff_value: V },
  ],
  screen_time: [
    { id: 'st_1', title: { en: 'No phone during meals',             he: 'בלי טלפון בזמן ארוחות'             }, buff_value: V },
    { id: 'st_2', title: { en: 'Screens off 30 min before bed',     he: 'מסכים כבויים 30 דקות לפני שינה'   }, buff_value: V },
    { id: 'st_3', title: { en: 'Earn screen time after tasks done', he: 'זמן מסך רק אחרי משימות'            }, buff_value: V },
  ],
  screen_balance: [
    { id: 'st_1', title: { en: 'No phone during meals',             he: 'בלי טלפון בזמן ארוחות'             }, buff_value: V },
    { id: 'st_2', title: { en: 'Screens off 30 min before bed',     he: 'מסכים כבויים 30 דקות לפני שינה'   }, buff_value: V },
    { id: 'st_3', title: { en: 'Earn screen time after tasks done', he: 'זמן מסך רק אחרי משימות'            }, buff_value: V },
  ],
  screen_limits: [
    { id: 'st_1', title: { en: 'No phone during meals',             he: 'בלי טלפון בזמן ארוחות'             }, buff_value: V },
    { id: 'st_2', title: { en: 'Screens off 30 min before bed',     he: 'מסכים כבויים 30 דקות לפני שינה'   }, buff_value: V },
    { id: 'st_3', title: { en: 'Earn screen time after tasks done', he: 'זמן מסך רק אחרי משימות'            }, buff_value: V },
  ],
  time_management: [
    { id: 'tm_1', title: { en: 'Use a 25-min timer for tasks',      he: 'להשתמש בטיימר של 25 דקות'         }, buff_value: V },
    { id: 'tm_2', title: { en: 'Write 3 priorities each morning',   he: 'לכתוב 3 עדיפויות כל בוקר'         }, buff_value: V },
    { id: 'tm_3', title: { en: 'Check off completed tasks daily',   he: 'לסמן משימות שהושלמו כל יום'       }, buff_value: V },
  ],
  confidence: [
    { id: 'cf_1', title: { en: 'Do one thing that scares you today', he: 'לעשות דבר אחד שמפחיד אותך היום'  }, buff_value: V },
    { id: 'cf_2', title: { en: 'Give yourself a compliment',         he: 'לתת לעצמך מחמאה'                  }, buff_value: V },
    { id: 'cf_3', title: { en: 'Help someone at home or school',     he: 'לעזור למישהו בבית או בבית ספר'   }, buff_value: V },
  ],
  confidence_friends: [
    { id: 'sf_1', title: { en: 'Say hi to someone new this week',    he: 'להגיד שלום למישהו חדש השבוע'     }, buff_value: V },
    { id: 'sf_2', title: { en: 'Do something kind for a friend',     he: 'לעשות מעשה טוב לחבר'              }, buff_value: V },
    { id: 'sf_3', title: { en: 'Join one group activity',            he: 'להצטרף לפעילות קבוצתית אחת'      }, buff_value: V },
  ],
  social_friendships: [
    { id: 'sf_1', title: { en: 'Say hi to someone new this week',    he: 'להגיד שלום למישהו חדש השבוע'     }, buff_value: V },
    { id: 'sf_2', title: { en: 'Do something kind for a friend',     he: 'לעשות מעשה טוב לחבר'              }, buff_value: V },
    { id: 'sf_3', title: { en: 'Join one group activity',            he: 'להצטרף לפעילות קבוצתית אחת'      }, buff_value: V },
  ],
  independence: [
    { id: 'in_1', title: { en: 'Make your own breakfast',            he: 'להכין ארוחת בוקר לבד'             }, buff_value: V },
    { id: 'in_2', title: { en: 'Solve a small problem yourself',     he: 'לפתור בעיה קטנה לבד'              }, buff_value: V },
    { id: 'in_3', title: { en: 'Ask for help when stuck',            he: 'לבקש עזרה כשנתקעים'              }, buff_value: V },
  ],
  life_independence: [
    { id: 'in_1', title: { en: 'Make your own breakfast',            he: 'להכין ארוחת בוקר לבד'             }, buff_value: V },
    { id: 'in_2', title: { en: 'Solve a small problem yourself',     he: 'לפתור בעיה קטנה לבד'              }, buff_value: V },
    { id: 'in_3', title: { en: 'Ask for help when stuck',            he: 'לבקש עזרה כשנתקעים'              }, buff_value: V },
  ],
  focus_planning: [
    { id: 'fp_1', title: { en: 'Brain dump — write all worries down',  he: 'לרוקן את הראש — לכתוב כל מה שמטריד' }, buff_value: V },
    { id: 'fp_2', title: { en: 'Break big tasks into small steps',     he: 'לפרק משימות גדולות לצעדים קטנים'    }, buff_value: V },
    { id: 'fp_3', title: { en: '5-min tidy before starting homework',  he: '5 דקות סידור לפני שיעורי בית'       }, buff_value: V },
  ],
  planning_org: [
    { id: 'fp_1', title: { en: 'Brain dump — write all worries down',  he: 'לרוקן את הראש — לכתוב כל מה שמטריד' }, buff_value: V },
    { id: 'fp_2', title: { en: 'Break big tasks into small steps',     he: 'לפרק משימות גדולות לצעדים קטנים'    }, buff_value: V },
    { id: 'fp_3', title: { en: '5-min tidy before starting homework',  he: '5 דקות סידור לפני שיעורי בית'       }, buff_value: V },
  ],
  social_media: [
    { id: 'sm_1', title: { en: 'Social media only after 6pm',          he: 'רשתות חברתיות רק אחרי 18:00'         }, buff_value: V },
    { id: 'sm_2', title: { en: 'No TikTok/Instagram before school',    he: 'בלי טיקטוק/אינסטגרם לפני בית ספר'   }, buff_value: V },
    { id: 'sm_3', title: { en: 'Phone-free hour before sleep',         he: 'שעה ללא טלפון לפני שינה'             }, buff_value: V },
  ],
  self_management: [
    { id: 'tm_1', title: { en: 'Use a 25-min timer for tasks',         he: 'להשתמש בטיימר של 25 דקות'           }, buff_value: V },
    { id: 'tm_2', title: { en: 'Write 3 priorities each morning',      he: 'לכתוב 3 עדיפויות כל בוקר'           }, buff_value: V },
    { id: 'tm_3', title: { en: 'Check off completed tasks daily',      he: 'לסמן משימות שהושלמו כל יום'         }, buff_value: V },
  ],
  academic_perf: [
    { id: 'hf_1', title: { en: '15-minute focused homework sprint',    he: 'ספרינט שיעורי בית של 15 דקות'       }, buff_value: V },
    { id: 'fp_2', title: { en: 'Break big tasks into small steps',     he: 'לפרק משימות גדולות לצעדים קטנים'    }, buff_value: V },
    { id: 'hf_2', title: { en: 'No phone during homework time',        he: 'בלי טלפון בזמן שיעורי בית'          }, buff_value: V },
  ],
  // Legacy keys from old flow
  calm_mornings: [
    { id: 'mr_1', title: { en: 'Brush teeth & wash face',          he: 'לצחצח שיניים ולשטוף פנים'          }, buff_value: V },
    { id: 'mr_2', title: { en: 'Pack school bag the night before', he: 'לארוז את התיק בערב'                 }, buff_value: V },
    { id: 'mr_3', title: { en: 'Be ready to leave on time',        he: 'להיות מוכן לצאת בזמן'              }, buff_value: V },
  ],
  homework_reading: [
    { id: 'hf_1', title: { en: '15-minute focused homework sprint', he: 'ספרינט שיעורי בית של 15 דקות'     }, buff_value: V },
    { id: 'hf_2', title: { en: 'No phone during homework time',     he: 'בלי טלפון בזמן שיעורי בית'        }, buff_value: V },
    { id: 'hf_3', title: { en: 'One subject at a time',             he: 'מקצוע אחד בכל פעם'                }, buff_value: V },
  ],
  getting_ready: [
    { id: 'mr_1', title: { en: 'Brush teeth & wash face',          he: 'לצחצח שיניים ולשטוף פנים'          }, buff_value: V },
    { id: 'mr_2', title: { en: 'Pack school bag the night before', he: 'לארוז את התיק בערב'                 }, buff_value: V },
    { id: 'mr_3', title: { en: 'Be ready to leave on time',        he: 'להיות מוכן לצאת בזמן'              }, buff_value: V },
  ],
  homework_focus_adv: [
    { id: 'hf_1', title: { en: '15-minute focused homework sprint', he: 'ספרינט שיעורי בית של 15 דקות'     }, buff_value: V },
    { id: 'hf_2', title: { en: 'No phone during homework time',     he: 'בלי טלפון בזמן שיעורי בית'        }, buff_value: V },
    { id: 'hf_3', title: { en: 'One subject at a time',             he: 'מקצוע אחד בכל פעם'                }, buff_value: V },
  ],
};

/** Fallback when challenge ID has no matching tasks */
export const FALLBACK_TASKS: StarterTask[] = [
  { id: 'fallback_1', title: { en: 'Complete your daily routine', he: 'להשלים את השגרה היומית' }, buff_value: ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE },
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
