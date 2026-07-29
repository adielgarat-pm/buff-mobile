// parse-capture — turns a parent-shared message/file into structured capture
// items via Gemini (paid tier). Server-side only; the key never leaves here.
// Privacy: raw input is NOT stored (only a count is logged to capture_runs).
// pkg/parent-capture Phase 1. Returns the SAME ParsedItem shape the client/stub use.
//
// Usage metrics (pkg/capture-usage-metrics, migration 047): EVERY terminal path
// writes a capture_runs row with an `outcome` — including failures, which used
// to exist only in Sentry. The run id is returned so the client can attach the
// parent's confirm summary (kept / discarded / edited) to the same row.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Weekday arithmetic is done here, never by the model — see dateAnchors.ts for
// the 2026-07-28 off-by-one that motivated it.
import { buildDateAnchors } from './dateAnchors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Cost guard — same posture as generate-child-insights: hard server-side cap
// so a stuck client / abuse can't burn Gemini tokens. Per family per day.
const DAILY_CAPTURE_CAP = 30;

// Gemini latency ceiling. Real parses have been measured at 60-90s in prod
// (2026-07-28), so this must sit ABOVE that — it exists to convert a hung
// upstream call into a typed 504 (client shows "took too long, retry") instead
// of holding the connection until the edge-runtime wall clock kills it.
// Must stay below the runtime wall-clock limit; the client backstop is 120s.
const GEMINI_TIMEOUT_MS = 100_000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function ageFromBirth(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

interface RosterChild {
  name: string;
  age: number | null;
  grade: string | null;
}

// The item JSON contract is language-independent; only the instructions and the
// output language differ. Hebrew keeps the originally-verified prompt verbatim.
function buildPrompt(
  roster: RosterChild[],
  todayISO: string,
  messageSentAt: string | null,
  language: string,
  childHint: string | null = null,
): string {
  if (!language.startsWith('he')) {
    const rosterLinesEn =
      roster.length > 0
        ? roster
            .map((c) => `- ${c.name}${c.age != null ? `, age ${c.age}` : ''}${c.grade ? `, grade ${c.grade}` : ''}`)
            .join('\n')
        : '- (no children registered)';
    return `You are an extraction engine for a parent. Input: a WhatsApp message / email / text / file (image/PDF/Word/Excel) — it may be in English or another language.
Extract ONLY actionable items (task, event, test, assignment, class, performance, something to bring/wear, payment, permission form) or need-to-know info (schedule, policy). Chit-chat/greetings/discussion with no ask → return an empty array. Never invent.

== FAMILY CHILDREN ==
${rosterLinesEn}

${buildDateAnchors(todayISO, messageSentAt, false)}

== CHILD MATCHING ==
Match by grade/class (e.g. "4th grade" → the child in grade 4). If the item targets a grade no child is in → relevance="no_match". If it cannot be determined → relevance="unknown" and missing includes "child name". When the match is certain, do NOT add "child name" to missing.${childHint ? `\nThe parent says this input is about ${childHint}. Default childName to ${childHint} (relevance="matched") unless the message explicitly names a different child or grade.` : ''}

Return ONLY JSON shaped as: { "items": [ ... ] }, where each item is:
{
  "title": string,                       // short, actionable, in the owner's voice, in the input's language
  "type": "task"|"event"|"schedule"|"reference",
  "owner": "parent"|"child",
  "childName": string|null,
  "relevance": "matched"|"no_match"|"unknown",
  "dueDate": "YYYY-MM-DD"|null,
  "dueTime": "HH:MM"|null,
  "recurrence": string|null,             // recurring rule in words, else null
  "dates": ["YYYY-MM-DD", ...],          // for a date series, else []
  "dateSource": string,                  // the raw text the date was derived from
  "location": string|null,
  "bring": [string],
  "eventType": "performance"|"test"|"homework"|"activity"|"errand"|"payment"|"form"|"other",
  "forChildToRemember": boolean,
  "linkedEvent": string|null,            // if an event was split into parent+child parts
  "confidence": "high"|"medium"|"low",
  "missing": string|null
}
Rules: owner="child" + forChildToRemember=true only when the child can remember/carry it themselves. confidence="low" if vague or guessed. Missing value → goes to missing, never invented. An event with a parent part (attend/drive) and a child part (wear/participate) → split into two items linked via linkedEvent.
title must NEVER contain a child's name or a name prefix ("Leia: pack…") — it is a plain action; the assignment lives ONLY in childName.
A bring/wear item for a DATED event → TWO items: (1) "Pack …" with dueDate = the day BEFORE the event and dueTime "19:00"; (2) "Take …" with dueDate = the event day and dueTime "07:30". A dated event with no stated time → dueTime "08:00".`;
  }

  const rosterLines =
    roster.length > 0
      ? roster
          .map((c) => `- ${c.name}${c.age != null ? `, בן/בת ${c.age}` : ''}${c.grade ? `, כיתה ${c.grade}` : ''}`)
          .join('\n')
      : '- (אין ילדים רשומים)';
  return `אתה מנוע חילוץ עבור הורה. קלט: הודעת וואטסאפ / מייל / טקסט / קובץ (תמונה/PDF/וורד/אקסל) — בעברית.
חלץ אך ורק פריטים ניתנים-לפעולה (מטלה, אירוע, מבחן, עבודה, חוג, הופעה, דבר להביא/ללבוש, תשלום, אישור) או מידע-שצריך-לדעת (לוח זמנים, מדיניות). פטפוט/ברכה/דיון בלי דרישה → החזר מערך ריק. אל תמציא.

== ילדי המשפחה ==
${rosterLines}

${buildDateAnchors(todayISO, messageSentAt, true)}

== שיוך לילד ==
שייך לפי שכבה/כיתה (למשל "שכבת ד" → הילד בכיתה ד). אם הפריט מתייחס לשכבה שאינה של אף ילד → relevance="no_match". אם אי אפשר לקבוע → relevance="unknown" ו-missing יכלול "שם הילד". כשהשיוך ודאי, אל תוסיף "שם הילד" ל-missing.${childHint ? `\nההורה ציין שהקלט שייך ל${childHint}. שייך את הפריטים אליו כברירת מחדל (relevance="matched") אלא אם ההודעה מציינת מפורשות ילד או שכבה אחרים.` : ''}

החזר JSON בלבד בצורה: { "items": [ ... ] }, כשכל פריט הוא:
{
  "title": string,                       // קצר, פעולתי, בקול של מי שאחראי
  "type": "task"|"event"|"schedule"|"reference",
  "owner": "parent"|"child",
  "childName": string|null,
  "relevance": "matched"|"no_match"|"unknown",
  "dueDate": "YYYY-MM-DD"|null,
  "dueTime": "HH:MM"|null,
  "recurrence": string|null,             // כלל חוזר במילים, אחרת null
  "dates": ["YYYY-MM-DD", ...],          // לרצף תאריכים, אחרת []
  "dateSource": string,                  // הטקסט הגולמי שממנו נגזר התאריך
  "location": string|null,
  "bring": [string],
  "eventType": "performance"|"test"|"homework"|"activity"|"errand"|"payment"|"form"|"other",
  "forChildToRemember": boolean,
  "linkedEvent": string|null,            // אם פוצל אירוע להורה+ילד
  "confidence": "high"|"medium"|"low",
  "missing": string|null
}
כללים: owner="child" + forChildToRemember=true רק כשזה משהו שהילד יכול לזכור/לשאת בעצמו. confidence="low" אם עורפל או ניחוש. חסר ערך → ל-missing, לא להמציא. אירוע עם חלק-הורה (להגיע/להסיע) וחלק-ילד (ללבוש/להשתתף) → פצל לשני פריטים מקושרים ב-linkedEvent.
אסור ש-title יכיל שם ילד או קידומת שם ("לייא: לארוז…") — הכותרת היא פעולה פשוטה בלבד; השיוך חי אך ורק ב-childName.
פריט "להביא/ללבוש/לצייד" לאירוע מתוארך → שני פריטים: (1) "לארוז …" עם dueDate של היום שלפני האירוע ו-dueTime "19:00"; (2) "לקחת …" עם dueDate של יום האירוע ו-dueTime "07:30". אירוע מתוארך בלי שעה → dueTime "08:00".`;
}

/** capture_runs outcomes — mirrors the CHECK in migration 047. */
type RunOutcome =
  | 'ok'
  | 'empty'
  | 'error_premium'
  | 'error_rate_limited'
  | 'error_gemini'
  | 'error_internal';

/**
 * Audit + usability metric. Counts only — NEVER raw input, file name or content.
 * Never throws: a failed metric write must not turn a good parse into an error.
 * Returns the run id so the client can attach its confirm summary.
 */
async function logRun(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  row: {
    familyId: string;
    createdBy: string | null;
    kind: unknown;
    itemCount: number;
    outcome: RunOutcome;
  },
): Promise<string | null> {
  try {
    const { data, error } = await db
      .from('capture_runs')
      .insert({
        family_id: row.familyId,
        created_by: row.createdBy,
        input_kind: row.kind === 'text' ? 'text' : 'image',
        item_count: row.itemCount,
        model: MODEL,
        outcome: row.outcome,
      })
      .select('id')
      .single();
    if (error) {
      console.error('capture_runs insert failed', JSON.stringify(error));
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (e) {
    console.error('capture_runs insert threw', String(e));
    return null;
  }
}

const TYPES = ['task', 'event', 'schedule', 'reference'];
const EVENT_TYPES = ['performance', 'test', 'homework', 'activity', 'errand', 'payment', 'form', 'other'];
const CONF = ['high', 'medium', 'low'];
const REL = ['matched', 'no_match', 'unknown'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(it: any, i: number) {
  const s = (v: unknown): string | null => (typeof v === 'string' && v.length ? v : null);
  return {
    id: `g${i}`,
    title: s(it?.title) ?? '—',
    type: TYPES.includes(it?.type) ? it.type : 'task',
    owner: it?.owner === 'child' ? 'child' : 'parent',
    childName: s(it?.childName),
    relevance: REL.includes(it?.relevance) ? it.relevance : 'unknown',
    dueDate: s(it?.dueDate),
    dueTime: s(it?.dueTime),
    recurrence: s(it?.recurrence),
    dates: Array.isArray(it?.dates) ? it.dates.filter((x: unknown) => typeof x === 'string') : [],
    dateSource: s(it?.dateSource) ?? '',
    location: s(it?.location),
    bring: Array.isArray(it?.bring) ? it.bring.filter((x: unknown) => typeof x === 'string') : [],
    eventType: EVENT_TYPES.includes(it?.eventType) ? it.eventType : 'other',
    forChildToRemember: !!it?.forChildToRemember,
    linkedEvent: s(it?.linkedEvent),
    confidence: CONF.includes(it?.confidence) ? it.confidence : 'medium',
    missing: s(it?.missing),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!GEMINI_API_KEY) return json({ error: 'missing_gemini_key' }, 500);

  // ── Auth — same pattern as generate-child-insights ─────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    console.error('Auth failed', JSON.stringify(authError));
    return json({ error: 'unauthorized' }, 401);
  }

  // Hoisted for the catch-all handler — it must still be able to log the failed
  // run (error_internal) after an unexpected throw.
  let logFamilyId: string | null = null;
  let logCreatedBy: string | null = null;
  let logKind: unknown = null;

  try {
    const body = await req.json();
    const { kind, text, fileBase64, mimeType, familyId, messageSentAt, platform, language, childHint } = body ?? {};
    if (!familyId) return json({ error: 'missing_family_id' }, 400);
    logFamilyId = familyId;
    logKind = kind;
    if (kind === 'text' && !String(text ?? '').trim()) return json({ items: [] });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Caller must be a member of the family they're capturing for.
    const { data: callerProfile, error: callerErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('family_id', familyId)
      .maybeSingle();
    if (callerErr || !callerProfile) {
      console.error('caller not in family', user.id, familyId, JSON.stringify(callerErr));
      return json({ error: 'forbidden' }, 403);
    }
    logCreatedBy = callerProfile.id;

    // ── Entitlement gate — mirrors generate-child-insights exactly ───────────
    // No Gemini tokens for FREE families; web stays free while the web build
    // matures (same intentional divergence as the AI coach). Fail closed on
    // cost with a 500 (not 402) so a payer sees a retry, not a paywall.
    const { data: entitled, error: entErr } = await supabase.rpc('family_is_entitled', {
      p_family_id: familyId,
    });
    if (entErr) {
      console.error('entitlement check failed', JSON.stringify(entErr));
      return json({ error: 'entitlement_check_failed' }, 500);
    }
    if (!entitled && platform !== 'web') {
      // Logged, not silent: blocked-by-paywall attempts are the demand signal
      // for whether capture is worth paying for.
      await logRun(supabase, {
        familyId, createdBy: callerProfile.id, kind, itemCount: 0, outcome: 'error_premium',
      });
      return json({ error: 'premium_required' }, 402);
    }

    // ── Rate limit — DAILY_CAPTURE_CAP per family, enforced server-side ──────
    // Only billable runs (ok/empty, or pre-047 NULL rows) count toward the cap —
    // otherwise the new error rows would lock a family out of a feature that
    // never actually ran for them.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { count: runsToday, error: capErr } = await supabase
      .from('capture_runs')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', familyId)
      .gte('created_at', since.toISOString())
      .or('outcome.is.null,outcome.in.(ok,empty)');
    if (!capErr && (runsToday ?? 0) >= DAILY_CAPTURE_CAP) {
      await logRun(supabase, {
        familyId, createdBy: callerProfile.id, kind, itemCount: 0, outcome: 'error_rate_limited',
      });
      return json({ error: 'rate_limited', daily_cap: DAILY_CAPTURE_CAP }, 429);
    }
    const { data: kids } = await supabase
      .from('profiles')
      .select('display_name, birth_date, grade_level')
      .eq('family_id', familyId)
      .eq('role', 'child')
      .eq('is_deleted', false);
    const roster: RosterChild[] = (kids ?? []).map((k: any) => ({
      name: k.display_name,
      age: ageFromBirth(k.birth_date),
      grade: k.grade_level ?? null,
    }));

    const todayISO = new Date().toISOString().slice(0, 10);
    const lang = typeof language === 'string' && language ? language : 'he';
    const hint = typeof childHint === 'string' && childHint.trim() ? childHint.trim().slice(0, 60) : null;
    const prompt = buildPrompt(roster, todayISO, messageSentAt ?? null, lang, hint);

    const inputLabel = lang.startsWith('he')
      ? { file: 'הקלט מצורף כקובץ.', text: 'הקלט:' }
      : { file: 'The input is attached as a file.', text: 'Input:' };
    const parts =
      kind === 'file' && fileBase64
        ? [{ text: `${prompt}\n\n${inputLabel.file}` }, { inline_data: { mime_type: mimeType ?? 'application/octet-stream', data: fileBase64 } }]
        : [{ text: `${prompt}\n\n${inputLabel.text}\n${text ?? ''}` }];

    // Key travels in a header, never in the URL (URLs get logged) — same as
    // generate-child-insights.
    const gemStart = Date.now();
    let gemRes: Response;
    let gj: any;
    try {
      gemRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      );
      gj = await gemRes.json();
    } catch (gemErr) {
      // Timeout/abort or network failure toward Gemini. 504 is the typed
      // "took too long" the client maps to its retry copy.
      console.error('gemini fetch failed', String(gemErr), 'after_ms', Date.now() - gemStart);
      await logRun(supabase, {
        familyId, createdBy: callerProfile.id, kind, itemCount: 0, outcome: 'error_gemini',
      });
      return json({ error: 'gemini_timeout' }, 504);
    }
    // Latency observability (no PII): production parses were measured at
    // 60-90s on 2026-07-28 — track whether that regresses or recovers.
    console.log('gemini_ms', Date.now() - gemStart, 'kind', kind === 'text' ? 'text' : 'file');
    if (!gemRes.ok) {
      await logRun(supabase, {
        familyId, createdBy: callerProfile.id, kind, itemCount: 0, outcome: 'error_gemini',
      });
      return json({ error: 'gemini_error', status: gemRes.status, detail: gj?.error ?? gj }, 502);
    }

    const rawText = gj?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { items: [] };
    }
    const rawItems = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
    const items = rawItems.map(normalize);

    // Audit (counts only — NO raw input stored). run_id lets the client attach
    // the parent's confirm summary to this same row.
    const runId = await logRun(supabase, {
      familyId,
      createdBy: callerProfile.id,
      kind,
      itemCount: items.length,
      outcome: items.length > 0 ? 'ok' : 'empty',
    });

    return json({ items, run_id: runId });
  } catch (e) {
    if (logFamilyId) {
      await logRun(createClient(SUPABASE_URL, SERVICE_ROLE), {
        familyId: logFamilyId,
        createdBy: logCreatedBy,
        kind: logKind,
        itemCount: 0,
        outcome: 'error_internal',
      });
    }
    return json({ error: 'internal', detail: String(e) }, 500);
  }
});
