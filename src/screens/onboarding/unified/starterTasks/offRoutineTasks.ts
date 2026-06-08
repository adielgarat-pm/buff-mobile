/**
 * Off-Routine Day task bank.
 *
 * A LIGHT, age-banded default task set shown when a child's "off-routine day"
 * mode is active (weekend / holiday / disruption) — instead of the full weekday
 * plan. Principle (see docs/sessions/off-routine-day/SPEC.md): keep a few body
 * anchors, drop the school/routine load, add regulation + bounded autonomy +
 * self-driven curiosity. Co-designed with the parent community (Tamar + Noa).
 *
 * Decoupled from the challenge-domain generator (taskLibrary.ts) on purpose:
 * off-routine selection is "the whole light bank for the age band", not a
 * weighted domain pick. Titles are bilingual {en,he}; the seeder picks the
 * child's language at insert time.
 */
import type { AgeBand } from './types';
import type { I18nString } from '../onboardingData';
import type { TaskCategory } from '../../../../types/task';

export interface OffRoutineTaskDef {
  title:    I18nString;
  /** HH:MM — drives phase grouping (morning / midday / evening). */
  time:     string;
  category: TaskCategory;
  credits:  number;
  icon:     string;
}

const MORNING = '08:00';
const MIDDAY  = '12:00';
const EVENING = '19:00';

export const OFF_ROUTINE_BANK: Record<AgeBand, OffRoutineTaskDef[]> = {
  '6-8': [
    { title: { en: 'Brush teeth & get dressed',           he: 'לצחצח שיניים ולהתלבש' },            time: MORNING, category: 'self-care',      credits: 10, icon: '🦷' },
    { title: { en: 'Eat breakfast',                        he: 'לאכול ארוחת בוקר' },                 time: MORNING, category: 'self-care',      credits: 10, icon: '🍳' },
    { title: { en: 'Move your body — dance or jump',       he: 'להזיז את הגוף — לרקוד או לקפוץ' },    time: MIDDAY,  category: 'movement',       credits: 10, icon: '⚡' },
    { title: { en: 'Pick one fun thing you can do at home', he: 'לבחור דבר כיף אחד מתוך מה שאפשר בבית' }, time: MIDDAY, category: 'self-care',  credits: 10, icon: '✨' },
    { title: { en: 'Play one game with someone at home',   he: 'לשחק משחק אחד עם מישהו מהמשפחה' },     time: MIDDAY,  category: 'self-care',      credits: 10, icon: '🎲' },
    { title: { en: 'Name one good thing that happened',    he: 'דבר טוב אחד שקרה היום' },             time: EVENING, category: 'self-care',      credits: 10, icon: '💙' },
  ],
  '9-11': [
    { title: { en: 'Brush teeth & get dressed',            he: 'לצחצח שיניים ולהתלבש' },             time: MORNING, category: 'self-care',      credits: 10, icon: '🦷' },
    { title: { en: 'Eat breakfast',                        he: 'לאכול ארוחת בוקר' },                 time: MORNING, category: 'self-care',      credits: 10, icon: '🍳' },
    { title: { en: 'Pick what to do first',                he: 'לבחור מה עושים ראשון' },             time: MORNING, category: 'organization',   credits: 10, icon: '🎯' },
    { title: { en: 'Move, or get some fresh air',          he: 'לזוז, או לצאת קצת החוצה' },          time: MIDDAY,  category: 'movement',       credits: 10, icon: '🚶' },
    { title: { en: 'Explore something you are curious about (with a grown-up)', he: 'לחקור נושא אחד שמעניין אותי (אפשר עם הורה)' }, time: MIDDAY, category: 'learning', credits: 10, icon: '🔎' },
    { title: { en: 'One fun thing from what is possible at home', he: 'דבר כיף אחד מתוך מה שאפשר בבית' }, time: MIDDAY, category: 'self-care',   credits: 10, icon: '✨' },
    { title: { en: 'Name one good thing that happened',    he: 'דבר טוב אחד שקרה היום' },             time: EVENING, category: 'self-care',      credits: 10, icon: '💙' },
  ],
  '12-14': [
    { title: { en: 'Wake up and get ready at my pace',     he: 'לקום ולהתארגן בקצב שלי' },           time: MORNING, category: 'self-care',      credits: 10, icon: '🛏️' },
    { title: { en: 'Go for a walk or some movement',       he: 'לצאת להליכה או קצת תנועה' },          time: MIDDAY,  category: 'movement',       credits: 10, icon: '🚶' },
    { title: { en: 'Explore or learn something I am curious about', he: 'לחקור או ללמוד משהו שמעניין אותי' }, time: MIDDAY, category: 'learning', credits: 10, icon: '🔎' },
    { title: { en: 'Screen time with a purpose — learn or create', he: 'זמן מסך עם תכלית — ללמוד או ליצור' }, time: MIDDAY, category: 'learning', credits: 10, icon: '📲' },
    { title: { en: 'Help with one thing at home',          he: 'לעזור בדבר אחד בבית' },              time: MIDDAY,  category: 'responsibility', credits: 10, icon: '🏠' },
    { title: { en: 'Name one good thing that happened',    he: 'דבר טוב אחד שקרה היום' },             time: EVENING, category: 'self-care',      credits: 10, icon: '💙' },
  ],
  '15-18': [
    { title: { en: 'Go for a walk — set a free-day step goal', he: 'לצאת להליכה — לעדכן את יעד הצעדים ליום חופשי' }, time: MIDDAY, category: 'movement', credits: 10, icon: '🚶' },
    { title: { en: 'Make a plan with a friend',            he: 'לקבוע משהו עם חבר' },                time: MIDDAY,  category: 'self-care',      credits: 10, icon: '🤝' },
    { title: { en: 'Move forward on a topic or project I care about', he: 'לקדם נושא או פרויקט שמעניין אותי' }, time: MIDDAY, category: 'learning', credits: 10, icon: '🧠' },
    { title: { en: 'Screen time with a purpose — learn or create', he: 'זמן מסך עם תכלית — ללמוד או ליצור' }, time: MIDDAY, category: 'learning', credits: 10, icon: '📲' },
    { title: { en: 'Choose a shape for the day — what matters to me', he: 'לבחור מבנה ליום — מה חשוב לי' }, time: MORNING, category: 'organization', credits: 10, icon: '🗓️' },
    { title: { en: 'Name one good thing that happened',    he: 'דבר טוב אחד שקרה היום' },             time: EVENING, category: 'self-care',      credits: 10, icon: '💙' },
  ],
};
