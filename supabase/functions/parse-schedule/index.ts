import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Abuse guard (2026-07-29 security hardening) ──────────────────────────────
// Before this, the function ran with verify_jwt only — which the public anon
// key satisfies — so ANY holder of the anon key (it ships in the web bundle)
// got unlimited Sonnet-vision calls on our Anthropic key. Now: a real user
// session is required, family_id is derived SERVER-SIDE from the caller's
// profile (never from the body — deployed clients don't send it and a body
// value would just be one more client-supplied field to distrust), and runs
// are capped per family per day via schedule_parse_runs (migration 049).
// Deliberately NO entitlement gate (D: Adi 2026-07-29) — timetable import
// stays free core onboarding; this only closes the anonymous/unbounded hole.
const DAILY_SCHEDULE_PARSE_CAP = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedLesson {
  day: string;
  start_time: string;
  end_time: string | null;
  lesson_name: string | null;
  equipment?: string | null;   // comma-separated gear for this lesson
  auto_time?: boolean;
  row_index?: number;
  merged?: boolean;            // true when lesson_name is several options joined with " / "
}

interface ParsedTask {
  title: string;
  time: string;
  day: string;
  category: string;
  credits: number;
  equipment?: string | null;   // carried through to PeriodInfo.equipment on the client
  autoTime?: boolean;
  missingSubject?: boolean;
  lessonNumber?: number;
  teacher?: string | null;
  adhdCategory?: string;
}

// ── Day mapping ───────────────────────────────────────────────────────────────

const HEBREW_DAY_MAP: Record<string, string> = {
  'יום ראשון': 'sunday', 'ראשון': 'sunday', 'א': 'sunday', "א'": 'sunday', 'יום א': 'sunday',
  'יום שני': 'monday', 'שני': 'monday', 'ב': 'monday', "ב'": 'monday', 'יום ב': 'monday',
  'יום שלישי': 'tuesday', 'שלישי': 'tuesday', 'ג': 'tuesday', "ג'": 'tuesday', 'יום ג': 'tuesday',
  'יום רביעי': 'wednesday', 'רביעי': 'wednesday', 'ד': 'wednesday', "ד'": 'wednesday', 'יום ד': 'wednesday',
  'יום חמישי': 'thursday', 'חמישי': 'thursday', 'ה': 'thursday', "ה'": 'thursday', 'יום ה': 'thursday',
  'יום שישי': 'friday', 'שישי': 'friday', 'ו': 'friday', "ו'": 'friday', 'יום ו': 'friday',
};

