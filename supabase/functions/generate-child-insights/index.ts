// generate-child-insights — Smart Insights Edge Function
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY     = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const GEMINI_API_KEY        = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Gemini is the primary insight model (D: Adi, 2026-07-14 — Hebrew quality).
// Anthropic stays as fallback so the function keeps working until the
// GEMINI_API_KEY secret is set, and survives Gemini outages.
const GEMINI_MODEL = 'gemini-2.5-flash';

const WEEKLY_LIMIT = 3;

/**
 * Free "taste" insights per child, for families with NO entitlement (red team
 * F1, Adi approved 2026-07-28). Lifetime, not weekly — see migration 048.
 * Raising this raises token spend on non-payers linearly, so treat it as a
 * pricing decision, not a tuning knob.
 */
const FREE_INSIGHTS_PER_CHILD = 1;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getLast14Days(): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getAgeFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

interface CategoryStat { category: string | null; rate: number; count: number }

function buildCategoryStats(
  tasks: { id: string; category: string | null }[],
  progress: { task_id: string; date: string; completed: boolean }[],
  dates: string[],
): CategoryStat[] {
  const byCategory = new Map<string, { scheduled: number; completed: number }>();
  for (const task of tasks) {
    const cat = task.category ?? 'other';
    const taskProgress = progress.filter(p => p.task_id === task.id);
    for (const date of dates) {
      const entry = taskProgress.find(p => p.date === date);
      const stat = byCategory.get(cat) ?? { scheduled: 0, completed: 0 };
      stat.scheduled++;
      if (entry?.completed) stat.completed++;
      byCategory.set(cat, stat);
    }
  }
  return Array.from(byCategory.entries()).map(([category, s]) => ({
    category: category === 'other' ? null : category,
    rate: s.scheduled > 0 ? Math.round((s.completed / s.scheduled) * 100) : 0,
    count: s.scheduled,
  }));
}

function countActiveDays(progress: { date: string; completed: boolean }[]): number {
  const active = new Set<string>();
  for (const p of progress) { if (p.completed) active.add(p.date); }
  return active.size;
}

// Task categories → clean Hebrew (so no English category keys leak into the
// Hebrew prompt). Falls back to the raw label for any unmapped category.
const CATEGORY_HE: Record<string, string> = {
  'self-care':      'טיפוח עצמי',
  'learning':       'למידה',
  'organization':   'סדר וארגון',
  'responsibility': 'אחריות',
  'movement':       'תנועה',
};

// Recent activity as WORDS, never a number (the Hebrew coach output must be
// number-free — we translate the signal here so the model reasons over it
// without ever seeing a raw count).
function activityBandHe(activeDays: number): string {
  if (activeDays >= 8) return 'רוב הימים';
  if (activeDays >= 4) return 'חלק מהימים';
  if (activeDays >= 1) return 'מעט ימים';
  return 'כמעט ואין עדיין';
}

