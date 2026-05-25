/**
 * timetableParser.ts
 *
 * Pure parsing utilities for school timetable import.
 * Ported from buff-lovable/src/components/TimetableImporter.tsx.
 * No UI dependencies — safe to use in hooks or screens.
 */

import * as XLSX from 'xlsx';
import type { Timetable, WeekDay, PeriodInfo } from '../types/timetable';
import { WEEK_DAYS_WITH_FRIDAY } from '../types/timetable';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedPeriod {
  id:              string;
  subject:         string;
  time:            string;   // "HH:MM"
  day:             WeekDay;
  selected:        boolean;
  autoTime?:       boolean;
  missingSubject?: boolean;
  missingDay?:     boolean;
  lessonNumber?:   number;
  equipment?:      string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_MAPPINGS = {
  day:       ['יום', 'day', 'weekday', 'ימים', 'days'],
  subject:   ['מקצוע', 'שיעור', 'נושא', 'subject', 'lesson', 'activity', 'class', 'course', 'מקצועות', 'שיעורים', 'פעילות', 'תוכן'],
  time:      ['שעה', 'זמן', 'התחלה', 'time', 'start', 'hour', 'from', 'שעות'],
  equipment: ['ציוד', 'להביא', 'equipment', 'required', 'bring', 'items', 'חומרים', 'ציוד נדרש'],
};

export const HEBREW_DAY_MAP: Record<string, WeekDay> = {
  'ראשון': 'sunday',   'א': 'sunday',   "א'": 'sunday',   'יום א': 'sunday',   'יום ראשון': 'sunday',
  'שני': 'monday',     'ב': 'monday',   "ב'": 'monday',   'יום ב': 'monday',   'יום שני': 'monday',
  'שלישי': 'tuesday',  'ג': 'tuesday',  "ג'": 'tuesday',  'יום ג': 'tuesday',  'יום שלישי': 'tuesday',
  'רביעי': 'wednesday','ד': 'wednesday',"ד'": 'wednesday','יום ד': 'wednesday','יום רביעי': 'wednesday',
  'חמישי': 'thursday', 'ה': 'thursday', "ה'": 'thursday', 'יום ה': 'thursday', 'יום חמישי': 'thursday',
  'שישי': 'friday',    'ו': 'friday',   "ו'": 'friday',   'יום ו': 'friday',   'יום שישי': 'friday',
  'sunday': 'sunday', 'monday': 'monday', 'tuesday': 'tuesday',
  'wednesday': 'wednesday', 'thursday': 'thursday', 'friday': 'friday',
  'sun': 'sunday', 'mon': 'monday', 'tue': 'tuesday',
  'wed': 'wednesday', 'thu': 'thursday', 'fri': 'friday',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substr(2, 9);

/** "Buff Standard" — 50-min lessons, 20-min breaks, first lesson at 08:00 */
export const generateBuffStandardTime = (lessonIndex: number): string => {
  const capped = Math.min(lessonIndex, 9);
  let minutes = 8 * 60;
  for (let i = 0; i < capped; i++) {
    minutes += 50;
    if ((i + 1) % 2 === 0) minutes += 20;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const parseDay = (value: string): WeekDay | null => {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  return HEBREW_DAY_MAP[normalized] ?? HEBREW_DAY_MAP[value.trim()] ?? null;
};

export const parseTime = (value: string | number): string => {
  if (value === undefined || value === null || value === '') return '';
  const str = value.toString().trim();
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMins = Math.round(num * 24 * 60);
    return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  }
  if (/^\d{1,2}$/.test(str)) return `${str.padStart(2, '0')}:00`;
  return '';
};

const looksLikeDay = (val: string): boolean => {
  const n = val.toString().toLowerCase().trim();
  return Object.keys(HEBREW_DAY_MAP).some(d => n.includes(d) || d.includes(n));
};

const looksLikeTime = (val: string): boolean => {
  const s = val.toString().trim();
  return /^\d{1,2}(:\d{2})?$/.test(s) || (!isNaN(parseFloat(s)) && parseFloat(s) >= 0 && parseFloat(s) < 1);
};

const findHeaderKey = (headers: string[], type: keyof typeof HEADER_MAPPINGS): string | null => {
  const variants = HEADER_MAPPINGS[type];
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    for (const v of variants) {
      if (lower === v || lower.includes(v)) return header;
    }
  }
  return null;
};

const findSubjectFallback = (headers: string[], dayCol: string | null, timeCol: string | null): string | null => {
  for (const h of headers) {
    if (h === dayCol || h === timeCol) continue;
    if (looksLikeDay(h) || looksLikeTime(h)) continue;
    if (h.trim().length > 0) return h;
  }
  return null;
};

// ─── Pivot / grid format ──────────────────────────────────────────────────────

export const detectPivotFormat = (rawData: unknown[][]): { isPivot: boolean; headerRowIndex: number } => {
  // Match either full Hebrew day names ("ראשון", "שני", ...) OR the abbreviated
  // form ("יום א", "יום ב", ...) — many Israeli school exports use the latter.
  const dayPatterns: RegExp[] = [
    /ראשון|יום\s*א/,
    /שני|יום\s*ב/,
    /שלישי|יום\s*ג/,
    /רביעי|יום\s*ד/,
    /חמישי|יום\s*ה/,
    /שישי|יום\s*ו/,
  ];
  for (let rowIdx = 0; rowIdx <= Math.min(5, rawData.length - 1); rowIdx++) {
    const row = (rawData[rowIdx] || []) as unknown[];
    const rowStr = row.map(c => String(c ?? '').trim().toLowerCase());
    const found = dayPatterns.filter(p => rowStr.some(cell => p.test(cell)));
    const hasTimeHeader = rowStr.some(cell => cell.includes('שעה'));
    if (found.length >= 3 || (found.length >= 2 && hasTimeHeader)) {
      return { isPivot: true, headerRowIndex: rowIdx };
    }
  }
  return { isPivot: false, headerRowIndex: 0 };
};

const mapColumnsToDay = (headers: string[]): Record<number, WeekDay> => {
  const patterns: [RegExp, WeekDay][] = [
    [/ראשון|יום\s*א|sunday|sun/i,   'sunday'],
    [/שני|יום\s*ב|monday|mon/i,      'monday'],
    [/שלישי|יום\s*ג|tuesday|tue/i,   'tuesday'],
    [/רביעי|יום\s*ד|wednesday|wed/i, 'wednesday'],
    [/חמישי|יום\s*ה|thursday|thu/i,  'thursday'],
    [/שישי|יום\s*ו|friday|fri/i,     'friday'],
  ];
  const map: Record<number, WeekDay> = {};
  headers.forEach((h, i) => {
    const s = String(h ?? '').trim().toLowerCase();
    for (const [pattern, day] of patterns) {
      if (pattern.test(s)) { map[i] = day; break; }
    }
  });
  return map;
};

const parseTimeFromPivotCell = (cell: string): { startTime: string; lessonNumber: number; autoTime: boolean } => {
  const s = String(cell ?? '').trim();
  const rangeMatch = s.match(/(\d{1,2})[:\.]?\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) return { lessonNumber: parseInt(rangeMatch[1], 10), startTime: rangeMatch[2], autoTime: false };
  const simpleMatch = s.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (simpleMatch) return { lessonNumber: 0, startTime: simpleMatch[1], autoTime: false };
  const numMatch = s.match(/(\d+)/);
  if (numMatch) {
    // Lesson-number-only cell ("1", "2"…) → we *generate* the time, so flag it as auto.
    const n = parseInt(numMatch[1], 10);
    return { lessonNumber: n, startTime: generateBuffStandardTime(n - 1), autoTime: true };
  }
  return { lessonNumber: 0, startTime: '', autoTime: false };
};

const extractSubjectFromCell = (cell: string): string =>
  String(cell ?? '').trim()
    .split(/[\n\r]+/)[0]
    .replace(/^\d+\.\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();

export const parsePivotFormat = (rawData: unknown[][], headerRowIndex: number): ParsedPeriod[] => {
  const headers = ((rawData[headerRowIndex] ?? []) as unknown[]).map(h => String(h ?? '').trim());
  const colToDay = mapColumnsToDay(headers);
  const dayCols = Object.keys(colToDay).map(Number).sort((a, b) => a - b);
  const periods: ParsedPeriod[] = [];

  for (let rowIdx = headerRowIndex + 1; rowIdx < rawData.length; rowIdx++) {
    const row = (rawData[rowIdx] ?? []) as unknown[];
    const timeCell = String(row[0] ?? '').trim();
    if (!timeCell) continue;
    const { startTime, lessonNumber, autoTime: cellAutoTime } = parseTimeFromPivotCell(timeCell);
    const effectiveLesson = lessonNumber || (rowIdx - headerRowIndex);
    const effectiveTime   = startTime || generateBuffStandardTime(effectiveLesson - 1);
    // autoTime is true when the cell didn't contain a real time, OR contained only
    // a lesson number that we converted via Buff Standard.
    const effectiveAutoTime = !startTime || cellAutoTime;

    for (const colIdx of dayCols) {
      const day = colToDay[colIdx];
      if (!day) continue;
      const cell = String(row[colIdx] ?? '').trim();
      if (!cell) continue;
      const subject = extractSubjectFromCell(cell);
      if (!subject) continue;
      periods.push({
        id: generateId(), subject, time: effectiveTime, day,
        selected: true, autoTime: effectiveAutoTime,
        missingSubject: false, missingDay: false,
        lessonNumber: effectiveLesson, equipment: '',
      });
    }
  }
  return periods;
};

// ─── Standard row-based Excel format ─────────────────────────────────────────

/**
 * Standard row-based Excel parser using raw cell arrays.
 *
 * Header-aware object mapping lives in `parseExcelBase64` because it needs the
 * full WorkSheet (not just rawData). This function assumes the column order
 * Day | Time | Subject | Equipment, skipping a header row if the first row
 * doesn't start with a parseable day.
 */
export const parseStandardFormat = (rawData: unknown[][]): { periods: ParsedPeriod[]; hasAuto: boolean; hasErrors: boolean } => {
  const startIndex = rawData.length > 1 && !parseDay(String((rawData[0] as unknown[])[0] ?? '')) ? 1 : 0;
  const dataRows = rawData.slice(startIndex).map(row => {
    const r = row as unknown[];
    return { day: String(r[0] ?? ''), time: String(r[1] ?? ''), subject: String(r[2] ?? ''), equipment: String(r[3] ?? '') };
  });
  return processDataRows(dataRows);
};

/** Process header-mapped row objects into ParsedPeriods. */
export const processDataRows = (
  rows: Array<{ day: string; time: string | number; subject: string; equipment: string }>,
): { periods: ParsedPeriod[]; hasAuto: boolean; hasErrors: boolean } => {
  const periods: ParsedPeriod[] = [];
  const lessonCount: Record<WeekDay, number> = {
    sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0,
  };
  let hasAuto   = false;
  let hasErrors = false;

  for (const row of rows) {
    const dayStr  = String(row.day ?? '').trim();
    const subject = String(row.subject ?? '').trim();
    const equip   = String(row.equipment ?? '').trim();
    if (!dayStr && !subject && !row.time) continue;

    const day           = parseDay(dayStr);
    const isMissingDay  = !day || !WEEK_DAYS_WITH_FRIDAY.includes(day);
    const isMissingSubj = !subject;
    if (isMissingDay || isMissingSubj) hasErrors = true;

    const validDay = (day && WEEK_DAYS_WITH_FRIDAY.includes(day)) ? day : 'sunday';
    let time       = parseTime(row.time);
    if (!time) {
      time    = generateBuffStandardTime(lessonCount[validDay]);
      hasAuto = true;
    }

    periods.push({
      id: generateId(), subject, time, day: validDay,
      selected: true, autoTime: !parseTime(row.time),
      missingSubject: isMissingSubj, missingDay: isMissingDay,
      equipment: equip,
    });
    lessonCount[validDay]++;
  }

  periods.sort((a, b) => {
    const dOrder = WEEK_DAYS_WITH_FRIDAY.indexOf(a.day) - WEEK_DAYS_WITH_FRIDAY.indexOf(b.day);
    return dOrder !== 0 ? dOrder : a.time.localeCompare(b.time);
  });

  return { periods, hasAuto, hasErrors };
};

// ─── Main Excel entry point ───────────────────────────────────────────────────

/**
 * Parse an Excel/CSV file from a base64 string.
 * Returns ParsedPeriod[] ready for the review screen.
 */
export const parseExcelBase64 = (
  base64: string,
): { periods: ParsedPeriod[]; hasAuto: boolean; hasErrors: boolean; isPivot: boolean } => {
  const workbook  = XLSX.read(base64, { type: 'base64' });
  const sheet     = workbook.Sheets[workbook.SheetNames[0]];
  const rawData   = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (rawData.length === 0) throw new Error('הקובץ ריק');

  const { isPivot, headerRowIndex } = detectPivotFormat(rawData);

  if (isPivot) {
    const periods = parsePivotFormat(rawData, headerRowIndex);
    if (periods.length === 0) throw new Error('לא נמצאו שיעורים בטבלה');
    periods.sort((a, b) => {
      const dOrder = WEEK_DAYS_WITH_FRIDAY.indexOf(a.day) - WEEK_DAYS_WITH_FRIDAY.indexOf(b.day);
      return dOrder !== 0 ? dOrder : (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0);
    });
    const hasAuto = periods.some(p => p.autoTime);
    return { periods, hasAuto, hasErrors: false, isPivot: true };
  }

  // Standard format — use sheet_to_json with headers for flexible column mapping
  const firstRow = (rawData[0] ?? []) as unknown[];
  const headers  = firstRow.map(h => String(h ?? '').trim());
  const dayCol   = findHeaderKey(headers, 'day');
  let subjectCol = findHeaderKey(headers, 'subject');
  const timeCol  = findHeaderKey(headers, 'time');
  const equipCol = findHeaderKey(headers, 'equipment');
  if (!subjectCol) subjectCol = findSubjectFallback(headers, dayCol, timeCol);

  const hasHeaders = !!(dayCol || subjectCol || timeCol);

  let mappedRows: Array<{ day: string; time: string | number; subject: string; equipment: string }>;

  if (hasHeaders) {
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    mappedRows = jsonRows.map(row => ({
      day:       dayCol   ? String(row[dayCol]   ?? '') : '',
      time:      timeCol  ? String(row[timeCol]  ?? '') : '',
      subject:   subjectCol ? String(row[subjectCol] ?? '') : '',
      equipment: equipCol  ? String(row[equipCol]  ?? '') : '',
    }));
  } else {
    const startIdx = rawData.length > 1 && !parseDay(String((rawData[0] as unknown[])[0] ?? '')) ? 1 : 0;
    mappedRows = (rawData.slice(startIdx) as unknown[][]).map(row => ({
      day: String(row[0] ?? ''), time: String(row[1] ?? ''),
      subject: String(row[2] ?? ''), equipment: String(row[3] ?? ''),
    }));
  }

  const result = processDataRows(mappedRows);
  return { ...result, isPivot: false };
};

// ─── API response parser (OCR / text paste) ───────────────────────────────────

/**
 * Converts raw tasks array from the parse-schedule Edge Function
 * into ParsedPeriod[] for the review screen.
 */
export const processApiResponse = (
  tasks: Array<{
    title?: string; day?: string; time?: string;
    autoTime?: boolean; missingSubject?: boolean;
    lessonNumber?: number; equipment?: string;
  }>,
): { periods: ParsedPeriod[]; hasAuto: boolean; hasErrors: boolean } => {
  const periods: ParsedPeriod[] = [];
  const lessonCount: Record<WeekDay, number> = {
    sunday: 0, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0,
  };
  let hasAuto   = false;
  let hasErrors = false;

  for (const t of tasks ?? []) {
    const subject       = t.title ?? '';
    const isMissingSubj = !subject.trim() || subject === '[שיעור ללא שם]';
    const day           = (t.day ?? 'sunday') as WeekDay;
    const isMissingDay  = !t.day || !WEEK_DAYS_WITH_FRIDAY.includes(day);
    if (isMissingSubj && isMissingDay) continue;
    if (isMissingSubj || isMissingDay) hasErrors = true;
    // Propagate per-task autoTime up to the aggregate flag so the review banner
    // shows even when the AI provided a time but flagged it as auto-generated.
    if (t.autoTime) hasAuto = true;

    const validDay = isMissingDay ? 'sunday' : day;
    let time       = t.time ?? '';
    let isAutoTime = !!t.autoTime;
    if (!time && subject.trim()) {
      time       = generateBuffStandardTime(lessonCount[validDay]);
      isAutoTime = true;
      hasAuto    = true;
    } else if (!time) {
      time = '08:00';
    }

    periods.push({
      id: generateId(), subject: isMissingSubj ? '' : subject,
      time, day: validDay, selected: true,
      autoTime: isAutoTime, missingSubject: isMissingSubj, missingDay: isMissingDay,
      lessonNumber: t.lessonNumber ?? lessonCount[validDay] + 1,
      equipment: t.equipment ?? '',
    });
    lessonCount[validDay]++;
  }

  periods.sort((a, b) => {
    const dOrder = WEEK_DAYS_WITH_FRIDAY.indexOf(a.day) - WEEK_DAYS_WITH_FRIDAY.indexOf(b.day);
    return dOrder !== 0 ? dOrder : (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0);
  });

  return { periods, hasAuto, hasErrors };
};

// ─── Final conversion ─────────────────────────────────────────────────────────

/** Convert confirmed ParsedPeriods to the Timetable shape stored in Supabase. */
export const periodsToTimetable = (periods: ParsedPeriod[]): Timetable => {
  const timetable: Timetable = {};
  WEEK_DAYS_WITH_FRIDAY.forEach(day => { timetable[day] = []; });

  const byDay: Partial<Record<WeekDay, ParsedPeriod[]>> = {};
  WEEK_DAYS_WITH_FRIDAY.forEach(day => { byDay[day] = []; });
  periods.forEach(p => { byDay[p.day]!.push(p); });

  WEEK_DAYS_WITH_FRIDAY.forEach(day => {
    const sorted = (byDay[day] ?? []).sort(
      (a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0) || a.time.localeCompare(b.time),
    );
    timetable[day] = sorted.map<PeriodInfo>(p => ({
      subject:   p.subject,
      startTime: p.time,
      ...(p.equipment ? { equipment: p.equipment } : {}),
    }));
  });

  return timetable;
};