function normalizeDay(day: string): string {
  if (!day) return 'sunday';
  const trimmed = day.trim();
  const mapped = HEBREW_DAY_MAP[trimmed];
  if (mapped) return mapped;
  const lower = trimmed.toLowerCase();
  if (['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].includes(lower)) return lower;
  for (const [heb, eng] of Object.entries(HEBREW_DAY_MAP)) {
    if (trimmed.includes(heb) || heb.includes(trimmed)) return eng;
  }
  return 'sunday';
}

function normalizeTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const h = parseInt(match[1], 10), m = parseInt(match[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  }
  const ext = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (ext) {
    const h = parseInt(ext[1], 10), m = parseInt(ext[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  }
  return null;
}

function generateDefaultTime(lessonIndex: number): string {
  const idx = Math.min(lessonIndex, 9);
  let mins = 8 * 60;
  for (let i = 0; i < idx; i++) {
    mins += 50;
    if ((i + 1) % 2 === 0) mins += 20;
  }
  return `${Math.floor(mins/60).toString().padStart(2,'0')}:${(mins%60).toString().padStart(2,'0')}`;
}

// ── Subject / teacher helpers ─────────────────────────────────────────────────

const COMMON_SUBJECTS = new Set([
  'מתמטיקה','חשבון','אנגלית','עברית','מדעים','היסטוריה','גאוגרפיה',
  'מחשבים','אמנות','ציור','מוזיקה','תנ"ך','ספרות','חברה','שעת חברה',
  'חנ"ג','חינוך גופני','ספורט','טכנולוגיה','מולדת','תורה','משנה',
  'גמרא','פרשת שבוע','פרשה','הלכה','תפילה','עברית שפה','הבעה',
  'כתיבה','קריאה','גיאומטריה','פיזיקה','כימיה','ביולוגיה',
  'אזרחות','ערבית','צרפתית','רוסית','ספרדית',
  'math','english','hebrew','science','history','geography','art','music','pe',
  'רובוטיקה','דרמה','תיאטרון','מדעי המחשב','תכנות',
]);

const DAY_HEADERS = new Set([
  'יום ראשון','ראשון','א',"א'",'יום א','sunday','sun',
  'יום שני','שני','ב',"ב'",'יום ב','monday','mon',
  'יום שלישי','שלישי','ג',"ג'",'יום ג','tuesday','tue',
  'יום רביעי','רביעי','ד',"ד'",'יום ד','wednesday','wed',
  'יום חמישי','חמישי','ה',"ה'",'יום ה','thursday','thu',
  'יום שישי','שישי','ו',"ו'",'יום ו','friday','fri',
]);

type ADHDCategory = 'Core' | 'Physical' | 'Creative' | 'Social' | 'school';

const SUBJECT_CATEGORIES: Record<string, ADHDCategory> = {
  'מתמטיקה':'Core','חשבון':'Core','math':'Core','אנגלית':'Core','english':'Core',
  'עברית':'Core','hebrew':'Core','הבעה':'Core','כתיבה':'Core','קריאה':'Core',
  'מדעים':'Core','science':'Core','פיזיקה':'Core','כימיה':'Core','ביולוגיה':'Core',
  'היסטוריה':'Core','history':'Core','גאוגרפיה':'Core','geography':'Core',
  'תנ"ך':'Core','ספרות':'Core','ערבית':'Core','אזרחות':'Core',
  'חנ"ג':'Physical','חינוך גופני':'Physical','pe':'Physical','ספורט':'Physical',
  'כדורגל':'Physical','כדורסל':'Physical','שחייה':'Physical','התעמלות':'Physical',
  'מוזיקה':'Creative','music':'Creative','אמנות':'Creative','ציור':'Creative','art':'Creative',
  'מחשבים':'Creative','מדעי המחשב':'Creative','תכנות':'Creative','רובוטיקה':'Creative',
  'טכנולוגיה':'Creative','דרמה':'Creative','תיאטרון':'Creative',
  'חברה':'Social','שעת חברה':'Social','מורשת':'Social','תורה':'Social',
  'משנה':'Social','גמרא':'Social','פרשה':'Social','הלכה':'Social','תפילה':'Social',
  'מולדת':'Social','ידיעת הארץ':'Social',
};

function isLikelyTeacherName(text: string): boolean {
  if (!text || text.trim().length < 2) return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  if (COMMON_SUBJECTS.has(trimmed) || COMMON_SUBJECTS.has(lower)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (/\d/.test(trimmed)) return false;
  if (/["']/.test(trimmed) && (trimmed.includes('חנ"ג') || trimmed.includes('תנ"ך'))) return false;
  return words.every(w => w.length >= 2 && w.length <= 12);
}

function applyHeaderGuard(text: string): string {
  if (!text) return text;
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return text;
  const first = lines[0].toLowerCase();
  if (DAY_HEADERS.has(first) || DAY_HEADERS.has(lines[0])) return lines.slice(1).join('\n').trim();
  return text.trim();
}

function extractSubjectAndTeacher(rawText: string): { subject: string; teacher: string | null } {
  if (!rawText) return { subject: '', teacher: null };
  const text = applyHeaderGuard(rawText);
  if (!text) return { subject: '', teacher: null };
  const parts = text.split(/[\n\r]+|\s{2,}/).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return { subject: '', teacher: null };
  if (parts.length === 1) return { subject: parts[0], teacher: null };
  let subject = '', teacher: string | null = null;
  for (const part of parts) {
    if (COMMON_SUBJECTS.has(part) || COMMON_SUBJECTS.has(part.toLowerCase())) {
      subject = part;
    } else if (isLikelyTeacherName(part)) {
      teacher = part;
    } else if (!subject) {
      subject = part;
    }
  }
  return { subject: subject || parts[0], teacher };
}

function guessCategory(_title: string): string { return 'school'; }

function getADHDCategory(title: string): ADHDCategory {
  if (!title) return 'school';
  const lower = title.toLowerCase();
  for (const [kw, cat] of Object.entries(SUBJECT_CATEGORIES)) {
    if (lower.includes(kw.toLowerCase()) || title.includes(kw)) return cat;
  }
  return 'school';
}

function guessCredits(title: string): number {
  const lower = title.toLowerCase();
  if (lower.includes('homework') || lower.includes('שיעורי בית') || lower.includes('מבחן')) return 30;
  const cat = getADHDCategory(title);
  if (cat === 'Core') return 15;
  if (cat === 'Physical' || cat === 'Creative' || cat === 'Social') return 10;
  return 10;
}

const EMPTY_NAMES = new Set(['', 'null', '[שיעור ללא שם]']);
const isRealSubject = (name?: string | null) => {
  const t = (name ?? '').trim();
  return t.length > 0 && !EMPTY_NAMES.has(t);
};

interface CleanupOpts {
  /** Merge several options in one slot into ONE lesson, names joined with " / " (vision modes). */
  mergeSlots?: boolean;
  /** Keep the parsed start_time instead of regenerating a Buff-standard time (PDFs have real times). */
  preserveTimes?: boolean;
}

function cleanupAndDeduplicateLessons(
  lessons: ParsedLesson[],
  opts: CleanupOpts = {},
): ParsedLesson[] {
  const { mergeSlots = false, preserveTimes = false } = opts;

  const byDay: Record<string, ParsedLesson[]> = {};
  lessons.forEach(l => { if (!byDay[l.day]) byDay[l.day] = []; byDay[l.day].push(l); });

  const cleaned: ParsedLesson[] = [];
  Object.entries(byDay).forEach(([day, dayLessons]) => {
    // Per slot: collect the sample lesson (for time/equipment) + distinct option names.
    const slotMap: Record<number, { sample: ParsedLesson; options: string[] }> = {};
    dayLessons.forEach((lesson, index) => {
      const rawNum = lesson.row_index ?? (index + 1);
      const num = Number(rawNum);
      if (!Number.isFinite(num) || num < 1 || num > 10) return;
      if (!slotMap[num]) slotMap[num] = { sample: lesson, options: [] };
      const slot = slotMap[num];
      if (!isRealSubject(slot.sample.lesson_name) && isRealSubject(lesson.lesson_name)) {
        slot.sample = lesson; // prefer a sample that carries a real subject (time/equipment)
      }
      if (isRealSubject(lesson.lesson_name)) {
        // The model may already have joined options with "/"; split and dedupe.
        for (const part of lesson.lesson_name!.split('/').map(s => s.trim()).filter(Boolean)) {
          if (mergeSlots) {
            if (!slot.options.some(o => o.toLowerCase() === part.toLowerCase())) slot.options.push(part);
          } else if (slot.options.length === 0) {
            slot.options.push(part); // legacy: one subject per slot, first real wins
          }
        }
      }
    });
    Object.entries(slotMap)
      .filter(([, s]) => s.options.length > 0)
      .forEach(([num, s]) => {
        const slot = parseInt(num);
        const idx  = slot - 1;
        const time = preserveTimes
          ? (s.sample.start_time?.trim() || generateDefaultTime(idx))
          : generateDefaultTime(idx);
        cleaned.push({
          ...s.sample,
          day,
          lesson_name: s.options.join(' / '),
          merged:      s.options.length > 1,
          start_time:  time,
          auto_time:   preserveTimes ? !!s.sample.auto_time : true,
          row_index:   slot,
        });
      });
  });
  return cleaned;
}

interface TasksOpts extends CleanupOpts { applyCleanup?: boolean; }

function lessonsToTasks(lessons: ParsedLesson[], opts: TasksOpts = {}): ParsedTask[] {
  const { applyCleanup = true, ...cleanupOpts } = opts;
  const processed = applyCleanup ? cleanupAndDeduplicateLessons(lessons, cleanupOpts) : lessons;
  return processed
    .filter(l => (l.lesson_name?.trim() && l.lesson_name !== 'null') || l.start_time?.trim())
    .map(l => {
      const raw = l.lesson_name?.trim() || '';
      const isEmpty = !isRealSubject(raw);
      // Merged slots keep every option verbatim ("A / B / C") — no teacher parsing,
      // so the joined name is never mangled by the single-lesson subject/teacher split.
      if (l.merged) {
        return {
          title:        raw,
          time:         l.start_time,
          day:          l.day,
          category:     guessCategory(raw),
          credits:      guessCredits(raw),
          equipment:    (l.equipment ?? '').toString().trim() || null,
          autoTime:     l.auto_time,
          missingSubject: false,
          lessonNumber: l.row_index || 0,
          teacher:      null,
          adhdCategory: getADHDCategory(raw),
        };
      }
      const { subject, teacher } = extractSubjectAndTeacher(raw);
      let title = isEmpty ? 'שעה פנויה' : (teacher ? `${subject} (${teacher})` : subject);
      title = title.replace(/\[\?\]$/, '').trim();
      return {
        title,
        time: l.start_time,
        day: l.day,
        category: guessCategory(subject),
        credits: isEmpty ? 0 : guessCredits(subject),
        equipment: (l.equipment ?? '').toString().trim() || null,
        autoTime: l.auto_time,
        missingSubject: isEmpty,
        lessonNumber: l.row_index || 0,
        teacher,
        adhdCategory: getADHDCategory(subject),
      };
    });
}

// ── AI call helper (Anthropic) ────────────────────────────────────────────────

async function callAnthropic(opts: {
  apiKey: string;
  model: string;
  system: string;
  userContent: unknown;
  maxTokens: number;
  timeoutMs: number;
}): Promise<string> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), opts.timeoutMs);

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: [{ role: "user", content: opts.userContent }],
      }),
    });
    clearTimeout(tid);
  } catch (e: any) {
    clearTimeout(tid);
    if (e.name === "AbortError") throw Object.assign(new Error("TIMEOUT"), { isTimeout: true });
    throw e;
  }

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw Object.assign(new Error("RATE_LIMIT"), { isRateLimit: true });
    throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.content?.[0]?.text ?? "{}";
}