function buildPrompt(opts: {
  childName: string;
  age: number | null;
  categoryStats: CategoryStat[];
  activeDays14: number;
  balance: number;
  cheapestReward: number | null;
  approvedRedemptions: number;
  parentContext: string | null | undefined;
  previousAction: string | null;
  previousVote: number | null;   // 1 | -1 | null (null = no vote / not activated)
  language: string;
}): string {
  const { childName, age, categoryStats, activeDays14, balance, cheapestReward,
          approvedRedemptions, parentContext, previousAction, previousVote, language } = opts;
  const isHebrew = language === 'he';

  // Bucketed signal shared by both paths (strongest / weakest routine with data).
  const withData = categoryStats.filter(c => c.count >= 3).sort((a, b) => b.rate - a.rate);

  if (isHebrew) {
    const heCat = (c: CategoryStat | undefined): string | null =>
      c ? (CATEGORY_HE[c.category ?? ''] ?? c.category ?? 'שגרה') : null;
    const strongCat  = heCat(withData[0]);
    const supportCat = withData.length > 1 ? heCat(withData[withData.length - 1]) : null;

    const prevFeedbackHe = previousAction
      ? (previousVote === 1 ? '👍 (עזר / עבד טוב)'
        : previousVote === -1 ? '👎 (לא עזר)'
        : 'לא הופעל / אין משוב')
      : 'אין עדיין (זו התובנה הראשונה)';

    return `אתה קוצ'ר מומחה להורות חיובית ומלווה מוסמך באפליקציית "באף" (BUFF). תפקידך לייצר תובנה קצרה, מעצימה וממוקדת להורה על סמך הנתונים של הילד/ה הספציפי/ת והטקסט החופשי שההורה הוסיף.

נתוני הילד/ה:
- שם: ${childName}
- מידע נוסף מההורה: ${parentContext?.trim() || '—'}
- רמת פעילות לאחרונה: ${activityBandHe(activeDays14)}
- תחום שזורם: ${strongCat ?? '—'}
- תחום ששווה לתמוך בו: ${supportCat ?? '—'}

היסטוריה ולולאת משוב:
- הפעולה שהוצעה בפעם הקודמת: ${previousAction ?? '— (אין עדיין)'}
- משוב ההורה על הפעולה הקודמת: ${prevFeedbackHe}

הפרדה מוחלטת בין ילדים:
- המערכת פועלת במודל "פר ילד". חל איסור מוחלט להשליך תובנות, היסטוריה או מאפיינים מילד אחר במשפחה. התבסס אך ורק על הנתונים של ${childName} שלמעלה.

מנגנון לולאת משוב:
- אם הפעולה הקודמת קיבלה 👍: חזק את הכיוון, הסבר בקצרה למה זה עבד מבחינה נוירולוגית, והצע צעד המשך טבעי באותו סגנון.
- אם הפעולה הקודמת קיבלה 👎, לא הופעלה, או שאין עדיין: אל תחזור עליה ואל תציע וריאציה דומה — שנה כיוון והצע גישה פרקטית/נוירולוגית אחרת.

עקרונות כתיבה וטון:
- כתוב בעברית חמה, יומיומית, טבעית וזורמת — כמו חבר קרוב שמבין בחינוך, לא כמו דוח רשמי או פסיכולוגי.
- הימנע לחלוטין מתרגום מילולי מאנגלית; המשפטים חייבים להישמע טבעיים בעברית מדוברת ויפה.
- לשון פנייה להורה: ניטרלית וללא מגדר ("כדאי לנסות", "אפשר לחשוב על", "השבוע שווה להתמקד ב...").
- לגבי הילד/ה: השתמש בשם (${childName}). אם המגדר לא ברור מהשם — נסח בצורה ניטרלית.
- שפה חיובית בלבד. חל איסור מוחלט על המילים: נכשל, פיגר, מתקשה, בעיה, קושי, חלש, ירידה, לא הצליח.
- הסבר את ההתנהגות דרך המוח ("איך המוח עובד", "מנגנון הקשב צריך הפסקות") — לעולם לא דרך אופי או מאמץ ("עצלן", "לא מתאמץ").
- גוון את פתיחת המשפטים; אל תפתח תמיד באותו מבנה (כמו "המוח של...").
- בלי מספרים או אחוזים בכלל (גם אם ההורה כתב מספרים). השתמש ב"ברוב הימים", "פעימות קצרות", "זמן ממוקד".
- בלי מילים לועזיות (פוקוס, טאסק, רגולציה, ספרינט, מוטיבציה) — מצא חלופות בעברית פשוטה.
- הפעולה חייבת לבנות עצמאות אצל ${childName} — משהו שההורה עושה יחד איתו/ה, לא במקומו/ה.

החזר אך ורק JSON תקין במבנה הבא, בלי טקסט נוסף:
{
  "headline": "כותרת של 2-4 מילים, ממוקדת ומסקרנת",
  "message": "1-2 משפטים שמסבירים את הדפוס בצורה חיובית ונוירולוגית, בהתחשב במשוב על הפעולה הקודמת",
  "action": "משפט אחד קונקרטי לשבוע הקרוב שבונה עצמאות יחד עם ${childName}",
  "cta_type": "בדיוק אחד מ: send-bonus / open-rewards / set-anchor / start-conversation / none"
}`;
  }

  // ── English path (unchanged from the original prompt) ────────────────────────
  const catLines = categoryStats
    .filter(c => c.count >= 3)
    .sort((a, b) => a.rate - b.rate)
    .map(c => {
      const label = c.category ?? 'other';
      const level = c.rate >= 70 ? 'strong' : c.rate >= 40 ? 'moderate' : 'needs attention';
      return `  - ${label}: ${level}`;
    }).join('\n');

  const rewardLine = cheapestReward !== null
    ? `Balance: ${balance} BUFFs, cheapest reward: ${cheapestReward} BUFFs, redeemed recently: ${approvedRedemptions}`
    : `Balance: ${balance} BUFFs, no rewards defined yet`;

  const parentLine = parentContext ? `\nParent note:\n"${parentContext}"` : '';

  return `You are a warm, evidence-based ADHD advisor for parents. Give ONE insight and ONE specific action for this week.

CHILD: ${childName}, age ${age ?? 'unknown'}

LAST 14 DAYS:
- Active days: ${activeDays14}/14
- Task completion by category:
${catLines || '  - (no data yet)'}
- Rewards: ${rewardLine}${parentLine}

RULES:
1. Respond entirely in English.
2. Never say failed/behind/dropped/struggle/problem — always forward-facing.
3. Mechanism = biological ("the way the brain works"), never behavioral.
4. Max 2 sentences for message, 1 for action.
5. If parent note given, weave it in — connect their lived experience to the pattern.
6. Action = something concrete the parent can do THIS WEEK.
7. No numbers/percentages — translate to human language.
8. Sound like a knowledgeable friend, not a report.
9. cta_type: exactly one of: send-bonus / open-rewards / set-anchor / start-conversation / none

Respond with ONLY valid JSON:
{
  "headline": "2-5 words",
  "message": "1-2 sentences",
  "action": "1 sentence",
  "cta_type": "one of the 5 types"
}`;
}

