// Deterministic weekday resolution for the parse-capture prompt.
//
// WHY THIS EXISTS (bug found 2026-07-28, pre-launch verification of Smart
// Organizer): the DATE ANCHORS block used to pass bare ISO dates. That forced
// Gemini to infer for itself that 2026-07-28 is a Tuesday — a date past its
// training cutoff — and it guessed wrong, so every NAMED weekday inherited the
// error while purely relative words stayed correct:
//   "tomorrow"    -> 2026-07-29  correct
//   "on Thursday" -> 2026-07-31  WRONG (that is Friday)
//   "by Sunday"   -> 2026-08-03  WRONG (that is Monday)
// A parent whose exam lands on the wrong day loses trust in the whole feature,
// so weekday arithmetic is now computed HERE and handed to the model as a
// lookup table. The model is never asked to do calendar math.
//
// Lives in its own file (not inline in index.ts) so the app's Jest suite can
// import and pin it — see src/lib/parentCapture/__tests__/dateAnchors.test.ts.
// index.ts is Deno-only and unreachable from Jest; this module is dependency-
// free and runs in both.

/** Index 0 = Sunday, matching Date#getUTCDay(). */
export const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Hebrew display names, same Sunday-first order. */
export const WEEKDAYS_HE = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'יום שבת',
] as const;

/** The single-letter forms Israeli class messages actually use ("יום ה'"). */
export const WEEKDAY_LETTERS_HE = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalize a date-ish input to `YYYY-MM-DD`, or null if it isn't a real date.
 * Accepts a bare date or a full ISO timestamp (the client may send either).
 * Rejects impossible dates ("2026-02-31") that Date would silently roll over.
 */
export function toDateOnly(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const datePart = value.trim().slice(0, 10);
  if (!ISO_DATE.test(datePart)) return null;
  const ms = Date.parse(`${datePart}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  // Round-trip guard: Date.parse accepts 2026-02-31 and rolls it to March 3.
  return new Date(ms).toISOString().slice(0, 10) === datePart ? datePart : null;
}

/**
 * Day-of-week index (0 = Sunday) for a `YYYY-MM-DD` date.
 * Parsed as UTC on purpose — the server's local timezone must never be able to
 * shift which weekday a calendar date falls on.
 */
export function weekdayIndex(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay();
}

/** Weekday display name for a `YYYY-MM-DD` date, in the prompt's language. */
export function weekdayName(dateISO: string, hebrew: boolean): string {
  const i = weekdayIndex(dateISO);
  return hebrew ? WEEKDAYS_HE[i] : WEEKDAYS_EN[i];
}

/** `YYYY-MM-DD` + n days, UTC arithmetic (no DST or local-offset drift). */
export function addDays(dateISO: string, n: number): string {
  const ms = Date.parse(`${dateISO}T00:00:00Z`) + n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** One row of the "next 7 days" table handed to the model. */
export interface WeekdayRow {
  date: string;
  weekday: string;
}

/**
 * The seven days AFTER `anchorISO` — exactly one occurrence of every weekday.
 * This is what makes "a named weekday means its next occurrence strictly after
 * the message date" a lookup instead of a calculation.
 */
export function nextSevenDays(anchorISO: string, hebrew: boolean): WeekdayRow[] {
  const rows: WeekdayRow[] = [];
  for (let n = 1; n <= 7; n++) {
    const date = addDays(anchorISO, n);
    rows.push({ date, weekday: weekdayName(date, hebrew) });
  }
  return rows;
}

/**
 * Build the `== DATE ANCHORS ==` prompt block.
 *
 * `todayISO` is the server's date; `messageSentAt` is the parent's best-effort
 * "when was this sent" (usually absent, in which case today is the anchor).
 * Relative expressions resolve against the MESSAGE date, so the lookup table is
 * anchored there too.
 */
export function buildDateAnchors(
  todayISO: string,
  messageSentAt: string | null,
  hebrew: boolean,
): string {
  const sent = toDateOnly(messageSentAt);
  const anchor = sent ?? todayISO;
  const todayLabel = `${todayISO} (${weekdayName(todayISO, hebrew)})`;

  if (hebrew) {
    const sentLabel = sent
      ? `${sent} (${weekdayName(sent, hebrew)})`
      : `${todayLabel} — לא צוין, הונח שההודעה נשלחה היום`;
    const table = nextSevenDays(anchor, true)
      .map((r) => `- ${r.date} = ${r.weekday} (${WEEKDAY_LETTERS_HE[weekdayIndex(r.date)]})`)
      .join('\n');
    return `== עוגני תאריך ==
- היום: ${todayLabel}
- ההודעה נשלחה: ${sentLabel}
פתור כל זמן יחסי ("מחר", "יום ה' הקרוב") ביחס לתאריך שליחת ההודעה.
אסור להסיק בעצמך איזה יום בשבוע נופל על תאריך כלשהו — השתמש אך ורק בטבלה הבאה. שם של יום בשבוע ללא תאריך מפורש = המופע הבא שלו, אחרי תאריך שליחת ההודעה בלבד:
${table}
אם ההודעה מציינת יום בשבוע שכבר עבר השבוע, קח את המופע מהטבלה. תאריך שאינו בטבלה — חשב אותו יחסית לתאריכים שבה, ואל תנחש יום בשבוע.`;
  }

  const sentLabel = sent
    ? `${sent} (${weekdayName(sent, false)})`
    : `${todayLabel} — not provided, assume the message was sent today`;
  const table = nextSevenDays(anchor, false)
    .map((r) => `- ${r.date} = ${r.weekday}`)
    .join('\n');
  return `== DATE ANCHORS ==
- Today: ${todayLabel}
- Message sent: ${sentLabel}
Resolve every relative time ("tomorrow", "this Thursday") against the message-sent date.
NEVER work out for yourself which weekday a date falls on — use ONLY this table. A named weekday with no explicit date means its NEXT occurrence strictly after the message-sent date:
${table}
If the message names a weekday that has already passed this week, still use the occurrence in the table. For a date outside the table, derive it from these rows — never guess a weekday.`;
}