// ── Runtime config (DB-driven, D-IE-3) ────────────────────────────────────────
// Model + optional prompt override per mode live in public.edge_function_config
// (row key 'parse_schedule'), so tuning is a DB edit, not a redeploy. Anything
// absent falls back to the baked-in defaults below; any load failure → defaults,
// so a DB problem never breaks import.

const DEFAULT_MODELS: Record<string, string> = {
  image: "claude-sonnet-4-6",
  text:  "claude-haiku-4-5-20251001",
  excel: "claude-haiku-4-5-20251001",
  pdf:   "claude-sonnet-4-6",
};

const EQUIPMENT_RULE = `EQUIPMENT (IMPORTANT):
- If a lesson/cell lists gear to bring, put it in "equipment" (comma-separated).
- If the sheet has a general "bring every day / keep in the bag" note (often a footer), return it ONCE in top-level "daily_equipment" (comma-separated). Do NOT repeat it on every lesson.`;

// SPLIT / LEVEL GROUPS (D: Adi 2026-08-31) — many Israeli high-school timetables
// put several lesson OPTIONS in one time-slot cell (ability levels "רמה 3/4/5",
// or parallel groups with different teachers). We do NOT create a row per option
// — the parent/child pick one later. Instead: ONE lesson per slot, all option
// names joined with " / ".
const SPLIT_GROUP_RULE = `SPLIT / LEVEL GROUPS (IMPORTANT):
- When a SINGLE time-slot cell contains several lesson options (e.g. ability levels "רמה 3/4/5", or parallel groups with different teachers), return them as ONE lesson for that slot whose "lesson_name" joins ALL option names with " / " (spaces around the slash), e.g. "מתמטיקה רמה 5 / מתמטיקה רמה 4 / מתמטיקה רמה 3".
- Do NOT create a separate row per option, and do NOT drop options — the parent/child choose one afterwards.`;

