/**
 * Starter-task library — pure data (the §1–§7 research table as records).
 *
 * SOURCE OF TRUTH: docs/sessions/onboarding-starter-tasks/DOMAIN_RESEARCH.md
 * (Adi-reviewed 2026-06-01). Every task carries an `evidenceTag` → that doc's
 * §9 bibliography, so the clinical basis stays auditable.
 *
 * Editing wording / ages / sexLean is a DATA edit here — the generator never
 * changes. Phase 2 can move this array to a Supabase `starter_task_defs` table
 * for server-side content updates without an app release.
 *
 * Conventions (Adi): child-facing titles are simple, inviting actions with NO
 * embedded "why" (rationale is parent-facing). baseWeight encodes editorial
 * priority before learning: foundational `both` tasks = 3, standard `both` = 2,
 * leaned tasks = 1 (they surface via sexLeanBonus when they match the child).
 */
import type { StarterTaskDef } from './types';

export const STARTER_TASK_LIBRARY: StarterTaskDef[] = [
  // ── Domain 1 — Morning routine / getting ready (Unified) ──────────────────
  {
    id: 'd1_layout_clothes', domain: 1, timeOfDay: 'evening',
    title: { en: "Lay out tomorrow's clothes", he: 'להכין בגדים למחר' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'EveningPrep', rationale: 'Kills AM decision fatigue', enabled: true, baseWeight: 3,
  },
  {
    id: 'd1_pack_bag', domain: 1, timeOfDay: 'evening',
    title: { en: 'Pack your bag for tomorrow', he: 'לארוז את התיק למחר' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'LaunchPad', rationale: 'Externalize memory the night before', enabled: true, baseWeight: 2,
  },
  {
    id: 'd1_bag_by_door', domain: 1, timeOfDay: 'morning',
    title: { en: 'Put your bag and shoes by the door', he: 'לשים את התיק והנעליים ליד הדלת' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'LaunchPad', rationale: 'One fixed spot, ready to go', enabled: true, baseWeight: 2,
  },
  {
    id: 'd1_brush_wash', domain: 1, timeOfDay: 'morning',
    title: { en: 'Brush teeth & wash face', he: 'לצחצח שיניים ולשטוף פנים' },
    ageBands: ['6-8', '9-11'], sexLean: 'both',
    evidenceTag: 'MorningTips', rationale: 'Core hygiene step', enabled: true, baseWeight: 2,
  },
  {
    id: 'd1_get_dressed', domain: 1, timeOfDay: 'morning',
    title: { en: 'Get dressed before breakfast', he: 'להתלבש לפני ארוחת הבוקר' },
    ageBands: ['6-8', '9-11', '12-14'], sexLean: 'both',
    evidenceTag: 'MorningTips', rationale: 'Natural anchor, no race', enabled: true, baseWeight: 3,
  },
  {
    id: 'd1_calm_breaths', domain: 1, timeOfDay: 'morning',
    title: { en: 'Take 3 calm breaths before the day starts', he: '3 נשימות רגועות לפני שהיום מתחיל' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'GirlsADHD', rationale: 'Calms AM overwhelm/anxiety (internalizing lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd1_move_body', domain: 1, timeOfDay: 'morning', category: 'movement',
    title: { en: 'Move your body for one minute', he: 'להזיז את הגוף דקה אחת' },
    ageBands: ['6-8', '9-11'], sexLean: 'boys',
    evidenceTag: 'SexDiff', rationale: 'Channel energy into the sequence (hyperactive lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd1_eat_breakfast', domain: 1, timeOfDay: 'morning',
    title: { en: 'Eat breakfast before you leave', he: 'לאכול ארוחת בוקר לפני שיוצאים' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'MorningTips', rationale: 'Commonly skipped', enabled: true, baseWeight: 3,
  },
  {
    id: 'd1_set_alarm', domain: 1, timeOfDay: 'evening',
    title: { en: 'Set your own alarm for tomorrow', he: 'לכוון לעצמך שעון מעורר למחר' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'EveningPrep', rationale: 'Fades to independence; set at night', enabled: true, baseWeight: 2,
  },

  // ── Domain 2 — Homework / focus / academics (Mild tuning) ─────────────────
  {
    id: 'd2_open_book', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'Just open the book to the right page', he: 'רק לפתוח את הספר בעמוד הנכון' },
    ageBands: ['6-8', '9-11'], sexLean: 'both',
    evidenceTag: 'TaskInit', rationale: 'Beats the initiation block (young)', enabled: true, baseWeight: 3,
  },
  {
    id: 'd2_work_out_today', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'Work out what you need to do today', he: 'להבין מה צריך לעשות היום' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'TaskInit', rationale: 'Orient before starting', enabled: true, baseWeight: 3,
  },
  {
    id: 'd2_five_min', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'Start with a 5-minute try', he: 'להתחיל מ-5 דקות בלבד' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'BreakDown', rationale: 'Momentum over resistance', enabled: true, baseWeight: 3,
  },
  {
    id: 'd2_pick_first', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'Pick the first thing to do', he: 'לבחור מה עושים ראשון' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'BreakDown', rationale: 'Chunk the blob', enabled: true, baseWeight: 2,
  },
  {
    id: 'd2_focus_round', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'Do one short focus round, then a break', he: 'סבב מיקוד קצר אחד, ואז הפסקה' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'boys',
    evidenceTag: 'TimeBlind', rationale: 'Short burst + movement (hyperactive lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd2_clear_desk', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'Clear your desk to just what you need', he: 'לפנות את השולחן רק למה שצריך' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'WorkingMem', rationale: 'Cuts working-memory load', enabled: true, baseWeight: 2,
  },
  {
    id: 'd2_write_due', domain: 2, timeOfDay: 'afternoon',
    title: { en: "Write down what's due today", he: 'לכתוב מה צריך להגיש היום' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'WorkingMem', rationale: 'Externalize memory', enabled: true, baseWeight: 2,
  },
  {
    id: 'd2_move_break', domain: 2, timeOfDay: 'afternoon', category: 'movement',
    title: { en: 'Take a quick move-break, then back', he: 'הפסקת תנועה קצרה ואז חוזרים' },
    ageBands: ['6-8', '9-11', '12-14'], sexLean: 'boys',
    evidenceTag: 'SexDiff', rationale: 'Channel hyperactivity (hyperactive lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd2_good_enough', domain: 2, timeOfDay: 'afternoon',
    title: { en: '"Good enough" — finish and let it go', he: '"מספיק טוב" — לסיים ולשחרר' },
    ageBands: ['12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'Perfectionism', rationale: 'Anti-perfectionism (perfectionism blocks finishing)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd2_calm_breath_begin', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'One calm breath, then begin', he: 'נשימה רגועה אחת ואז מתחילים' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'GirlsADHD', rationale: 'Defuse overwhelm before starting', enabled: true, baseWeight: 1,
  },
  {
    id: 'd2_break_big', domain: 2, timeOfDay: 'afternoon',
    title: { en: 'Write the big task, then break it into steps', he: 'לכתוב את המשימה הגדולה ולחלק אותה לצעדים' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'BreakDown', rationale: 'Milestone the project', enabled: true, baseWeight: 2,
  },

  // ── Domain 3 — Organisation / planning / working memory (Unified) ─────────
  {
    id: 'd3_pack_timetable', domain: 3, timeOfDay: 'evening',
    title: { en: "Pack your bag using tomorrow's schedule", he: 'לארוז את התיק לפי המערכת של מחר' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'Understood/CHADD', rationale: 'Externalize WM (age 6 with help)', enabled: true, baseWeight: 3,
  },
  {
    id: 'd3_empty_bag', domain: 3, timeOfDay: 'afternoon',
    title: { en: 'Empty your school bag onto your desk', he: 'לרוקן את התיק על השולחן' },
    ageBands: ['6-8', '9-11', '12-14'], sexLean: 'both',
    evidenceTag: 'UntappedLearning', rationale: 'Landing routine after school', enabled: true, baseWeight: 3,
  },
  {
    id: 'd3_go_over_hw', domain: 3, timeOfDay: 'afternoon',
    title: { en: "Go over today's homework", he: 'לעבור על שיעורי הבית של היום' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'ChildMind', rationale: 'Low-pressure review (masking lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd3_pick_one_first', domain: 3, timeOfDay: 'afternoon',
    title: { en: 'Pick the one thing to do first', he: 'לבחור מה לעשות ראשון' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'Barkley', rationale: 'Task initiation', enabled: true, baseWeight: 2,
  },
  {
    id: 'd3_check_bag', domain: 3, timeOfDay: 'morning',
    title: { en: 'Check your bag before you leave', he: 'לבדוק את התיק לפני שיוצאים' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'Understood', rationale: 'Quick self-check', enabled: true, baseWeight: 2,
  },
  {
    id: 'd3_add_calendar', domain: 3, timeOfDay: 'evening',
    title: { en: 'Add one upcoming thing to your calendar', he: 'להוסיף ליומן דבר אחד שמתקרב' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude', rationale: 'Fade scaffolding to self-run calendar', enabled: true, baseWeight: 2,
  },

  // ── Domain 4 — Screen time / social media (Mild tuning) ────────────────────
  {
    id: 'd4_after_screen', domain: 4, timeOfDay: 'afternoon',
    title: { en: 'Choose one thing to do after screen time', he: 'לבחור משהו אחד לעשות אחרי המסך' },
    ageBands: ['6-8'], sexLean: 'both',
    evidenceTag: 'CHADD', rationale: '"What\'s next" eases the transition (young)', enabled: true, baseWeight: 2,
  },
  {
    id: 'd4_precommit_stop', domain: 4, timeOfDay: 'afternoon',
    title: { en: "Before screens, decide when you'll stop and what's next", he: 'לפני המסך, להחליט מתי מפסיקים ומה עושים אחרי' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'boys',
    evidenceTag: 'PMC-gaming', rationale: 'Pre-plan the reward-loop exit (impulsive lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd4_movement_break', domain: 4, timeOfDay: 'afternoon', category: 'movement',
    title: { en: 'Take a movement break away from the screen', he: 'הפסקת תנועה הרחק מהמסך' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'CHADD', rationale: 'Balance / movement', enabled: true, baseWeight: 3,
  },
  {
    id: 'd4_charge_outside', domain: 4, timeOfDay: 'evening',
    title: { en: 'Charge your phone outside your room', he: 'לטעון את הטלפון מחוץ לחדר' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'AAP/HealthyChildren', rationale: 'Protects sleep', enabled: true, baseWeight: 2,
  },
  {
    id: 'd4_screens_off', domain: 4, timeOfDay: 'evening',
    title: { en: 'Screens off half an hour before bed', he: 'מסכים כבויים חצי שעה לפני השינה' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'CHOC/AAP', rationale: 'Sleep wind-down', enabled: true, baseWeight: 3,
  },
  {
    id: 'd4_app_limit', domain: 4, timeOfDay: 'afternoon',
    title: { en: 'Set a time limit on the app you scroll most', he: 'להגדיר מגבלת זמן לאפליקציה שהכי גוללים בה' },
    ageBands: ['12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'ChildMind', rationale: 'Infinite-scroll guardrail (comparison lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd4_unfollow', domain: 4, timeOfDay: 'evening',
    title: { en: 'Unfollow one account that brings you down', he: 'לבטל עוקב אחרי חשבון שמעציב אותך' },
    ageBands: ['12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'PMC-bodyimage', rationale: 'Social comparison (comparison lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd4_notice_feel', domain: 4, timeOfDay: 'afternoon',
    title: { en: 'Notice how you feel after scrolling', he: 'לשים לב איך את/ה מרגיש/ה אחרי הגלילה' },
    ageBands: ['12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'ChildMind', rationale: 'Comparison / self-esteem (comparison lean)', enabled: true, baseWeight: 1,
  },

  // ── Domain 5 — Confidence / social-emotional / friendships (Strong tuning) ─
  {
    id: 'd5_one_good_thing', domain: 5, timeOfDay: 'evening',
    title: { en: 'Name one good thing that happened today', he: 'להגיד דבר טוב אחד שקרה היום' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude', rationale: 'Counters daily-failure erosion', enabled: true, baseWeight: 3,
  },
  {
    id: 'd5_good_at', domain: 5, timeOfDay: 'evening',
    title: { en: "Name one thing you're good at", he: 'להגיד דבר אחד שאני טוב/ה בו' },
    ageBands: ['6-8', '9-11', '12-14'], sexLean: 'both',
    evidenceTag: 'Understood', rationale: 'Strengths > deficits', enabled: true, baseWeight: 3,
  },
  {
    id: 'd5_power_word', domain: 5, timeOfDay: 'morning',
    title: { en: 'Choose a word that gives you strength today', he: 'לבחור מילה שנותנת לך כוח היום' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'rula', rationale: 'Softens self-criticism (internalizing lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd5_say_hi', domain: 5, timeOfDay: 'school',
    title: { en: 'Say hi to one kid', he: 'להגיד שלום לילד/ה אחד/ת' },
    ageBands: ['6-8', '9-11'], sexLean: 'both',
    evidenceTag: 'ADDitude-friends', rationale: 'Low-stakes peer initiation', enabled: true, baseWeight: 2,
  },
  {
    id: 'd5_ask_question', domain: 5, timeOfDay: 'afternoon',
    title: { en: 'Ask a friend one question about them', he: 'לשאול חבר/ה שאלה אחת עליו/ה' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-social', rationale: 'Reciprocity skill', enabled: true, baseWeight: 2,
  },
  {
    id: 'd5_turn_taking', domain: 5, timeOfDay: 'afternoon',
    title: { en: 'Take one turn, let them take one', he: 'תור שלי, תור שלך' },
    ageBands: ['6-8', '9-11'], sexLean: 'boys',
    evidenceTag: 'PMC-peer', rationale: 'Impulsive turn-taking (impulsive lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd5_invite_friend', domain: 5, timeOfDay: 'afternoon',
    title: { en: 'Invite a friend to do something you like', he: 'להזמין חבר/ה לעשות משהו שאוהבים' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-friends', rationale: 'Shared-interest playdate', enabled: true, baseWeight: 2,
  },
  {
    id: 'd5_sting_breath', domain: 5, timeOfDay: 'evening',
    title: { en: 'When something stings, take a slow breath', he: 'כשמשהו צורב, לקחת נשימה איטית' },
    ageBands: ['6-8', '9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ClevelandClinic-RSD', rationale: 'RSD coping (girls-lean 12+, kept both)', enabled: true, baseWeight: 2,
  },
  {
    id: 'd5_mistake_okay', domain: 5, timeOfDay: 'evening',
    title: { en: "Tell yourself: I made a mistake, and that's okay", he: 'להגיד לעצמי: טעיתי, וזה בסדר' },
    ageBands: ['12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'OT4ADHD', rationale: 'Separate behavior from identity (internalizing lean)', enabled: true, baseWeight: 1,
  },

  // ── Domain 6 — Time management / self-management (Mild tuning) ─────────────
  {
    id: 'd6_main_thing', domain: 6, timeOfDay: 'evening',
    title: { en: "Say tomorrow's main thing in one sentence", he: 'להגיד במשפט אחד מה הכי חשוב מחר' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'Riveta', rationale: 'Surfaces hidden deadline-stress (masking lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd6_first_morning', domain: 6, timeOfDay: 'morning',
    title: { en: 'Pick the first thing to do this morning', he: 'לבחור מה עושים ראשון בבוקר' },
    ageBands: ['6-8', '9-11', '12-14'], sexLean: 'both',
    evidenceTag: 'CarolinaADHD', rationale: 'Beats the start', enabled: true, baseWeight: 3,
  },
  {
    id: 'd6_guess_time', domain: 6, timeOfDay: 'afternoon',
    title: { en: "Guess how long it'll take, then check", he: 'לנחש כמה זמן ייקח, ואז לבדוק' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-estimation', rationale: 'Fixes the planning fallacy', enabled: true, baseWeight: 3,
  },
  {
    id: 'd6_focus_round', domain: 6, timeOfDay: 'afternoon',
    title: { en: 'Do one short focus round, then a break', he: 'סבב מיקוד קצר אחד, ואז הפסקה' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'boys',
    evidenceTag: 'ADDitude-Pomodoro', rationale: 'Shorter chunks (hyperactive lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd6_body_double', domain: 6, timeOfDay: 'afternoon',
    title: { en: 'Do it next to someone (body double)', he: 'לעשות את זה ליד מישהו' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-Pomodoro', rationale: 'Body-doubling', enabled: true, baseWeight: 2,
  },
  {
    id: 'd6_plan_tomorrow', domain: 6, timeOfDay: 'evening',
    title: { en: 'Plan tomorrow tonight', he: 'לתכנן את מחר, הערב' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-schedule', rationale: 'Offload to evening self', enabled: true, baseWeight: 3,
  },
  {
    id: 'd6_week_view', domain: 6, timeOfDay: 'evening',
    title: { en: 'Look at the whole week — tests and things due', he: 'להסתכל על כל השבוע — מבחנים ודברים להגשה' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'Understood-TimeSys', rationale: 'Weekly view, see it at a glance', enabled: true, baseWeight: 2,
  },
  {
    id: 'd6_spread_assignment', domain: 6, timeOfDay: 'evening',
    title: { en: 'Spread a big assignment across a few days', he: 'לפזר עבודה גדולה על כמה ימים' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'Understood-TimeSys', rationale: 'Back-plan far deadlines', enabled: true, baseWeight: 2,
  },
  {
    id: 'd6_assign_days', domain: 6, timeOfDay: 'evening',
    title: { en: 'Choose what each day this week is for', he: 'לבחור מה עושים בכל יום השבוע' },
    ageBands: ['15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-planner', rationale: 'Assign tasks to days (weekly ownership)', enabled: true, baseWeight: 2,
  },
  {
    id: 'd6_sum_day', domain: 6, timeOfDay: 'evening',
    title: { en: 'Sum up the day in one sentence', he: 'לסכם את היום במשפט אחד' },
    ageBands: ['15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude', rationale: 'Light self-review', enabled: true, baseWeight: 2,
  },

  // ── Domain 7 — Independence / life skills (Unified, mild in teens) ─────────
  {
    id: 'd7_dress_self', domain: 7, timeOfDay: 'morning',
    title: { en: 'Get dressed all by yourself', he: 'להתלבש לבד' },
    ageBands: ['6-8', '9-11'], sexLean: 'both',
    evidenceTag: 'ADDitude-chores', rationale: 'Self-care independence', enabled: true, baseWeight: 3,
  },
  {
    id: 'd7_make_bed', domain: 7, timeOfDay: 'morning',
    title: { en: 'Make your bed', he: 'לסדר את המיטה' },
    ageBands: ['6-8', '9-11', '12-14'], sexLean: 'both',
    evidenceTag: 'Joon', rationale: 'Single-step daily chore', enabled: true, baseWeight: 3,
  },
  {
    id: 'd7_own_alarm', domain: 7, timeOfDay: 'morning',
    title: { en: 'Wake up to your own alarm', he: 'להתעורר לבד עם השעון' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'CHADD', rationale: 'Fades the #1 over-done task', enabled: true, baseWeight: 3,
  },
  {
    id: 'd7_pack_bag', domain: 7, timeOfDay: 'morning',
    title: { en: 'Pack your own bag', he: 'לארוז את התיק לבד' },
    ageBands: ['6-8', '9-11'], sexLean: 'both',
    evidenceTag: 'Treehouse', rationale: 'Multi-step home contribution', enabled: true, baseWeight: 2,
  },
  {
    id: 'd7_make_breakfast', domain: 7, timeOfDay: 'morning',
    title: { en: 'Make your own breakfast', he: 'להכין לעצמך ארוחת בוקר' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-chores', rationale: 'Multi-step + kitchen safety (teen skill)', enabled: true, baseWeight: 3,
  },
  {
    id: 'd7_feed_pet', domain: 7, timeOfDay: 'afternoon',
    title: { en: 'Feed your pet / water a plant', he: 'להאכיל את החיה / להשקות צמח' },
    ageBands: ['6-8', '9-11'], sexLean: 'both',
    evidenceTag: 'OTToolbox', rationale: 'Responsibility for another living thing', enabled: true, baseWeight: 2,
  },
  {
    id: 'd7_clear_plate', domain: 7, timeOfDay: 'afternoon',
    title: { en: 'Clear your plate after eating', he: 'לפנות את הצלחת אחרי האוכל' },
    ageBands: ['6-8', '9-11'], sexLean: 'both',
    evidenceTag: 'Joon', rationale: 'Single-step home contribution', enabled: true, baseWeight: 2,
  },
  {
    id: 'd7_dishwasher', domain: 7, timeOfDay: 'afternoon',
    title: { en: 'Load the dishwasher', he: 'לסדר כלים במדיח' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'BrainBalance', rationale: 'Multi-step home contribution', enabled: true, baseWeight: 2,
  },
  {
    id: 'd7_laundry', domain: 7, timeOfDay: 'afternoon',
    title: { en: 'Do a load of your own laundry', he: 'לעשות כביסה משלך' },
    ageBands: ['12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'CHADD', rationale: '"Good-enough first try" (perfectionism lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd7_cook_meal', domain: 7, timeOfDay: 'afternoon',
    title: { en: 'Plan and cook one simple meal', he: 'לתכנן ולבשל ארוחה פשוטה' },
    ageBands: ['12-14', '15-18'], sexLean: 'both',
    evidenceTag: 'ADDitude-chores', rationale: 'Multi-step planning + execution', enabled: true, baseWeight: 2,
  },
  {
    id: 'd7_allowance', domain: 7, timeOfDay: 'evening',
    title: { en: 'Plan your weekly allowance', he: 'לתכנן את דמי הכיס השבועיים' },
    ageBands: ['9-11', '12-14', '15-18'], sexLean: 'boys',
    evidenceTag: 'ADDitude-money', rationale: 'Impulse-spend guardrail (impulsive lean)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd7_ask_need', domain: 7, timeOfDay: 'evening',
    title: { en: 'Ask for one thing you need today', he: 'לבקש דבר אחד שאת/ה צריך/ה היום' },
    ageBands: ['12-14', '15-18'], sexLean: 'girls',
    evidenceTag: 'CHADD', rationale: 'Counters masking (asks for help)', enabled: true, baseWeight: 1,
  },
  {
    id: 'd7_appointment', domain: 7, timeOfDay: 'evening',
    title: { en: 'Book or check one of your own appointments', he: 'לתאם או לבדוק תור משלך' },
    ageBands: ['15-18'], sexLean: 'both',
    evidenceTag: 'CHADD', rationale: 'Adult-prep self-management', enabled: true, baseWeight: 2,
  },
];

/** Fast lookup by id (used by the learning layer + tests). */
export const TASK_BY_ID: Record<string, StarterTaskDef> = Object.fromEntries(
  STARTER_TASK_LIBRARY.map((t) => [t.id, t]),
);
