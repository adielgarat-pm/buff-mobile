// generate-child-insights — Smart Insights Edge Function
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY     = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const WEEKLY_LIMIT = 3;

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

function buildPrompt(opts: {
  childName: string;
  age: number | null;
  categoryStats: CategoryStat[];
  activeDays14: number;
  balance: number;
  cheapestReward: number | null;
  approvedRedemptions: number;
  parentContext: string | null | undefined;
  language: string;
}): string {
  const { childName, age, categoryStats, activeDays14, balance, cheapestReward, approvedRedemptions, parentContext, language } = opts;
  const isHebrew = language === 'he';

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

  const parentLine = parentContext
    ? (isHebrew
        ? `\nמה ההורה שיתף:\n"${parentContext}"`
        : `\nParent note:\n"${parentContext}"`)
    : '';

  const langInstruction = isHebrew
    ? 'Respond entirely in Hebrew (modern, warm Israeli Hebrew).'
    : 'Respond entirely in English.';

  return `You are a warm, evidence-based ADHD advisor for parents. Give ONE insight and ONE specific action for this week.

CHILD: ${childName}, age ${age ?? 'unknown'}

LAST 14 DAYS:
- Active days: ${activeDays14}/14
- Task completion by category:
${catLines || '  - (no data yet)'}
- Rewards: ${rewardLine}${parentLine}

RULES:
1. ${langInstruction}
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
  // Web is intentionally FREE for the AI coach while the web build matures — no
  // trial, no 14-day cutoff. The client sends platform:'web'; native (Android/iOS)
  // keeps the entitlement/trial gate. Bounded by the WEEKLY_LIMIT rate-limit below,
  // so even a spoofed platform flag can burn at most 3 calls/child/week. Logged as
  // an intentional platform divergence (BUFF_DECISIONS_LOG; mirrors the client's
  // insightsUnlocked in useSubscription).
  if (!entitled && platform !== 'web') {
    return new Response(
      JSON.stringify({ error: 'premium_required' }),
      { status: 402, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
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

  const [{ data: tasks }, { data: progress }, { data: creditVault }, { data: rewards }, { data: redemptions }] = await Promise.all([
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

  const prompt = buildPrompt({
    childName: childProfile.display_name ?? 'הילד',
    age,
    categoryStats,
    activeDays14,
    balance,
    cheapestReward,
    approvedRedemptions,
    parentContext: parent_context ?? null,
    language,
  });

  let smartInsight: Record<string, string>;
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
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
    if (!anthropicRes.ok) {
      console.error('Anthropic error', anthropicRes.status, await anthropicRes.text());
      return new Response('LLM unavailable', { status: 502, headers: corsHeaders });
    }
    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData.content?.[0]?.text ?? '';
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