const DEFAULT_PROMPTS: Record<string, string> = {
  image: `You are an OCR parser for ANY weekly schedule — a school timetable, a summer-camp board, or after-school activities. Extract EXACTLY what is written, by the times and labels in the sheet. Do NOT assume a fixed list of subjects; camp activities (בריכה, סרט, הפנינג, חוג) are valid lesson_name values.

LAYOUT: columns are usually days (headers may be dated, e.g. "רביעי 8.7" → map to that weekday). Rows are time slots. Cells may be merged/colored; IGNORE header blocks (coordinator name, phone numbers, group name).

DAYS (RTL, right→left): ראשון/א'=Sunday, שני/ב'=Monday, שלישי/ג'=Tuesday, רביעי/ד'=Wednesday, חמישי/ה'=Thursday, שישי/ו'=Friday. Include any day that appears.

${EQUIPMENT_RULE}

${SPLIT_GROUP_RULE}

ZERO DATA LOSS: keep a row if it has a label OR a time. Unclear label → append [?]. Missing time → start_time null (the system fills it).

Return ONLY valid JSON, no markdown fences.
OUTPUT: {"lessons":[{"day":"יום ב'","row_index":1,"start_time":"08:00","lesson_name":"מתמטיקה","equipment":"מחשבון, סרגל"}],"daily_equipment":"בגד ים, קרם הגנה, כובע, מים, בגדים להחלפה"}`,

  text: `You parse ANY weekly schedule from extracted OCR/pasted text — school, camp, or activities. Use the times and labels as written; do not assume fixed subjects.

DAYS: ראשון/א'=Sunday, שני/ב'=Monday, שלישי/ג'=Tuesday, רביעי/ד'=Wednesday, חמישי/ה'=Thursday, שישי/ו'=Friday. Include Friday if present. A dated day header → its weekday.

${EQUIPMENT_RULE}

RULES: Return ONLY valid JSON, no markdown, no explanation. If time is missing set start_time to null.
OUTPUT: {"lessons":[{"day":"יום א","start_time":"08:00","lesson_name":"מתמטיקה","equipment":"חלוק"}],"daily_equipment":null}`,

  excel: `You parse ANY weekly schedule from spreadsheet rows — school, camp, or activities. Use the times and labels as written; do not assume fixed subjects.

DAYS: ראשון=Sunday, שני=Monday, שלישי=Tuesday, רביעי=Wednesday, חמישי=Thursday, שישי=Friday. Always extract the Friday column if present (often leftmost in RTL).

${EQUIPMENT_RULE}

RULES: Return ONLY valid JSON, no markdown. If time missing set start_time to null.
OUTPUT: {"lessons":[{"day":"יום א","start_time":"08:00","lesson_name":"מתמטיקה","equipment":"מחברת"}],"daily_equipment":null}`,

  pdf: `You are an OCR parser for a weekly schedule delivered as a PDF (usually a "Print to PDF" of a school/camp timetable, often with NO selectable text — read it visually). Extract EXACTLY what is written, by the times and labels in the sheet. Do NOT assume a fixed subject list.

MULTI-PAGE: the schedule is ONE weekly grid that may spill across several pages. Day headers (columns) usually appear once (page 1); later pages CONTINUE the same day columns with more time-rows. Treat all pages as a single grid and keep the same column→day mapping across pages. Use the printed time in each row's leftmost/edge cell as start_time (a range like "08:15-09:00" → start_time "08:15").

LAYOUT: columns are days; rows are time slots. Cells may be merged/colored; IGNORE header blocks (grade title, coordinator, phone numbers, room-only codes).

DAYS (RTL, right→left): ראשון/א'=Sunday, שני/ב'=Monday, שלישי/ג'=Tuesday, רביעי/ד'=Wednesday, חמישי/ה'=Thursday, שישי/ו'=Friday. Include any day that appears.

${EQUIPMENT_RULE}

${SPLIT_GROUP_RULE}

ZERO DATA LOSS: keep a row if it has a label OR a time. Unclear label → append [?]. Missing time → start_time null.

Return ONLY valid JSON, no markdown fences.
OUTPUT: {"lessons":[{"day":"יום ב'","row_index":1,"start_time":"08:15","lesson_name":"מתמטיקה רמה 5 / מתמטיקה רמה 4 / מתמטיקה רמה 3","equipment":null}],"daily_equipment":null}`,
};