/** Returns current weekly generation count for a child (0 if new week or no row). */
async function getWeeklyCount(svc: ReturnType<typeof createClient>, childId: string): Promise<number> {
  const { data } = await svc
    .from('child_insights')
    .select('smart_insight_weekly_count, smart_insight_week_start')
    .eq('child_id', childId)
    .maybeSingle();

  if (!data) return 0;

  // Reset if we're in a new week (Monday-based)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const rowWeekStart = new Date(data.smart_insight_week_start);
  if (rowWeekStart < weekStart) return 0;

  return data.smart_insight_weekly_count ?? 0;
}

/** Gemini call — primary model. Returns the raw model text or null on failure. */
async function callGemini(prompt: string): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          // Structured output — the model returns pure JSON, no regex digging.
          responseMimeType: 'application/json',
          maxOutputTokens: 1024,
          // No "thinking" needed for this short structured task; keeps latency
          // and cost flat (thinking tokens count toward maxOutputTokens).
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );
  if (!res.ok) {
    console.error('Gemini error', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

/** Anthropic call — fallback while GEMINI_API_KEY is unset / Gemini is down. */
async function callAnthropic(prompt: string): Promise<string | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    console.error('Anthropic error', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? null;
}

/** Gemini first (when the key exists), Anthropic as fallback. Null = both failed. */
async function generateWithGeminiOrFallback(prompt: string): Promise<string | null> {
  if (GEMINI_API_KEY) {
    const text = await callGemini(prompt);
    if (text !== null) return text;
    console.error('Gemini failed — falling back to Anthropic');
  } else {
    console.error('GEMINI_API_KEY not set — using Anthropic fallback');
  }
  return ANTHROPIC_API_KEY ? callAnthropic(prompt) : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    console.error('Auth failed', JSON.stringify(authError));
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  let body: { child_id: string; parent_context?: string };
  try { body = await req.json(); }
  catch { return new Response('Bad request', { status: 400, headers: corsHeaders }); }
  // `platform` is accepted as TELEMETRY ONLY — it is client-supplied and must
  // never influence gating (an Android client can send 'web'; see the removed
  // D-2026-07-04-01 bypass, superseded 2026-07-29).
  const { child_id, parent_context, language: bodyLanguage, platform } = body as { child_id: string; parent_context?: string; language?: string; platform?: string };
  if (!child_id) return new Response('child_id required', { status: 400, headers: corsHeaders });

  // Fetch child profile
  const { data: childProfile, error: childErr } = await svc
    .from('profiles')
    .select('id, display_name, birth_date, preferred_language, family_id')
    .eq('id', child_id)
    .eq('role', 'child')
    .single();
  if (childErr || !childProfile) {
    console.error('child lookup failed', JSON.stringify(childErr));
    return new Response('Child not found', { status: 404, headers: corsHeaders });
  }

  // Verify the calling user belongs to the same family
  const { data: callerProfile, error: callerErr } = await svc
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('family_id', childProfile.family_id)
    .single();
  if (callerErr || !callerProfile) {
    console.error('caller not in family', user.id, childProfile.family_id, JSON.stringify(callerErr));
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  // ── Entitlement gate ────────────────────────────────────────────────────────
  // No LLM tokens for FREE families. Server-side + platform-independent: the
  // client's noIapPaywallHidden treats every web user as subscribed, so the UI
  // gate alone leaks tokens on web. Runs BEFORE the rate-limit increment and the
  // Anthropic call, so a blocked call costs zero tokens and does not bump the
  // weekly counter. Trial families pass via premium_until (populated in Phase B).
  // NOTE (billing): once monthly/yearly RC subscriptions go live, rc-webhook MUST
  // reflect them into premium_until or those payers will be 402'd here.
  const { data: entitled, error: entErr } = await svc.rpc('family_is_entitled', {
    p_family_id: childProfile.family_id,
  });
  if (entErr) {
    // Fail closed on cost, but signal a *server* error (500) not "not premium"
    // (402) so the client retries rather than showing a paywall to a payer.
    console.error('entitlement check failed', JSON.stringify(entErr));
    return new Response('Entitlement check failed', { status: 500, headers: corsHeaders });
  }
  // Platform-uniform gate: web gets the same taste-then-gate as Android. The old
  // web-free bypass (D-2026-07-04-01) keyed on the CLIENT-SUPPLIED platform field
  // — any Android client sending platform:'web' got free generations — and was
  // superseded once the taste gate (#404) gave every family a real free taste.
  if (!entitled) {
    // ── Taste-then-gate (pkg/ai-taste-gate, red team F1) ──────────────────────
    // The first FREE_INSIGHTS_PER_CHILD are generated for EVERY family, paid or
    // not. Nobody pays for a capability they have never felt, and before this the
    // AI coach was visible almost exclusively to families holding a lifetime
    // GRANT — i.e. to people who can never convert. A free parent who has read one
    // real insight about their own child is a qualified lead; one looking at a
    // generic lock card is not.
    //
    // Cost is bounded by construction: one call per child, once, ever. The
    // counter is the lifetime one (migration 048) precisely because
    // smart_insight_weekly_count resets and would hand out a fresh freebie every
    // week. Fail CLOSED on a read error — an unreadable counter must not become
    // unlimited free generations.
    const { data: taste, error: tasteErr } = await svc
      .from('child_insights')
      .select('smart_insight_total_count')
      .eq('child_id', child_id)
      .maybeSingle();
    const used = taste?.smart_insight_total_count ?? 0;
    if (tasteErr || used >= FREE_INSIGHTS_PER_CHILD) {
      if (tasteErr) console.error('taste counter read failed', JSON.stringify(tasteErr));
      return new Response(
        JSON.stringify({ error: 'premium_required', free_insights: FREE_INSIGHTS_PER_CHILD }),
        { status: 402, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }
    console.log(`free taste insight ${used + 1}/${FREE_INSIGHTS_PER_CHILD} for child ${child_id} (platform=${platform ?? 'unknown'})`);
  }

  // Rate limit check — 3 generations per child per week
  const currentCount = await getWeeklyCount(svc, child_id);
  if (currentCount >= WEEKLY_LIMIT) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', weekly_count: currentCount, weekly_limit: WEEKLY_LIMIT }),
      { status: 429, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  }

  const dates14 = getLast14Days();
  const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: tasks }, { data: progress }, { data: creditVault }, { data: rewards }, { data: redemptions }, { data: prevInsightRow }, { data: prevVoteRow }] = await Promise.all([
    svc.from('tasks')
      .select('id, category')
      .eq('family_id', childProfile.family_id)
      .or(`assigned_to.is.null,assigned_to.eq.${child_id}`)
      .eq('is_off_routine', false),
    svc.from('daily_progress')
      .select('task_id, date, completed')
      .eq('child_id', child_id)
      .eq('family_id', childProfile.family_id)
      .in('date', dates14),
    svc.from('credit_vault')
      .select('total_balance')
      .eq('child_id', child_id)
      .maybeSingle(),
    svc.from('store_rewards')
      .select('credits_needed')
      .eq('family_id', childProfile.family_id)
      .eq('is_redeemed', false),
    svc.from('reward_redemptions')
      .select('status')
      .eq('child_id', child_id)
      .gte('requested_at', cutoffDate),
    // Feedback loop — the previously-suggested action (read BEFORE we overwrite it)
    // and the parent's latest 👍/👎 on it. Scoped to THIS child_id (per-child).
    svc.from('child_insights')
      .select('smart_insight')
      .eq('child_id', child_id)
      .maybeSingle(),
    svc.from('smart_insight_feedback')
      .select('explicit_vote')
      .eq('child_id', child_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const categoryStats      = buildCategoryStats(tasks ?? [], progress ?? [], dates14);
  const activeDays14       = countActiveDays(progress ?? []);
  const balance            = creditVault?.total_balance ?? 0;
  const cheapestReward     = rewards && rewards.length > 0
    ? Math.min(...rewards.map((r: { credits_needed: number }) => r.credits_needed))
    : null;
  const approvedRedemptions = (redemptions ?? []).filter((r: { status: string }) => r.status === 'approved').length;
  const language           = bodyLanguage ?? childProfile.preferred_language ?? 'he';
  const age                = getAgeFromBirthDate(childProfile.birth_date);
  const previousAction     = (prevInsightRow?.smart_insight as { action?: string } | null)?.action ?? null;
  const previousVote       = (prevVoteRow?.explicit_vote as number | null | undefined) ?? null;

  const prompt = buildPrompt({
    childName: childProfile.display_name ?? 'הילד',
    age,
    categoryStats,
    activeDays14,
    balance,
    cheapestReward,
    approvedRedemptions,
    parentContext: parent_context ?? null,
    previousAction,
    previousVote,
    language,
  });

  let smartInsight: Record<string, string>;
  try {
    const rawText = await generateWithGeminiOrFallback(prompt);
    if (rawText === null) {
      return new Response('LLM unavailable', { status: 502, headers: corsHeaders });
    }
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    smartInsight = JSON.parse(jsonMatch?.[0] ?? rawText);
  } catch (e) {
    console.error('Parse error', e);
    return new Response('Parse error', { status: 500, headers: corsHeaders });
  }

  // Upsert to DB and get new weekly count
  const { data: newCount, error: upsertError } = await svc.rpc('upsert_smart_insight', {
    p_child_id: child_id,
    p_smart_insight: smartInsight,
    p_parent_context: parent_context ?? null,
    p_window_end: new Date().toISOString().split('T')[0],
  });
  if (upsertError) console.error('Upsert error', upsertError);

  // Return insight + updated count so the hook can update UI without a refetch
  return new Response(
    JSON.stringify({ ...smartInsight, _weekly_count: newCount ?? currentCount + 1 }),
    { headers: { ...corsHeaders, 'content-type': 'application/json' } },
  );
});
