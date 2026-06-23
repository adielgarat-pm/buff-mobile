// parse-capture — turns a parent-shared message/file into structured capture
// items via Gemini (paid tier). Server-side only; the key never leaves here.
// Privacy: raw input is NOT stored (only a count is logged to capture_runs).
// pkg/parent-capture Phase 1. Returns the SAME ParsedItem shape the client/stub use.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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

function buildPrompt(roster: RosterChild[], todayISO: string, messageSentAt: string | null): string {
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

== עוגני תאריך ==
- היום: ${todayISO}
- ההודעה נשלחה: ${messageSentAt ?? 'לא ידוע — השתמש בהיום'}
פתור כל זמן יחסי ("מחר", "יום ה' הקרוב") ביחס לתאריך שליחת ההודעה.

== שיוך לילד ==
שייך לפי שכבה/כיתה (למשל "שכבת ד" → הילד בכיתה ד). אם הפריט מתייחס לשכבה שאינה של אף ילד → relevance="no_match". אם אי אפשר לקבוע → relevance="unknown" ו-missing יכלול "שם הילד". כשהשיוך ודאי, אל תוסיף "שם הילד" ל-missing.

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
כללים: owner="child" + forChildToRemember=true רק כשזה משהו שהילד יכול לזכור/לשאת בעצמו. confidence="low" אם עורפל או ניחוש. חסר ערך → ל-missing, לא להמציא. אירוע עם חלק-הורה (להגיע/להסיע) וחלק-ילד (ללבוש/להשתתף) → פצל לשני פריטים מקושרים ב-linkedEvent.`;
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

  try {
    const body = await req.json();
    const { kind, text, fileBase64, mimeType, familyId, messageSentAt } = body ?? {};
    if (!familyId) return json({ error: 'missing_family_id' }, 400);
    if (kind === 'text' && !String(text ?? '').trim()) return json({ items: [] });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
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
    const prompt = buildPrompt(roster, todayISO, messageSentAt ?? null);

    const parts =
      kind === 'file' && fileBase64
        ? [{ text: `${prompt}\n\nהקלט מצורף כקובץ.` }, { inline_data: { mime_type: mimeType ?? 'application/octet-stream', data: fileBase64 } }]
        : [{ text: `${prompt}\n\nהקלט:\n${text ?? ''}` }];

    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      },
    );
    const gj = await gemRes.json();
    if (!gemRes.ok) return json({ error: 'gemini_error', status: gemRes.status, detail: gj?.error ?? gj }, 502);

    const rawText = gj?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { items: [] };
    }
    const rawItems = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
    const items = rawItems.map(normalize);

    // Audit (counts only — NO raw input stored).
    await supabase.from('capture_runs').insert({
      family_id: familyId,
      input_kind: kind === 'text' ? 'text' : 'image',
      item_count: items.length,
      model: MODEL,
    });

    return json({ items });
  } catch (e) {
    return json({ error: 'internal', detail: String(e) }, 500);
  }
});