interface ParseConfig { models?: Record<string, string>; prompts?: Record<string, string>; }

async function loadParseConfig(): Promise<ParseConfig> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return {};
  try {
    const res = await fetch(
      `${url}/rest/v1/edge_function_config?key=eq.parse_schedule&select=value`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) return {};
    const rows = await res.json();
    return (rows?.[0]?.value as ParseConfig) ?? {};
  } catch {
    return {}; // DB unreachable → baked-in defaults; import never breaks
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth: a real user session, not just the anon key ─────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth failed", JSON.stringify(authError));
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Family: derived from the caller's PARENT profile, never the body ─────
    const svc = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: callerProfiles, error: callerErr } = await svc
      .from("profiles")
      .select("id, family_id")
      .eq("user_id", user.id)
      .eq("role", "parent")
      .limit(1);
    const caller = callerProfiles?.[0];
    if (callerErr || !caller?.family_id) {
      // No parent profile = a child session or an anon-key probe. Timetable
      // import is a parent-only surface (TimetableScreen).
      console.error("caller has no parent profile", user.id, JSON.stringify(callerErr));
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate limit: DAILY_SCHEDULE_PARSE_CAP per family per day ──────────────
    // The run row is inserted BEFORE the LLM call so failed parses also count —
    // a failure still burns Anthropic tokens, and the cap is generous enough
    // (imports are a setup-time action) that real retries never hit it.
    // Fail CLOSED: an unreadable counter must not become unlimited free calls.
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { count: runsToday, error: capErr } = await svc
      .from("schedule_parse_runs")
      .select("id", { count: "exact", head: true })
      .eq("family_id", caller.family_id)
      .gte("created_at", todayStart.toISOString());
    if (capErr) {
      console.error("rate-limit read failed", JSON.stringify(capErr));
      return new Response(JSON.stringify({ error: "rate_check_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((runsToday ?? 0) >= DAILY_SCHEDULE_PARSE_CAP) {
      return new Response(JSON.stringify({ error: "rate_limited", daily_cap: DAILY_SCHEDULE_PARSE_CAP }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, excelData, fileType, extractedText, pdfBase64 } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { error: runErr } = await svc.from("schedule_parse_runs").insert({
      family_id: caller.family_id, created_by: caller.id, mode: String(fileType ?? "unknown"),
    });
    if (runErr) console.error("run log insert failed (non-fatal)", JSON.stringify(runErr));

    const config = await loadParseConfig();
    const modelFor  = (m: string) => config.models?.[m]  || DEFAULT_MODELS[m];
    const promptFor = (m: string) => config.prompts?.[m] || DEFAULT_PROMPTS[m];

    let parsedTasks: ParsedTask[] = [];
    let dailyEquipment: string | null = null;

    // ── TEXT mode ────────────────────────────────────────────────────────────
    if (fileType === "text" && extractedText) {
      console.log("Processing extracted text...");

      const system = promptFor("text");

      let content: string;
      try {
        content = await callAnthropic({
          apiKey: ANTHROPIC_API_KEY,
          model: modelFor("text"),
          system,
          userContent: `Parse this extracted Hebrew schedule text into JSON:\n\n${extractedText}`,
          maxTokens: 4000,
          timeoutMs: 30000,
        });
      } catch (e: any) {
        if (e.isTimeout) {
          return new Response(JSON.stringify({ error: "עיבוד הטקסט ארך יותר מדי זמן." }), {
            status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw e;
      }

      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(jsonStr);
        const rawLessons = parsed.lessons || [];
        if (typeof parsed.daily_equipment === "string" && parsed.daily_equipment.trim()) {
          dailyEquipment = parsed.daily_equipment.trim();
        }
        const byDay: Record<string, any[]> = {};
        rawLessons.forEach((l: any) => {
          const day = normalizeDay(l.day || 'sunday');
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(l);
        });
        const validated: ParsedLesson[] = [];
        Object.entries(byDay).forEach(([day, lessons]) => {
          lessons.forEach((l, i) => {
            const time = normalizeTime(l.start_time);
            const rawIdx = l.row_index ?? (i + 1);
            const rowIdx = Math.min(Math.max(Number(rawIdx) || (i + 1), 1), 10);
            validated.push({ day, start_time: time || generateDefaultTime(rowIdx - 1), end_time: null, lesson_name: l.lesson_name || null, equipment: l.equipment ?? null, auto_time: !time, row_index: rowIdx });
          });
        });
        parsedTasks = lessonsToTasks(validated);
      } catch {
        throw new Error("לא הצלחנו לפענח את הטקסט. נסו להעתיק את הטקסט ידנית.");
      }

    // ── IMAGE mode ───────────────────────────────────────────────────────────
    } else if (fileType === "image" && imageBase64) {
      console.log("Processing image with OCR...");

      const system = promptFor("image");

      let content: string;
      try {
        content = await callAnthropic({
          apiKey: ANTHROPIC_API_KEY,
          model: modelFor("image"),
          system,
          userContent: [
            { type: "text", text: "Extract the school schedule with ZERO DATA LOSS. Include ALL visible subjects and times. Return only JSON." },
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          ],
          maxTokens: 6000,
          timeoutMs: 60000,
        });
      } catch (e: any) {
        if (e.isTimeout) {
          return new Response(JSON.stringify({ error: "העיבוד לוקח קצת זמן. נסו תמונה ברורה יותר.", timeout: true }), {
            status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (e.isRateLimit) {
          return new Response(JSON.stringify({ error: "יש הרבה בקשות כרגע. נסו שוב בעוד דקה." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw e;
      }

      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(jsonStr);
        const rawLessons = parsed.lessons || [];
        if (typeof parsed.daily_equipment === "string" && parsed.daily_equipment.trim()) {
          dailyEquipment = parsed.daily_equipment.trim();
        }
        const byDay: Record<string, any[]> = {};
        rawLessons.forEach((l: any) => {
          const day = normalizeDay(l.day || 'sunday');
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(l);
        });
        const validated: ParsedLesson[] = [];
        Object.entries(byDay).forEach(([day, lessons]) => {
          lessons.sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''));
          lessons.forEach((l, i) => {
            const time = normalizeTime(l.start_time);
            const rawIdx = l.row_index ?? (i + 1);
            const rowIdx = Math.min(Math.max(Number(rawIdx) || (i + 1), 1), 10);
            validated.push({ day, start_time: time || generateDefaultTime(rowIdx - 1), end_time: null, lesson_name: l.lesson_name || null, equipment: l.equipment ?? null, auto_time: !time, row_index: rowIdx });
          });
        });
        parsedTasks = lessonsToTasks(validated, { mergeSlots: true });
        console.log(`Parsed ${parsedTasks.length} tasks from image`);
      } catch {
        throw new Error("לא הצלחנו לחלץ את המערכת. נסו תמונה ברורה יותר.");
      }

    // ── PDF mode ───────────────────────────────────────────────────────────────
    } else if (fileType === "pdf" && pdfBase64) {
      console.log("Processing PDF schedule...");

      const system = promptFor("pdf");

      let content: string;
      try {
        content = await callAnthropic({
          apiKey: ANTHROPIC_API_KEY,
          model: modelFor("pdf"),
          system,
          // Anthropic reads PDFs natively via a document block (no extra library,
          // no client-side page rendering). Document goes before the instruction.
          userContent: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: "Extract the FULL weekly schedule from this PDF with ZERO DATA LOSS. It may span several pages that continue one grid. Return only JSON." },
          ],
          maxTokens: 8000,
          timeoutMs: 90000,
        });
      } catch (e: any) {
        if (e.isTimeout) {
          return new Response(JSON.stringify({ error: "עיבוד ה-PDF ארך יותר מדי זמן. נסו קובץ קטן/ברור יותר.", timeout: true }), {
            status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (e.isRateLimit) {
          return new Response(JSON.stringify({ error: "יש הרבה בקשות כרגע. נסו שוב בעוד דקה." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw e;
      }

      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(jsonStr);
        const rawLessons = parsed.lessons || [];
        if (typeof parsed.daily_equipment === "string" && parsed.daily_equipment.trim()) {
          dailyEquipment = parsed.daily_equipment.trim();
        }
        const byDay: Record<string, any[]> = {};
        rawLessons.forEach((l: any) => {
          const day = normalizeDay(l.day || 'sunday');
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(l);
        });
        const validated: ParsedLesson[] = [];
        Object.entries(byDay).forEach(([day, lessons]) => {
          lessons.sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''));
          lessons.forEach((l, i) => {
            const time = normalizeTime(l.start_time);
            const rawIdx = l.row_index ?? (i + 1);
            const rowIdx = Math.min(Math.max(Number(rawIdx) || (i + 1), 1), 10);
            validated.push({ day, start_time: time || generateDefaultTime(rowIdx - 1), end_time: null, lesson_name: l.lesson_name || null, equipment: l.equipment ?? null, auto_time: !time, row_index: rowIdx });
          });
        });
        // preserveTimes: PDFs print real times; mergeSlots: join split-level options with " / ".
        parsedTasks = lessonsToTasks(validated, { mergeSlots: true, preserveTimes: true });
        console.log(`Parsed ${parsedTasks.length} tasks from PDF`);
      } catch {
        throw new Error("לא הצלחנו לחלץ את המערכת מה-PDF. נסו קובץ ברור יותר.");
      }

    // ── EXCEL mode ───────────────────────────────────────────────────────────
    } else if (fileType === "excel" && excelData) {
      console.log("Processing Excel data...");

      const system = promptFor("excel");

      let content: string;
      try {
        content = await callAnthropic({
          apiKey: ANTHROPIC_API_KEY,
          model: modelFor("excel"),
          system,
          userContent: `Parse this timetable:\n${JSON.stringify(excelData, null, 2)}`,
          maxTokens: 6000,
          timeoutMs: 60000,
        });
      } catch (e: any) {
        if (e.isTimeout) {
          return new Response(JSON.stringify({ error: "עיבוד האקסל ארך יותר מדי זמן." }), {
            status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw e;
      }

      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(jsonStr);
        const rawLessons = parsed.lessons || [];
        if (typeof parsed.daily_equipment === "string" && parsed.daily_equipment.trim()) {
          dailyEquipment = parsed.daily_equipment.trim();
        }
        const byDay: Record<string, any[]> = {};
        rawLessons.forEach((l: any) => {
          const day = normalizeDay(l.day || 'sunday');
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(l);
        });
        const validated: ParsedLesson[] = [];
        Object.entries(byDay).forEach(([day, lessons]) => {
          lessons.sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''));
          lessons.forEach((l, i) => {
            const time = normalizeTime(l.start_time);
            const rawIdx = l.row_index ?? (i + 1);
            const rowIdx = Math.min(Math.max(Number(rawIdx) || (i + 1), 1), 10);
            validated.push({ day, start_time: time || generateDefaultTime(rowIdx - 1), end_time: null, lesson_name: l.lesson_name || null, equipment: l.equipment ?? null, auto_time: !time, row_index: rowIdx });
          });
        });
        parsedTasks = lessonsToTasks(validated);
        console.log(`Parsed ${parsedTasks.length} tasks from Excel`);
      } catch {
        throw new Error("לא הצלחנו לפענח את הקובץ. ודאו שהפורמט תקין.");
      }
    }

    return new Response(JSON.stringify({ tasks: parsedTasks, daily_equipment: dailyEquipment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("parse-schedule error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה לא צפויה" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
