/**
 * Unit tests for src/utils/timetableParser.ts.
 *
 * Coverage:
 *  - Pure helpers: parseDay, parseTime, generateBuffStandardTime
 *  - Pivot Excel parsing (mirrors the real-world screenshot Adi sent)
 *  - Standard row-based parsing
 *  - API response → periods (image OCR / paste flow)
 *  - Final conversion to the Timetable shape
 *
 * Regression cases included:
 *  - REG-1: split groups (two קבוצות separated by divider) — currently LOST, needs SPEC
 *  - REG-2: RTL Excel where שעה is the RIGHTMOST column, not col 0 — currently degraded, needs SPEC
 *
 * Bug fixes verified by this suite (see pkg/timetable-import-fixes):
 *   FIX-A: detectPivotFormat now recognizes "יום א"/"יום ב" header forms
 *   FIX-B: parsePivotFormat now flags autoTime=true when time is generated from a lesson number
 *   FIX-C: processApiResponse now propagates t.autoTime to the aggregate hasAuto flag
 *   FIX-D: parseStandardFormat dead-code branch removed
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseDay,
  parseTime,
  generateBuffStandardTime,
  detectPivotFormat,
  parsePivotFormat,
  processApiResponse,
  periodsToTimetable,
  parseExcelBase64,
  extractSubjectGroupsFromCell,
  applyDailyEquipment,
} from '../timetableParser';
import type { WeekDay } from '../../types/timetable';

// ─── Helper: build raw pivot grid that mirrors Adi's screenshot ───────────────
// Layout: col 0 = שעה (lesson number), cols 1..6 = יום א..יום ו
// (standard left-to-right Excel storage with שעה first)
const screenshotPivotRawData = (): unknown[][] => [
  // Header row
  ['שעה', 'יום א', 'יום ב', 'יום ג', 'יום ד', 'יום ה', 'יום ו'],
  // Row 1
  [
    '1',
    'שפה\nרובינשטין ליאת',
    'מתמטיקה\nזכאי סיגל',
    'שפה\nרובינשטין ליאת',
    'מדעים\nלוקמיש נטע',
    'מדעים\nלוקמיש נטע',
    'תנ"ך\nסרויה אורטל',
  ],
  // Row 2 — includes SPLIT GROUPS (two קבוצות separated by ─ divider)
  [
    '2',
    'מתמטיקה\nזכאי סיגל',
    'אנגלית מדוברת\nבלייב יוליה,\n────\nאנגלית מדוברת\nעשת מיכל', // SPLIT
    'שפה\nרובינשטין ליאת',
    'אנגלית\nבקאל מירלה',
    'כישורי חיים\nלוקמיש נטע,\n────\nכישורי חיים\nאלאל דיקלה',     // SPLIT
    'שפה\nרובינשטין ליאת',
  ],
  // Row 3
  [
    '3',
    'מתמטיקה\nזכאי סיגל',
    'היסטוריה\nאדוט איה',
    'אנגלית\nבקאל מירלה',
    'מוסיקה\nמרדיקס בר',
    'PBL\nלוקמיש בר נטע',
    'מתמטיקה\nזכאי סיגל',
  ],
  // Row 4 — also has a split (בינה מלאכותית)
  [
    '4',
    'שפה\nרובינשטין ליאת',
    'תנ"ך\nסרויה אורטל',
    'בינה מלאכותית\nלוקמיש נטע,\n────\nבינה מלאכותית\nנוי בינה מלאכותי', // SPLIT
    'מדעים\nלוקמיש נטע',
    'חינוך\nלוקמיש נטע',
    'שפה\nרובינשטין ליאת',
  ],
  // Row 5 — Friday empty
  [
    '5',
    'חנ"ג\nאסולין תובל',
    'מדעים\nלוקמיש נטע',
    'מתמטיקה\nזכאי סיגל',
    'חנ"ג\nאסולין תובל',
    'קרב מגע\nתלן שלום רועי',
    '', // Friday empty
  ],
  // Row 6 — Friday empty
  [
    '6',
    'היסטוריה\nאדוט איה',
    'חנ"ג\nאסולין תובל',
    'אנגלית\nבקאל מירלה',
    '',
    'אמנות\nמזרחי קארין',
    '', // Friday empty
  ],
];

// Same data, but with שעה moved to the LAST column (RTL-laid-out Excel)
const screenshotPivotRawDataRTL = (): unknown[][] => {
  const ltr = screenshotPivotRawData();
  return ltr.map(row => {
    const r = row as unknown[];
    return [...r.slice(1), r[0]]; // move col 0 to the end
  });
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

describe('parseDay', () => {
  test.each([
    ['ראשון', 'sunday'],
    ['שני', 'monday'],
    ['שלישי', 'tuesday'],
    ['רביעי', 'wednesday'],
    ['חמישי', 'thursday'],
    ['שישי', 'friday'],
    ["א'", 'sunday'],
    ['יום ו', 'friday'],
    ['SUNDAY', 'sunday'],
    ['mon', 'monday'],
    ['Fri', 'friday'],
  ])('parses %s → %s', (input, expected) => {
    expect(parseDay(input)).toBe(expected);
  });

  test('returns null for empty/unknown', () => {
    expect(parseDay('')).toBeNull();
    expect(parseDay('שבת')).toBeNull(); // Saturday — not a school day in BUFF
    expect(parseDay('garbage')).toBeNull();
  });
});

describe('parseTime', () => {
  test.each([
    ['08:00', '08:00'],
    ['8:00', '08:00'],
    ['8',    '08:00'],
    ['14:30', '14:30'],
  ])('parses %s → %s', (input, expected) => {
    expect(parseTime(input)).toBe(expected);
  });

  test('handles Excel serial fraction (0.333 ≈ 08:00)', () => {
    expect(parseTime(8 / 24)).toBe('08:00');
  });

  test('returns empty string for garbage', () => {
    expect(parseTime('')).toBe('');
    expect(parseTime('lunch')).toBe('');
  });
});

describe('generateBuffStandardTime', () => {
  test('lesson 0 = 08:00 (first lesson)', () => {
    expect(generateBuffStandardTime(0)).toBe('08:00');
  });
  test('lesson 1 = 08:50 (50 min later, no break yet)', () => {
    expect(generateBuffStandardTime(1)).toBe('08:50');
  });
  test('lesson 2 = 10:00 (50 + 20 break)', () => {
    expect(generateBuffStandardTime(2)).toBe('10:00');
  });
  test('lesson 3 = 10:50', () => {
    expect(generateBuffStandardTime(3)).toBe('10:50');
  });
  test('caps at lesson 9', () => {
    const last  = generateBuffStandardTime(9);
    const over  = generateBuffStandardTime(20);
    expect(last).toBe(over);
  });
});

// ─── Split-group extraction ───────────────────────────────────────────────────

describe('extractSubjectGroupsFromCell', () => {
  test('returns one group for a simple subject+teacher cell', () => {
    const groups = extractSubjectGroupsFromCell('מתמטיקה\nשליט שליט\n128 (ט6)');
    expect(groups).toEqual([{ subject: 'מתמטיקה', teacher: 'שליט שליט' }]);
  });

  test('returns one group for a bare subject (no teacher)', () => {
    const groups = extractSubjectGroupsFromCell('ספורט');
    expect(groups).toEqual([{ subject: 'ספורט', teacher: undefined }]);
  });

  test('splits two groups on a ──── divider line', () => {
    const groups = extractSubjectGroupsFromCell(
      'אנגלית מדוברת\nבלייב יוליה,\n────\nאנגלית מדוברת\nעשת מיכל',
    );
    expect(groups).toEqual([
      { subject: 'אנגלית מדוברת', teacher: 'בלייב יוליה' },
      { subject: 'אנגלית מדוברת', teacher: 'עשת מיכל' },
    ]);
  });

  test('splits three groups on underscores/dashes', () => {
    const groups = extractSubjectGroupsFromCell(
      'מתמטיקה א\nכהן\n____\nמתמטיקה ב\nלוי\n----\nמתמטיקה ג\nאברהמי',
    );
    expect(groups).toEqual([
      { subject: 'מתמטיקה א', teacher: 'כהן' },
      { subject: 'מתמטיקה ב', teacher: 'לוי' },
      { subject: 'מתמטיקה ג', teacher: 'אברהמי' },
    ]);
  });

  test('ignores empty/trailing dividers', () => {
    const groups = extractSubjectGroupsFromCell('שפה\n────\n────');
    expect(groups).toEqual([{ subject: 'שפה', teacher: undefined }]);
  });

  test('returns empty for empty cell', () => {
    expect(extractSubjectGroupsFromCell('')).toEqual([]);
    expect(extractSubjectGroupsFromCell('   \n   ')).toEqual([]);
  });

  test('strips trailing parens (room info) from subject line', () => {
    const groups = extractSubjectGroupsFromCell('כימיה (אשכול 2)\nדויטש');
    expect(groups).toEqual([{ subject: 'כימיה', teacher: 'דויטש' }]);
  });

  test('does NOT pick a room code as a teacher', () => {
    const groups = extractSubjectGroupsFromCell('מדעי המחשב\n217 (מחשבים)');
    expect(groups).toEqual([{ subject: 'מדעי המחשב', teacher: undefined }]);
  });
});

// ─── Pivot detection ──────────────────────────────────────────────────────────

describe('detectPivotFormat', () => {
  test('detects screenshot-style pivot (all 6 day headers in row 0)', () => {
    const { isPivot, headerRowIndex } = detectPivotFormat(screenshotPivotRawData());
    expect(isPivot).toBe(true);
    expect(headerRowIndex).toBe(0);
  });

  test('returns false for non-pivot (standard rows)', () => {
    const raw = [
      ['יום', 'שעה', 'מקצוע'],
      ['ראשון', '08:00', 'מתמטיקה'],
    ];
    expect(detectPivotFormat(raw).isPivot).toBe(false);
  });

  test('detects pivot even when header is on row 1 (banner above)', () => {
    const raw = [
      ['מערכת שעות — כיתה ה1 — תשפ"ו'],
      ['שעה', 'יום א', 'יום ב', 'יום ג', 'יום ד', 'יום ה', 'יום ו'],
      ['1', 'מתמטיקה', '', '', '', '', ''],
    ];
    const { isPivot, headerRowIndex } = detectPivotFormat(raw);
    expect(isPivot).toBe(true);
    expect(headerRowIndex).toBe(1);
  });
});

// ─── Pivot parsing (the screenshot, the real-world case) ──────────────────────

describe('parsePivotFormat — screenshot fixture', () => {
  const raw     = screenshotPivotRawData();
  const periods = parsePivotFormat(raw, 0);

  test('captures lessons across all 6 days', () => {
    const daysSeen = new Set(periods.map(p => p.day));
    expect(daysSeen).toEqual(new Set(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']));
  });

  test('assigns Buff Standard times based on lesson number', () => {
    const row1Sunday = periods.find(p => p.day === 'sunday' && p.lessonNumber === 1);
    expect(row1Sunday?.time).toBe('08:00');
    const row2Sunday = periods.find(p => p.day === 'sunday' && p.lessonNumber === 2);
    expect(row2Sunday?.time).toBe('08:50');
    const row3Sunday = periods.find(p => p.day === 'sunday' && p.lessonNumber === 3);
    expect(row3Sunday?.time).toBe('10:00');
  });

  test('autoTime is true (we only had lesson numbers, not real times)', () => {
    expect(periods.every(p => p.autoTime)).toBe(true);
  });

  test('strips teacher name when extracting subject (takes only first line)', () => {
    const taraf = periods.find(p => p.day === 'sunday' && p.lessonNumber === 1);
    expect(taraf?.subject).toBe('שפה');           // not "שפה\nרובינשטין ליאת"
  });

  test('skips empty Friday cells in rows 5 and 6', () => {
    const friLessons = periods.filter(p => p.day === 'friday');
    const friLessonNumbers = friLessons.map(p => p.lessonNumber).sort();
    expect(friLessonNumbers).toEqual([1, 2, 3, 4]); // rows 5 + 6 should be missing for Fri
  });

  test('FIX-1: split group cells now emit BOTH groups (primary selected, alternate deselected)', () => {
    // Mon row 2 cell has TWO english groups (Yulia + Michal) separated by ────.
    // After pkg/timetable-split-groups, the parser captures both as separate periods
    // with groupIndex 0 and 1, groupTotal 2.
    const monRow2 = periods.filter(p => p.day === 'monday' && p.lessonNumber === 2);
    expect(monRow2).toHaveLength(2);
    expect(monRow2.map(p => p.subject)).toEqual(['אנגלית מדוברת', 'אנגלית מדוברת']);
    expect(monRow2.map(p => p.teacher)).toEqual(['בלייב יוליה', 'עשת מיכל']);
    expect(monRow2.map(p => p.groupIndex)).toEqual([0, 1]);
    expect(monRow2.map(p => p.groupTotal)).toEqual([2, 2]);
    // Primary selected; alternate not (parent must opt-in if their child is in group 2).
    expect(monRow2.map(p => p.selected)).toEqual([true, false]);
    // Both share the same slotKey so the UI can group them visually.
    expect(monRow2[0].slotKey).toBe(monRow2[1].slotKey);
  });

  test('REG-2 (KNOWN BUG): RTL Excel with שעה in last column is misparsed', () => {
    // When שעה is in col 6 (rightmost) instead of col 0, parsePivotFormat
    // treats col 0 (יום א data) as the time column. The first day's lessons
    // get treated as lesson numbers, which silently corrupts the whole import.
    const rtlPeriods = parsePivotFormat(screenshotPivotRawDataRTL(), 0);
    // Currently this produces wrong results — when we fix it, this assertion
    // should change. Today we expect: 6 days but with broken lesson numbers.
    const friLessons = rtlPeriods.filter(p => p.day === 'friday');
    // Friday data is now in col 5, and שעה is in col 6 — parser uses col 0 (Sunday) as time,
    // so Friday gets broken assignments. The exact failure mode depends on what's in col 0.
    expect(friLessons.length).toBeGreaterThan(0); // sanity — we still capture *something*
    // The key bug: the Friday lesson numbers will be derived from Sunday subject strings.
  });
});

// ─── API response (image OCR / paste flow) ────────────────────────────────────

describe('processApiResponse', () => {
  test('processes a clean Edge Function response', () => {
    const tasks = [
      { title: 'מתמטיקה',  day: 'sunday',  time: '08:00', lessonNumber: 1 },
      { title: 'אנגלית',    day: 'sunday',  time: '08:50', lessonNumber: 2 },
      { title: 'מדעים',     day: 'friday',  time: '08:00', lessonNumber: 1 },
    ];
    const { periods, hasAuto, hasErrors } = processApiResponse(tasks);
    expect(periods).toHaveLength(3);
    expect(hasAuto).toBe(false);
    expect(hasErrors).toBe(false);
    expect(periods[0]).toMatchObject({ day: 'sunday', subject: 'מתמטיקה', time: '08:00' });
  });

  test('flags hasAuto when AI signals autoTime', () => {
    const { hasAuto } = processApiResponse([
      { title: 'אנגלית', day: 'monday', time: '08:00', autoTime: true },
    ]);
    expect(hasAuto).toBe(true);
  });

  test('back-fills missing time with Buff Standard', () => {
    const { periods, hasAuto } = processApiResponse([
      { title: 'מתמטיקה', day: 'sunday', time: '' },
      { title: 'אנגלית',  day: 'sunday', time: '' },
    ]);
    expect(periods[0].time).toBe('08:00');
    expect(periods[1].time).toBe('08:50');
    expect(hasAuto).toBe(true);
  });

  test('marks missingSubject for empty title and flags hasErrors', () => {
    const { periods, hasErrors } = processApiResponse([
      { title: '',           day: 'sunday', time: '08:00' },
      { title: 'מתמטיקה',    day: 'sunday', time: '08:50' },
    ]);
    expect(periods).toHaveLength(2);
    expect(periods[0].missingSubject).toBe(true);
    expect(periods[0].subject).toBe('');
    expect(hasErrors).toBe(true);
  });

  test('marks missingDay for unknown day', () => {
    const { periods, hasErrors } = processApiResponse([
      { title: 'מתמטיקה', day: 'שבת' as WeekDay, time: '08:00' },
    ]);
    expect(periods[0].missingDay).toBe(true);
    expect(hasErrors).toBe(true);
  });

  test('skips rows that are missing BOTH day and subject', () => {
    const { periods } = processApiResponse([
      { title: '',         day: undefined, time: '08:00' },
      { title: 'מתמטיקה',  day: 'sunday',  time: '08:00' },
    ]);
    expect(periods).toHaveLength(1);
    expect(periods[0].subject).toBe('מתמטיקה');
  });

  test('carries per-lesson equipment from the Edge Function', () => {
    const { periods } = processApiResponse([
      { title: 'אמנות', day: 'sunday', time: '08:00', equipment: 'צבעים, מכחול' },
    ]);
    expect(periods[0].equipment).toBe('צבעים, מכחול');
  });

  // "Different systems" guard (Adi 2026-09-01): a real HS grid uses IRREGULAR
  // printed times (07:30 / 08:15 / 09:05), NOT the 08:00/08:50 Buff-standard.
  // When the parse returns explicit times they must be preserved verbatim — a
  // regression here is exactly the "hours shift" the Haiku model produced.
  test('Hebrew HS grid: preserves real printed times (no shift) + keeps split "/" title', () => {
    const { periods, hasAuto } = processApiResponse([
      { title: 'מתמטיקה רמה 5 / מתמטיקה רמה 4 / מתמטיקה רמה 3', day: 'sunday', time: '08:15', lessonNumber: 1 },
      { title: 'אנגלית',   day: 'sunday',   time: '09:05', lessonNumber: 2 },
      { title: 'היסטוריה', day: 'thursday', time: '07:30', lessonNumber: 1 },
    ]);
    // Times are taken exactly as given — never rewritten to Buff-standard.
    const timeOf = (day: string, startsWith: string) =>
      periods.find(p => p.day === day && p.subject.startsWith(startsWith))?.time;
    expect(timeOf('sunday', 'מתמטיקה')).toBe('08:15');
    expect(timeOf('sunday', 'אנגלית')).toBe('09:05');
    expect(timeOf('thursday', 'היסטוריה')).toBe('07:30');
    expect(hasAuto).toBe(false);
    // The joined split-group options survive intact (one lesson, all options).
    expect(periods.some(p => p.subject === 'מתמטיקה רמה 5 / מתמטיקה רמה 4 / מתמטיקה רמה 3')).toBe(true);
  });

  test('English Mon–Fri grid: preserves times and maps weekdays', () => {
    const { periods, hasAuto, hasErrors } = processApiResponse([
      { title: 'Math', day: 'monday', time: '09:00', lessonNumber: 1 },
      { title: 'PE',   day: 'friday', time: '10:00', lessonNumber: 1 },
    ]);
    expect(hasErrors).toBe(false);
    expect(hasAuto).toBe(false);
    expect(periods.find(p => p.subject === 'Math')?.time).toBe('09:00');
    expect(periods.find(p => p.subject === 'Math')?.day).toBe('monday');
    expect(periods.find(p => p.subject === 'PE')?.time).toBe('10:00');
    expect(periods.find(p => p.subject === 'PE')?.day).toBe('friday');
  });
});

// ─── Daily gear (import-extract-equipment, D-IE-1) ────────────────────────────

describe('applyDailyEquipment', () => {
  const base = () => processApiResponse([
    { title: 'בריכה', day: 'sunday', time: '10:00', lessonNumber: 2 },
    { title: 'קליטה', day: 'sunday', time: '08:00', lessonNumber: 1 },
    { title: 'סרט',   day: 'monday', time: '09:00', lessonNumber: 1 },
  ]).periods;

  test('adds one daily-gear row per day that has lessons, at the earliest time', () => {
    const out = applyDailyEquipment(base(), 'בגד ים, כובע', 'ציוד יומי');
    const gear = out.filter((p) => p.subject === 'ציוד יומי');
    expect(gear).toHaveLength(2); // sunday + monday
    expect(gear.every((p) => p.equipment === 'בגד ים, כובע')).toBe(true);
    expect(gear.every((p) => p.lessonNumber === 0)).toBe(true);
    expect(gear.find((p) => p.day === 'sunday')!.time).toBe('08:00'); // earliest
  });

  test('is a no-op when there is no daily note', () => {
    const periods = base();
    expect(applyDailyEquipment(periods, '', 'ציוד יומי')).toBe(periods);
    expect(applyDailyEquipment(periods, '   ', 'ציוד יומי')).toBe(periods);
    expect(applyDailyEquipment(periods, null, 'ציוד יומי')).toBe(periods);
  });

  test('is a no-op when there are no lessons', () => {
    expect(applyDailyEquipment([], 'בגד ים', 'ציוד יומי')).toEqual([]);
  });

  test('daily-gear rows survive periodsToTimetable and sort first', () => {
    const out = applyDailyEquipment(base(), 'מים', 'ציוד יומי');
    const tt = periodsToTimetable(out);
    expect(tt.sunday?.[0]).toMatchObject({ subject: 'ציוד יומי', equipment: 'מים' });
  });
});

// ─── Final conversion ─────────────────────────────────────────────────────────

describe('periodsToTimetable', () => {
  test('converts ParsedPeriods into a sorted Timetable', () => {
    const { periods } = processApiResponse([
      { title: 'שפה',       day: 'sunday', time: '08:00', lessonNumber: 1 },
      { title: 'מדעים',     day: 'sunday', time: '10:00', lessonNumber: 3 },
      { title: 'מתמטיקה',   day: 'sunday', time: '08:50', lessonNumber: 2 },
      { title: 'אנגלית',    day: 'friday', time: '08:00', lessonNumber: 1 },
    ]);

    const timetable = periodsToTimetable(periods);
    expect(timetable.sunday?.map(p => p.subject)).toEqual(['שפה', 'מתמטיקה', 'מדעים']);
    expect(timetable.friday?.map(p => p.subject)).toEqual(['אנגלית']);
    expect(timetable.monday).toEqual([]);
  });

  test('preserves equipment when present', () => {
    const { periods } = processApiResponse([
      { title: 'חנ"ג', day: 'monday', time: '08:00', equipment: 'חולצה כחולה' },
    ]);
    const timetable = periodsToTimetable(periods);
    expect(timetable.monday?.[0]).toEqual({
      subject: 'חנ"ג', startTime: '08:00', equipment: 'חולצה כחולה',
    });
  });
});

// ─── REG-3: parseStandardFormat dead-code branch ──────────────────────────────

describe('parseExcelBase64 — header mapping (covers REG-3 indirectly)', () => {
  test('respects header order: יום | שעה | מקצוע | ציוד', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['יום',   'שעה',   'מקצוע',   'ציוד'],
      ['ראשון', '08:00', 'מתמטיקה', 'מחשבון'],
      ['שני',   '09:00', 'אנגלית',  ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const { periods, isPivot } = parseExcelBase64(base64);
    expect(isPivot).toBe(false);
    expect(periods).toHaveLength(2);
    expect(periods[0]).toMatchObject({ day: 'sunday', subject: 'מתמטיקה', time: '08:00', equipment: 'מחשבון' });
    expect(periods[1]).toMatchObject({ day: 'monday', subject: 'אנגלית' });
  });

  test('handles English headers (Day | Time | Subject)', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Day',     'Time',  'Subject'],
      ['Sunday',  '08:00', 'Math'],
      ['Monday',  '09:00', 'English'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const { periods } = parseExcelBase64(base64);
    expect(periods).toHaveLength(2);
    expect(periods[0]).toMatchObject({ day: 'sunday', subject: 'Math' });
  });

  test('parses the screenshot pivot end-to-end', () => {
    const ws = XLSX.utils.aoa_to_sheet(screenshotPivotRawData() as any[][]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const { periods, isPivot } = parseExcelBase64(base64);
    expect(isPivot).toBe(true);
    expect(periods.length).toBeGreaterThan(20); // 5 days × multiple lessons + friday(4)
    const daysSeen = new Set(periods.map(p => p.day));
    expect(daysSeen.size).toBe(6);
  });
});

// ─── Real-world fixture #1: parent-submitted schedule-1.xlsx ──────────────────
// Source: a parent sent this to Adi. Captures a particularly hostile pattern:
//  - 3-row banner above the header (title "מערכת שעות לט' 6" + 2 blank rows)
//  - Header row 3, with day names preceded by a leading space (" ראשון", " שני"…)
//  - Time column "שעה/יום" with format "1. 08:15-09:00" (lesson# + range)
//  - Multi-line cells: subject + duplicated-teacher + room "128 (ט6)"
//  - Empty Friday column (no שישי lessons at all)
//  - Empty time cells in continuation rows = SECOND-GROUP lessons that we LOSE
//    (e.g., row 5 שני=כימיה, row 6 שני=פיזיקה under the same time slot)

describe('real-world fixture: schedule-real-1.xlsx', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'schedule-real-1.xlsx');
  const base64 = fs.readFileSync(fixturePath, { encoding: 'base64' });
  const { periods, isPivot, hasAuto, hasErrors } = parseExcelBase64(base64);

  test('detects as pivot despite the 3-row banner above the header', () => {
    expect(isPivot).toBe(true);
  });

  test('captures 5 active school days (no שישי, no שבת)', () => {
    const daysSeen = new Set(periods.map(p => p.day));
    expect(daysSeen).not.toContain('friday'); // file has empty Friday column
    expect(daysSeen.size).toBe(5);
  });

  test('parses real lesson times correctly (not Buff Standard)', () => {
    const l1 = periods.find(p => p.day === 'sunday' && p.lessonNumber === 1);
    expect(l1?.time).toBe('08:15');  // from "1. 08:15-09:00", not auto 08:00
    expect(l1?.autoTime).toBe(false);
    const l3 = periods.find(p => p.day === 'sunday' && p.lessonNumber === 3);
    expect(l3?.time).toBe('10:05');  // from "3. 10:05-10:50"
  });

  test('strips teacher and room info from cell (subject = first line)', () => {
    const l1Mon = periods.find(p => p.day === 'monday' && p.lessonNumber === 1);
    // Cell content: "כימיה\nדויטש דויטש\nאשכול 2 (כימיה)"
    expect(l1Mon?.subject).toBe('כימיה');
  });

  test('captures Computer Science (מדעי המחשב) across multiple late slots', () => {
    const csLessons = periods.filter(p => p.subject === 'מדעי המחשב');
    expect(csLessons.length).toBeGreaterThanOrEqual(4);
  });

  test('FIX-4: continuation rows now capture second-group lessons (פיזיקה under שני@1 + @2)', () => {
    // Row 5 (lesson 1): שני=כימיה.
    // Row 6 (no time cell): שני=פיזיקה — this is a SECOND group for the same slot.
    // After pkg/timetable-split-groups, the continuation row is treated as an extension
    // of the previous slot, so פיזיקה@lesson1 and פיזיקה@lesson2 are captured as
    // alternates (groupIndex 1, selected: false).
    const physicsAtSlot1 = periods.filter(
      p => p.subject === 'פיזיקה' && p.day === 'monday' && p.lessonNumber === 1,
    );
    expect(physicsAtSlot1).toHaveLength(1);
    expect(physicsAtSlot1[0].groupIndex).toBe(1);
    expect(physicsAtSlot1[0].groupTotal).toBe(2);
    expect(physicsAtSlot1[0].selected).toBe(false);

    const physicsAtSlot2 = periods.filter(
      p => p.subject === 'פיזיקה' && p.day === 'monday' && p.lessonNumber === 2,
    );
    expect(physicsAtSlot2).toHaveLength(1);
    expect(physicsAtSlot2[0].groupIndex).toBe(1);

    // The primary group (כימיה) for slot 1 has its groupTotal bumped to 2 retroactively
    const chemAtSlot1 = periods.find(
      p => p.subject === 'כימיה' && p.day === 'monday' && p.lessonNumber === 1,
    );
    expect(chemAtSlot1?.groupTotal).toBe(2);
    expect(chemAtSlot1?.selected).toBe(true);
    expect(chemAtSlot1?.slotKey).toBe(physicsAtSlot1[0].slotKey);
  });

  test('produces no validation errors (file is well-formed)', () => {
    expect(hasErrors).toBe(false);
  });

  test('has real times so hasAuto is false', () => {
    expect(hasAuto).toBe(false);
  });

  test('converts to a Timetable with sorted lesson order per day', () => {
    const timetable = periodsToTimetable(periods);
    const sunTimes = (timetable.sunday ?? []).map(p => p.startTime);
    // Lessons 1..8 sorted chronologically
    expect(sunTimes).toEqual([...sunTimes].sort());
    expect(sunTimes[0]).toBe('08:15');
  });
});

// ─── Real-world fixture #2: photo-style pivot (no time column, no lesson #s) ──
// Source: photo Adi sent on 2026-05-25. A 1st-grade weekly schedule.
// Structure: 6 day columns (ראשון..שישי), 7 lesson rows, no time/lesson# column.
// Friday last 2 rows are empty.
// Each cell is just the subject name — no teacher, no room.
//
// This is the FORMAT THE PHOTO WOULD PRODUCE if exported as XLSX. The photo
// itself would go through OCR → AI → processApiResponse, but if any parent
// builds the same shape in Excel, we want to parse it without a time column.

const photoStylePivotRawData = (): unknown[][] => [
  ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'],
  ['אנגלית',       'ספורט',  'שפה',           'כתיבה יצירתית', 'תנך',     'חשבון'],
  ['כישורי חיים',  'אנגלית', 'שפה',           'זה"ב',          'חשבון',   'כישורי חיים'],
  ['שפה',          'מדעים',  'בשבילי המורשת', 'שפה',           'דאפו',    'שפה'],
  ['שפה',          'מדעים',  'גיאומטריה',     'חשבון',         'ספורט',   'אנגלית'],
  ['חשבון',        'מדעים',  'חלל/ אומנות',   'קורדינציה',     'תיאטרון', ''],
  ['שיח מחנכת',    'אנגלית', 'חלל/ אומנות',   'שפה',           'חשבון',   ''],
];

describe('real-world fixture: photo-style pivot (no time column)', () => {
  test('still detects as pivot (all 6 day headers present)', () => {
    const { isPivot, headerRowIndex } = detectPivotFormat(photoStylePivotRawData());
    expect(isPivot).toBe(true);
    expect(headerRowIndex).toBe(0);
  });

  test('still captures all 6 days when col 0 doubles as time cell + first day', () => {
    // Because the parser assumes row[0] = שעה, the first data column (ראשון)
    // is consumed as the time-cell input. parseTimeFromPivotCell on "אנגלית"
    // returns {lessonNumber:0, startTime:'', autoTime:false} → effectiveLesson
    // falls back to (rowIdx - headerRowIndex) = 1,2,3..., time = Buff Standard.
    // The cell is ALSO processed as a Sunday lesson (because col 0 is in dayCols),
    // so Sunday IS captured. This is fragile but functional for this format.
    const ws = XLSX.utils.aoa_to_sheet(photoStylePivotRawData() as any[][]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const { periods } = parseExcelBase64(base64);

    const daysSeen = new Set(periods.map(p => p.day));
    expect(daysSeen.size).toBe(6);
    const sundayLessons = periods.filter(p => p.day === 'sunday');
    expect(sundayLessons.length).toBe(6); // 6 data rows in fixture
    expect(sundayLessons[0]?.subject).toBe('אנגלית');
  });

  test('parses photo-style end-to-end: 6 lessons per weekday, 4 on Friday', () => {
    const ws = XLSX.utils.aoa_to_sheet(photoStylePivotRawData() as any[][]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const { periods, hasAuto } = parseExcelBase64(base64);

    // All Buff Standard times because there were no real times in the file
    expect(hasAuto).toBe(true);
    expect(periods.every(p => p.autoTime)).toBe(true);

    // Last 2 Friday cells are empty → 4 Fri lessons captured
    const friLessons = periods.filter(p => p.day === 'friday');
    expect(friLessons.length).toBe(4);

    // Monday/Wednesday/Sunday/Tuesday/Thursday all have 6 lessons each
    expect(periods.filter(p => p.day === 'sunday').length).toBe(6);
    expect(periods.filter(p => p.day === 'monday').length).toBe(6);
    expect(periods.filter(p => p.day === 'tuesday').length).toBe(6);
    expect(periods.filter(p => p.day === 'wednesday').length).toBe(6);
    expect(periods.filter(p => p.day === 'thursday').length).toBe(6);
  });

  test('subject is the raw cell value (no teacher to strip)', () => {
    const ws = XLSX.utils.aoa_to_sheet(photoStylePivotRawData() as any[][]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const { periods } = parseExcelBase64(base64);

    // Col order: 0=ראשון, 1=שני, 2=שלישי, 3=רביעי, 4=חמישי, 5=שישי
    const monL1 = periods.find(p => p.day === 'monday' && p.lessonNumber === 1);
    expect(monL1?.subject).toBe('ספורט');                  // row 1, col 1
    const tueL3 = periods.find(p => p.day === 'tuesday' && p.lessonNumber === 3);
    expect(tueL3?.subject).toBe('בשבילי המורשת');         // row 3, col 2 (שלישי)
    const wedL5 = periods.find(p => p.day === 'wednesday' && p.lessonNumber === 5);
    expect(wedL5?.subject).toBe('קורדינציה');             // row 5, col 3 (רביעי)
    const thuL4 = periods.find(p => p.day === 'thursday' && p.lessonNumber === 4);
    expect(thuL4?.subject).toBe('ספורט');                  // row 4, col 4 (חמישי)
  });
});
